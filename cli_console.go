package main

import (
	"context"
	"flag"
	"fmt"
	"io"
	"os"
	"os/signal"
	"syscall"
	"time"

	consoleui "thalweg/internal/console"
)

func runConsole(args []string, stdin io.Reader, stdout, stderr io.Writer) error {
	mode := "tui"
	if len(args) > 0 && (args[0] == "tui" || args[0] == "web") {
		mode = args[0]
		args = args[1:]
	}
	switch mode {
	case "tui":
		return runConsoleTUI(args, stdin, stdout, stderr)
	case "web":
		return runConsoleWeb(args, stdout, stderr)
	default:
		return fmt.Errorf("unknown console mode %q", mode)
	}
}

func runConsoleTUI(args []string, stdin io.Reader, stdout, stderr io.Writer) error {
	flags := flag.NewFlagSet("console tui", flag.ContinueOnError)
	flags.SetOutput(stderr)
	socketFlag := flags.String("socket", "", "Unix socket path")
	network := flags.String("network", "", "initial mounted network")
	refresh := flags.Duration("refresh", 2*time.Second, "snapshot refresh interval")
	noAltScreen := flags.Bool("no-alt-screen", false, "render in the current terminal buffer")
	if err := flags.Parse(args); err != nil {
		return err
	}
	if flags.NArg() != 0 {
		return fmt.Errorf("console tui does not accept positional arguments")
	}
	if *refresh < 250*time.Millisecond || *refresh > time.Minute {
		return fmt.Errorf("--refresh must be between 250ms and 1m")
	}
	socketPath, err := resolvedSocket(*socketFlag)
	if err != nil {
		return err
	}
	return consoleui.RunTUI(consoleui.TUIOptions{
		Service:          consoleui.NewService(socketPath),
		Network:          *network,
		RefreshEvery:     *refresh,
		Input:            stdin,
		Output:           stdout,
		DisableAltScreen: *noAltScreen,
	})
}

func runConsoleWeb(args []string, stdout, stderr io.Writer) error {
	flags := flag.NewFlagSet("console web", flag.ContinueOnError)
	flags.SetOutput(stderr)
	socketFlag := flags.String("socket", "", "Unix socket path")
	network := flags.String("network", "", "initial mounted network")
	listen := flags.String("listen", "127.0.0.1:42424", "loopback HTTP listen address")
	if err := flags.Parse(args); err != nil {
		return err
	}
	if flags.NArg() != 0 {
		return fmt.Errorf("console web does not accept positional arguments")
	}
	socketPath, err := resolvedSocket(*socketFlag)
	if err != nil {
		return err
	}
	service := consoleui.NewService(socketPath)
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	return consoleui.RunWeb(ctx, consoleui.WebOptions{
		Service: service,
		Listen:  *listen,
		Network: *network,
		Output:  stdout,
	})
}
