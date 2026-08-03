package daemon

import (
	"bufio"
	"bytes"
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net"
	"os"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/dgraph-io/badger/v4"
	"github.com/libp2p/go-libp2p"
	"github.com/libp2p/go-libp2p/core/host"
	"github.com/libp2p/go-libp2p/core/peer"
	libp2ptcp "github.com/libp2p/go-libp2p/p2p/transport/tcp"
	"github.com/multiformats/go-multiaddr"
	manet "github.com/multiformats/go-multiaddr/net"
)

const canonicalTimestampLayout = "2006-01-02T15:04:05.000000000Z"

const (
	localMaxRequestBytes  = 1024 * 1024
	subscriptionQueueSize = 128
)

type Message struct {
	ID              string          `json:"id,omitempty"`
	ProtocolVersion int             `json:"protocolVersion,omitempty"`
	Action          string          `json:"action"`
	Payload         json.RawMessage `json:"payload"`
}

type Response struct {
	ID              string         `json:"id,omitempty"`
	ProtocolVersion int            `json:"protocolVersion"`
	Success         bool           `json:"success"`
	Data            any            `json:"data,omitempty"`
	Error           string         `json:"error,omitempty"`
	ErrorDetails    *ResponseError `json:"errorDetails,omitempty"`
}

type ResponseError struct {
	Code      string `json:"code"`
	Message   string `json:"message"`
	Retryable bool   `json:"retryable"`
}

type StreamMessage struct {
	Type            string       `json:"type"`
	ProtocolVersion int          `json:"protocolVersion"`
	SubscriptionID  string       `json:"subscriptionId"`
	Event           ThalwegEvent `json:"event"`
}

type HandlerFunc func(conn *clientConn, payload json.RawMessage) (any, error)

type ThalwegEvent struct {
	ID           string          `json:"id"`
	Network      string          `json:"network"`
	Stream       string          `json:"stream"`
	OccurredAt   string          `json:"occurredAt"`
	InsertedAt   string          `json:"insertedAt"`
	PropagatedAt string          `json:"propagatedAt"`
	Counter      uint64          `json:"counter"`
	DeviceID     string          `json:"deviceId"`
	Payload      json.RawMessage `json:"payload"`
}

type Daemon struct {
	socketPath  string
	ctx         context.Context
	cancel      context.CancelFunc
	p2p         host.Host
	store       *badger.DB
	memberships *membershipStore
	routes      map[string]HandlerFunc

	lifecycleMu sync.Mutex
	listener    net.Listener
	ownsSocket  bool
	started     bool
	closed      bool
	closeOnce   sync.Once
	closeErr    error

	clientMu      sync.Mutex
	clients       map[net.Conn]struct{}
	closingClient bool
	clientWG      sync.WaitGroup
	backgroundWG  sync.WaitGroup

	deviceID string
	ingestMu sync.Mutex
	hlc      *hybridLogicalClock
	now      func() time.Time

	subMu         sync.RWMutex
	subscriptions map[string]*subscription
	debug         bool
	logger        *slog.Logger

	enrollmentMu       sync.Mutex
	enrollmentOffers   map[string]enrollmentOffer
	enrollmentRequests map[string]*pendingEnrollment
	discoveryMu        sync.Mutex
	discoveryService   io.Closer
	discoveredPeers    map[peer.ID]peer.AddrInfo

	meshSyncInterval time.Duration
	meshPeerMu       sync.Mutex
	meshSyncMu       sync.Mutex
	meshSyncing      map[string]struct{}
	meshLeaving      map[string]struct{}
	meshWakeMu       sync.Mutex
	meshWakeNetworks map[string]struct{}
	meshWake         chan struct{}
	meshSyncDebounce time.Duration
}

type clientConn struct {
	conn net.Conn
	enc  *json.Encoder
	mu   sync.Mutex
}

func (c *clientConn) Encode(v any) error {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.enc.Encode(v)
}

type subscription struct {
	id      string
	network string
	streams map[string]bool
	client  *clientConn
	queue   chan StreamMessage
}

type Config struct {
	SocketPath         string
	DBPath             string
	P2PListenAddresses []string
	Debug              bool
	MeshSyncInterval   time.Duration
	MeshSyncDebounce   time.Duration
}

func New(path string, dbPath string) (*Daemon, error) {
	return NewWithConfig(Config{SocketPath: path, DBPath: dbPath})
}

func NewWithConfig(config Config) (*Daemon, error) {
	if config.SocketPath == "" {
		return nil, fmt.Errorf("socket path is required")
	}
	if config.DBPath == "" {
		return nil, fmt.Errorf("database path is required")
	}
	db, err := badger.Open(badger.DefaultOptions(config.DBPath))
	if err != nil {
		return nil, fmt.Errorf("failed to open badgerdb: %w", err)
	}
	if err := ensureStorageSchema(db); err != nil {
		db.Close()
		return nil, err
	}
	clock, err := loadHLC(db)
	if err != nil {
		db.Close()
		return nil, err
	}

	privateKey, err := loadOrCreateIdentity(identityPath(config.DBPath))
	if err != nil {
		db.Close()
		return nil, err
	}
	memberships, err := loadMembershipStore(membershipsPath(config.DBPath))
	if err != nil {
		db.Close()
		return nil, err
	}

	options := []libp2p.Option{
		libp2p.Identity(privateKey),
		// Thalweg does not use TCP hole punching yet. Disabling source-port
		// reuse also avoids same-port LAN dials on macOS failing with
		// EHOSTUNREACH while an ordinary TCP probe succeeds.
		libp2p.Transport(libp2ptcp.NewTCPTransport, libp2ptcp.DisableReuseport()),
	}
	listenAddresses := config.P2PListenAddresses
	if len(listenAddresses) == 0 {
		listenAddresses = []string{"/ip4/0.0.0.0/tcp/0"}
	}
	options = append(options, libp2p.ListenAddrStrings(listenAddresses...))
	node, err := libp2p.New(options...)
	if err != nil {
		db.Close()
		return nil, fmt.Errorf("failed to create libp2p node: %w", err)
	}

	ctx, cancel := context.WithCancel(context.Background())
	d := &Daemon{
		socketPath:         config.SocketPath,
		routes:             make(map[string]HandlerFunc),
		ctx:                ctx,
		cancel:             cancel,
		p2p:                node,
		store:              db,
		memberships:        memberships,
		deviceID:           node.ID().String(),
		hlc:                clock,
		now:                time.Now,
		clients:            make(map[net.Conn]struct{}),
		subscriptions:      make(map[string]*subscription),
		enrollmentOffers:   make(map[string]enrollmentOffer),
		enrollmentRequests: make(map[string]*pendingEnrollment),
		discoveredPeers:    make(map[peer.ID]peer.AddrInfo),
		meshSyncInterval:   config.MeshSyncInterval,
		meshSyncDebounce:   config.MeshSyncDebounce,
		meshSyncing:        make(map[string]struct{}),
		meshLeaving:        make(map[string]struct{}),
		meshWakeNetworks:   make(map[string]struct{}),
		meshWake:           make(chan struct{}, 1),
		debug:              config.Debug,
		logger: slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{
			Level: slog.LevelDebug,
		})),
	}
	if d.meshSyncInterval == 0 {
		d.meshSyncInterval = 30 * time.Second
	}
	if d.meshSyncDebounce == 0 {
		d.meshSyncDebounce = 100 * time.Millisecond
	}

	d.p2p.SetStreamHandler(meshProtocolID, d.handleMeshStream)
	d.p2p.SetStreamHandler(enrollmentProtocolID, d.handleEnrollmentStream)
	d.registerRoutes()
	if err := d.reconcileConflictResolutions(); err != nil {
		_ = node.Close()
		_ = db.Close()
		return nil, fmt.Errorf("reconcile event conflict resolutions: %w", err)
	}

	return d, nil
}

func (d *Daemon) trace(enabled bool, stage, message string, args ...any) {
	if d == nil || (!d.debug && !enabled) || d.logger == nil {
		return
	}
	args = append([]any{"stage", stage, "peerId", d.deviceID}, args...)
	d.logger.Debug(message, args...)
}

func (d *Daemon) Register(action string, handler HandlerFunc) {
	d.routes[action] = handler
}

func (d *Daemon) Start() error {
	d.lifecycleMu.Lock()
	if d.closed {
		d.lifecycleMu.Unlock()
		return fmt.Errorf("daemon is closed")
	}
	if d.started {
		d.lifecycleMu.Unlock()
		return fmt.Errorf("daemon is already started")
	}
	if err := prepareSocket(d.socketPath); err != nil {
		d.lifecycleMu.Unlock()
		return err
	}
	listener, err := net.Listen("unix", d.socketPath)
	if err != nil {
		d.lifecycleMu.Unlock()
		return fmt.Errorf("listen on unix socket %s: %w", d.socketPath, err)
	}
	if err := os.Chmod(d.socketPath, 0o600); err != nil {
		listener.Close()
		_ = os.Remove(d.socketPath)
		d.lifecycleMu.Unlock()
		return fmt.Errorf("restrict unix socket permissions: %w", err)
	}
	d.listener = listener
	d.ownsSocket = true
	d.started = true
	d.restorePeers()
	d.restoreMeshPeers()
	d.lifecycleMu.Unlock()

	fmt.Println("Daemon is listening.")

	for {
		conn, err := listener.Accept()
		if err != nil {
			if errors.Is(err, net.ErrClosed) || d.ctx.Err() != nil {
				return nil
			}
			return fmt.Errorf("accept unix socket connection: %w", err)
		}
		if !d.trackClient(conn) {
			_ = conn.Close()
			continue
		}
		go func() {
			defer d.untrackClient(conn)
			d.Handle(conn)
		}()
	}
}

func (d *Daemon) Close() error {
	d.closeOnce.Do(func() {
		if d.cancel != nil {
			d.cancel()
		}

		d.clientMu.Lock()
		d.closingClient = true
		clients := make([]net.Conn, 0, len(d.clients))
		for conn := range d.clients {
			clients = append(clients, conn)
		}
		d.clientMu.Unlock()

		d.lifecycleMu.Lock()
		d.closed = true
		listener := d.listener
		ownsSocket := d.ownsSocket
		d.lifecycleMu.Unlock()

		var errs []error
		if listener != nil {
			if err := listener.Close(); err != nil && !errors.Is(err, net.ErrClosed) {
				errs = append(errs, fmt.Errorf("close unix listener: %w", err))
			}
		}
		for _, conn := range clients {
			_ = conn.Close()
		}
		d.clientWG.Wait()
		d.backgroundWG.Wait()

		if ownsSocket && d.socketPath != "" {
			if err := os.Remove(d.socketPath); err != nil && !errors.Is(err, os.ErrNotExist) {
				errs = append(errs, fmt.Errorf("remove unix socket: %w", err))
			}
		}
		if d.p2p != nil {
			d.discoveryMu.Lock()
			discovery := d.discoveryService
			d.discoveryService = nil
			d.discoveryMu.Unlock()
			if discovery != nil {
				if err := discovery.Close(); err != nil {
					errs = append(errs, fmt.Errorf("close LAN discovery: %w", err))
				}
			}
			if err := d.p2p.Close(); err != nil {
				errs = append(errs, fmt.Errorf("close libp2p host: %w", err))
			}
		}
		if d.store != nil {
			if err := d.store.Close(); err != nil {
				errs = append(errs, fmt.Errorf("close badgerdb: %w", err))
			}
		}
		d.closeErr = errors.Join(errs...)
	})
	return d.closeErr
}

func (d *Daemon) trackClient(conn net.Conn) bool {
	d.clientMu.Lock()
	defer d.clientMu.Unlock()
	if d.closingClient {
		return false
	}
	d.clients[conn] = struct{}{}
	d.clientWG.Add(1)
	return true
}

func (d *Daemon) untrackClient(conn net.Conn) {
	d.clientMu.Lock()
	delete(d.clients, conn)
	d.clientMu.Unlock()
	d.clientWG.Done()
}

func (d *Daemon) Handle(conn net.Conn) {
	client := &clientConn{conn: conn, enc: json.NewEncoder(conn)}
	defer func() {
		d.removeClientSubscriptions(client)
		conn.Close()
	}()

	scanner := bufio.NewScanner(conn)
	scanner.Buffer(make([]byte, 64*1024), localMaxRequestBytes)
	for scanner.Scan() {
		var msg Message
		if err := json.Unmarshal(scanner.Bytes(), &msg); err != nil {
			d.writeLocalError(client, "", "invalid_request", "invalid JSON structure", false)
			continue
		}
		if msg.ProtocolVersion != 0 && msg.ProtocolVersion != currentLocalProtocolVersion {
			d.writeLocalError(
				client,
				msg.ID,
				"protocol_mismatch",
				fmt.Sprintf(
					"unsupported protocol version %d (daemon supports %d)",
					msg.ProtocolVersion,
					currentLocalProtocolVersion,
				),
				false,
			)
			continue
		}

		handler, exists := d.routes[msg.Action]
		if !exists {
			d.writeLocalError(client, msg.ID, "unknown_action", fmt.Sprintf("unknown action: %s", msg.Action), false)
			continue
		}

		data, err := handler(client, msg.Payload)
		if err != nil {
			code, retryable := classifyLocalError(err)
			d.trace(false, "ipc.action", "local action failed", "action", msg.Action, "requestId", msg.ID, "errorCode", code, "retryable", retryable, "error", err)
			d.writeLocalError(client, msg.ID, code, err.Error(), retryable)
			continue
		}

		_ = client.Encode(Response{
			ID:              msg.ID,
			ProtocolVersion: currentLocalProtocolVersion,
			Success:         true,
			Data:            data,
		})
		if msg.Action == "daemon_shutdown" {
			go func() {
				_ = d.Close()
			}()
			return
		}
	}
	if err := scanner.Err(); err != nil {
		d.writeLocalError(
			client,
			"",
			"request_too_large",
			fmt.Sprintf("read local request (maximum %d bytes): %v", localMaxRequestBytes, err),
			false,
		)
	}
}

func (d *Daemon) writeLocalError(client *clientConn, id, code, message string, retryable bool) {
	_ = client.Encode(Response{
		ID:              id,
		ProtocolVersion: currentLocalProtocolVersion,
		Success:         false,
		Error:           message,
		ErrorDetails: &ResponseError{
			Code:      code,
			Message:   message,
			Retryable: retryable,
		},
	})
}

func classifyLocalError(err error) (string, bool) {
	switch {
	case errors.Is(err, context.DeadlineExceeded):
		return "deadline_exceeded", true
	case errors.Is(err, context.Canceled):
		return "canceled", true
	}
	var networkError net.Error
	if errors.As(err, &networkError) {
		return "unavailable", true
	}
	return "action_failed", false
}

func (d *Daemon) registerRoutes() {
	d.registerEnrollmentRoutes()

	d.Register("daemon_shutdown", func(_ *clientConn, _ json.RawMessage) (any, error) {
		return map[string]any{"stopping": true}, nil
	})

	d.Register("network_status", func(_ *clientConn, _ json.RawMessage) (any, error) {
		addrs := d.peerAddresses()
		return map[string]any{
			"peerId":                d.p2p.ID().String(),
			"deviceId":              d.deviceID,
			"addresses":             addrs,
			"addressGroups":         groupPeerAddresses(addrs),
			"daemonVersion":         daemonVersion,
			"protocolVersion":       currentLocalProtocolVersion,
			"storageSchemaVersion":  currentStorageSchemaVersion,
			"meshProtocolVersion":   meshProtocolVersion,
			"membershipFileVersion": membershipFileVersion,
		}, nil
	})

	d.Register("network_create", func(_ *clientConn, payload json.RawMessage) (any, error) {
		var args struct {
			Name string `json:"name"`
		}
		if err := json.Unmarshal(payload, &args); err != nil {
			return nil, err
		}
		membership, invitation, err := d.memberships.create(args.Name)
		if err != nil {
			return nil, err
		}
		return map[string]any{
			"membership": membership,
			"invitation": invitation,
		}, nil
	})

	d.Register("network_join", func(_ *clientConn, payload json.RawMessage) (any, error) {
		var args struct {
			Invitation string `json:"invitation"`
		}
		if err := json.Unmarshal(payload, &args); err != nil {
			return nil, err
		}
		membership, joined, err := d.memberships.join(args.Invitation)
		if err != nil {
			return nil, err
		}
		return map[string]any{
			"membership": membership,
			"joined":     joined,
		}, nil
	})

	d.Register("network_invite", func(_ *clientConn, payload json.RawMessage) (any, error) {
		var args struct {
			Name string `json:"name"`
		}
		if err := json.Unmarshal(payload, &args); err != nil {
			return nil, err
		}
		membership, invitation, err := d.memberships.invite(args.Name)
		if err != nil {
			return nil, err
		}
		return map[string]any{
			"membership":     membership,
			"invitation":     invitation,
			"credentialMode": "shared-bearer",
		}, nil
	})

	d.Register("network_list", func(_ *clientConn, _ json.RawMessage) (any, error) {
		return d.memberships.list(), nil
	})

	d.Register("network_leave", func(_ *clientConn, payload json.RawMessage) (any, error) {
		var args struct {
			Name string `json:"name"`
		}
		if err := json.Unmarshal(payload, &args); err != nil {
			return nil, err
		}
		if err := d.startMeshNetworkLeave(args.Name); err != nil {
			return nil, err
		}
		defer d.finishMeshNetworkLeave(args.Name)
		membership, err := d.memberships.leave(args.Name)
		if err != nil {
			return nil, err
		}
		if err := d.removeMeshPeersForNetwork(args.Name); err != nil {
			return nil, fmt.Errorf("left network, but failed to remove persisted peers: %w", err)
		}
		return map[string]any{
			"membership": membership,
			"left":       true,
		}, nil
	})

	d.Register("mesh_peer_list", func(_ *clientConn, payload json.RawMessage) (any, error) {
		var args struct {
			Network string `json:"network"`
		}
		if len(payload) > 0 {
			if err := json.Unmarshal(payload, &args); err != nil {
				return nil, err
			}
		}
		return d.listMeshPeers(args.Network)
	})

	d.Register("event_ingest", func(_ *clientConn, payload json.RawMessage) (any, error) {
		var args struct {
			Network    string          `json:"network"`
			Stream     string          `json:"stream"`
			OccurredAt string          `json:"occurredAt"`
			Payload    json.RawMessage `json:"payload"`
			EventID    string          `json:"eventId"`
		}
		if err := json.Unmarshal(payload, &args); err != nil {
			return nil, err
		}
		event, err := d.ingest(args.Network, args.Stream, args.OccurredAt, args.EventID, args.Payload)
		if err != nil {
			return nil, err
		}
		return event, nil
	})

	d.Register("event_query", func(_ *clientConn, payload json.RawMessage) (any, error) {
		var args struct {
			Network string   `json:"network"`
			Streams []string `json:"streams"`
			From    string   `json:"from"`
			To      string   `json:"to"`
			Limit   int      `json:"limit"`
			Order   string   `json:"order"`
		}
		if err := json.Unmarshal(payload, &args); err != nil {
			return nil, err
		}
		return d.queryOrdered(args.Network, args.Streams, args.From, args.To, args.Limit, args.Order)
	})

	d.Register("event_conflict_list", func(_ *clientConn, payload json.RawMessage) (any, error) {
		var args struct {
			Network string `json:"network"`
		}
		if err := json.Unmarshal(payload, &args); err != nil {
			return nil, err
		}
		return d.listEventConflicts(args.Network)
	})

	d.Register("event_conflict_resolve", func(_ *clientConn, payload json.RawMessage) (any, error) {
		var args struct {
			Network  string `json:"network"`
			EventID  string `json:"eventId"`
			Strategy string `json:"strategy"`
		}
		if err := json.Unmarshal(payload, &args); err != nil {
			return nil, err
		}
		return d.resolveEventConflict(args.Network, args.EventID, args.Strategy)
	})

	d.Register("siphon_register", func(client *clientConn, payload json.RawMessage) (any, error) {
		var args struct {
			Network string   `json:"network"`
			Streams []string `json:"streams"`
		}
		if err := json.Unmarshal(payload, &args); err != nil {
			return nil, err
		}
		if args.Network == "" {
			return nil, fmt.Errorf("network is required")
		}
		id := randomID("sub")
		streams := make(map[string]bool)
		for _, stream := range args.Streams {
			streams[stream] = true
		}
		sub := &subscription{
			id:      id,
			network: args.Network,
			streams: streams,
			client:  client,
			queue:   make(chan StreamMessage, subscriptionQueueSize),
		}
		d.subMu.Lock()
		d.subscriptions[id] = sub
		d.subMu.Unlock()
		d.backgroundWG.Add(1)
		go d.deliverSubscription(sub)
		return map[string]string{"subscriptionId": id}, nil
	})

	d.Register("siphon_unregister", func(_ *clientConn, payload json.RawMessage) (any, error) {
		var args struct {
			SubscriptionID string `json:"subscriptionId"`
		}
		if err := json.Unmarshal(payload, &args); err != nil {
			return nil, err
		}
		d.removeSubscription(args.SubscriptionID, nil)
		return map[string]bool{"removed": true}, nil
	})

	d.Register("p2p_dial", func(_ *clientConn, payload json.RawMessage) (any, error) {
		var args struct {
			TargetAddr string `json:"target_addr"`
		}
		if err := json.Unmarshal(payload, &args); err != nil {
			return nil, err
		}

		maddr, err := multiaddr.NewMultiaddr(args.TargetAddr)
		if err != nil {
			return nil, fmt.Errorf("invalid multiaddress: %w", err)
		}
		info, err := peer.AddrInfoFromP2pAddr(maddr)
		if err != nil {
			return nil, err
		}
		if err := d.p2p.Connect(d.ctx, *info); err != nil {
			return nil, fmt.Errorf("failed to connect to peer: %w", err)
		}
		err = d.store.Update(func(txn *badger.Txn) error {
			return txn.Set([]byte(fmt.Sprintf("peer:%s", info.ID.String())), []byte(args.TargetAddr))
		})
		if err != nil {
			return nil, fmt.Errorf("connected, but failed to persist peer: %w", err)
		}
		return fmt.Sprintf("Successfully connected to %s", info.ID.String()), nil
	})

	d.Register("mesh_dial", func(_ *clientConn, payload json.RawMessage) (any, error) {
		var args struct {
			TargetAddr       string `json:"targetAddr"`
			LegacyTargetAddr string `json:"target_addr"`
			Network          string `json:"network"`
			Debug            bool   `json:"debug"`
		}
		if err := json.Unmarshal(payload, &args); err != nil {
			return nil, err
		}
		if args.TargetAddr == "" {
			args.TargetAddr = args.LegacyTargetAddr
		}
		if args.TargetAddr == "" {
			return nil, fmt.Errorf("targetAddr is required")
		}
		if args.Network == "" {
			return nil, fmt.Errorf("network is required")
		}
		maddr, err := multiaddr.NewMultiaddr(args.TargetAddr)
		if err != nil {
			return nil, fmt.Errorf("invalid multiaddress: %w", err)
		}
		info, err := peer.AddrInfoFromP2pAddr(maddr)
		if err != nil {
			return nil, err
		}
		ctx, cancel := context.WithTimeout(d.ctx, 10*time.Second)
		defer cancel()
		probe := d.debugTCPProbe(args.TargetAddr, args.Debug)
		d.trace(args.Debug, "mesh.connect", "starting libp2p connect", "network", args.Network, "target", args.TargetAddr, "tcpProbe", probe)
		if err := d.p2p.Connect(ctx, *info); err != nil {
			if args.Debug {
				return nil, fmt.Errorf("failed to connect to peer: %w (debug: %s; tcp source-port reuse disabled)", err, probe)
			}
			return nil, fmt.Errorf("connect to mesh peer: %w", err)
		}
		d.trace(args.Debug, "mesh.authenticate", "TCP/libp2p connection established", "remotePeerId", info.ID.String())
		if err := d.authenticatePeer(ctx, info.ID, args.Network); err != nil {
			return nil, fmt.Errorf("authenticate mesh peer: %w", err)
		}
		if err := d.persistMeshPeer(args.Network, info.ID, args.TargetAddr); err != nil {
			return nil, fmt.Errorf("authenticated, but failed to persist mesh peer: %w", err)
		}
		membership, _ := d.memberships.get(args.Network)
		return map[string]any{
			"peerId":     info.ID.String(),
			"network":    membership.info(),
			"authorized": true,
		}, nil
	})

	d.Register("mesh_sync", func(_ *clientConn, payload json.RawMessage) (any, error) {
		var args struct {
			TargetAddr       string `json:"targetAddr"`
			LegacyTargetAddr string `json:"target_addr"`
			Network          string `json:"network"`
			Debug            bool   `json:"debug"`
		}
		if err := json.Unmarshal(payload, &args); err != nil {
			return nil, err
		}
		if args.TargetAddr == "" {
			args.TargetAddr = args.LegacyTargetAddr
		}
		if args.TargetAddr == "" {
			return nil, fmt.Errorf("targetAddr is required")
		}
		if args.Network == "" {
			return nil, fmt.Errorf("network is required")
		}
		maddr, err := multiaddr.NewMultiaddr(args.TargetAddr)
		if err != nil {
			return nil, fmt.Errorf("invalid multiaddress: %w", err)
		}
		info, err := peer.AddrInfoFromP2pAddr(maddr)
		if err != nil {
			return nil, err
		}
		ctx, cancel := context.WithTimeout(d.ctx, syncTimeout)
		defer cancel()
		probe := d.debugTCPProbe(args.TargetAddr, args.Debug)
		d.trace(args.Debug, "mesh.connect", "starting libp2p sync connection", "network", args.Network, "target", args.TargetAddr, "tcpProbe", probe)
		d.trace(args.Debug, "mesh.sync", "starting authenticated synchronization", "remotePeerId", info.ID.String())
		result, err := d.synchronizeKnownPeer(ctx, *info, args.Network, args.TargetAddr)
		if err != nil {
			if args.Debug {
				return nil, fmt.Errorf("synchronize mesh peer: %w (debug: %s; tcp source-port reuse disabled)", err, probe)
			}
			return nil, fmt.Errorf("synchronize mesh peer: %w", err)
		}
		return result, nil
	})
}

func groupPeerAddresses(addresses []string) map[string][]string {
	groups := map[string][]string{
		"loopback": {},
		"lan":      {},
		"public":   {},
		"other":    {},
	}
	for _, address := range addresses {
		scope := "other"
		maddr, err := multiaddr.NewMultiaddr(address)
		if err == nil {
			var ip net.IP
			if value, valueErr := maddr.ValueForProtocol(multiaddr.P_IP4); valueErr == nil {
				ip = net.ParseIP(value)
			} else if value, valueErr := maddr.ValueForProtocol(multiaddr.P_IP6); valueErr == nil {
				ip = net.ParseIP(value)
			}
			switch {
			case ip != nil && ip.IsLoopback():
				scope = "loopback"
			case ip != nil && (ip.IsPrivate() || ip.IsLinkLocalUnicast()):
				scope = "lan"
			case ip != nil && ip.IsGlobalUnicast():
				scope = "public"
			}
		}
		groups[scope] = append(groups[scope], address)
	}
	for scope := range groups {
		sort.Strings(groups[scope])
	}
	return groups
}

func (d *Daemon) debugTCPProbe(target string, enabled bool) string {
	if !enabled && !d.debug {
		return "not requested"
	}
	address, err := multiaddr.NewMultiaddr(target)
	if err != nil {
		return "invalid multiaddress: " + err.Error()
	}
	info, err := peer.AddrInfoFromP2pAddr(address)
	if err != nil || len(info.Addrs) == 0 {
		return "cannot extract peer TCP address"
	}
	networkName, endpoint, err := manet.DialArgs(info.Addrs[0])
	if err != nil {
		return "cannot derive TCP endpoint: " + err.Error()
	}
	conn, err := net.DialTimeout(networkName, endpoint, 2*time.Second)
	if err != nil {
		return fmt.Sprintf("raw %s dial to %s failed: %v", networkName, endpoint, err)
	}
	local := conn.LocalAddr().String()
	remote := conn.RemoteAddr().String()
	_ = conn.Close()
	return fmt.Sprintf("raw %s dial succeeded (%s -> %s)", networkName, local, remote)
}

func (d *Daemon) ingest(networkName, stream, occurredAt, eventID string, payload json.RawMessage) (ThalwegEvent, error) {
	if stream == conflictResolutionStream {
		return ThalwegEvent{}, fmt.Errorf("stream %q is reserved; use event conflict resolution", conflictResolutionStream)
	}
	return d.ingestInternal(networkName, stream, occurredAt, eventID, payload)
}

func (d *Daemon) ingestInternal(networkName, stream, occurredAt, eventID string, payload json.RawMessage) (ThalwegEvent, error) {
	if networkName == "" {
		return ThalwegEvent{}, fmt.Errorf("network is required")
	}
	if stream == "" {
		return ThalwegEvent{}, fmt.Errorf("stream is required")
	}
	if len(payload) == 0 {
		payload = json.RawMessage("null")
	}
	canonicalPayload, err := normalizePayload(payload)
	if err != nil {
		return ThalwegEvent{}, err
	}
	payload = canonicalPayload
	occurredAtProvided := occurredAt != ""
	wallTime := d.clockNow()
	if occurredAt == "" {
		occurredAt = wallTime.UTC().Format(canonicalTimestampLayout)
	}
	occurredAt, err = normalizeTimestamp("occurredAt", occurredAt)
	if err != nil {
		return ThalwegEvent{}, err
	}
	if eventID == "" {
		eventID = randomID("evt")
	}

	d.ingestMu.Lock()
	defer d.ingestMu.Unlock()

	var event ThalwegEvent
	created := false
	var nextClockState hlcTimestamp
	err = d.store.Update(func(txn *badger.Txn) error {
		existing, err := findEventByID(txn, networkName, eventID)
		if err != nil {
			return err
		}
		if existing != nil {
			if err := validateIdempotentRetry(*existing, stream, occurredAt, occurredAtProvided, payload); err != nil {
				return err
			}
			event = *existing
			return nil
		}

		nextClockState, err = d.hlc.nextLocal(wallTime)
		if err != nil {
			return err
		}
		event = ThalwegEvent{
			ID:           eventID,
			Network:      networkName,
			Stream:       stream,
			OccurredAt:   occurredAt,
			InsertedAt:   nextClockState.Physical,
			PropagatedAt: nextClockState.Physical,
			Counter:      nextClockState.Logical,
			DeviceID:     d.deviceID,
			Payload:      payload,
		}
		value, err := json.Marshal(event)
		if err != nil {
			return err
		}
		primaryKey := eventKey(event)
		if err := txn.Set([]byte(primaryKey), value); err != nil {
			return err
		}
		if err := txn.Set([]byte(eventIDKey(networkName, eventID)), []byte(primaryKey)); err != nil {
			return err
		}
		if err := setHLCState(txn, nextClockState); err != nil {
			return err
		}
		created = true
		return nil
	})
	if err != nil {
		return ThalwegEvent{}, err
	}

	if created {
		d.hlc.commit(nextClockState)
		d.broadcast(event)
		d.signalMeshSync(networkName)
	}
	return event, nil
}

// ingestReplicated persists an immutable event envelope received from another
// node. Transport and membership authentication intentionally live outside
// this boundary; callers must authenticate the peer before invoking it.
func (d *Daemon) ingestReplicated(incoming ThalwegEvent) (ThalwegEvent, bool, error) {
	event, err := normalizeReplicatedEvent(incoming)
	if err != nil {
		return ThalwegEvent{}, false, err
	}
	resolution, isResolution, err := parseConflictResolution(event)
	if err != nil {
		return ThalwegEvent{}, false, err
	}

	d.ingestMu.Lock()

	created := false
	var nextClockState hlcTimestamp
	err = d.store.Update(func(txn *badger.Txn) error {
		existing, err := findEventByID(txn, event.Network, event.ID)
		if err != nil {
			return err
		}
		if existing != nil {
			if err := validateReplicatedRetry(*existing, event); err != nil {
				return err
			}
			event = *existing
			return nil
		}

		nextClockState, err = mergeHLCTimestamp(
			d.hlc.state,
			hlcTimestamp{Physical: event.InsertedAt, Logical: event.Counter},
			d.clockNow(),
		)
		if err != nil {
			return err
		}
		value, err := json.Marshal(event)
		if err != nil {
			return fmt.Errorf("encode replicated event: %w", err)
		}
		primaryKey := eventKey(event)
		if err := txn.Set([]byte(primaryKey), value); err != nil {
			return err
		}
		if err := txn.Set([]byte(eventIDKey(event.Network, event.ID)), []byte(primaryKey)); err != nil {
			return err
		}
		if err := setHLCState(txn, nextClockState); err != nil {
			return err
		}
		created = true
		return nil
	})
	if err != nil {
		d.ingestMu.Unlock()
		return ThalwegEvent{}, false, err
	}

	if created {
		d.hlc.commit(nextClockState)
	}
	d.ingestMu.Unlock()

	if created {
		d.broadcast(event)
	}
	if isResolution {
		if _, _, err := d.materializeConflictVariant(event.Network, resolution.EventID); err != nil {
			return ThalwegEvent{}, false, err
		}
	}
	return event, created, nil
}

func normalizeReplicatedEvent(event ThalwegEvent) (ThalwegEvent, error) {
	required := []struct {
		field string
		value string
	}{
		{field: "id", value: event.ID},
		{field: "network", value: event.Network},
		{field: "stream", value: event.Stream},
		{field: "deviceId", value: event.DeviceID},
		{field: "occurredAt", value: event.OccurredAt},
		{field: "insertedAt", value: event.InsertedAt},
		{field: "propagatedAt", value: event.PropagatedAt},
	}
	for _, candidate := range required {
		if candidate.value == "" {
			return ThalwegEvent{}, fmt.Errorf("%s is required", candidate.field)
		}
	}

	var err error
	event.OccurredAt, err = normalizeTimestamp("occurredAt", event.OccurredAt)
	if err != nil {
		return ThalwegEvent{}, err
	}
	event.InsertedAt, err = normalizeTimestamp("insertedAt", event.InsertedAt)
	if err != nil {
		return ThalwegEvent{}, err
	}
	event.PropagatedAt, err = normalizeTimestamp("propagatedAt", event.PropagatedAt)
	if err != nil {
		return ThalwegEvent{}, err
	}
	if len(event.Payload) == 0 {
		event.Payload = json.RawMessage("null")
	}
	event.Payload, err = normalizePayload(event.Payload)
	if err != nil {
		return ThalwegEvent{}, err
	}
	return event, nil
}

func findEventByID(txn *badger.Txn, networkName string, eventID string) (*ThalwegEvent, error) {
	indexItem, err := txn.Get([]byte(eventIDKey(networkName, eventID)))
	if errors.Is(err, badger.ErrKeyNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("read event ID index: %w", err)
	}
	primaryKey, err := indexItem.ValueCopy(nil)
	if err != nil {
		return nil, fmt.Errorf("read event ID index value: %w", err)
	}
	eventItem, err := txn.Get(primaryKey)
	if errors.Is(err, badger.ErrKeyNotFound) {
		return nil, fmt.Errorf("event ID index points to missing event: %s", primaryKey)
	}
	if err != nil {
		return nil, fmt.Errorf("read indexed event: %w", err)
	}

	var event ThalwegEvent
	if err := eventItem.Value(func(value []byte) error {
		return json.Unmarshal(value, &event)
	}); err != nil {
		return nil, err
	}
	if event.ID != eventID || event.Network != networkName {
		return nil, fmt.Errorf("event ID index points to mismatched event %q in network %q", event.ID, event.Network)
	}
	normalizedOccurredAt, err := normalizeTimestamp("stored occurredAt", event.OccurredAt)
	if err != nil {
		return nil, err
	}
	normalizedPayload, err := normalizePayload(event.Payload)
	if err != nil {
		return nil, fmt.Errorf("decode stored payload for event %s: %w", event.ID, err)
	}
	event.OccurredAt = normalizedOccurredAt
	event.Payload = normalizedPayload
	return &event, nil
}

func validateIdempotentRetry(
	existing ThalwegEvent,
	stream string,
	occurredAt string,
	occurredAtProvided bool,
	payload json.RawMessage,
) error {
	existingPayload, err := normalizePayload(existing.Payload)
	if err != nil {
		return fmt.Errorf("decode stored payload for event %s: %w", existing.ID, err)
	}
	existingOccurredAt, err := normalizeTimestamp("stored occurredAt", existing.OccurredAt)
	if err != nil {
		return err
	}
	if existing.Stream != stream ||
		(occurredAtProvided && existingOccurredAt != occurredAt) ||
		!bytes.Equal(existingPayload, payload) {
		return fmt.Errorf("event id %q already exists with different content in network %q", existing.ID, existing.Network)
	}
	return nil
}

func validateReplicatedRetry(existing ThalwegEvent, incoming ThalwegEvent) error {
	storedID := existing.ID
	existing, err := normalizeReplicatedEvent(existing)
	if err != nil {
		return fmt.Errorf("normalize stored event %s: %w", storedID, err)
	}
	if existing.ID != incoming.ID ||
		existing.Network != incoming.Network ||
		existing.Stream != incoming.Stream ||
		existing.OccurredAt != incoming.OccurredAt ||
		existing.InsertedAt != incoming.InsertedAt ||
		existing.PropagatedAt != incoming.PropagatedAt ||
		existing.Counter != incoming.Counter ||
		existing.DeviceID != incoming.DeviceID ||
		!bytes.Equal(existing.Payload, incoming.Payload) {
		return fmt.Errorf(
			"event id %q already exists with a different origin envelope in network %q",
			incoming.ID,
			incoming.Network,
		)
	}
	return nil
}

func normalizePayload(payload json.RawMessage) (json.RawMessage, error) {
	decoder := json.NewDecoder(bytes.NewReader(payload))
	decoder.UseNumber()
	var value any
	if err := decoder.Decode(&value); err != nil {
		return nil, fmt.Errorf("payload must be valid JSON: %w", err)
	}
	var trailing any
	if err := decoder.Decode(&trailing); !errors.Is(err, io.EOF) {
		if err == nil {
			return nil, fmt.Errorf("payload must contain exactly one JSON value")
		}
		return nil, fmt.Errorf("payload must be valid JSON: %w", err)
	}
	normalized, err := json.Marshal(value)
	if err != nil {
		return nil, fmt.Errorf("normalize payload JSON: %w", err)
	}
	return normalized, nil
}

func (d *Daemon) query(networkName string, streams []string, from string, to string, limit int) ([]ThalwegEvent, error) {
	return d.queryOrdered(networkName, streams, from, to, limit, "asc")
}

func (d *Daemon) queryOrdered(
	networkName string,
	streams []string,
	from string,
	to string,
	limit int,
	order string,
) ([]ThalwegEvent, error) {
	if networkName == "" {
		return nil, fmt.Errorf("network is required")
	}
	if order == "" {
		order = "asc"
	}
	if order != "asc" && order != "desc" {
		return nil, fmt.Errorf("order must be \"asc\" or \"desc\"")
	}
	if limit < 0 {
		return nil, fmt.Errorf("limit must be zero or greater")
	}
	if from != "" {
		normalized, err := normalizeTimestamp("from", from)
		if err != nil {
			return nil, err
		}
		from = normalized
	}
	if to != "" {
		normalized, err := normalizeTimestamp("to", to)
		if err != nil {
			return nil, err
		}
		to = normalized
	}

	events := make([]ThalwegEvent, 0)
	err := d.store.View(func(txn *badger.Txn) error {
		resolutions, err := conflictResolutionsTxn(txn, networkName)
		if err != nil {
			return err
		}
		it := txn.NewIterator(badger.DefaultIteratorOptions)
		defer it.Close()

		prefixes := queryPrefixes(networkName, streams)
		for _, prefix := range prefixes {
			for it.Seek([]byte(prefix)); it.ValidForPrefix([]byte(prefix)); it.Next() {
				item := it.Item()
				err := item.Value(func(val []byte) error {
					var event ThalwegEvent
					if err := json.Unmarshal(val, &event); err != nil {
						return err
					}
					if _, superseded := resolutions[event.ID]; superseded {
						return nil
					}
					normalized, err := normalizeTimestamp("stored occurredAt", event.OccurredAt)
					if err != nil {
						return err
					}
					event.OccurredAt = normalized
					if inRange(event, from, to) {
						events = append(events, event)
					}
					return nil
				})
				if err != nil {
					return err
				}
			}
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	sort.Slice(events, func(i, j int) bool {
		if order == "desc" {
			return chronologicalKey(events[i]) > chronologicalKey(events[j])
		}
		return chronologicalKey(events[i]) < chronologicalKey(events[j])
	})
	if limit > 0 && len(events) > limit {
		events = events[:limit]
	}
	return events, nil
}

func queryPrefixes(networkName string, streams []string) []string {
	if len(streams) == 0 {
		return []string{fmt.Sprintf("event-v3:%s:", encodeKeyPart(networkName))}
	}
	prefixes := make([]string, 0, len(streams))
	for _, stream := range streams {
		prefixes = append(prefixes, fmt.Sprintf(
			"event-v3:%s:%s:",
			encodeKeyPart(networkName),
			encodeKeyPart(stream),
		))
	}
	return prefixes
}

func inRange(event ThalwegEvent, from string, to string) bool {
	if from != "" && event.OccurredAt < from {
		return false
	}
	if to != "" && event.OccurredAt > to {
		return false
	}
	return true
}

func normalizeTimestamp(field string, value string) (string, error) {
	parsed, err := time.Parse(time.RFC3339Nano, value)
	if err != nil {
		return "", fmt.Errorf("%s must be RFC3339/RFC3339Nano: %w", field, err)
	}
	return parsed.UTC().Format(canonicalTimestampLayout), nil
}

func (d *Daemon) clockNow() time.Time {
	if d.now != nil {
		return d.now()
	}
	return time.Now()
}

func chronologicalKey(event ThalwegEvent) string {
	return fmt.Sprintf(
		"%s:%s:%020d:%s:%s:%s",
		event.OccurredAt,
		event.InsertedAt,
		event.Counter,
		event.DeviceID,
		event.Stream,
		event.ID,
	)
}

func eventKey(event ThalwegEvent) string {
	return fmt.Sprintf(
		"event-v3:%s:%s:%s:%020d:%s:%s",
		encodeKeyPart(event.Network),
		encodeKeyPart(event.Stream),
		event.OccurredAt,
		event.Counter,
		encodeKeyPart(event.DeviceID),
		encodeKeyPart(event.ID),
	)
}

func eventIDKey(networkName string, eventID string) string {
	return fmt.Sprintf(
		"event-id-v3:%s:%s",
		encodeKeyPart(networkName),
		encodeKeyPart(eventID),
	)
}

func encodeKeyPart(value string) string {
	return base64.RawURLEncoding.EncodeToString([]byte(value))
}

func legacyEventKey(event ThalwegEvent) string {
	return fmt.Sprintf(
		"event:%s:%s:%s:%020d:%s:%s",
		escapeKeyPart(event.Network),
		escapeKeyPart(event.Stream),
		event.OccurredAt,
		event.Counter,
		escapeKeyPart(event.DeviceID),
		escapeKeyPart(event.ID),
	)
}

func escapeKeyPart(value string) string {
	return strings.ReplaceAll(value, ":", "%3A")
}

func (d *Daemon) broadcast(event ThalwegEvent) {
	message := StreamMessage{
		Type:            "event",
		ProtocolVersion: currentLocalProtocolVersion,
		Event:           event,
	}
	overflowed := make([]*subscription, 0)
	d.subMu.RLock()
	for _, sub := range d.subscriptions {
		if sub.network != event.Network {
			continue
		}
		if len(sub.streams) > 0 && !sub.streams[event.Stream] {
			continue
		}
		message.SubscriptionID = sub.id
		select {
		case sub.queue <- message:
		default:
			overflowed = append(overflowed, sub)
		}
	}
	d.subMu.RUnlock()
	for _, sub := range overflowed {
		if d.removeSubscription(sub.id, sub) {
			d.trace(false, "subscription.delivery", "disconnecting slow subscriber", "subscriptionId", sub.id)
			_ = sub.client.conn.Close()
		}
	}
}

func (d *Daemon) deliverSubscription(sub *subscription) {
	defer d.backgroundWG.Done()
	for message := range sub.queue {
		if err := sub.client.Encode(message); err != nil {
			d.removeSubscription(sub.id, sub)
			_ = sub.client.conn.Close()
			return
		}
	}
}

func (d *Daemon) removeSubscription(id string, expected *subscription) bool {
	d.subMu.Lock()
	defer d.subMu.Unlock()
	sub, exists := d.subscriptions[id]
	if !exists || (expected != nil && sub != expected) {
		return false
	}
	delete(d.subscriptions, id)
	close(sub.queue)
	return true
}

func (d *Daemon) removeClientSubscriptions(client *clientConn) {
	d.subMu.Lock()
	defer d.subMu.Unlock()
	for id, sub := range d.subscriptions {
		if sub.client == client {
			delete(d.subscriptions, id)
			close(sub.queue)
		}
	}
}

func randomID(prefix string) string {
	var b [8]byte
	if _, err := rand.Read(b[:]); err != nil {
		return fmt.Sprintf("%s_%d", prefix, time.Now().UnixNano())
	}
	return fmt.Sprintf("%s_%s", prefix, hex.EncodeToString(b[:]))
}

func (d *Daemon) restorePeers() {
	d.store.View(func(txn *badger.Txn) error {
		it := txn.NewIterator(badger.DefaultIteratorOptions)
		defer it.Close()

		prefix := []byte("peer:")
		for it.Seek(prefix); it.ValidForPrefix(prefix); it.Next() {
			item := it.Item()
			item.Value(func(val []byte) error {
				maddr, err := multiaddr.NewMultiaddr(string(val))
				if err != nil {
					return nil
				}
				info, err := peer.AddrInfoFromP2pAddr(maddr)
				if err != nil {
					return nil
				}
				d.backgroundWG.Add(1)
				go func(pi peer.AddrInfo) {
					defer d.backgroundWG.Done()
					if err := d.p2p.Connect(d.ctx, pi); err != nil {
						fmt.Printf("Failed to reconnect to %s: %s\n", pi.ID.String(), err)
					} else {
						fmt.Printf("Restored connection to %s\n", pi.ID.String())
					}
				}(*info)
				return nil
			})
		}
		return nil
	})
}

func (d *Daemon) restoreMeshPeers() {
	if d.meshSyncInterval < 0 {
		return
	}
	d.backgroundWG.Add(2)
	go d.meshRetryLoop()
	go d.meshEventSyncLoop()
}
