import "@mantine/core/styles.css";
import "./styles.css";

import {
  Alert,
  Anchor,
  Badge,
  Box,
  Button,
  Card,
  Center,
  Container,
  createTheme,
  Divider,
  Grid,
  Group,
  MantineProvider,
  Paper,
  ScrollArea,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";

type ConsoleState = "online" | "degraded" | "offline";

type Network = {
  name: string;
  id: string;
};

type Event = {
  id: string;
  stream: string;
  occurredAt: string;
  deviceId: string;
  payload: unknown;
};

type StreamSummary = {
  name: string;
  eventCount: number;
  latestAt?: string;
};

type MeshPeer = {
  peerId: string;
  address: string;
  state: "known" | "connected" | "syncing" | "healthy" | "degraded";
  connected: boolean;
  lastSuccessAt?: string;
  lastError?: string;
  nextAttemptAt?: string;
  consecutiveFailures: number;
};

type Feature = {
  name: string;
  supported: boolean;
  detail: string;
};

type Snapshot = {
  capturedAt: string;
  state: ConsoleState;
  error?: string;
  status: {
    deviceId: string;
    addressGroups?: Record<string, string[]>;
    daemonVersion: string;
    protocolVersion: number;
    storageSchemaVersion: number;
  };
  networks: Network[];
  peers: MeshPeer[];
  selectedNetwork?: string;
  events: Event[];
  streams: StreamSummary[];
  warnings: string[];
  features: Feature[];
};

const theme = createTheme({
  primaryColor: "frost",
  primaryShade: { light: 6, dark: 4 },
  defaultRadius: "md",
  colors: {
    frost: [
      "#eef6fa",
      "#dceaf1",
      "#bdd8e4",
      "#9bc5d6",
      "#88c0d0",
      "#81a1c1",
      "#5e81ac",
      "#4c6c91",
      "#3b5675",
      "#2c415a",
    ],
    dark: [
      "#eceff4",
      "#e5e9f0",
      "#d8dee9",
      "#b8c2d1",
      "#697386",
      "#4c566a",
      "#3b4252",
      "#2e3440",
      "#292f3a",
      "#242933",
    ],
  },
});

const shortId = (value?: string) => {
  if (!value) return "—";
  return value.length > 18 ? `${value.slice(0, 9)}…${value.slice(-7)}` : value;
};

const localTime = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : date.toLocaleString();
};

const stateColor: Record<ConsoleState, string> = {
  online: "green",
  degraded: "yellow",
  offline: "red",
};

function SectionTitle({ title, detail }: { title: string; detail: string }) {
  return (
    <Group justify="space-between" align="baseline" mb="md" wrap="nowrap">
      <Title order={2} size="h4">{title}</Title>
      <Text c="dimmed" size="xs" ta="right">{detail}</Text>
    </Group>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <Center mih={108}>
      <Text c="dimmed" size="sm">{children}</Text>
    </Center>
  );
}

function App() {
  const initialNetwork = useMemo(
    () => new URL(window.location.href).searchParams.get("network") || "",
    [],
  );
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState(initialNetwork);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async (network = selectedNetwork, indicate = false) => {
    if (indicate) setLoading(true);
    try {
      const endpoint = new URL("api/snapshot", window.location.href);
      if (network) endpoint.searchParams.set("network", network);
      const response = await fetch(endpoint, { cache: "no-store" });
      if (!response.ok) throw new Error(`Console API returned ${response.status}`);
      const next = await response.json() as Snapshot;
      setSnapshot(next);
      setSelectedNetwork(next.selectedNetwork || "");
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to reach the console API");
    } finally {
      if (indicate) setLoading(false);
    }
  }, [selectedNetwork]);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 2_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const currentState: ConsoleState = error ? "offline" : snapshot?.state || "offline";
  const activeNetwork = snapshot?.networks.find((network) => network.name === selectedNetwork);
  const diagnosticsURL = useMemo(() => {
    const target = new URL("api/diagnostics", window.location.href);
    if (selectedNetwork) target.searchParams.set("network", selectedNetwork);
    return target.toString();
  }, [selectedNetwork]);
  const addresses = useMemo(() => {
    if (!snapshot) return [];
    const result: Array<{ scope: string; address: string }> = [];
    const groups = snapshot.status.addressGroups || {};
    for (const scope of ["lan", "public", "loopback", "other"]) {
      for (const address of groups[scope] || []) result.push({ scope, address });
    }
    return result;
  }, [snapshot]);
  const events = useMemo(
    () => [...(snapshot?.events || [])].reverse().slice(0, 12),
    [snapshot],
  );

  const metrics = [
    { label: "Device", value: shortId(snapshot?.status.deviceId), mono: true },
    { label: "Networks", value: String(snapshot?.networks.length ?? 0) },
    { label: "Known peers", value: String(snapshot?.peers?.length ?? 0) },
    { label: "Recent events", value: String(events.length) },
    {
      label: "Versions",
      value: snapshot
        ? `${snapshot.status.daemonVersion || "?"} · IPC ${snapshot.status.protocolVersion || "?"} · DB ${snapshot.status.storageSchemaVersion || "?"}`
        : "—",
    },
  ];

  return (
    <Box className="app-shell">
      <Container size="xl" py={{ base: "lg", sm: "xl" }}>
        <Stack gap="lg">
          <Group justify="space-between" align="center">
            <Group gap="sm">
              <ThemeIcon variant="light" size={42} radius="md" aria-hidden>
                <Text fw={800} ff="monospace">T</Text>
              </ThemeIcon>
              <div>
                <Title order={1} size="h3">Thalweg Console</Title>
                <Text c="dimmed" size="sm">A clear view of your local daemon</Text>
              </div>
            </Group>
            <Group gap="sm">
              <Badge
                color={stateColor[currentState]}
                variant="light"
                size="lg"
                leftSection={<span className="status-dot" />}
              >
                {currentState}
              </Badge>
              <Button
                variant="default"
                loading={loading}
                onClick={() => void refresh(selectedNetwork, true)}
              >
                Refresh
              </Button>
              <Button component="a" href={diagnosticsURL} variant="light">
                Export diagnostics
              </Button>
            </Group>
          </Group>

          <Paper withBorder p="md">
            <Group justify="space-between" align="end">
              <Select
                label="Network"
                placeholder={snapshot ? "No mounted networks" : "Waiting for daemon"}
                data={(snapshot?.networks || []).map((network) => ({
                  label: network.name,
                  value: network.name,
                }))}
                value={selectedNetwork || null}
                disabled={!snapshot?.networks.length}
                onChange={(value) => {
                  const network = value || "";
                  setSelectedNetwork(network);
                  void refresh(network, true);
                }}
                w={{ base: "100%", sm: 280 }}
              />
              <div>
                <Text c="dimmed" size="xs" ta={{ base: "left", sm: "right" }}>Network ID</Text>
                <Text ff="monospace" size="sm">{activeNetwork?.id || "—"}</Text>
              </div>
            </Group>
          </Paper>

          {(error || snapshot?.error) && (
            <Alert color="red" title="Console unavailable" variant="light">
              {error || snapshot?.error}
            </Alert>
          )}

          <Card withBorder padding="lg">
            <SectionTitle
              title="Overview"
              detail={snapshot ? `Captured ${localTime(snapshot.capturedAt)}` : "Not yet refreshed"}
            />
            <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }}>
              {metrics.map((metric) => (
                <Paper key={metric.label} withBorder p="md" bg="dark.7">
                  <Text c="dimmed" size="xs" fw={700} tt="uppercase" lts=".06em">
                    {metric.label}
                  </Text>
                  <Text mt={6} fw={650} ff={metric.mono ? "monospace" : undefined} truncate>
                    {metric.value}
                  </Text>
                </Paper>
              ))}
            </SimpleGrid>
          </Card>

          <Grid gap="lg">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card withBorder padding="lg" h="100%">
                <SectionTitle title="Node addresses" detail="Advertised locally" />
                {addresses.length === 0 ? (
                  <Empty>No advertised addresses.</Empty>
                ) : (
                  <Stack gap={0}>
                    {addresses.slice(0, 6).map((item, index) => (
                      <Box key={`${item.scope}-${item.address}`}>
                        {index > 0 && <Divider />}
                        <Group justify="space-between" py="sm" wrap="nowrap">
                          <Badge variant="light" size="sm">{item.scope}</Badge>
                          <Text ff="monospace" size="xs" truncate className="flex-text">
                            {item.address}
                          </Text>
                          <Text c="dimmed" size="xs">advertised</Text>
                        </Group>
                      </Box>
                    ))}
                    {addresses.length > 6 && (
                      <Text c="dimmed" size="xs" pt="sm">+ {addresses.length - 6} more addresses</Text>
                    )}
                  </Stack>
                )}
              </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card withBorder padding="lg" h="100%">
                <SectionTitle title="Streams" detail="Recent 24-hour window" />
                {!snapshot?.streams.length ? (
                  <Empty>No events in the recent diagnostic window.</Empty>
                ) : (
                  <Stack gap={0}>
                    {snapshot.streams.slice(0, 6).map((stream, index) => (
                      <Box key={stream.name}>
                        {index > 0 && <Divider />}
                        <Group justify="space-between" py="sm" wrap="nowrap">
                          <Badge variant="light" size="sm">stream</Badge>
                          <Text ff="monospace" size="xs" truncate className="flex-text">
                            {stream.name}
                          </Text>
                          <Text c="dimmed" size="xs" ta="right">
                            {stream.eventCount} · {localTime(stream.latestAt)}
                          </Text>
                        </Group>
                      </Box>
                    ))}
                    {snapshot.streams.length > 6 && (
                      <Text c="dimmed" size="xs" pt="sm">+ {snapshot.streams.length - 6} more streams</Text>
                    )}
                  </Stack>
                )}
              </Card>
            </Grid.Col>
          </Grid>

          <Card withBorder padding="lg">
            <SectionTitle title="Peers" detail={selectedNetwork || "network required"} />
            {!snapshot?.peers?.length ? (
              <Empty>No known peers for this network.</Empty>
            ) : (
              <ScrollArea type="auto">
                <Table verticalSpacing="sm" miw={760}>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Peer</Table.Th>
                      <Table.Th>State</Table.Th>
                      <Table.Th>Last synchronized</Table.Th>
                      <Table.Th>Retry</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {snapshot.peers.map((peer) => (
                      <Table.Tr key={peer.peerId}>
                        <Table.Td>
                          <Text ff="monospace" size="sm">{shortId(peer.peerId)}</Text>
                          <Text c="dimmed" ff="monospace" size="xs" truncate maw={340}>
                            {peer.address}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge color={peer.state === "healthy" ? "green" : peer.state === "degraded" ? "yellow" : "frost"} variant="light">
                            {peer.state}{peer.connected ? " · connected" : ""}
                          </Badge>
                          {peer.lastError && <Text c="yellow" size="xs" mt={4}>{peer.lastError}</Text>}
                        </Table.Td>
                        <Table.Td>{localTime(peer.lastSuccessAt)}</Table.Td>
                        <Table.Td>
                          <Text size="xs">{peer.consecutiveFailures} failures</Text>
                          <Text c="dimmed" size="xs">{localTime(peer.nextAttemptAt)}</Text>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            )}
          </Card>

          <Card withBorder padding="lg">
            <SectionTitle
              title="Recent events"
              detail={`Latest 12 · ${selectedNetwork || "network required"}`}
            />
            {events.length === 0 ? (
              <Empty>No events to display.</Empty>
            ) : (
              <ScrollArea type="auto">
                <Table highlightOnHover verticalSpacing="sm" miw={900}>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Occurred</Table.Th>
                      <Table.Th>Stream</Table.Th>
                      <Table.Th>Origin</Table.Th>
                      <Table.Th>Event</Table.Th>
                      <Table.Th>Payload</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {events.map((event) => (
                      <Table.Tr key={event.id}>
                        <Table.Td>{localTime(event.occurredAt)}</Table.Td>
                        <Table.Td><Text ff="monospace" size="sm">{event.stream}</Text></Table.Td>
                        <Table.Td><Text ff="monospace" size="sm">{shortId(event.deviceId)}</Text></Table.Td>
                        <Table.Td><Text ff="monospace" size="sm">{shortId(event.id)}</Text></Table.Td>
                        <Table.Td>
                          <Text ff="monospace" size="xs" className="payload">
                            {JSON.stringify(event.payload) ?? "—"}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            )}
          </Card>

          <Card withBorder padding="lg">
            <SectionTitle title="System notes" detail="Current daemon capabilities" />
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
              {(snapshot?.features || []).map((feature) => (
                <Paper key={feature.name} withBorder p="md" bg="dark.7">
                  <Group gap="xs" mb={4}>
                    <Badge
                      color={feature.supported ? "green" : "yellow"}
                      variant="light"
                      size="xs"
                    >
                      {feature.supported ? "Available" : "Planned"}
                    </Badge>
                    <Text fw={650} size="sm">{feature.name}</Text>
                  </Group>
                  <Text c="dimmed" size="xs">{feature.detail}</Text>
                </Paper>
              ))}
            </SimpleGrid>
            {!!snapshot?.warnings.length && (
              <Stack gap="xs" mt="lg">
                {snapshot.warnings.map((warning) => (
                  <Alert key={warning} color="yellow" variant="light" py="xs">
                    <Text size="xs">{warning}</Text>
                  </Alert>
                ))}
              </Stack>
            )}
          </Card>

          <Text c="dimmed" size="xs" ta="center">
            Loopback-only session · payloads are rendered as inert text · refreshes every 2 seconds
          </Text>
        </Stack>
      </Container>
    </Box>
  );
}

createRoot(document.getElementById("root")!).render(
  <MantineProvider theme={theme} forceColorScheme="dark">
    <App />
  </MantineProvider>,
);
