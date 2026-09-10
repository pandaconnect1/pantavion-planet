import { createHash } from "node:crypto";

export const SOVEREIGN_ADMISSION_BUNDLE_SCHEMA =
  "pantavion.sovereign-admission-bundle.v1" as const;
export const SOVEREIGN_ADMISSION_BUNDLE_POLICY =
  "sovereign-receipt-chain-fail-closed-v1" as const;

const COMPONENTS = [
  {
    id: "intent_firewall",
    sourcePr: 476,
    sourceHead: "4fa03685a7277d4696873996ddd0b5b94b6514e0",
  },
  {
    id: "intent_outcome",
    sourcePr: 482,
    sourceHead: "0d90c1906e0f22120eb00ee3a2c194065763f49b",
  },
  {
    id: "capability_budget",
    sourcePr: 478,
    sourceHead: "94791f0ab08fc8746d37977bb73e597fe8c4bf2a",
  },
  {
    id: "swarm_admission",
    sourcePr: 481,
    sourceHead: "0d19340415546a63d7148a82d8b3746ff5e49bce",
  },
  {
    id: "edge_preflight",
    sourcePr: 479,
    sourceHead: "67baa0fab093a7406af703619dec89bd48304d0e",
  },
] as const;

type ComponentId = (typeof COMPONENTS)[number]["id"];
type Disposition = "pass" | "owner_approval" | "deny";
type RecordValue = Record<string, unknown>;

const DISPOSITIONS = new Set(["pass", "owner_approval", "deny"]);
const REQUEST_KEYS = new Set(["bundleId", "intentId", "components"]);
const COMPONENT_KEYS = new Set([
  "componentId",
  "sourcePr",
  "sourceHead",
  "receiptSha256",
  "disposition",
  "authorizationEffect",
  "executionAllowed",
]);
const ID = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,159}$/;
const SHA256 = /^[a-f0-9]{64}$/;

export type SovereignAdmissionComponent = {
  componentId: ComponentId;
  sourcePr: number;
  sourceHead: string;
  receiptSha256: string;
  disposition: Disposition;
  authorizationEffect: "none";
  executionAllowed: false;
};

export type SovereignAdmissionBundleRequest = {
  bundleId: string;
  intentId: string;
  components: SovereignAdmissionComponent[];
};

function isRecord(value: unknown): value is RecordValue {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function rejectUnknownKeys(value: RecordValue, allowed: Set<string>, location: string) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new Error(`invalid_sovereign_admission_bundle:unknown_${location}_field:${key}`);
    }
  }
}

function identifier(value: unknown, field: string) {
  if (typeof value !== "string") {
    throw new Error(`invalid_sovereign_admission_bundle:${field}_must_be_string`);
  }
  const normalized = value.trim();
  if (!ID.test(normalized)) {
    throw new Error(`invalid_sovereign_admission_bundle:${field}_format`);
  }
  return normalized;
}

function sha(value: unknown, field: string) {
  if (typeof value !== "string" || !SHA256.test(value.toLowerCase())) {
    throw new Error(`invalid_sovereign_admission_bundle:${field}_format`);
  }
  return value.toLowerCase();
}

function parseComponent(value: unknown, index: number): SovereignAdmissionComponent {
  if (!isRecord(value)) {
    throw new Error(`invalid_sovereign_admission_bundle:component_${index}_object_required`);
  }
  rejectUnknownKeys(value, COMPONENT_KEYS, "component");

  const expected = COMPONENTS[index];
  if (!expected) throw new Error("invalid_sovereign_admission_bundle:unexpected_component");
  if (value.componentId !== expected.id) {
    throw new Error(`invalid_sovereign_admission_bundle:component_${index}_order`);
  }
  if (value.sourcePr !== expected.sourcePr) {
    throw new Error(`invalid_sovereign_admission_bundle:component_${index}_source_pr`);
  }
  if (sha(value.sourceHead, `components[${index}].sourceHead`) !== expected.sourceHead) {
    throw new Error(`invalid_sovereign_admission_bundle:component_${index}_source_head`);
  }
  if (typeof value.disposition !== "string" || !DISPOSITIONS.has(value.disposition)) {
    throw new Error(`invalid_sovereign_admission_bundle:component_${index}_disposition`);
  }
  if (value.authorizationEffect !== "none") {
    throw new Error(`invalid_sovereign_admission_bundle:component_${index}_authorization_effect`);
  }
  if (value.executionAllowed !== false) {
    throw new Error(`invalid_sovereign_admission_bundle:component_${index}_execution_must_be_false`);
  }

  return {
    componentId: expected.id,
    sourcePr: expected.sourcePr,
    sourceHead: expected.sourceHead,
    receiptSha256: sha(value.receiptSha256, `components[${index}].receiptSha256`),
    disposition: value.disposition as Disposition,
    authorizationEffect: "none",
    executionAllowed: false,
  };
}

export function parseSovereignAdmissionBundle(value: unknown): SovereignAdmissionBundleRequest {
  if (!isRecord(value)) throw new Error("invalid_sovereign_admission_bundle:object_required");
  rejectUnknownKeys(value, REQUEST_KEYS, "request");

  if (!Array.isArray(value.components) || value.components.length !== COMPONENTS.length) {
    throw new Error("invalid_sovereign_admission_bundle:component_count");
  }
  const components = value.components.map(parseComponent);
  if (new Set(components.map((item) => item.receiptSha256)).size !== components.length) {
    throw new Error("invalid_sovereign_admission_bundle:duplicate_receipt");
  }

  return {
    bundleId: identifier(value.bundleId, "bundleId"),
    intentId: identifier(value.intentId, "intentId"),
    components,
  };
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (isRecord(value)) {
    return `{${Object.keys(value).sort().map((key) =>
      `${JSON.stringify(key)}:${stableJson(value[key])}`,
    ).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

export function createSovereignAdmissionBundle(value: unknown) {
  const request = parseSovereignAdmissionBundle(value);
  const denied = request.components.filter((item) => item.disposition === "deny");
  const ownerApproval = request.components.filter((item) => item.disposition === "owner_approval");
  const readiness = denied.length
    ? "DENY"
    : ownerApproval.length
      ? "OWNER_APPROVAL_REQUIRED"
      : "READY_FOR_OWNER_ADMISSION";

  const receiptPayload = {
    schema: SOVEREIGN_ADMISSION_BUNDLE_SCHEMA,
    policyVersion: SOVEREIGN_ADMISSION_BUNDLE_POLICY,
    request,
    readiness,
    deniedComponents: denied.map((item) => item.componentId),
    ownerApprovalComponents: ownerApproval.map((item) => item.componentId),
    completeReceiptChain: request.components.length === COMPONENTS.length,
    admissionRecorded: false,
    executionPlanIssued: false,
    agentsCreated: false,
    edgeHandoffIssued: false,
    budgetConsumed: false,
    executionAllowed: false,
    authorizationEffect: "none",
  };

  return {
    ...receiptPayload,
    preflightOnly: true as const,
    ownerAdmissionRequired: true as const,
    receiptSha256: createHash("sha256").update(stableJson(receiptPayload)).digest("hex"),
  };
}

export function sovereignAdmissionComponents() {
  return COMPONENTS.map((item) => ({ ...item }));
}
