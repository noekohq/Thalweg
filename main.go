package main

import (
	"fmt"
	"os"
	"os/exec"

	daemon "thalweg/core/daemon"
)

const socketPath = "/tmp/thalweg.sock"

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Usage: thalweg [start | send | run-daemon]")
		os.Exit(1)
	}

	switch os.Args[1] {
	case "start":
		cmd := exec.Command(os.Args[0], "run-daemon")
		if err := cmd.Start(); err != nil {
			fmt.Println("Failed to start: ", err)
		}
	case "run-daemon":
		fmt.Println("Starting Thalweg Daemon.")
		d := daemon.New(socketPath)
		d.Start()
	case "send":
		fmt.Println("Send command triggered")
	default:
		os.Exit(1)
	}
}
