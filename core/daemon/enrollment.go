package daemon

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"strings"
	"time"

	"github.com/libp2p/go-libp2p/core/network"
	"github.com/libp2p/go-libp2p/core/peer"
	"github.com/libp2p/go-libp2p/p2p/discovery/mdns"
	"github.com/multiformats/go-multiaddr"
)

const (
	enrollmentProtocolID = "/thalweg/enrollment/1.0.0"
	enrollmentFrameMax   = 64 * 1024
	enrollmentService    = "_thalweg._udp"
)

type enrollmentOffer struct {
	ID        string                `json:"id"`
	Network   NetworkMembershipInfo `json:"network"`
	ExpiresAt string                `json:"expiresAt"`
}

type enrollmentCandidate struct {
	PeerID     string          `json:"peerId"`
	TargetAddr string          `json:"targetAddr"`
	Offer      enrollmentOffer `json:"offer"`
}

type enrollmentRequestInfo struct {
	ID          string                `json:"id"`
	Network     NetworkMembershipInfo `json:"network"`
	PeerID      string                `json:"peerId"`
	DeviceName  string                `json:"deviceName"`
	RequestedAt string                `json:"requestedAt"`
	ExpiresAt   string                `json:"expiresAt"`
}

type enrollmentDecision struct {
	Accepted   bool
	Invitation string
	Error      string
}

type pendingEnrollment struct {
	info     enrollmentRequestInfo
	peerID   peer.ID
	decision chan enrollmentDecision
}

type enrollmentWireQuery struct {
	Type    string `json:"type"`
	Version int    `json:"version"`
}

type enrollmentWireOffers struct {
	Type    string            `json:"type"`
	Version int               `json:"version"`
	Offers  []enrollmentOffer `json:"offers"`
}

type enrollmentWireRequest struct {
	Type       string `json:"type"`
	Version    int    `json:"version"`
	OfferID    string `json:"offerId"`
	DeviceName string `json:"deviceName"`
}

type enrollmentWireDecision struct {
	Type       string `json:"type"`
	Version    int    `json:"version"`
	RequestID  string `json:"requestId"`
	Accepted   bool   `json:"accepted"`
	Invitation string `json:"invitation,omitempty"`
	Error      string `json:"error,omitempty"`
}

func (d *Daemon) registerEnrollmentRoutes() {
	d.Register("enrollment_listen", func(_ *clientConn, payload json.RawMessage) (any, error) {
		var args struct {
			Network         string `json:"network"`
			DurationSeconds int    `json:"durationSeconds"`
			Debug           bool   `json:"debug"`
		}
		if err := json.Unmarshal(payload, &args); err != nil {
			return nil, err
		}
		if args.DurationSeconds <= 0 || args.DurationSeconds > 3600 {
			return nil, fmt.Errorf("durationSeconds must be between 1 and 3600")
		}
		membership, exists := d.memberships.get(args.Network)
		if !exists {
			return nil, fmt.Errorf("network %q is not mounted", args.Network)
		}
		id, err := randomCredential(16)
		if err != nil {
			return nil, fmt.Errorf("generate enrollment offer: %w", err)
		}
		offer := enrollmentOffer{
			ID:        id,
			Network:   membership.info(),
			ExpiresAt: time.Now().UTC().Add(time.Duration(args.DurationSeconds) * time.Second).Format(time.RFC3339Nano),
		}
		d.enrollmentMu.Lock()
		d.enrollmentOffers[offer.ID] = offer
		d.enrollmentMu.Unlock()
		if err := d.startEnrollmentDiscovery(args.Debug); err != nil {
			return nil, err
		}
		d.trace(args.Debug, "enrollment.listen", "opened enrollment offer", "network", args.Network, "offerId", id, "expiresAt", offer.ExpiresAt)
		return map[string]any{"offer": offer, "addresses": d.peerAddresses()}, nil
	})

	d.Register("enrollment_close", func(_ *clientConn, payload json.RawMessage) (any, error) {
		var args struct {
			OfferID string `json:"offerId"`
		}
		if err := json.Unmarshal(payload, &args); err != nil {
			return nil, err
		}
		d.enrollmentMu.Lock()
		_, removed := d.enrollmentOffers[args.OfferID]
		delete(d.enrollmentOffers, args.OfferID)
		d.enrollmentMu.Unlock()
		return map[string]bool{"removed": removed}, nil
	})

	d.Register("enrollment_requests", func(_ *clientConn, payload json.RawMessage) (any, error) {
		var args struct {
			Network string `json:"network"`
		}
		if err := json.Unmarshal(payload, &args); err != nil {
			return nil, err
		}
		return d.pendingEnrollmentInfos(args.Network), nil
	})

	d.Register("enrollment_approve", func(_ *clientConn, payload json.RawMessage) (any, error) {
		return d.decideEnrollment(payload, true)
	})
	d.Register("enrollment_deny", func(_ *clientConn, payload json.RawMessage) (any, error) {
		return d.decideEnrollment(payload, false)
	})

	d.Register("enrollment_discover", func(_ *clientConn, payload json.RawMessage) (any, error) {
		var args struct {
			TargetAddr string `json:"targetAddr"`
			WaitMillis int    `json:"waitMillis"`
			Debug      bool   `json:"debug"`
		}
		if err := json.Unmarshal(payload, &args); err != nil {
			return nil, err
		}
		if args.TargetAddr != "" {
			candidates, err := d.queryEnrollmentAddress(args.TargetAddr, args.Debug)
			if err != nil {
				return nil, err
			}
			return candidates, nil
		}
		if args.WaitMillis <= 0 {
			args.WaitMillis = 2500
		}
		if args.WaitMillis > 10000 {
			return nil, fmt.Errorf("waitMillis must be at most 10000")
		}
		if err := d.startEnrollmentDiscovery(args.Debug); err != nil {
			return nil, err
		}
		d.trace(args.Debug, "enrollment.discovery", "scanning LAN", "waitMillis", args.WaitMillis)
		timer := time.NewTimer(time.Duration(args.WaitMillis) * time.Millisecond)
		select {
		case <-d.ctx.Done():
			timer.Stop()
			return nil, d.ctx.Err()
		case <-timer.C:
		}
		return d.discoverEnrollmentCandidates(args.Debug), nil
	})

	d.Register("enrollment_join", func(_ *clientConn, payload json.RawMessage) (any, error) {
		var args struct {
			TargetAddr string `json:"targetAddr"`
			OfferID    string `json:"offerId"`
			DeviceName string `json:"deviceName"`
			Debug      bool   `json:"debug"`
		}
		if err := json.Unmarshal(payload, &args); err != nil {
			return nil, err
		}
		return d.requestEnrollment(args.TargetAddr, args.OfferID, args.DeviceName, args.Debug)
	})
}

func (d *Daemon) peerAddresses() []string {
	addresses := make([]string, 0, len(d.p2p.Addrs()))
	for _, address := range d.p2p.Addrs() {
		addresses = append(addresses, fmt.Sprintf("%s/p2p/%s", address, d.p2p.ID()))
	}
	return addresses
}

func (d *Daemon) activeEnrollmentOffers() []enrollmentOffer {
	now := time.Now().UTC()
	d.enrollmentMu.Lock()
	defer d.enrollmentMu.Unlock()
	offers := make([]enrollmentOffer, 0, len(d.enrollmentOffers))
	for id, offer := range d.enrollmentOffers {
		expires, err := time.Parse(time.RFC3339Nano, offer.ExpiresAt)
		if err != nil || !expires.After(now) {
			delete(d.enrollmentOffers, id)
			continue
		}
		offers = append(offers, offer)
	}
	return offers
}

func (d *Daemon) pendingEnrollmentInfos(networkName string) []enrollmentRequestInfo {
	d.enrollmentMu.Lock()
	defer d.enrollmentMu.Unlock()
	result := make([]enrollmentRequestInfo, 0)
	for _, pending := range d.enrollmentRequests {
		if networkName == "" || pending.info.Network.Name == networkName {
			result = append(result, pending.info)
		}
	}
	return result
}

func (d *Daemon) decideEnrollment(payload json.RawMessage, approve bool) (any, error) {
	var args struct {
		RequestID string `json:"requestId"`
	}
	if err := json.Unmarshal(payload, &args); err != nil {
		return nil, err
	}
	d.enrollmentMu.Lock()
	pending, exists := d.enrollmentRequests[args.RequestID]
	if exists {
		delete(d.enrollmentRequests, args.RequestID)
	}
	d.enrollmentMu.Unlock()
	if !exists {
		return nil, fmt.Errorf("enrollment request %q is not pending", args.RequestID)
	}
	decision := enrollmentDecision{Accepted: approve}
	if approve {
		_, invitation, err := d.memberships.invite(pending.info.Network.Name)
		if err != nil {
			return nil, err
		}
		decision.Invitation = invitation
	} else {
		decision.Error = "enrollment denied"
	}
	pending.decision <- decision
	d.trace(false, "enrollment.decision", "decided enrollment request", "requestId", args.RequestID, "accepted", approve)
	return map[string]any{"requestId": args.RequestID, "accepted": approve}, nil
}

type enrollmentNotifee struct{ daemon *Daemon }

func (n enrollmentNotifee) HandlePeerFound(info peer.AddrInfo) {
	n.daemon.discoveryMu.Lock()
	n.daemon.discoveredPeers[info.ID] = info
	n.daemon.discoveryMu.Unlock()
	n.daemon.trace(false, "enrollment.discovery", "found LAN peer", "remotePeerId", info.ID.String(), "addressCount", len(info.Addrs))
}

func (d *Daemon) startEnrollmentDiscovery(debug bool) error {
	d.discoveryMu.Lock()
	defer d.discoveryMu.Unlock()
	if d.discoveryService != nil {
		return nil
	}
	service := mdns.NewMdnsService(d.p2p, enrollmentService, enrollmentNotifee{daemon: d})
	if err := service.Start(); err != nil {
		return fmt.Errorf("start LAN discovery: %w", err)
	}
	d.discoveryService = service
	d.trace(debug, "enrollment.discovery", "started mDNS service", "service", enrollmentService)
	return nil
}

func (d *Daemon) discoverEnrollmentCandidates(debug bool) []enrollmentCandidate {
	d.discoveryMu.Lock()
	peers := make([]peer.AddrInfo, 0, len(d.discoveredPeers))
	for _, info := range d.discoveredPeers {
		peers = append(peers, info)
	}
	d.discoveryMu.Unlock()
	var result []enrollmentCandidate
	for _, info := range peers {
		candidates, err := d.queryEnrollmentPeer(info, debug)
		if err != nil {
			d.trace(debug, "enrollment.discovery", "peer offer query failed", "remotePeerId", info.ID.String(), "error", err)
			continue
		}
		result = append(result, candidates...)
	}
	if result == nil {
		result = make([]enrollmentCandidate, 0)
	}
	d.trace(debug, "enrollment.discovery", "LAN scan completed", "discoveredPeers", len(peers), "offers", len(result))
	return result
}

func (d *Daemon) queryEnrollmentAddress(target string, debug bool) ([]enrollmentCandidate, error) {
	address, err := multiaddr.NewMultiaddr(target)
	if err != nil {
		return nil, fmt.Errorf("invalid peer address: %w", err)
	}
	info, err := peer.AddrInfoFromP2pAddr(address)
	if err != nil {
		return nil, err
	}
	return d.queryEnrollmentPeer(*info, debug)
}

func (d *Daemon) queryEnrollmentPeer(info peer.AddrInfo, debug bool) ([]enrollmentCandidate, error) {
	ctx, cancel := context.WithTimeout(d.ctx, 5*time.Second)
	defer cancel()
	target := enrollmentTarget(info)
	probe := d.debugTCPProbe(target, debug)
	d.trace(debug, "enrollment.connect", "connecting to discovered peer", "remotePeerId", info.ID.String(), "addresses", fmt.Sprint(info.Addrs), "tcpProbe", probe)
	if err := d.p2p.Connect(ctx, info); err != nil {
		if debug {
			return nil, fmt.Errorf("connect to enrollment peer %s: %w (debug: %s; tcp source-port reuse disabled)", info.ID, err, probe)
		}
		return nil, fmt.Errorf("connect to enrollment peer %s: %w", info.ID, err)
	}
	stream, err := d.p2p.NewStream(ctx, info.ID, enrollmentProtocolID)
	if err != nil {
		return nil, fmt.Errorf("open enrollment query: %w", err)
	}
	defer stream.Close()
	if err := json.NewEncoder(stream).Encode(enrollmentWireQuery{Type: "query", Version: 1}); err != nil {
		return nil, err
	}
	var response enrollmentWireOffers
	if err := readEnrollmentFrame(stream, &response); err != nil {
		return nil, err
	}
	connections := d.p2p.Network().ConnsToPeer(info.ID)
	if len(connections) > 0 {
		target = fmt.Sprintf("%s/p2p/%s", connections[0].RemoteMultiaddr(), info.ID)
	}
	candidates := make([]enrollmentCandidate, 0, len(response.Offers))
	for _, offer := range response.Offers {
		candidates = append(candidates, enrollmentCandidate{PeerID: info.ID.String(), TargetAddr: target, Offer: offer})
	}
	return candidates, nil
}

func (d *Daemon) requestEnrollment(target, offerID, deviceName string, debug bool) (any, error) {
	address, err := multiaddr.NewMultiaddr(target)
	if err != nil {
		return nil, fmt.Errorf("invalid peer address: %w", err)
	}
	info, err := peer.AddrInfoFromP2pAddr(address)
	if err != nil {
		return nil, err
	}
	ctx, cancel := context.WithTimeout(d.ctx, 15*time.Minute)
	defer cancel()
	probe := d.debugTCPProbe(target, debug)
	d.trace(debug, "enrollment.connect", "connecting for enrollment", "remotePeerId", info.ID.String(), "target", target, "tcpProbe", probe)
	if err := d.p2p.Connect(ctx, *info); err != nil {
		if debug {
			return nil, fmt.Errorf("connect to enrollment peer: %w (debug: %s; tcp source-port reuse disabled)", err, probe)
		}
		return nil, fmt.Errorf("connect to enrollment peer: %w", err)
	}
	stream, err := d.p2p.NewStream(ctx, info.ID, enrollmentProtocolID)
	if err != nil {
		return nil, fmt.Errorf("open enrollment request: %w", err)
	}
	defer stream.Close()
	if err := json.NewEncoder(stream).Encode(enrollmentWireRequest{
		Type: "request", Version: 1, OfferID: offerID, DeviceName: deviceName,
	}); err != nil {
		return nil, err
	}
	var decision enrollmentWireDecision
	if err := readEnrollmentFrame(stream, &decision); err != nil {
		return nil, err
	}
	if !decision.Accepted {
		if decision.Error == "" {
			decision.Error = "enrollment denied"
		}
		return nil, errors.New(decision.Error)
	}
	membership, joined, err := d.memberships.join(decision.Invitation)
	if err != nil {
		return nil, fmt.Errorf("mount approved membership: %w", err)
	}
	syncResult, err := d.synchronizeKnownPeer(ctx, *info, membership.Name, target)
	if err != nil {
		return nil, fmt.Errorf("membership joined, but initial sync failed: %w", err)
	}
	return map[string]any{"membership": membership, "joined": joined, "peerId": info.ID.String(), "sync": syncResult}, nil
}

func enrollmentTarget(info peer.AddrInfo) string {
	if len(info.Addrs) == 0 {
		return ""
	}
	return fmt.Sprintf("%s/p2p/%s", info.Addrs[0], info.ID)
}

func (d *Daemon) handleEnrollmentStream(stream network.Stream) {
	defer stream.Close()
	reader := bufio.NewReader(io.LimitReader(stream, enrollmentFrameMax+1))
	line, err := reader.ReadBytes('\n')
	if err != nil || len(line) > enrollmentFrameMax {
		_ = stream.Reset()
		return
	}
	var base struct {
		Type string `json:"type"`
	}
	if err := json.Unmarshal(line, &base); err != nil {
		_ = stream.Reset()
		return
	}
	switch base.Type {
	case "query":
		var query enrollmentWireQuery
		if decodeStrictJSON(line, &query) != nil || query.Version != 1 {
			_ = stream.Reset()
			return
		}
		_ = json.NewEncoder(stream).Encode(enrollmentWireOffers{Type: "offers", Version: 1, Offers: d.activeEnrollmentOffers()})
	case "request":
		var request enrollmentWireRequest
		if decodeStrictJSON(line, &request) != nil || request.Version != 1 {
			_ = stream.Reset()
			return
		}
		d.handleEnrollmentRequest(stream, request)
	default:
		_ = stream.Reset()
	}
}

func (d *Daemon) handleEnrollmentRequest(stream network.Stream, request enrollmentWireRequest) {
	var offer enrollmentOffer
	found := false
	for _, candidate := range d.activeEnrollmentOffers() {
		if candidate.ID == request.OfferID {
			offer, found = candidate, true
			break
		}
	}
	if !found {
		_ = json.NewEncoder(stream).Encode(enrollmentWireDecision{Type: "decision", Version: 1, Accepted: false, Error: "enrollment offer is unavailable or expired"})
		return
	}
	requestID, err := randomCredential(16)
	if err != nil {
		return
	}
	remotePeer := stream.Conn().RemotePeer()
	pending := &pendingEnrollment{
		info: enrollmentRequestInfo{
			ID: requestID, Network: offer.Network, PeerID: remotePeer.String(),
			DeviceName:  strings.TrimSpace(request.DeviceName),
			RequestedAt: time.Now().UTC().Format(time.RFC3339Nano), ExpiresAt: offer.ExpiresAt,
		},
		peerID: remotePeer, decision: make(chan enrollmentDecision, 1),
	}
	d.enrollmentMu.Lock()
	d.enrollmentRequests[requestID] = pending
	d.enrollmentMu.Unlock()
	d.trace(false, "enrollment.request", "received enrollment request", "requestId", requestID, "network", offer.Network.Name, "remotePeerId", remotePeer.String(), "deviceName", pending.info.DeviceName)
	expires, _ := time.Parse(time.RFC3339Nano, offer.ExpiresAt)
	timer := time.NewTimer(time.Until(expires))
	defer timer.Stop()
	var decision enrollmentDecision
	select {
	case decision = <-pending.decision:
	case <-timer.C:
		decision.Error = "enrollment request expired"
	case <-d.ctx.Done():
		decision.Error = "daemon is shutting down"
	}
	d.enrollmentMu.Lock()
	delete(d.enrollmentRequests, requestID)
	d.enrollmentMu.Unlock()
	_ = json.NewEncoder(stream).Encode(enrollmentWireDecision{
		Type: "decision", Version: 1, RequestID: requestID, Accepted: decision.Accepted,
		Invitation: decision.Invitation, Error: decision.Error,
	})
}

func readEnrollmentFrame(reader io.Reader, target any) error {
	buffered := bufio.NewReader(io.LimitReader(reader, enrollmentFrameMax+1))
	line, err := buffered.ReadBytes('\n')
	if err != nil {
		return fmt.Errorf("read enrollment frame: %w", err)
	}
	if len(line) > enrollmentFrameMax {
		return fmt.Errorf("enrollment frame exceeds %d bytes", enrollmentFrameMax)
	}
	return decodeStrictJSON(line, target)
}

func decodeStrictJSON(data []byte, target any) error {
	decoder := json.NewDecoder(bytes.NewReader(data))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(target); err != nil {
		return err
	}
	var trailing any
	if err := decoder.Decode(&trailing); !errors.Is(err, io.EOF) {
		return fmt.Errorf("enrollment frame contains trailing data")
	}
	return nil
}
