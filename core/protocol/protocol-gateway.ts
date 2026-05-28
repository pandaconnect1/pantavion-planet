import type {
  PantavionExecutionReceipt,
  PantavionProtocolEnvelope,
} from "./protocol-types";

type RegistryEntry<TValue = unknown> = {
  key: string;
  adapterKey: string;
  value: TValue;
  registeredAt: string;
};

export interface ProtocolHandlerContext {
  request: {
    operationKey: string;
    capabilityKey?: string;
    input?: unknown;
  };
}

type ProtocolHandler = (context: ProtocolHandlerContext) => Promise<unknown> | unknown;

const foundationProtocolAdapters: RegistryEntry[] = [];
const protocolHandlers: RegistryEntry<ProtocolHandler>[] = [];
let dispatchCount = 0;

function getRegistryKey(value: unknown, fallbackPrefix: string) {
  if (typeof value === "string" && value.trim()) return value.trim();

  if (value && typeof value === "object") {
    const record = value as {
      key?: unknown;
      id?: unknown;
      name?: unknown;
      adapterKey?: unknown;
      displayName?: unknown;
    };

    if (typeof record.adapterKey === "string" && record.adapterKey.trim()) return record.adapterKey.trim();
    if (typeof record.key === "string" && record.key.trim()) return record.key.trim();
    if (typeof record.id === "string" && record.id.trim()) return record.id.trim();
    if (typeof record.name === "string" && record.name.trim()) return record.name.trim();
    if (typeof record.displayName === "string" && record.displayName.trim()) return record.displayName.trim();
  }

  return `${fallbackPrefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export interface PantavionProtocolGateway {
  accept<TPayload>(envelope: PantavionProtocolEnvelope<TPayload>): PantavionExecutionReceipt;
  getAdapter(adapterKey: string): RegistryEntry | null;
  getStats(): ReturnType<typeof getProtocolGatewayStats>;
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

  const existing = foundationProtocolAdapters.find((entry) => entry.key === key);
  if (existing) return existing;

  const entry: RegistryEntry = {
    key,
    adapterKey: key,
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

  const entry: RegistryEntry<ProtocolHandler> = {
    key,
    adapterKey: key,
    value: value as ProtocolHandler,
    registeredAt: new Date().toISOString(),
  };

  protocolHandlers.push(entry);
  return entry;
}

export function getProtocolRegistrySnapshot() {
  return {
    adapters: foundationProtocolAdapters.map((entry) => ({
      adapterKey: entry.adapterKey,
      key: entry.key,
      registeredAt: entry.registeredAt,
    })),
    handlers: protocolHandlers.map((entry) => ({
      adapterKey: entry.adapterKey,
      key: entry.key,
      registeredAt: entry.registeredAt,
    })),
    foundationProtocolAdapters: foundationProtocolAdapters.map((entry) => ({
      key: entry.key,
      registeredAt: entry.registeredAt,
    })),
    protocolHandlers: protocolHandlers.map((entry) => ({
      key: entry.key,
      registeredAt: entry.registeredAt,
    })),
    totals: {
      adapters: foundationProtocolAdapters.length,
      handlers: protocolHandlers.length,
      foundationProtocolAdapters: foundationProtocolAdapters.length,
      protocolHandlers: protocolHandlers.length,
    },
  };
}

export function getProtocolGatewayStats() {
  const snapshot = getProtocolRegistrySnapshot();

  return {
    ...snapshot.totals,
    dispatchCount,
    adapterCount: snapshot.totals.adapters,
    handlerCount: snapshot.totals.handlers,
    gatewayReady: true,
    updatedAt: new Date().toISOString(),
  };
}

export function createProtocolGateway(): PantavionProtocolGateway {
  return {
    accept<TPayload>(envelope: PantavionProtocolEnvelope<TPayload>): PantavionExecutionReceipt {
      dispatchCount += 1;

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

    getAdapter(adapterKey: string): RegistryEntry | null {
      return foundationProtocolAdapters.find((entry) => entry.adapterKey === adapterKey || entry.key === adapterKey) ?? null;
    },

    getStats() {
      return getProtocolGatewayStats();
    },
  };
}

export const protocolGateway = createProtocolGateway();
