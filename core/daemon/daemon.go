package daemon

import (
	"bufio"
	"fmt"
	"net"
	"os"
)

type Daemon struct {
	socketPath string
}

func New(path string) *Daemon {
	return &Daemon{
		socketPath: path,
	}
}

func (d *Daemon) Start() {
	os.Remove(d.socketPath)

	listener, err := net.Listen("unix", d.socketPath)
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
	fmt.Println("Daemon is listening.")
	defer listener.Close()

	for {
		conn, err := listener.Accept()
		if err != nil {
			continue
		}
		go d.Handle(conn)
	}
}

func (d *Daemon) Handle(conn net.Conn) {
	defer conn.Close()

	scanner := bufio.NewScanner(conn)
	for scanner.Scan() {
		msg := scanner.Text()

		fmt.Printf("Recieved msg: %s: ", msg)
		conn.Write([]byte(fmt.Sprintf("ACK: %s\n", msg)))
	}
}
