package daemon

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net"
	"sort"
	"time"

	"github.com/dgraph-io/badger/v4"
	libp2pnetwork "github.com/libp2p/go-libp2p/core/network"
	"github.com/libp2p/go-libp2p/core/peer"
	"github.com/multiformats/go-multiaddr"
)

const (
	meshPeerKeyPrefix     = "mesh-peer-v1:"
	meshRetryMaximumDelay = 15 * time.Minute
)

var errMeshSyncInProgress = errors.New("mesh synchronization is already in progress")

type persistedMeshPeer struct {
	Network             string      `json:"network"`
	PeerID              string      `json:"peerId,omitempty"`
	Address             string      `json:"address"`
	LastAttemptAt       string      `json:"lastAttemptAt,omitempty"`
	LastSuccessAt       string      `json:"lastSuccessAt,omitempty"`
	LastError           string      `json:"lastError,omitempty"`
	NextAttemptAt       string      `json:"nextAttemptAt,omitempty"`
	ConsecutiveFailures int         `json:"consecutiveFailures,omitempty"`
	LastResult          *SyncResult `json:"lastResult,omitempty"`
}

type MeshPeerStatus struct {
	Network             NetworkMembershipInfo `json:"network"`
	PeerID              string                `json:"peerId"`
	Address             string                `json:"address"`
	State               string                `json:"state"`
	Connected           bool                  `json:"connected"`
	LastAttemptAt       string                `json:"lastAttemptAt,omitempty"`
	LastSuccessAt       string                `json:"lastSuccessAt,omitempty"`
	LastError           string                `json:"lastError,omitempty"`
	NextAttemptAt       string                `json:"nextAttemptAt,omitempty"`
	ConsecutiveFailures int                   `json:"consecutiveFailures"`
	LastResult          *SyncResult           `json:"lastResult,omitempty"`
}

func meshPeerKey(networkName string, peerID peer.ID) string {
	return fmt.Sprintf("%s%s:%s", meshPeerKeyPrefix, encodeKeyPart(networkName), peerID)
}

func (d *Daemon) persistMeshPeer(networkName string, peerID peer.ID, address string) error {
	return d.updateMeshPeer(networkName, peerID, func(record *persistedMeshPeer) {
		record.Network = networkName
		record.PeerID = peerID.String()
		record.Address = address
	})
}

func (d *Daemon) rememberInboundMeshPeer(networkName string, peerID peer.ID, connection libp2pnetwork.Conn) error {
	address := d.preferredPeerAddress(peerID, connection)
	if address == "" {
		return fmt.Errorf("authenticated peer did not advertise a usable address")
	}
	return d.persistMeshPeer(networkName, peerID, address)
}

func (d *Daemon) preferredPeerAddress(peerID peer.ID, connection libp2pnetwork.Conn) string {
	candidates := append([]multiaddr.Multiaddr(nil), d.p2p.Peerstore().Addrs(peerID)...)
	advertisedCount := len(candidates)
	var connectedIP net.IP
	if connection != nil && connection.RemoteMultiaddr() != nil {
		connectedIP = multiaddrIP(connection.RemoteMultiaddr())
		candidates = append(candidates, connection.RemoteMultiaddr())
	}
	return selectPreferredPeerAddress(candidates, advertisedCount, connectedIP, peerID)
}

func selectPreferredPeerAddress(candidates []multiaddr.Multiaddr, advertisedCount int, connectedIP net.IP, peerID peer.ID) string {
	bestScore := -1
	var best multiaddr.Multiaddr
	seen := make(map[string]struct{})
	for index, candidate := range candidates {
		if candidate == nil {
			continue
		}
		value := candidate.String()
		if _, exists := seen[value]; exists {
			continue
		}
		seen[value] = struct{}{}
		score := peerAddressScore(candidate)
		if index < advertisedCount && connectedIP != nil {
			if candidateIP := multiaddrIP(candidate); candidateIP != nil && candidateIP.Equal(connectedIP) {
				score += 100
			}
		}
		if score > bestScore {
			bestScore = score
			best = candidate
		}
	}
	if best == nil {
		return ""
	}
	return fmt.Sprintf("%s/p2p/%s", best, peerID)
}

func multiaddrIP(address multiaddr.Multiaddr) net.IP {
	for _, protocolCode := range []int{multiaddr.P_IP4, multiaddr.P_IP6} {
		value, err := address.ValueForProtocol(protocolCode)
		if err == nil {
			return net.ParseIP(value)
		}
	}
	return nil
}

func peerAddressScore(address multiaddr.Multiaddr) int {
	if _, err := address.ValueForProtocol(multiaddr.P_TCP); err != nil {
		return 0
	}
	for _, protocolCode := range []int{multiaddr.P_IP4, multiaddr.P_IP6} {
		value, err := address.ValueForProtocol(protocolCode)
		if err != nil {
			continue
		}
		ip := net.ParseIP(value)
		switch {
		case ip == nil:
			return 10
		case ip.IsLoopback():
			return 20
		case ip.IsPrivate() || ip.IsLinkLocalUnicast():
			return 50
		case ip.IsGlobalUnicast():
			return 40
		default:
			return 10
		}
	}
	if _, err := address.ValueForProtocol(multiaddr.P_DNS); err == nil {
		return 30
	}
	if _, err := address.ValueForProtocol(multiaddr.P_DNS4); err == nil {
		return 30
	}
	if _, err := address.ValueForProtocol(multiaddr.P_DNS6); err == nil {
		return 30
	}
	return 10
}

func (d *Daemon) updateMeshPeer(
	networkName string,
	peerID peer.ID,
	update func(*persistedMeshPeer),
) error {
	d.meshPeerMu.Lock()
	defer d.meshPeerMu.Unlock()
	key := []byte(meshPeerKey(networkName, peerID))
	return d.store.Update(func(txn *badger.Txn) error {
		record := persistedMeshPeer{Network: networkName, PeerID: peerID.String()}
		item, err := txn.Get(key)
		switch {
		case err == nil:
			if err := item.Value(func(value []byte) error {
				return json.Unmarshal(value, &record)
			}); err != nil {
				return fmt.Errorf("decode persisted mesh peer: %w", err)
			}
		case errors.Is(err, badger.ErrKeyNotFound):
		case err != nil:
			return err
		}
		update(&record)
		encoded, err := json.Marshal(record)
		if err != nil {
			return fmt.Errorf("encode persisted mesh peer: %w", err)
		}
		return txn.Set(key, encoded)
	})
}

func (d *Daemon) loadMeshPeers() ([]persistedMeshPeer, error) {
	records := make([]persistedMeshPeer, 0)
	err := d.store.View(func(txn *badger.Txn) error {
		iterator := txn.NewIterator(badger.DefaultIteratorOptions)
		defer iterator.Close()
		prefix := []byte(meshPeerKeyPrefix)
		for iterator.Seek(prefix); iterator.ValidForPrefix(prefix); iterator.Next() {
			var record persistedMeshPeer
			if err := iterator.Item().Value(func(value []byte) error {
				return json.Unmarshal(value, &record)
			}); err != nil {
				return fmt.Errorf("decode persisted mesh peer: %w", err)
			}
			if record.PeerID == "" && record.Address != "" {
				address, err := multiaddr.NewMultiaddr(record.Address)
				if err == nil {
					if info, infoErr := peer.AddrInfoFromP2pAddr(address); infoErr == nil {
						record.PeerID = info.ID.String()
					}
				}
			}
			records = append(records, record)
		}
		return nil
	})
	return records, err
}

func (d *Daemon) listMeshPeers(networkName string) ([]MeshPeerStatus, error) {
	if networkName != "" {
		if _, exists := d.memberships.get(networkName); !exists {
			return nil, fmt.Errorf("network %q is not mounted", networkName)
		}
	}
	records, err := d.loadMeshPeers()
	if err != nil {
		return nil, err
	}
	statuses := make([]MeshPeerStatus, 0, len(records))
	for _, record := range records {
		if networkName != "" && record.Network != networkName {
			continue
		}
		membership, exists := d.memberships.get(record.Network)
		if !exists {
			continue
		}
		peerID, err := peer.Decode(record.PeerID)
		if err != nil {
			continue
		}
		connected := d.p2p.Network().Connectedness(peerID) != libp2pnetwork.NotConnected
		state := "known"
		if d.meshPeerSyncing(record.Network, peerID) {
			state = "syncing"
		} else if record.LastError != "" {
			state = "degraded"
		} else if record.LastSuccessAt != "" {
			state = "healthy"
		} else if connected {
			state = "connected"
		}
		statuses = append(statuses, MeshPeerStatus{
			Network:             membership.info(),
			PeerID:              record.PeerID,
			Address:             record.Address,
			State:               state,
			Connected:           connected,
			LastAttemptAt:       record.LastAttemptAt,
			LastSuccessAt:       record.LastSuccessAt,
			LastError:           record.LastError,
			NextAttemptAt:       record.NextAttemptAt,
			ConsecutiveFailures: record.ConsecutiveFailures,
			LastResult:          record.LastResult,
		})
	}
	sort.Slice(statuses, func(i, j int) bool {
		if statuses[i].Network.Name == statuses[j].Network.Name {
			return statuses[i].PeerID < statuses[j].PeerID
		}
		return statuses[i].Network.Name < statuses[j].Network.Name
	})
	return statuses, nil
}

func (d *Daemon) startMeshPeerSync(networkName string, peerID peer.ID) bool {
	key := meshPeerKey(networkName, peerID)
	d.meshSyncMu.Lock()
	defer d.meshSyncMu.Unlock()
	if _, leaving := d.meshLeaving[networkName]; leaving {
		return false
	}
	if _, exists := d.meshSyncing[key]; exists {
		return false
	}
	d.meshSyncing[key] = struct{}{}
	return true
}

func (d *Daemon) startMeshNetworkLeave(networkName string) error {
	d.meshSyncMu.Lock()
	defer d.meshSyncMu.Unlock()
	if _, leaving := d.meshLeaving[networkName]; leaving {
		return fmt.Errorf("network %q is already being left", networkName)
	}
	prefix := fmt.Sprintf("%s%s:", meshPeerKeyPrefix, encodeKeyPart(networkName))
	for key := range d.meshSyncing {
		if len(key) >= len(prefix) && key[:len(prefix)] == prefix {
			return fmt.Errorf("network %q has a synchronization in progress; try leaving again", networkName)
		}
	}
	d.meshLeaving[networkName] = struct{}{}
	return nil
}

func (d *Daemon) finishMeshNetworkLeave(networkName string) {
	d.meshSyncMu.Lock()
	delete(d.meshLeaving, networkName)
	d.meshSyncMu.Unlock()
}

func (d *Daemon) finishMeshPeerSync(networkName string, peerID peer.ID) {
	d.meshSyncMu.Lock()
	delete(d.meshSyncing, meshPeerKey(networkName, peerID))
	d.meshSyncMu.Unlock()
}

func (d *Daemon) meshPeerSyncing(networkName string, peerID peer.ID) bool {
	d.meshSyncMu.Lock()
	defer d.meshSyncMu.Unlock()
	_, exists := d.meshSyncing[meshPeerKey(networkName, peerID)]
	return exists
}

func (d *Daemon) synchronizeKnownPeer(
	ctx context.Context,
	info peer.AddrInfo,
	networkName string,
	address string,
) (SyncResult, error) {
	if !d.startMeshPeerSync(networkName, info.ID) {
		return SyncResult{}, errMeshSyncInProgress
	}
	defer d.finishMeshPeerSync(networkName, info.ID)
	now := d.clockNow().UTC()
	known := d.meshPeerExists(networkName, info.ID)
	if known {
		_ = d.updateMeshPeer(networkName, info.ID, func(record *persistedMeshPeer) {
			record.LastAttemptAt = now.Format(canonicalTimestampLayout)
			record.NextAttemptAt = ""
		})
	}
	if err := d.p2p.Connect(ctx, info); err != nil {
		if known {
			d.recordMeshPeerFailure(networkName, info.ID, err)
		}
		return SyncResult{}, err
	}
	result, err := d.synchronizePeer(ctx, info.ID, networkName)
	if err != nil {
		if known {
			d.recordMeshPeerFailure(networkName, info.ID, err)
		}
		return SyncResult{}, err
	}
	if err := d.persistMeshPeer(networkName, info.ID, address); err != nil {
		return SyncResult{}, err
	}
	if err := d.recordMeshPeerSuccess(networkName, info.ID, result); err != nil {
		return SyncResult{}, err
	}
	return result, nil
}

func (d *Daemon) meshPeerExists(networkName string, peerID peer.ID) bool {
	exists := false
	_ = d.store.View(func(txn *badger.Txn) error {
		_, err := txn.Get([]byte(meshPeerKey(networkName, peerID)))
		exists = err == nil
		return nil
	})
	return exists
}

func (d *Daemon) recordMeshPeerSuccess(networkName string, peerID peer.ID, result SyncResult) error {
	now := d.clockNow().UTC()
	return d.updateMeshPeer(networkName, peerID, func(record *persistedMeshPeer) {
		record.LastAttemptAt = now.Format(canonicalTimestampLayout)
		record.LastSuccessAt = now.Format(canonicalTimestampLayout)
		record.LastError = ""
		record.ConsecutiveFailures = 0
		record.NextAttemptAt = now.Add(d.meshSyncInterval).Format(canonicalTimestampLayout)
		resultCopy := result
		record.LastResult = &resultCopy
	})
}

func (d *Daemon) recordMeshPeerFailure(networkName string, peerID peer.ID, syncErr error) {
	now := d.clockNow().UTC()
	_ = d.updateMeshPeer(networkName, peerID, func(record *persistedMeshPeer) {
		record.LastAttemptAt = now.Format(canonicalTimestampLayout)
		record.LastError = syncErr.Error()
		record.ConsecutiveFailures++
		record.NextAttemptAt = now.Add(d.meshRetryDelay(record.ConsecutiveFailures)).Format(canonicalTimestampLayout)
	})
}

func (d *Daemon) meshRetryDelay(failures int) time.Duration {
	delay := d.meshSyncInterval
	if delay <= 0 {
		delay = 30 * time.Second
	}
	for attempt := 1; attempt < failures && delay < meshRetryMaximumDelay; attempt++ {
		delay *= 2
	}
	if delay > meshRetryMaximumDelay {
		return meshRetryMaximumDelay
	}
	return delay
}

func (d *Daemon) meshRetryLoop() {
	defer d.backgroundWG.Done()
	if d.meshSyncInterval < 0 {
		return
	}
	d.syncDueMeshPeers()
	ticker := time.NewTicker(d.meshSyncInterval)
	defer ticker.Stop()
	for {
		select {
		case <-d.ctx.Done():
			return
		case <-ticker.C:
			d.syncDueMeshPeers()
		}
	}
}

func (d *Daemon) signalMeshSync(networkName string) {
	if networkName == "" || d.meshSyncInterval < 0 {
		return
	}
	d.meshWakeMu.Lock()
	if d.meshWakeNetworks == nil {
		d.meshWakeNetworks = make(map[string]struct{})
	}
	d.meshWakeNetworks[networkName] = struct{}{}
	d.meshWakeMu.Unlock()
	if d.meshWake == nil {
		return
	}
	select {
	case d.meshWake <- struct{}{}:
	default:
	}
}

func (d *Daemon) meshEventSyncLoop() {
	defer d.backgroundWG.Done()
	for {
		select {
		case <-d.ctx.Done():
			return
		case <-d.meshWake:
		}
		if d.meshSyncDebounce > 0 {
			timer := time.NewTimer(d.meshSyncDebounce)
			select {
			case <-d.ctx.Done():
				timer.Stop()
				return
			case <-timer.C:
			}
		}
		networks := d.takeMeshWakeNetworks()
		for _, networkName := range networks {
			d.syncTriggeredMeshPeers(networkName)
		}
	}
}

func (d *Daemon) takeMeshWakeNetworks() []string {
	d.meshWakeMu.Lock()
	networks := make([]string, 0, len(d.meshWakeNetworks))
	for networkName := range d.meshWakeNetworks {
		networks = append(networks, networkName)
	}
	clear(d.meshWakeNetworks)
	d.meshWakeMu.Unlock()
	sort.Strings(networks)
	return networks
}

func (d *Daemon) syncTriggeredMeshPeers(networkName string) {
	records, err := d.loadMeshPeers()
	if err != nil {
		d.trace(false, "mesh.event", "failed to load peers for event-triggered sync", "network", networkName, "error", err)
		return
	}
	for _, record := range records {
		if d.ctx.Err() != nil || record.Network != networkName {
			continue
		}
		address, err := multiaddr.NewMultiaddr(record.Address)
		if err != nil {
			continue
		}
		info, err := peer.AddrInfoFromP2pAddr(address)
		if err != nil {
			continue
		}
		connected := d.p2p.Network().Connectedness(info.ID) != libp2pnetwork.NotConnected
		if !connected && record.LastError != "" {
			continue
		}
		ctx, cancel := context.WithTimeout(d.ctx, syncTimeout)
		_, err = d.synchronizeKnownPeer(ctx, *info, record.Network, record.Address)
		cancel()
		if errors.Is(err, errMeshSyncInProgress) {
			d.signalMeshSync(networkName)
			continue
		}
		if err != nil {
			d.trace(false, "mesh.event", "event-triggered mesh sync failed", "network", networkName, "remotePeerId", info.ID, "error", err)
		}
	}
}

func (d *Daemon) syncDueMeshPeers() {
	records, err := d.loadMeshPeers()
	if err != nil {
		d.trace(false, "mesh.retry", "failed to load persisted mesh peers", "error", err)
		return
	}
	now := d.clockNow().UTC()
	for _, record := range records {
		if d.ctx.Err() != nil {
			return
		}
		if _, exists := d.memberships.get(record.Network); !exists {
			continue
		}
		if record.NextAttemptAt != "" {
			next, err := time.Parse(canonicalTimestampLayout, record.NextAttemptAt)
			if err == nil && next.After(now) {
				continue
			}
		}
		address, err := multiaddr.NewMultiaddr(record.Address)
		if err != nil {
			continue
		}
		info, err := peer.AddrInfoFromP2pAddr(address)
		if err != nil {
			continue
		}
		ctx, cancel := context.WithTimeout(d.ctx, syncTimeout)
		_, err = d.synchronizeKnownPeer(ctx, *info, record.Network, record.Address)
		cancel()
		if err != nil {
			d.trace(false, "mesh.retry", "background mesh sync failed", "network", record.Network, "remotePeerId", info.ID, "error", err)
		}
	}
}

func (d *Daemon) removeMeshPeersForNetwork(networkName string) error {
	prefix := []byte(fmt.Sprintf("%s%s:", meshPeerKeyPrefix, encodeKeyPart(networkName)))
	return d.store.Update(func(txn *badger.Txn) error {
		iterator := txn.NewIterator(badger.DefaultIteratorOptions)
		defer iterator.Close()
		keys := make([][]byte, 0)
		for iterator.Seek(prefix); iterator.ValidForPrefix(prefix); iterator.Next() {
			keys = append(keys, iterator.Item().KeyCopy(nil))
		}
		for _, key := range keys {
			if err := txn.Delete(key); err != nil {
				return err
			}
		}
		return nil
	})
}
