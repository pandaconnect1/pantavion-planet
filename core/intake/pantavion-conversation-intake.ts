import { createHash } from "node:crypto";

import type { PantavionAutonomousBuildTarget } from "@/core/kernel/pantavion-autonomous-builder-kernel";
import type { PantavionFounderWorkOrderSubmission } from "@/core/kernel/pantavion-work-order-runtime";

export const PANTAVION_CONVERSATION_INTAKE_MARKER =
  "pantavion_conversation_intake_v1" as const;

export type PantavionConversationSourceKind =
  | "chat_thread"
  | "handoff"
  | "memory_recovery"
  | "uploaded_export"
  | "repo_recovery";

export type PantavionConversationDomain =
  | "personal_ai"
  | "translation"
  | "people"
  | "chat"
  | "social"
  | "voice"
  | "learning"
  | "marketplace"
  | "sos"
  | "safety"
  | "security"
  | "kernel"
  | "recovery"
  | "water"
  | "governance"
  | "billing"
  | "experience"
  | "general";

export type PantavionConversationTruthState =
  | "RECOVERED_ONLY"
  | "CANDIDATE"
  | "CONFLICT"
  | "HOLD"
  | "CANONICAL_EXISTING";

export type PantavionConversationImplementationState =
  | "UNCLASSIFIED"
  | "SPEC_ONLY"
  | "CODED"
  | "TESTED"
  | "MERGED"
  | "DEPLOYED"
  | "VERIFIED_LIVE";

export interface PantavionConversationIntakeInput {
  sourceKind: PantavionConversationSourceKind;
  sourceId: string;
  sourceDate?: string | null;
  sourceThreadTitle?: string | null;
  text: string;
  domains?: PantavionConversationDomain[];
  truthState?: PantavionConversationTruthState;
  implementationState?: PantavionConversationImplementationState;
  canonicalReferences?: string[];
  notes?: string[];
}

export interface PantavionConversationIntakeRecord {
  marker: typeof PANTAVION_CONVERSATION_INTAKE_MARKER;
  intakeId: string;
  source: {
    kind: PantavionConversationSourceKind;
    id: string;
    date: string | null;
    threadTitle: string | null;
    sha256: string;
    originalPreserved: true;
  };
  text: string;
  domains: PantavionConversationDomain[];
  truthState: PantavionConversationTruthState;
  implementationState: PantavionConversationImplementationState;
  canonicalReferences: string[];
  notes: string[];
  authority: {
    directExecutionAllowed: false;
    productionAuthority: false;
    workOrderPromotionRequired: true;
    founderGateRequired: true;
    truthBoundary: string;
  };
}

export interface PantavionConversationWorkOrderCandidate {
  marker: "pantavion_conversation_work_order_candidate_v1";
  intakeId: string;
  submission: PantavionFounderWorkOrderSubmission;
  authority: {
    directExecutionAllowed: false;
    approvalScope: "proposal_only";
    reason: string;
  };
}

const ALLOWED_SOURCE_ID = /^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,239}$/;
const MAX_TEXT_LENGTH = 120_000;
const MAX_REFERENCE_COUNT = 80;
const MAX_NOTE_COUNT = 80;

function uniqueTrimmed(values: string[] | undefined, max: number): string[] {
  if (!values) return [];
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean)),
  ).slice(0, max);
}

function normalizeText(value: string): string {
  const normalized = value.replace(/\r\n/g, "\n").trim();
  if (!normalized) throw new Error("conversation_intake_text_required");
  if (normalized.length > MAX_TEXT_LENGTH) {
    throw new Error("conversation_intake_text_too_large");
  }
  return normalized;
}

function normalizeSourceId(value: string): string {
  const normalized = value.trim();
  if (!ALLOWED_SOURCE_ID.test(normalized) || normalized.includes("..")) {
    throw new Error("conversation_intake_source_id_invalid");
  }
  return normalized;
}

function normalizeDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) throw new Error("conversation_intake_source_date_invalid");
  return new Date(timestamp).toISOString();
}

function sourceFingerprint(input: {
  sourceKind: PantavionConversationSourceKind;
  sourceId: string;
  sourceDate: string | null;
  sourceThreadTitle: string | null;
  text: string;
}): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        sourceKind: input.sourceKind,
        sourceId: input.sourceId,
        sourceDate: input.sourceDate,
        sourceThreadTitle: input.sourceThreadTitle,
        text: input.text,
      }),
      "utf8",
    )
    .digest("hex");
}

function targetForDomains(domains: PantavionConversationDomain[]): PantavionAutonomousBuildTarget {
  if (domains.includes("translation") || domains.includes("voice")) return "translation";
  if (
    domains.includes("social") ||
    domains.includes("people") ||
    domains.includes("chat")
  ) {
    return "social_universe";
  }
  if (domains.includes("personal_ai") || domains.includes("learning")) return "pantaai_center";
  if (domains.includes("marketplace")) return "marketplace";
  if (domains.includes("sos")) return "sos_elder";
  if (domains.includes("water")) return "water_infrastructure";
  if (domains.includes("safety") || domains.includes("security")) return "safety_system";
  return "pantavion_internal";
}

export function createPantavionConversationIntakeRecord(
  input: PantavionConversationIntakeInput,
): PantavionConversationIntakeRecord {
  const text = normalizeText(input.text);
  const sourceId = normalizeSourceId(input.sourceId);
  const sourceDate = normalizeDate(input.sourceDate);
  const sourceThreadTitle = input.sourceThreadTitle?.trim().slice(0, 240) || null;
  const domains: PantavionConversationDomain[] = Array.from(
    new Set<PantavionConversationDomain>(input.domains ?? ["general"]),
  );
  const sha256 = sourceFingerprint({
    sourceKind: input.sourceKind,
    sourceId,
    sourceDate,
    sourceThreadTitle,
    text,
  });

  return {
    marker: PANTAVION_CONVERSATION_INTAKE_MARKER,
    intakeId: `pci_${sha256.slice(0, 32)}`,
    source: {
      kind: input.sourceKind,
      id: sourceId,
      date: sourceDate,
      threadTitle: sourceThreadTitle,
      sha256,
      originalPreserved: true,
    },
    text,
    domains,
    truthState: input.truthState ?? "RECOVERED_ONLY",
    implementationState: input.implementationState ?? "UNCLASSIFIED",
    canonicalReferences: uniqueTrimmed(input.canonicalReferences, MAX_REFERENCE_COUNT),
    notes: uniqueTrimmed(input.notes, MAX_NOTE_COUNT),
    authority: {
      directExecutionAllowed: false,
      productionAuthority: false,
      workOrderPromotionRequired: true,
      founderGateRequired: true,
      truthBoundary:
        "Conversation recovery is evidence and intent, not deployment authority. Promotion must enter the founder-gated Pantavion work-order, security, Foundry, durable-execution and verification path.",
    },
  };
}

function boundedFounderIntent(record: PantavionConversationIntakeRecord): string {
  const header = [
    `Recovered Pantavion conversation intake: ${record.intakeId}`,
    `Source: ${record.source.kind}:${record.source.id}`,
    record.source.date ? `Source date: ${record.source.date}` : null,
    record.source.threadTitle ? `Thread: ${record.source.threadTitle}` : null,
    `Domains: ${record.domains.join(", ")}`,
    `Recovered truth: ${record.truthState}`,
    `Known implementation state: ${record.implementationState}`,
    `Source SHA-256: ${record.source.sha256}`,
    "Execute only after comparing this recovered intent with current canonical code/recovery evidence. Preserve newer verified decisions and fail closed on conflicts.",
    "",
  ]
    .filter((value): value is string => Boolean(value))
    .join("\n");

  return `${header}${record.text}`.slice(0, 6000);
}

export function createPantavionConversationWorkOrderCandidate(
  record: PantavionConversationIntakeRecord,
): PantavionConversationWorkOrderCandidate {
  return {
    marker: "pantavion_conversation_work_order_candidate_v1",
    intakeId: record.intakeId,
    submission: {
      idempotencyKey: `conversation:${record.source.sha256.slice(0, 40)}`,
      founderIntent: boundedFounderIntent(record),
      target: targetForDomains(record.domains),
      capabilities: [
        "repo_truth",
        "code_audit",
        "verification",
        "founder_approval_gate",
      ],
      targetFiles: [],
      approvalScope: "proposal_only",
      workload: {
        kind: "single_work_order",
        unitCount: 1,
        intakeReference: record.intakeId,
      },
    },
    authority: {
      directExecutionAllowed: false,
      approvalScope: "proposal_only",
      reason:
        "Recovered conversation material enters Pantavion as a bounded founder work-order candidate; it cannot directly patch, deploy, mutate production data, or bypass security/truth gates.",
    },
  };
}
