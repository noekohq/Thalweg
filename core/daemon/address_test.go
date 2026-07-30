package daemon

import (
	"reflect"
	"testing"
)

func TestGroupPeerAddresses(t *testing.T) {
	const peerID = "12D3KooWHRBSvtRrd1JGL2dfVmRNuN7yJMhVu8UNymimnoXnA9vt"
	addresses := []string{
		"/ip4/8.8.8.8/tcp/42422/p2p/" + peerID,
		"/ip4/127.0.0.1/tcp/42422/p2p/" + peerID,
		"/ip4/192.168.68.58/tcp/42422/p2p/" + peerID,
		"/dns4/example.test/tcp/42422/p2p/" + peerID,
	}
	got := groupPeerAddresses(addresses)
	want := map[string][]string{
		"loopback": {addresses[1]},
		"lan":      {addresses[2]},
		"public":   {addresses[0]},
		"other":    {addresses[3]},
	}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("address groups = %#v, want %#v", got, want)
	}
}
