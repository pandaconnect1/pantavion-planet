import { createHash } from "node:crypto";

import {
  createDisconnectedExecutionPacket,
  verifyDisconnectedExecutionPacket,
  type DisconnectedExecutionTask,
  type EdgeExecutionPolicy,
  type JsonValue,
} from "./edge-execution.ts";

export const EDGE_PREFLIGHT_SCHEMA = "pantavion.edge-preflight.v1" as const;
export const EDGE_PREFLIGHT_POLICY = "disconnected-execution-no-authority-v1" as const;

const ROOT_KEYS = new Set([
  "taskId", "intentId", "capability", "payload", "deterministic", "reversible",
  "requiresNetwork", "writesProduction", "issuedAt", "expiresAt",
  "allowedCapabilities", "maximumPayloadBytes", "verificationAt", "consumedDigests",
]);

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function boundedText(value: unknown, field: string, max: number): string {
  if (typeof value !== "string") throw new Error(`invalid_edge_preflight:${field}_must_be_string`);
  const normalized = value.trim();
  if (!normalized || normalized.length > max) throw new Error(`invalid_edge_preflight:${field}_length`);
  return normalized;
}

function timestamp(value: unknown, field: string): string {
  const normalized = boundedText(value, field, 64);
  if (!Number.isFinite(Date.parse(normalized))) throw new Error(`invalid_edge_preflight:${field}`);
  return normalized;
}

function booleanValue(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") throw new Error(`invalid_edge_preflight:${field}_must_be_boolean`);
  return value;
}

function jsonValue(value: unknown, depth = 0): JsonValue {
  if (depth > 12) throw new Error("invalid_edge_preflight:payload_depth");
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("invalid_edge_preflight:payload_number");
    return value;
  }
  if (Array.isArray(value)) {
    if (value.length > 500) throw new Error("invalid_edge_preflight:payload_array");
    return value.map((item) => jsonValue(item, depth + 1));
  }
  if (isRecord(value)) {
    const keys = Object.keys(value);
    if (keys.length > 200) throw new Error("invalid_edge_preflight:payload_keys");
    const output: Record<string, JsonValue> = {};
    for (const key of keys.sort()) {
      if (!key || key.length > 160 || key === "__proto__" || key === "constructor" || key === "prototype") {
        throw new Error("invalid_edge_preflight:payload_key");
      }
      output[key] = jsonValue(value[key], depth + 1);
    }
    return output;
  }
  throw new Error("invalid_edge_preflight:payload_value");
}

function stringArray(value: unknown, field: string, maxItems: number): string[] {
  if (!Array.isArray(value) || value.length > maxItems) {
    throw new Error(`invalid_edge_preflight:${field}`);
  }
  return value.map((item, index) => boundedText(item, `${field}_${index}`, 160));
}

export type ParsedEdgePreflight = {
  task: DisconnectedExecutionTask;
  policy: EdgeExecutionPolicy;
  verificationAt: string;
  consumedDigests: string[];
};

export function parseEdgePreflight(input: unknown): ParsedEdgePreflight {
  if (!isRecord(input)) throw new Error("invalid_edge_preflight:object_required");
  for (const key of Object.keys(input)) {
    if (!ROOT_KEYS.has(key)) throw new Error(`invalid_edge_preflight:unknown_field:${key}`);
  }
  if (!isRecord(input.payload)) throw new Error("invalid_edge_preflight:payload_object_required");

  const allowedCapabilities = stringArray(input.allowedCapabilities, "allowedCapabilities", 50);
  if (!allowedCapabilities.length || new Set(allowedCapabilities).size !== allowedCapabilities.length) {
    throw new Error("invalid_edge_preflight:allowedCapabilities");
  }
  if (
    typeof input.maximumPayloadBytes !== "number" ||
    !Number.isInteger(input.maximumPayloadBytes) ||
    input.maximumPayloadBytes < 0 ||
    input.maximumPayloadBytes > 16_384
  ) {
    throw new Error("invalid_edge_preflight:maximumPayloadBytes");
  }

  return {
    task: {
      id: boundedText(input.taskId, "taskId", 160),
      intentId: boundedText(input.intentId, "intentId", 160),
      capability: boundedText(input.capability, "capability", 160),
      payload: jsonValue(input.payload) as Record<string, JsonValue>,
      deterministic: booleanValue(input.deterministic, "deterministic"),
      reversible: booleanValue(input.reversible, "reversible"),
      requiresNetwork: booleanValue(input.requiresNetwork, "requiresNetwork"),
      writesProduction: booleanValue(input.writesProduction, "writesProduction"),
      issuedAt: timestamp(input.issuedAt, "issuedAt"),
      expiresAt: timestamp(input.expiresAt, "expiresAt"),
    },
    policy: {
      allowedCapabilities,
      maximumPayloadBytes: input.maximumPayloadBytes,
    },
    verificationAt: timestamp(input.verificationAt, "verificationAt"),
    consumedDigests: stringArray(input.consumedDigests, "consumedDigests", 100),
  };
}

function failureReason(error: unknown): string {
  const message = error instanceof Error ? error.message : "edge_packet_creation_failed";
  return "packet_creation_denied:" + message.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

export function createFounderEdgePreflight(input: unknown) {
  const parsed = parseEdgePreflight(input);
  let payloadDigest: string | null = null;
  let reasons: string[] = [];
  try {
    const packet = createDisconnectedExecutionPacket(parsed.task, parsed.policy);
    payloadDigest = packet.payloadDigest;
    reasons = verifyDisconnectedExecutionPacket(
      packet,
      parsed.verificationAt,
      parsed.policy,
      new Set(parsed.consumedDigests),
    ).reasons;
  } catch (error) {
    reasons = [failureReason(error)];
  }

  const canonical = {
    schema: EDGE_PREFLIGHT_SCHEMA,
    policyVersion: EDGE_PREFLIGHT_POLICY,
    task: parsed.task,
    policy: parsed.policy,
    verificationAt: parsed.verificationAt,
    consumedDigests: parsed.consumedDigests,
    preflight: {
      readyForOwnerReview: reasons.length === 0,
      reasons,
      payloadDigest,
    },
    handoffIssued: false,
    assessmentOnly: true,
    executionAllowed: false,
    productionWriteAllowed: false,
    authorizationEffect: "none" as const,
  };
  const receiptSha256 = createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
  return { ...canonical, receiptSha256 };
}
