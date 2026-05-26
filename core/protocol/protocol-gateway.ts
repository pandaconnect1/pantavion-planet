import type {
  PantavionExecutionReceipt,
  PantavionProtocolEnvelope,
} from "./protocol-types";

export interface PantavionProtocolGateway {
  accept<TPayload>(envelope: PantavionProtocolEnvelope<TPayload>): PantavionExecutionReceipt;
}

export function createProtocolGateway(): PantavionProtocolGateway {
  return {
    accept<TPayload>(envelope: PantavionProtocolEnvelope<TPayload>): PantavionExecutionReceipt {
      const reasons: string[] = [];

      if (!envelope.packetId) reasons.push("missing_packet_id");
      if (!envelope.protocolVersion) reasons.push("missing_protocol_version");
      if (!envelope.source?.principalId) reasons.push("missing_source_principal");
      if (!envelope.target?.route) reasons.push("missing_target_route");

      return {
        receiptId: "receipt:" + envelope.packetId,
        packetId: envelope.packetId,
        status: reasons.length === 0 ? "accepted" : "rejected",
        truthZone: envelope.truthZone,
        createdAt: new Date().toISOString(),
        reasons,
      };
    },
  };
}

type PantavionProtocolRegistryEntry = {
  key: string;
  value: unknown;
  registeredAt: string;
};

const foundationProtocolAdapters: PantavionProtocolRegistryEntry[] = [];
const protocolHandlers: PantavionProtocolRegistryEntry[] = [];

function getRegistryKey(value: unknown, fallbackPrefix: string) {
  if (typeof value === "string" && value.trim()) return value.trim();

  if (value && typeof value === "object") {
    const record = value as { key?: unknown; id?: unknown; name?: unknown };
    if (typeof record.key === "string" && record.key.trim()) return record.key.trim();
    if (typeof record.id === "string" && record.id.trim()) return record.id.trim();
    if (typeof record.name === "string" && record.name.trim()) return record.name.trim();
  }

  return fallbackPrefix + "_" + Date.now() + "_" + Math.random().toString(36).slice(2);
}

export function registerFoundationProtocolAdapter(
  keyOrAdapter: string | unknown,
  maybeAdapter?: unknown,
) {
  const key =
    typeof keyOrAdapter === "string"
      ? keyOrAdapter
      : getRegistryKey(keyOrAdapter, "foundation_adapter");

  const value = typeof keyOrAdapter === "string" ? maybeAdapter : keyOrAdapter;

  const entry = {
    key,
    value,
    registeredAt: new Date().toISOString(),
  };

  foundationProtocolAdapters.push(entry);
  return entry;
}

export function registerProtocolHandler(
  keyOrHandler: string | unknown,
  maybeHandler?: unknown,
) {
  const key =
    typeof keyOrHandler === "string"
      ? keyOrHandler
      : getRegistryKey(keyOrHandler, "protocol_handler");

  const value = typeof keyOrHandler === "string" ? maybeHandler : keyOrHandler;

  const entry = {
    key,
    value,
    registeredAt: new Date().toISOString(),
  };

  protocolHandlers.push(entry);
  return entry;
}

export function getProtocolRegistrySnapshot() {
  return {
    foundationProtocolAdapters: foundationProtocolAdapters.map((entry) => ({
      key: entry.key,
      registeredAt: entry.registeredAt,
    })),
    protocolHandlers: protocolHandlers.map((entry) => ({
      key: entry.key,
      registeredAt: entry.registeredAt,
    })),
    totals: {
      foundationProtocolAdapters: foundationProtocolAdapters.length,
      protocolHandlers: protocolHandlers.length,
    },
  };
}

export function getProtocolGatewayStats() {
  const snapshot = getProtocolRegistrySnapshot();

  return {
    ...snapshot.totals,
    gatewayReady: true,
    updatedAt: new Date().toISOString(),
  };
}

export const protocolGateway = createProtocolGateway();