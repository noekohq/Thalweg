package console

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"strings"
	"time"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

type TUIOptions struct {
	Service          Service
	Network          string
	RefreshEvery     time.Duration
	Input            io.Reader
	Output           io.Writer
	DisableAltScreen bool
}

type tuiSnapshotMsg Snapshot
type tuiTickMsg time.Time

type tuiModel struct {
	service      Service
	snapshot     Snapshot
	network      string
	refreshEvery time.Duration
	width        int
	height       int
	loading      bool
	offset       int
}

var (
	tuiAccent      = lipgloss.Color("#5E81AC")
	tuiGreen       = lipgloss.Color("#A3BE8C")
	tuiYellow      = lipgloss.Color("#EBCB8B")
	tuiRed         = lipgloss.Color("#BF616A")
	tuiMuted       = lipgloss.Color("#7F8A9E")
	tuiPanel       = lipgloss.NewStyle().Border(lipgloss.NormalBorder()).BorderForeground(lipgloss.Color("#4C566A")).Padding(0, 1)
	tuiHeading     = lipgloss.NewStyle().Bold(true).Foreground(tuiAccent)
	tuiSubtle      = lipgloss.NewStyle().Foreground(tuiMuted)
	tuiSelectedTab = lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("#ECEFF4")).Background(tuiAccent).Padding(0, 1)
	tuiTab         = lipgloss.NewStyle().Foreground(tuiMuted).Padding(0, 1)
)

func RunTUI(options TUIOptions) error {
	if options.RefreshEvery <= 0 {
		options.RefreshEvery = 2 * time.Second
	}
	model := tuiModel{
		service:      options.Service,
		network:      options.Network,
		refreshEvery: options.RefreshEvery,
		loading:      true,
		width:        100,
		height:       30,
	}
	programOptions := make([]tea.ProgramOption, 0, 3)
	if options.Input != nil {
		programOptions = append(programOptions, tea.WithInput(options.Input))
	}
	if options.Output != nil {
		programOptions = append(programOptions, tea.WithOutput(options.Output))
	}
	if !options.DisableAltScreen {
		programOptions = append(programOptions, tea.WithAltScreen())
	}
	_, err := tea.NewProgram(model, programOptions...).Run()
	return err
}

func (m tuiModel) Init() tea.Cmd {
	return tea.Batch(m.loadSnapshot(), m.nextTick())
}

func (m tuiModel) Update(message tea.Msg) (tea.Model, tea.Cmd) {
	switch message := message.(type) {
	case tea.KeyMsg:
		switch message.String() {
		case "q", "ctrl+c", "esc":
			return m, tea.Quit
		case "r":
			m.loading = true
			return m, m.loadSnapshot()
		case "left", "h":
			m.network = adjacentNetwork(m.snapshot.Networks, m.snapshot.SelectedNetwork, -1)
			m.loading = true
			m.offset = 0
			return m, m.loadSnapshot()
		case "right", "l", "tab":
			m.network = adjacentNetwork(m.snapshot.Networks, m.snapshot.SelectedNetwork, 1)
			m.loading = true
			m.offset = 0
			return m, m.loadSnapshot()
		case "down", "j":
			m.offset++
		case "up", "k":
			if m.offset > 0 {
				m.offset--
			}
		case "pgdown", "ctrl+d":
			m.offset += 5
		case "pgup", "ctrl+u":
			m.offset -= 5
			if m.offset < 0 {
				m.offset = 0
			}
		case "home", "g":
			m.offset = 0
		}
	case tea.WindowSizeMsg:
		m.width = message.Width
		m.height = message.Height
	case tuiSnapshotMsg:
		m.snapshot = Snapshot(message)
		m.network = m.snapshot.SelectedNetwork
		m.loading = false
	case tuiTickMsg:
		m.loading = true
		return m, tea.Batch(m.loadSnapshot(), m.nextTick())
	}
	return m, nil
}

func (m tuiModel) View() string {
	width := m.width
	if width < 48 {
		width = 48
	}
	contentWidth := width - 4
	stateColor := tuiGreen
	if m.snapshot.State == "degraded" {
		stateColor = tuiYellow
	} else if m.snapshot.State == "offline" || m.snapshot.State == "" {
		stateColor = tuiRed
	}
	state := m.snapshot.State
	if state == "" {
		state = "connecting"
	}
	header := lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("#ECEFF4")).Render("THALWEG CONSOLE")
	badge := lipgloss.NewStyle().Bold(true).Foreground(stateColor).Render("● " + strings.ToUpper(state))
	if m.loading {
		badge += tuiSubtle.Render("  refreshing")
	}
	title := lipgloss.JoinHorizontal(lipgloss.Top, header, "  ", badge)
	meta := tuiSubtle.Render(fmt.Sprintf("local observer · %s", emptyFallback(m.snapshot.CapturedAt, "waiting for daemon")))

	top := strings.Join(
		[]string{title, meta, renderNetworkTabs(m.snapshot.Networks, m.snapshot.SelectedNetwork)},
		"\n",
	)
	var bodySections []string
	if m.snapshot.State == "offline" || m.snapshot.State == "" {
		body := tuiHeading.Render("Daemon unavailable") + "\n\n" +
			wrapText(emptyFallback(m.snapshot.Error, "Waiting for the local daemon."), contentWidth-4) + "\n\n" +
			tuiSubtle.Render("Start it with `thalweg daemon -d --debug`. Press r to retry.")
		bodySections = append(bodySections, tuiPanel.Width(contentWidth).Render(body))
		return renderTUIViewport(top, bodySections, contentWidth, m.height, m.offset)
	}

	overview := renderOverview(m.snapshot, contentWidth)
	addresses := renderAddresses(m.snapshot, contentWidth)
	streams := renderStreams(m.snapshot, contentWidth)
	events := renderEvents(m.snapshot, contentWidth, m.height)
	warnings := renderWarnings(m.snapshot, contentWidth)
	bodySections = append(bodySections, overview, addresses, streams, events)
	if warnings != "" {
		bodySections = append(bodySections, warnings)
	}
	return renderTUIViewport(top, bodySections, contentWidth, m.height, m.offset)
}

func (m tuiModel) loadSnapshot() tea.Cmd {
	service := m.service
	network := m.network
	return func() tea.Msg {
		ctx, cancel := context.WithTimeout(context.Background(), 8*time.Second)
		defer cancel()
		return tuiSnapshotMsg(service.Snapshot(ctx, network))
	}
}

func (m tuiModel) nextTick() tea.Cmd {
	return tea.Tick(m.refreshEvery, func(at time.Time) tea.Msg {
		return tuiTickMsg(at)
	})
}

func renderNetworkTabs(networks []Network, selected string) string {
	if len(networks) == 0 {
		return tuiSubtle.Render("NETWORK  no memberships mounted")
	}
	parts := []string{tuiSubtle.Render("NETWORK ")}
	for _, network := range networks {
		style := tuiTab
		if network.Name == selected {
			style = tuiSelectedTab
		}
		parts = append(parts, style.Render(network.Name))
	}
	return lipgloss.JoinHorizontal(lipgloss.Center, parts...)
}

func renderOverview(snapshot Snapshot, width int) string {
	body := tuiHeading.Render("Overview") + "\n" +
		fmt.Sprintf("Device    %s\n", shortID(snapshot.Status.DeviceID)) +
		fmt.Sprintf("Networks  %d mounted\n", len(snapshot.Networks)) +
		fmt.Sprintf("Events    %d in displayed window\n", len(snapshot.Events)) +
		fmt.Sprintf("Streams   %d in displayed window\n", len(snapshot.Streams)) +
		fmt.Sprintf("Versions  daemon %s · IPC %d · storage %d · mesh %d",
			emptyFallback(snapshot.Status.DaemonVersion, "unknown"),
			snapshot.Status.ProtocolVersion,
			snapshot.Status.StorageSchemaVersion,
			snapshot.Status.MeshProtocolVersion,
		)
	if snapshot.Error != "" {
		body += "\n" + lipgloss.NewStyle().Foreground(tuiYellow).Render(snapshot.Error)
	}
	return tuiPanel.Width(width).Render(body)
}

func renderAddresses(snapshot Snapshot, width int) string {
	lines := []string{tuiHeading.Render("Topology · local addresses")}
	addressCount := 0
	for _, scope := range []string{"lan", "public", "loopback", "other"} {
		for _, address := range snapshot.Status.AddressGroups[scope] {
			lines = append(lines, fmt.Sprintf("%-8s %s", scope, truncate(address, width-15)))
			addressCount++
		}
	}
	if addressCount == 0 {
		lines = append(lines, tuiSubtle.Render("No advertised addresses."))
	}
	lines = append(lines, tuiSubtle.Render("Peer health and connection edges are unavailable in daemon protocol v1."))
	return tuiPanel.Width(width).Render(strings.Join(lines, "\n"))
}

func renderStreams(snapshot Snapshot, width int) string {
	lines := []string{tuiHeading.Render("Streams · " + emptyFallback(snapshot.SelectedNetwork, "no network"))}
	if len(snapshot.Streams) == 0 {
		lines = append(lines, tuiSubtle.Render("No events in the recent diagnostic window."))
	} else {
		for _, stream := range snapshot.Streams {
			lines = append(lines, fmt.Sprintf("%-30s %4d events  latest %s",
				truncate(stream.Name, 30), stream.EventCount, compactTime(stream.LatestAt)))
		}
	}
	return tuiPanel.Width(width).Render(strings.Join(lines, "\n"))
}

func renderEvents(snapshot Snapshot, width, height int) string {
	lines := []string{tuiHeading.Render("Recent events · " + emptyFallback(snapshot.SelectedNetwork, "no network"))}
	maxEvents := 6
	if height > 44 {
		maxEvents = 10
	}
	start := len(snapshot.Events) - maxEvents
	if start < 0 {
		start = 0
	}
	if len(snapshot.Events) == 0 {
		lines = append(lines, tuiSubtle.Render("No events to display."))
	}
	for _, event := range snapshot.Events[start:] {
		payload := compactJSON(event.Payload)
		lines = append(lines, fmt.Sprintf("%s  %-24s  %-12s  %s",
			compactTime(event.OccurredAt),
			truncate(event.Stream, 24),
			shortID(event.DeviceID),
			truncate(payload, width-62),
		))
	}
	return tuiPanel.Width(width).Render(strings.Join(lines, "\n"))
}

func renderWarnings(snapshot Snapshot, width int) string {
	if len(snapshot.Warnings) == 0 {
		return ""
	}
	lines := []string{lipgloss.NewStyle().Bold(true).Foreground(tuiYellow).Render("Prototype notices")}
	for _, warning := range snapshot.Warnings {
		lines = append(lines, "• "+wrapText(warning, width-6))
	}
	return tuiPanel.Width(width).Render(strings.Join(lines, "\n"))
}

func renderTUIViewport(top string, bodySections []string, width, height, requestedOffset int) string {
	bodyLines := strings.Split(strings.Join(bodySections, "\n"), "\n")
	topLines := strings.Count(top, "\n") + 1
	visible := height - topLines - 2
	if height <= 0 {
		visible = len(bodyLines)
	} else if visible < 1 {
		visible = 1
	}
	maxOffset := len(bodyLines) - visible
	if maxOffset < 0 {
		maxOffset = 0
	}
	offset := requestedOffset
	if offset > maxOffset {
		offset = maxOffset
	}
	end := offset + visible
	if end > len(bodyLines) {
		end = len(bodyLines)
	}
	body := strings.Join(bodyLines[offset:end], "\n")
	footer := renderTUIFooter(width, offset, maxOffset)
	return strings.Join([]string{top, body, footer}, "\n")
}

func renderTUIFooter(width, offset, maxOffset int) string {
	scroll := ""
	if maxOffset > 0 {
		scroll = fmt.Sprintf("  ·  scroll %d/%d", offset, maxOffset)
	}
	return tuiSubtle.Width(width).Render("←/→ network  ·  j/k scroll  ·  r refresh  ·  q quit" + scroll)
}

func adjacentNetwork(networks []Network, selected string, delta int) string {
	if len(networks) == 0 {
		return ""
	}
	index := 0
	for candidate, network := range networks {
		if network.Name == selected {
			index = candidate
			break
		}
	}
	index = (index + delta + len(networks)) % len(networks)
	return networks[index].Name
}

func compactJSON(payload json.RawMessage) string {
	if len(payload) == 0 {
		return "null"
	}
	var compact bytes.Buffer
	if err := json.Compact(&compact, payload); err != nil {
		return string(payload)
	}
	return compact.String()
}

func compactTime(value string) string {
	parsed, err := time.Parse(time.RFC3339Nano, value)
	if err != nil {
		return emptyFallback(value, "—")
	}
	return parsed.Local().Format("15:04:05")
}

func shortID(value string) string {
	if len(value) <= 16 {
		return emptyFallback(value, "—")
	}
	return value[:8] + "…" + value[len(value)-6:]
}

func truncate(value string, width int) string {
	if width < 2 {
		return ""
	}
	runes := []rune(value)
	if len(runes) <= width {
		return value
	}
	return string(runes[:width-1]) + "…"
}

func wrapText(value string, width int) string {
	if width <= 0 || len(value) <= width {
		return value
	}
	words := strings.Fields(value)
	var lines []string
	line := ""
	for _, word := range words {
		if line != "" && len(line)+1+len(word) > width {
			lines = append(lines, line)
			line = word
			continue
		}
		if line != "" {
			line += " "
		}
		line += word
	}
	if line != "" {
		lines = append(lines, line)
	}
	return strings.Join(lines, "\n")
}

func emptyFallback(value, fallback string) string {
	if value == "" {
		return fallback
	}
	return value
}
