package daemon

import (
	"bufio"
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net"
	"os"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/dgraph-io/badger/v4"
	"github.com/libp2p/go-libp2p"
	"github.com/libp2p/go-libp2p/core/host"
	"github.com/libp2p/go-libp2p/core/network"
	"github.com/libp2p/go-libp2p/core/peer"
	"github.com/multiformats/go-multiaddr"
)

type Message struct {
	ID      string          `json:"id,omitempty"`
	Action  string          `json:"action"`
	Payload json.RawMessage `json:"payload"`
}

type Response struct {
	ID      string `json:"id,omitempty"`
	Success bool   `json:"success"`
	Data    any    `json:"data,omitempty"`
	Error   string `json:"error,omitempty"`
}

type StreamMessage struct {
	Type           string       `json:"type"`
	SubscriptionID string       `json:"subscriptionId"`
	Event          ThalwegEvent `json:"event"`
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
	socketPath string
	ctx        context.Context
	p2p        host.Host
	store      *badger.DB
	routes     map[string]HandlerFunc

	deviceID string
	mu       sync.Mutex
	counter  uint64
	lastTime string

	subMu         sync.RWMutex
	subscriptions map[string]*subscription
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
}

func New(path string, dbPath string) (*Daemon, error) {
	db, err := badger.Open(badger.DefaultOptions(dbPath))
	if err != nil {
		return nil, fmt.Errorf("failed to open badgerdb: %w", err)
	}

	node, err := libp2p.New()
	if err != nil {
		db.Close()
		return nil, fmt.Errorf("failed to create libp2p node: %w", err)
	}

	d := &Daemon{
		socketPath:    path,
		routes:        make(map[string]HandlerFunc),
		ctx:           context.Background(),
		p2p:           node,
		store:         db,
		deviceID:      node.ID().String(),
		subscriptions: make(map[string]*subscription),
	}

	d.p2p.SetStreamHandler("/thalweg/1.0.0", d.handleP2PStream)
	d.registerRoutes()

	return d, nil
}

func (d *Daemon) Register(action string, handler HandlerFunc) {
	d.routes[action] = handler
}

func (d *Daemon) Start() {
	d.restorePeers()
	_ = os.Remove(d.socketPath)

	listener, err := net.Listen("unix", d.socketPath)
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
	fmt.Println("Daemon is listening.")
	defer listener.Close()
	defer d.store.Close()
	defer d.p2p.Close()

	for {
		conn, err := listener.Accept()
		if err != nil {
			continue
		}
		go d.Handle(conn)
	}
}

func (d *Daemon) Handle(conn net.Conn) {
	client := &clientConn{conn: conn, enc: json.NewEncoder(conn)}
	defer func() {
		d.removeClientSubscriptions(client)
		conn.Close()
	}()

	scanner := bufio.NewScanner(conn)
	for scanner.Scan() {
		var msg Message
		if err := json.Unmarshal(scanner.Bytes(), &msg); err != nil {
			client.Encode(Response{Success: false, Error: "invalid JSON structure"})
			continue
		}

		handler, exists := d.routes[msg.Action]
		if !exists {
			client.Encode(Response{ID: msg.ID, Success: false, Error: fmt.Sprintf("unknown action: %s", msg.Action)})
			continue
		}

		data, err := handler(client, msg.Payload)
		if err != nil {
			client.Encode(Response{ID: msg.ID, Success: false, Error: err.Error()})
			continue
		}

		client.Encode(Response{ID: msg.ID, Success: true, Data: data})
	}
}

func (d *Daemon) registerRoutes() {
	d.Register("network_status", func(_ *clientConn, _ json.RawMessage) (any, error) {
		var addrs []string
		for _, addr := range d.p2p.Addrs() {
			addrs = append(addrs, fmt.Sprintf("%s/p2p/%s", addr, d.p2p.ID()))
		}
		return map[string]any{
			"peerId":    d.p2p.ID().String(),
			"deviceId":  d.deviceID,
			"addresses": addrs,
		}, nil
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
		}
		if err := json.Unmarshal(payload, &args); err != nil {
			return nil, err
		}
		return d.query(args.Network, args.Streams, args.From, args.To, args.Limit)
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
		d.subMu.Lock()
		d.subscriptions[id] = &subscription{id: id, network: args.Network, streams: streams, client: client}
		d.subMu.Unlock()
		return map[string]string{"subscriptionId": id}, nil
	})

	d.Register("siphon_unregister", func(_ *clientConn, payload json.RawMessage) (any, error) {
		var args struct {
			SubscriptionID string `json:"subscriptionId"`
		}
		if err := json.Unmarshal(payload, &args); err != nil {
			return nil, err
		}
		d.subMu.Lock()
		delete(d.subscriptions, args.SubscriptionID)
		d.subMu.Unlock()
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
}

func (d *Daemon) ingest(networkName, stream, occurredAt, eventID string, payload json.RawMessage) (ThalwegEvent, error) {
	if networkName == "" {
		return ThalwegEvent{}, fmt.Errorf("network is required")
	}
	if stream == "" {
		return ThalwegEvent{}, fmt.Errorf("stream is required")
	}
	if len(payload) == 0 {
		payload = json.RawMessage("null")
	}
	if occurredAt == "" {
		occurredAt = time.Now().UTC().Format(time.RFC3339Nano)
	}
	if _, err := time.Parse(time.RFC3339Nano, occurredAt); err != nil {
		return ThalwegEvent{}, fmt.Errorf("occurredAt must be RFC3339/RFC3339Nano: %w", err)
	}
	now := time.Now().UTC().Format(time.RFC3339Nano)
	counter := d.nextCounter(occurredAt)
	if eventID == "" {
		eventID = randomID("evt")
	}

	event := ThalwegEvent{
		ID:           eventID,
		Network:      networkName,
		Stream:       stream,
		OccurredAt:   occurredAt,
		InsertedAt:   now,
		PropagatedAt: now,
		Counter:      counter,
		DeviceID:     d.deviceID,
		Payload:      payload,
	}

	value, err := json.Marshal(event)
	if err != nil {
		return ThalwegEvent{}, err
	}
	err = d.store.Update(func(txn *badger.Txn) error {
		return txn.Set([]byte(eventKey(event)), value)
	})
	if err != nil {
		return ThalwegEvent{}, err
	}

	d.broadcast(event)
	return event, nil
}

func (d *Daemon) nextCounter(occurredAt string) uint64 {
	d.mu.Lock()
	defer d.mu.Unlock()
	if occurredAt <= d.lastTime {
		d.counter++
	} else {
		d.lastTime = occurredAt
		d.counter = 0
	}
	return d.counter
}

func (d *Daemon) query(networkName string, streams []string, from string, to string, limit int) ([]ThalwegEvent, error) {
	if networkName == "" {
		return nil, fmt.Errorf("network is required")
	}
	if from != "" {
		if _, err := time.Parse(time.RFC3339Nano, from); err != nil {
			return nil, fmt.Errorf("from must be RFC3339/RFC3339Nano: %w", err)
		}
	}
	if to != "" {
		if _, err := time.Parse(time.RFC3339Nano, to); err != nil {
			return nil, fmt.Errorf("to must be RFC3339/RFC3339Nano: %w", err)
		}
	}

	var events []ThalwegEvent
	err := d.store.View(func(txn *badger.Txn) error {
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
		return chronologicalKey(events[i]) < chronologicalKey(events[j])
	})
	if limit > 0 && len(events) > limit {
		events = events[:limit]
	}
	return events, nil
}

func queryPrefixes(networkName string, streams []string) []string {
	if len(streams) == 0 {
		return []string{fmt.Sprintf("event:%s:", escapeKeyPart(networkName))}
	}
	prefixes := make([]string, 0, len(streams))
	for _, stream := range streams {
		prefixes = append(prefixes, fmt.Sprintf("event:%s:%s:", escapeKeyPart(networkName), escapeKeyPart(stream)))
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

func chronologicalKey(event ThalwegEvent) string {
	return fmt.Sprintf("%s:%020d:%s:%s:%s", event.OccurredAt, event.Counter, event.DeviceID, event.Stream, event.ID)
}

func eventKey(event ThalwegEvent) string {
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
	d.subMu.RLock()
	defer d.subMu.RUnlock()
	for _, sub := range d.subscriptions {
		if sub.network != event.Network {
			continue
		}
		if len(sub.streams) > 0 && !sub.streams[event.Stream] {
			continue
		}
		_ = sub.client.Encode(StreamMessage{
			Type:           "event",
			SubscriptionID: sub.id,
			Event:          event,
		})
	}
}

func (d *Daemon) removeClientSubscriptions(client *clientConn) {
	d.subMu.Lock()
	defer d.subMu.Unlock()
	for id, sub := range d.subscriptions {
		if sub.client == client {
			delete(d.subscriptions, id)
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
				go func(pi peer.AddrInfo) {
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

func (d *Daemon) handleP2PStream(stream network.Stream) {
	defer stream.Close()

	scanner := bufio.NewScanner(stream)
	for scanner.Scan() {
		fmt.Printf("Received P2P msg from %s: %s\n", stream.Conn().RemotePeer(), scanner.Text())
	}
}
