import { createHash } from "node:crypto";

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export interface DisconnectedExecutionTask {
  id: string;
  intentId: string;
  capability: string;
  payload: { [key: string]: JsonValue };
  deterministic: boolean;
  reversible: boolean;
  requiresNetwork: boolean;
  writesProduction: boolean;
  issuedAt: string;
  expiresAt: string;
}

export interface EdgeExecutionPolicy {
  allowedCapabilities: string[];
  maximumPayloadBytes: number;
}

export interface DisconnectedExecutionPacket {
  version: "pantavion_edge_execution_v1";
  task: DisconnectedExecutionTask;
  payloadDigest: string;
  executionMode: "disconnected";
}

function canonicalize(value: JsonValue): JsonValue {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value !== null && typeof value === "object") {
    const sorted: { [key: string]: JsonValue } = {};
    for (const key of Object.keys(value).sort()) sorted[key] = canonicalize(value[key]);
    return sorted;
  }
  return value;
}

function digestTask(task: DisconnectedExecutionTask) {
  return createHash("sha256").update(JSON.stringify(canonicalize(task as unknown as JsonValue))).digest("hex");
}

export function createDisconnectedExecutionPacket(
  task: DisconnectedExecutionTask,
  policy: EdgeExecutionPolicy,
): DisconnectedExecutionPacket {
  if (!task.id.trim() || !task.intentId.trim()) throw new Error("task and intent identities are required");
  if (!policy.allowedCapabilities.includes(task.capability)) throw new Error("edge capability not allowed");
  if (!task.deterministic) throw new Error("disconnected execution must be deterministic");
  if (!task.reversible) throw new Error("disconnected execution must be reversible");
  if (task.requiresNetwork) throw new Error("disconnected execution cannot require network access");
  if (task.writesProduction) throw new Error("disconnected execution cannot write production");
  if (Date.parse(task.expiresAt) <= Date.parse(task.issuedAt)) throw new Error("edge packet expiry is invalid");

  const payloadBytes = Buffer.byteLength(JSON.stringify(task.payload), "utf8");
  if (payloadBytes > policy.maximumPayloadBytes) throw new Error("edge payload exceeds policy");

  return {
    version: "pantavion_edge_execution_v1",
    task,
    payloadDigest: digestTask(task),
    executionMode: "disconnected",
  };
}

export function verifyDisconnectedExecutionPacket(
  packet: DisconnectedExecutionPacket,
  now: string,
  consumedDigests: ReadonlySet<string> = new Set(),
): { valid: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (packet.version !== "pantavion_edge_execution_v1") reasons.push("unsupported_packet_version");
  if (packet.payloadDigest !== digestTask(packet.task)) reasons.push("packet_digest_mismatch");
  if (Date.parse(packet.task.expiresAt) <= Date.parse(now)) reasons.push("packet_expired");
  if (consumedDigests.has(packet.payloadDigest)) reasons.push("packet_replay_detected");
  if (packet.task.requiresNetwork) reasons.push("network_requirement_present");
  if (packet.task.writesProduction) reasons.push("production_write_present");
  return { valid: reasons.length === 0, reasons };
}
