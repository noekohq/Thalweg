package cli

import (
	"errors"
	"fmt"
	"io"

	daemon "thalweg/core/daemon"
)

// Run executes the Thalweg command-line interface and returns its process exit code.
func Run(args []string, stdin io.Reader, stdout, stderr io.Writer) int {
	if len(args) == 0 {
		printUsage(stderr)
		return 2
	}

	var err error
	switch args[0] {
	case "help", "-h", "--help":
		printUsage(stdout)
		return 0
	case "version":
		_, err = fmt.Fprintln(stdout, daemon.Version())
	case "init":
		err = runInit(args[1:], stdout, stderr)
	case "daemon":
		err = runDaemonCommand(args[1:], stdout, stderr)
	case "start":
		err = runConfiguredDaemon(args[1:], stdout, stderr)
	case "spawn":
		err = runDevelopmentDaemon(args[1:], stdout, stderr)
	case "status":
		err = runSimpleAction("status", args[1:], "network_status", map[string]any{}, stdout, stderr)
	case "doctor":
		err = runDoctor(args[1:], stdout, stderr)
	case "upgrade":
		err = runUpgrade(args[1:], stdout, stderr)
	case "network":
		err = runNetwork(args[1:], stdin, stdout, stderr)
	case "join":
		err = runEnrollmentJoin(args[1:], stdin, stdout, stderr)
	case "console":
		err = runConsole(args[1:], stdin, stdout, stderr)
	case "event":
		err = runEvent(args[1:], stdout, stderr)
	case "peer":
		err = runPeer(args[1:], stdout, stderr)
	case "lab":
		err = runLab(args[1:], stdout, stderr)
	case "siphon":
		err = runSiphon(args[1:], stdout, stderr)
	case "registry":
		err = runRegistry(args[1:], stdout, stderr)
	default:
		fmt.Fprintf(stderr, "unknown command %q\n\n", args[0])
		printUsage(stderr)
		return 2
	}
	if errors.Is(err, errDoctorFailed) {
		return 1
	}
	if err != nil {
		fmt.Fprintf(stderr, "thalweg: %v\n", err)
		return 1
	}
	return 0
}

func printUsage(output io.Writer) {
	fmt.Fprint(output, `Thalweg local-first event mesh

Usage:
  thalweg init [--socket PATH] [--storage PATH] [--p2p-listen ADDRS] [--force]
  thalweg daemon [-d] [--log PATH] [--debug]
  thalweg daemon start [--foreground] [--log PATH] [--debug]
  thalweg daemon stop [--timeout 10s]
  thalweg daemon restart [--timeout 10s] [--log PATH] [--debug]
  thalweg daemon status
  thalweg daemon logs [--lines 100]
  thalweg status
  thalweg doctor [--debug] [--json]
  thalweg upgrade [--check] [--no-restart] [--force]
  thalweg network create NAME
  thalweg network invite NAME
  thalweg network listen NAME [--duration 10m] [--debug]
  thalweg network join [INVITATION]
  thalweg network list
  thalweg network leave --yes NAME
  thalweg console [tui] [--network NAME]
  thalweg console web [--network NAME] [--listen 127.0.0.1:42424] [--lab]
  thalweg event ingest --network NAME --stream NAME --payload JSON
  thalweg event query --network NAME [--streams A,B] [--from TIME] [--to TIME]
  thalweg event conflicts list --network NAME
  thalweg event conflicts resolve --network NAME --id EVENT_ID
  thalweg peer dial --network NAME --address MULTIADDR
  thalweg peer sync --network NAME --address MULTIADDR
  thalweg peer list [--network NAME]
  thalweg lab publish --network NAME [--stream NAME] [--count 3] [--data JSON]
  thalweg lab verify --network NAME --run-id ID [--origin DEVICE_ID] [--expected 3] [--wait 10s]
  thalweg lab watch --network NAME --run-id ID [--origin DEVICE_ID] [--expected 3]
  thalweg siphon create --network NAME [--streams A,B] [--start earliest] SIPHON_NAME
  thalweg siphon list [--network NAME]
  thalweg siphon poll --network NAME [--limit 25] [--wait 20s] SIPHON_NAME
  thalweg siphon follow --network NAME [--streams A,B] [--start latest] [--limit 25] [--wait 20s] SIPHON_NAME
  thalweg siphon ack --network NAME --delivery DELIVERY_ID SIPHON_NAME
	thalweg registry validate [--json]
	thalweg registry reload
	thalweg registry status [--json]
	thalweg registry list [--json]
	thalweg registry inspect NAME
	thalweg registry start|stop|restart NAME
	thalweg registry reset --yes NAME
	thalweg registry logs [--lines 100] [--follow] NAME
  thalweg join [--address MULTIADDR] [--debug]
  thalweg version

Every daemon command accepts --socket PATH. The daemon also honors
THALWEG_CONFIG_PATH, THALWEG_SOCKET_PATH, THALWEG_STORAGE_PATH, and
THALWEG_P2P_LISTEN_ADDRS.
`)
}
