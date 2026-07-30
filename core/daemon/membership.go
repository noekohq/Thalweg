package daemon

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"
)

const (
	membershipFileName       = "memberships.json"
	membershipFileVersion    = 1
	networkInvitationVersion = 1
	networkIDBytes           = 16
	networkSecretBytes       = 32
)

type networkMembership struct {
	Name   string `json:"name"`
	ID     string `json:"id"`
	Secret string `json:"secret"`
}

type NetworkMembershipInfo struct {
	Name string `json:"name"`
	ID   string `json:"id"`
}

type membershipFile struct {
	Version     int                 `json:"version"`
	Memberships []networkMembership `json:"memberships"`
}

type networkInvitation struct {
	Version int    `json:"version"`
	Name    string `json:"name"`
	ID      string `json:"id"`
	Secret  string `json:"secret"`
}

type membershipStore struct {
	path        string
	mu          sync.RWMutex
	memberships map[string]networkMembership
}

func membershipsPath(dbPath string) string {
	return filepath.Join(filepath.Dir(filepath.Clean(dbPath)), membershipFileName)
}

func loadMembershipStore(path string) (*membershipStore, error) {
	store := &membershipStore{
		path:        path,
		memberships: make(map[string]networkMembership),
	}
	info, err := os.Lstat(path)
	switch {
	case errors.Is(err, os.ErrNotExist):
		if err := os.MkdirAll(filepath.Dir(path), 0o700); err != nil {
			return nil, fmt.Errorf("create membership directory: %w", err)
		}
		if err := store.persistLocked(); err != nil {
			return nil, err
		}
		return store, nil
	case err != nil:
		return nil, fmt.Errorf("inspect membership file: %w", err)
	}
	if info.Mode()&os.ModeSymlink != 0 || !info.Mode().IsRegular() {
		return nil, fmt.Errorf("membership path must be a regular file: %s", path)
	}
	if info.Mode().Perm()&0o077 != 0 {
		return nil, fmt.Errorf("membership file permissions must not allow group or other access: %s", path)
	}

	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read membership file: %w", err)
	}
	var persisted membershipFile
	if err := json.Unmarshal(data, &persisted); err != nil {
		return nil, fmt.Errorf("decode membership file: %w", err)
	}
	if persisted.Version != membershipFileVersion {
		return nil, fmt.Errorf(
			"unsupported membership file version %d (daemon supports %d)",
			persisted.Version,
			membershipFileVersion,
		)
	}
	for _, membership := range persisted.Memberships {
		if err := validateMembership(membership); err != nil {
			return nil, fmt.Errorf("invalid membership %q: %w", membership.Name, err)
		}
		if _, exists := store.memberships[membership.Name]; exists {
			return nil, fmt.Errorf("duplicate network membership name %q", membership.Name)
		}
		store.memberships[membership.Name] = membership
	}
	return store, nil
}

func (s *membershipStore) create(name string) (NetworkMembershipInfo, string, error) {
	if err := validateNetworkName(name); err != nil {
		return NetworkMembershipInfo{}, "", err
	}
	id, err := randomCredential(networkIDBytes)
	if err != nil {
		return NetworkMembershipInfo{}, "", fmt.Errorf("generate network ID: %w", err)
	}
	secret, err := randomCredential(networkSecretBytes)
	if err != nil {
		return NetworkMembershipInfo{}, "", fmt.Errorf("generate network secret: %w", err)
	}
	membership := networkMembership{Name: name, ID: id, Secret: secret}

	s.mu.Lock()
	defer s.mu.Unlock()
	if _, exists := s.memberships[name]; exists {
		return NetworkMembershipInfo{}, "", fmt.Errorf("network %q is already mounted", name)
	}
	s.memberships[name] = membership
	if err := s.persistLocked(); err != nil {
		delete(s.memberships, name)
		return NetworkMembershipInfo{}, "", err
	}
	invitation, err := encodeNetworkInvitation(membership)
	if err != nil {
		return NetworkMembershipInfo{}, "", err
	}
	return membership.info(), invitation, nil
}

func (s *membershipStore) join(invitation string) (NetworkMembershipInfo, bool, error) {
	membership, err := decodeNetworkInvitation(invitation)
	if err != nil {
		return NetworkMembershipInfo{}, false, err
	}

	s.mu.Lock()
	defer s.mu.Unlock()
	if existing, exists := s.memberships[membership.Name]; exists {
		if existing == membership {
			return existing.info(), false, nil
		}
		return NetworkMembershipInfo{}, false, fmt.Errorf(
			"network name %q is already mounted with different credentials",
			membership.Name,
		)
	}
	s.memberships[membership.Name] = membership
	if err := s.persistLocked(); err != nil {
		delete(s.memberships, membership.Name)
		return NetworkMembershipInfo{}, false, err
	}
	return membership.info(), true, nil
}

func (s *membershipStore) invite(name string) (NetworkMembershipInfo, string, error) {
	if err := validateNetworkName(name); err != nil {
		return NetworkMembershipInfo{}, "", err
	}
	s.mu.RLock()
	membership, exists := s.memberships[name]
	s.mu.RUnlock()
	if !exists {
		return NetworkMembershipInfo{}, "", fmt.Errorf("network %q is not mounted", name)
	}
	invitation, err := encodeNetworkInvitation(membership)
	if err != nil {
		return NetworkMembershipInfo{}, "", err
	}
	return membership.info(), invitation, nil
}

func (s *membershipStore) get(name string) (networkMembership, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	membership, exists := s.memberships[name]
	return membership, exists
}

func (s *membershipStore) list() []NetworkMembershipInfo {
	s.mu.RLock()
	defer s.mu.RUnlock()
	memberships := make([]NetworkMembershipInfo, 0, len(s.memberships))
	for _, membership := range s.memberships {
		memberships = append(memberships, membership.info())
	}
	sort.Slice(memberships, func(i, j int) bool {
		return memberships[i].Name < memberships[j].Name
	})
	return memberships
}

func (s *membershipStore) persistLocked() error {
	memberships := make([]networkMembership, 0, len(s.memberships))
	for _, membership := range s.memberships {
		memberships = append(memberships, membership)
	}
	sort.Slice(memberships, func(i, j int) bool {
		return memberships[i].Name < memberships[j].Name
	})
	encoded, err := json.MarshalIndent(membershipFile{
		Version:     membershipFileVersion,
		Memberships: memberships,
	}, "", "  ")
	if err != nil {
		return fmt.Errorf("encode membership file: %w", err)
	}
	encoded = append(encoded, '\n')

	temp, err := os.CreateTemp(filepath.Dir(s.path), ".memberships-*.tmp")
	if err != nil {
		return fmt.Errorf("create temporary membership file: %w", err)
	}
	tempPath := temp.Name()
	defer os.Remove(tempPath)
	if err := temp.Chmod(0o600); err != nil {
		temp.Close()
		return fmt.Errorf("restrict temporary membership permissions: %w", err)
	}
	if _, err := temp.Write(encoded); err != nil {
		temp.Close()
		return fmt.Errorf("write temporary membership file: %w", err)
	}
	if err := temp.Sync(); err != nil {
		temp.Close()
		return fmt.Errorf("sync temporary membership file: %w", err)
	}
	if err := temp.Close(); err != nil {
		return fmt.Errorf("close temporary membership file: %w", err)
	}
	if err := os.Rename(tempPath, s.path); err != nil {
		return fmt.Errorf("persist membership file: %w", err)
	}
	return nil
}

func (membership networkMembership) info() NetworkMembershipInfo {
	return NetworkMembershipInfo{Name: membership.Name, ID: membership.ID}
}

func encodeNetworkInvitation(membership networkMembership) (string, error) {
	payload, err := json.Marshal(networkInvitation{
		Version: networkInvitationVersion,
		Name:    membership.Name,
		ID:      membership.ID,
		Secret:  membership.Secret,
	})
	if err != nil {
		return "", fmt.Errorf("encode network invitation: %w", err)
	}
	return "thalweg1:" + base64.RawURLEncoding.EncodeToString(payload), nil
}

func decodeNetworkInvitation(invitation string) (networkMembership, error) {
	const prefix = "thalweg1:"
	if !strings.HasPrefix(invitation, prefix) {
		return networkMembership{}, fmt.Errorf("network invitation must start with %q", prefix)
	}
	payload, err := base64.RawURLEncoding.DecodeString(strings.TrimPrefix(invitation, prefix))
	if err != nil {
		return networkMembership{}, fmt.Errorf("decode network invitation: %w", err)
	}
	var decoded networkInvitation
	if err := json.Unmarshal(payload, &decoded); err != nil {
		return networkMembership{}, fmt.Errorf("decode network invitation payload: %w", err)
	}
	if decoded.Version != networkInvitationVersion {
		return networkMembership{}, fmt.Errorf(
			"unsupported network invitation version %d",
			decoded.Version,
		)
	}
	membership := networkMembership{
		Name:   decoded.Name,
		ID:     decoded.ID,
		Secret: decoded.Secret,
	}
	if err := validateMembership(membership); err != nil {
		return networkMembership{}, fmt.Errorf("invalid network invitation: %w", err)
	}
	return membership, nil
}

func validateMembership(membership networkMembership) error {
	if err := validateNetworkName(membership.Name); err != nil {
		return err
	}
	if err := validateCredential("network ID", membership.ID, networkIDBytes); err != nil {
		return err
	}
	return validateCredential("network secret", membership.Secret, networkSecretBytes)
}

func validateNetworkName(name string) error {
	if strings.TrimSpace(name) == "" {
		return fmt.Errorf("network name is required")
	}
	if name != strings.TrimSpace(name) {
		return fmt.Errorf("network name must not have leading or trailing whitespace")
	}
	if len(name) > 128 {
		return fmt.Errorf("network name must be at most 128 bytes")
	}
	return nil
}

func validateCredential(field string, value string, size int) error {
	decoded, err := base64.RawURLEncoding.DecodeString(value)
	if err != nil || len(decoded) != size {
		return fmt.Errorf("%s must be %d bytes of base64url data", field, size)
	}
	return nil
}

func randomCredential(size int) (string, error) {
	value := make([]byte, size)
	if _, err := rand.Read(value); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(value), nil
}
