package daemon

import (
	"encoding/json"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
)

func TestMembershipCreateJoinListAndRestart(t *testing.T) {
	firstPath := filepath.Join(t.TempDir(), membershipFileName)
	first, err := loadMembershipStore(firstPath)
	if err != nil {
		t.Fatalf("load first membership store: %v", err)
	}
	created, invitation, err := first.create("home")
	if err != nil {
		t.Fatalf("create network: %v", err)
	}
	if created.Name != "home" || created.ID == "" {
		t.Fatalf("created membership = %#v", created)
	}
	if !strings.HasPrefix(invitation, "thalweg1:") {
		t.Fatalf("invitation = %q", invitation)
	}
	info, err := os.Stat(firstPath)
	if err != nil {
		t.Fatalf("stat membership file: %v", err)
	}
	if info.Mode().Perm() != 0o600 {
		t.Fatalf("membership permissions = %o, want 600", info.Mode().Perm())
	}

	restarted, err := loadMembershipStore(firstPath)
	if err != nil {
		t.Fatalf("reload membership store: %v", err)
	}
	listed := restarted.list()
	if len(listed) != 1 || listed[0] != created {
		t.Fatalf("restarted memberships = %#v, want %#v", listed, created)
	}
	redacted, err := json.Marshal(listed)
	if err != nil {
		t.Fatalf("marshal redacted memberships: %v", err)
	}
	if strings.Contains(string(redacted), "secret") {
		t.Fatalf("redacted membership leaked a secret field: %s", redacted)
	}

	second, err := loadMembershipStore(filepath.Join(t.TempDir(), membershipFileName))
	if err != nil {
		t.Fatalf("load second membership store: %v", err)
	}
	joined, changed, err := second.join(invitation)
	if err != nil {
		t.Fatalf("join network: %v", err)
	}
	if !changed || joined != created {
		t.Fatalf("joined = (%#v, %t), want (%#v, true)", joined, changed, created)
	}
	joined, changed, err = second.join(invitation)
	if err != nil {
		t.Fatalf("repeat join: %v", err)
	}
	if changed || joined != created {
		t.Fatalf("repeat join = (%#v, %t), want idempotent", joined, changed)
	}
}

func TestMembershipRejectsConflictingName(t *testing.T) {
	first, err := loadMembershipStore(filepath.Join(t.TempDir(), membershipFileName))
	if err != nil {
		t.Fatalf("load first store: %v", err)
	}
	_, firstInvitation, err := first.create("work")
	if err != nil {
		t.Fatalf("create first network: %v", err)
	}
	second, err := loadMembershipStore(filepath.Join(t.TempDir(), membershipFileName))
	if err != nil {
		t.Fatalf("load second store: %v", err)
	}
	if _, _, err := second.create("work"); err != nil {
		t.Fatalf("create second network: %v", err)
	}
	if _, _, err := second.join(firstInvitation); err == nil {
		t.Fatal("expected conflicting mounted network name")
	}
}

func TestMembershipReissuesInvitationWithoutMutation(t *testing.T) {
	path := filepath.Join(t.TempDir(), membershipFileName)
	store, err := loadMembershipStore(path)
	if err != nil {
		t.Fatalf("load membership store: %v", err)
	}
	created, original, err := store.create("home")
	if err != nil {
		t.Fatalf("create network: %v", err)
	}
	before, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("read membership file before invite: %v", err)
	}

	membership, reissued, err := store.invite("home")
	if err != nil {
		t.Fatalf("reissue invitation: %v", err)
	}
	if membership != created {
		t.Fatalf("reissued membership = %#v, want %#v", membership, created)
	}
	if reissued != original {
		t.Fatalf("reissued invitation differs from persisted shared credential")
	}
	after, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("read membership file after invite: %v", err)
	}
	if string(after) != string(before) {
		t.Fatal("reissuing an invitation mutated the membership file")
	}

	restarted, err := loadMembershipStore(path)
	if err != nil {
		t.Fatalf("restart membership store: %v", err)
	}
	_, afterRestart, err := restarted.invite("home")
	if err != nil {
		t.Fatalf("reissue invitation after restart: %v", err)
	}
	if afterRestart != original {
		t.Fatal("invitation changed after restart")
	}
}

func TestMembershipInviteRejectsUnknownNetwork(t *testing.T) {
	store, err := loadMembershipStore(filepath.Join(t.TempDir(), membershipFileName))
	if err != nil {
		t.Fatalf("load membership store: %v", err)
	}
	if _, _, err := store.invite("missing"); err == nil ||
		!strings.Contains(err.Error(), `network "missing" is not mounted`) {
		t.Fatalf("unexpected unknown network error: %v", err)
	}
}

func TestNetworkInviteRouteReturnsExplicitSharedBearerMode(t *testing.T) {
	memberships, err := loadMembershipStore(filepath.Join(t.TempDir(), membershipFileName))
	if err != nil {
		t.Fatalf("load membership store: %v", err)
	}
	d := &Daemon{
		memberships: memberships,
		routes:      make(map[string]HandlerFunc),
	}
	d.registerRoutes()
	created, original, err := memberships.create("home")
	if err != nil {
		t.Fatalf("create network: %v", err)
	}
	handler, exists := d.routes["network_invite"]
	if !exists {
		t.Fatal("network_invite route is not registered")
	}
	data, err := handler(nil, json.RawMessage(`{"name":"home"}`))
	if err != nil {
		t.Fatalf("invoke network_invite route: %v", err)
	}
	result, ok := data.(map[string]any)
	if !ok {
		t.Fatalf("network_invite result has type %T", data)
	}
	if result["membership"] != created {
		t.Fatalf("membership = %#v, want %#v", result["membership"], created)
	}
	if result["invitation"] != original {
		t.Fatal("route did not return the persisted shared invitation")
	}
	if result["credentialMode"] != "shared-bearer" {
		t.Fatalf("credentialMode = %#v", result["credentialMode"])
	}
}

func TestMembershipFileSafetyAndCompatibility(t *testing.T) {
	t.Run("insecure permissions", func(t *testing.T) {
		path := filepath.Join(t.TempDir(), membershipFileName)
		if err := os.WriteFile(path, []byte(`{"version":1,"memberships":[]}`), 0o644); err != nil {
			t.Fatalf("write membership file: %v", err)
		}
		if _, err := loadMembershipStore(path); err == nil || !strings.Contains(err.Error(), "permissions") {
			t.Fatalf("error = %v, want permissions rejection", err)
		}
	})

	t.Run("unsupported version", func(t *testing.T) {
		path := filepath.Join(t.TempDir(), membershipFileName)
		if err := os.WriteFile(path, []byte(`{"version":99,"memberships":[]}`), 0o600); err != nil {
			t.Fatalf("write membership file: %v", err)
		}
		if _, err := loadMembershipStore(path); err == nil || !strings.Contains(err.Error(), "unsupported") {
			t.Fatalf("error = %v, want version rejection", err)
		}
	})

	t.Run("symlink", func(t *testing.T) {
		if runtime.GOOS == "windows" {
			t.Skip("symlink permission behavior differs on Windows")
		}
		directory := t.TempDir()
		target := filepath.Join(directory, "target")
		if err := os.WriteFile(target, []byte(`{"version":1,"memberships":[]}`), 0o600); err != nil {
			t.Fatalf("write target: %v", err)
		}
		path := filepath.Join(directory, membershipFileName)
		if err := os.Symlink(target, path); err != nil {
			t.Fatalf("create symlink: %v", err)
		}
		if _, err := loadMembershipStore(path); err == nil || !strings.Contains(err.Error(), "regular file") {
			t.Fatalf("error = %v, want symlink rejection", err)
		}
	})
}

func TestNetworkInvitationValidation(t *testing.T) {
	store, err := loadMembershipStore(filepath.Join(t.TempDir(), membershipFileName))
	if err != nil {
		t.Fatalf("load store: %v", err)
	}
	tests := []string{"", "other:abc", "thalweg1:not-base64"}
	for _, invitation := range tests {
		if _, _, err := store.join(invitation); err == nil {
			t.Fatalf("expected invitation %q to be rejected", invitation)
		}
	}
	if _, _, err := store.create(" home "); err == nil {
		t.Fatal("expected whitespace-padded network name rejection")
	}
}
