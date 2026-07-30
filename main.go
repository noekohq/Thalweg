package main

import (
	"fmt"
	"os"
	"os/exec"

	daemon "thalweg/core/daemon"
)

const socketPath = "/tmp/thalweg.sock"
const dbPath = "./storage/badger"

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Usage: thalweg [start | send | spawn]")
		os.Exit(1)
	}

	switch os.Args[1] {
	case "start":
		cmd := exec.Command(os.Args[0], "spawn")
		if err := cmd.Start(); err != nil {
			fmt.Println("Failed to start: ", err)
		}
	case "spawn":
		fmt.Println("Starting Thalweg Daemon.")
		d, err := daemon.New(socketPath, dbPath)
		if err != nil {
			fmt.Println("Failed to create daemon: ", err)
			os.Exit(1)
		}
		d.Start()
	case "send":
		fmt.Println("Send command triggered")
	default:
		os.Exit(1)
	}
}
