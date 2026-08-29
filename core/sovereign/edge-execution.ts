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

function containsNonFiniteNumber(value: JsonValue): boolean {
  if (typeof value === "number") return !Number.isFinite(value);
  if (Array.isArray(value)) return value.some(containsNonFiniteNumber);
  if (value !== null && typeof value === "object") {
    return Object.values(value).some(containsNonFiniteNumber);
  }
  return false;
}

function digestTask(task: DisconnectedExecutionTask) {
  return createHash("sha256").update(JSON.stringify(canonicalize(task as unknown as JsonValue))).digest("hex");
}

function policyIsValid(policy: EdgeExecutionPolicy): boolean {
  return (
    Array.isArray(policy.allowedCapabilities) &&
    policy.allowedCapabilities.every((capability) => capability.trim().length > 0) &&
    Number.isInteger(policy.maximumPayloadBytes) &&
    policy.maximumPayloadBytes >= 0
  );
}

export function createDisconnectedExecutionPacket(
  task: DisconnectedExecutionTask,
  policy: EdgeExecutionPolicy,
): DisconnectedExecutionPacket {
  if (!task.id.trim() || !task.intentId.trim() || !task.capability.trim()) {
    throw new Error("task, intent and capability identities are required");
  }
  if (!policyIsValid(policy)) throw new Error("edge policy is invalid");
  if (!policy.allowedCapabilities.includes(task.capability)) throw new Error("edge capability not allowed");
  if (!task.deterministic) throw new Error("disconnected execution must be deterministic");
  if (!task.reversible) throw new Error("disconnected execution must be reversible");
  if (task.requiresNetwork) throw new Error("disconnected execution cannot require network access");
  if (task.writesProduction) throw new Error("disconnected execution cannot write production");

  const issuedAt = Date.parse(task.issuedAt);
  const expiresAt = Date.parse(task.expiresAt);
  if (!Number.isFinite(issuedAt) || !Number.isFinite(expiresAt) || expiresAt <= issuedAt) {
    throw new Error("edge packet timestamps are invalid");
  }
  if (containsNonFiniteNumber(task.payload)) throw new Error("edge payload contains non-finite numbers");

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
  policy: EdgeExecutionPolicy,
  consumedDigests: ReadonlySet<string> = new Set(),
): { valid: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const issuedAt = Date.parse(packet.task.issuedAt);
  const expiresAt = Date.parse(packet.task.expiresAt);
  const observedAt = Date.parse(now);

  if (packet.version !== "pantavion_edge_execution_v1") reasons.push("unsupported_packet_version");
  if (packet.executionMode !== "disconnected") reasons.push("execution_mode_invalid");
  if (!packet.task.id.trim() || !packet.task.intentId.trim() || !packet.task.capability.trim()) {
    reasons.push("packet_identity_missing");
  }
  if (!policyIsValid(policy)) reasons.push("edge_policy_invalid");
  else {
    if (!policy.allowedCapabilities.includes(packet.task.capability)) reasons.push("edge_capability_not_allowed");
    const payloadBytes = Buffer.byteLength(JSON.stringify(packet.task.payload), "utf8");
    if (payloadBytes > policy.maximumPayloadBytes) reasons.push("edge_payload_exceeds_policy");
  }
  if (containsNonFiniteNumber(packet.task.payload)) reasons.push("payload_non_finite_number");
  if (packet.payloadDigest !== digestTask(packet.task)) reasons.push("packet_digest_mismatch");
  if (!Number.isFinite(issuedAt) || !Number.isFinite(expiresAt) || expiresAt <= issuedAt) {
    reasons.push("packet_time_invalid");
  }
  if (!Number.isFinite(observedAt)) reasons.push("verification_time_invalid");
  else {
    if (Number.isFinite(issuedAt) && observedAt < issuedAt) reasons.push("packet_not_yet_valid");
    if (Number.isFinite(expiresAt) && expiresAt <= observedAt) reasons.push("packet_expired");
  }
  if (consumedDigests.has(packet.payloadDigest)) reasons.push("packet_replay_detected");
  if (!packet.task.deterministic) reasons.push("nondeterministic_task");
  if (!packet.task.reversible) reasons.push("irreversible_task");
  if (packet.task.requiresNetwork) reasons.push("network_requirement_present");
  if (packet.task.writesProduction) reasons.push("production_write_present");
  return { valid: reasons.length === 0, reasons: [...new Set(reasons)] };
}
