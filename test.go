package main

import (
	"bufio"
	"context"
	"fmt"
	"log"
	"os"

	"github.com/libp2p/go-libp2p"
	"github.com/libp2p/go-libp2p/core/host"
	"github.com/libp2p/go-libp2p/core/network"
	"github.com/libp2p/go-libp2p/core/peer"
	"github.com/libp2p/go-libp2p/core/peerstore"
	"github.com/multiformats/go-multiaddr"
)

const protocolID = "/hello/1.0.0"

func test() {
	// 1. Create a libp2p Host
	// The Host represents this specific node in the P2P network.
	// By default, libp2p.New() generates a random identity and listens on a random port.
	node, err := libp2p.New()
	if err != nil {
		log.Fatalf("Failed to create node: %v", err)
	}
	defer node.Close()

	// 2. Set a Stream Handler
	// We register a function to handle incoming streams for our specific protocol ID.
	node.SetStreamHandler(protocolID, handleStream)

	// Determine if this node is starting as the listener or the dialer.
	if len(os.Args) > 1 {
		// Dailer Mode: Connect to the address provided via command line arguments.
		targetAddr := os.Args[1]
		dialPeer(node, targetAddr)
	} else {
		// Listener Mode: Print the node's addresses and wait.
		fmt.Println("Listener node started.")
		fmt.Println("To connect, run another instance with one of the following addresses as an argument:")
		for _, addr := range node.Addrs() {
			fmt.Printf("%s/p2p/%s\n", addr, node.ID())
		}

		// Block forever to keep the listener running
		select {}
	}
}

// handleStream reads a string from the incoming stream and writes a reply.
func handleStream(s network.Stream) {
	fmt.Println("\n-> Incoming connection established!")

	// Create a buffered reader/writer for the stream
	rw := bufio.NewReadWriter(bufio.NewReader(s), bufio.NewWriter(s))

	// Read the message from the dialer
	msg, err := rw.ReadString('\n')
	if err != nil {
		log.Printf("Error reading from stream: %v", err)
		return
	}
	fmt.Printf("Received: %s", msg)

	// Send a response back
	reply := "Hello from the Listener!\n"
	fmt.Printf("Sending reply: %s", reply)
	_, err = rw.WriteString(reply)
	if err != nil {
		log.Printf("Error writing to stream: %v", err)
		return
	}
	rw.Flush()

	// Close the stream once the exchange is complete
	s.Close()
}

// dialPeer parses the target address, establishes a connection, and opens a stream.
func dialPeer(node host.Host, target string) {
	// Parse the string into a Multiaddr
	maddr, err := multiaddr.NewMultiaddr(target)
	if err != nil {
		log.Fatalf("Invalid multiaddress: %v", err)
	}

	// Extract the peer ID and address details from the Multiaddr
	info, err := peer.AddrInfoFromP2pAddr(maddr)
	if err != nil {
		log.Fatalf("Failed to extract peer info: %v", err)
	}

	// Add the target peer's address to our local node's peerstore so it knows how to route to them.
	node.Peerstore().AddAddrs(info.ID, info.Addrs, peerstore.PermanentAddrTTL)

	fmt.Printf("Dialing peer: %s\n", info.ID)

	// Open a new stream to the target peer using our custom protocol ID
	s, err := node.NewStream(context.Background(), info.ID, protocolID)
	if err != nil {
		log.Fatalf("Failed to open stream: %v", err)
	}

	// Create a buffered reader/writer
	rw := bufio.NewReadWriter(bufio.NewReader(s), bufio.NewWriter(s))

	// Send the initial greeting
	greeting := "Hello from the Dialer!\n"
	fmt.Printf("Sending: %s", greeting)
	_, err = rw.WriteString(greeting)
	if err != nil {
		log.Fatalf("Failed to write to stream: %v", err)
	}
	rw.Flush()

	// Wait for and read the reply
	reply, err := rw.ReadString('\n')
	if err != nil {
		log.Fatalf("Failed to read reply: %v", err)
	}
	fmt.Printf("Received: %s", reply)
}
