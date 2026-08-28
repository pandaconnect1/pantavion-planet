import { NextResponse } from "next/server";

import {
  createPantavionKernelAccessDeniedReport,
  isPantavionKernelFounderRequestAllowed,
} from "@/core/kernel/kernel-access-guard";
import { persistPantavionFounderWorkOrder } from "@/core/kernel/pantavion-work-order-runtime";
import {
  createPantavionConversationIntakeRecord,
  createPantavionConversationWorkOrderCandidate,
  type PantavionConversationDomain,
  type PantavionConversationImplementationState,
  type PantavionConversationSourceKind,
  type PantavionConversationTruthState,
} from "@/core/intake/pantavion-conversation-intake";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SOURCE_KINDS = [
  "chat_thread",
  "handoff",
  "memory_recovery",
  "uploaded_export",
  "repo_recovery",
] as const satisfies readonly PantavionConversationSourceKind[];

const DOMAINS = [
  "personal_ai",
  "translation",
  "people",
  "chat",
  "social",
  "voice",
  "learning",
  "marketplace",
  "sos",
  "safety",
  "security",
  "kernel",
  "recovery",
  "water",
  "governance",
  "billing",
  "experience",
  "general",
] as const satisfies readonly PantavionConversationDomain[];

const TRUTH_STATES = [
  "RECOVERED_ONLY",
  "CANDIDATE",
  "CONFLICT",
  "HOLD",
  "CANONICAL_EXISTING",
] as const satisfies readonly PantavionConversationTruthState[];

const IMPLEMENTATION_STATES = [
  "UNCLASSIFIED",
  "SPEC_ONLY",
  "CODED",
  "TESTED",
  "MERGED",
  "DEPLOYED",
  "VERIFIED_LIVE",
] as const satisfies readonly PantavionConversationImplementationState[];

function noStore(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function denied() {
  return noStore(
    NextResponse.json(createPantavionKernelAccessDeniedReport(), { status: 404 }),
  );
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function stringList(value: unknown, max: number): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length > max) return undefined;
  if (!value.every((item) => typeof item === "string")) return undefined;
  return value.map((item) => item.trim()).filter(Boolean);
}

function parsePayload(body: Record<string, unknown>) {
  const sourceKind = typeof body.sourceKind === "string" ? body.sourceKind : "";
  const sourceId = typeof body.sourceId === "string" ? body.sourceId : "";
  const sourceDate =
    body.sourceDate === null || typeof body.sourceDate === "string"
      ? body.sourceDate
      : undefined;
  const sourceThreadTitle =
    body.sourceThreadTitle === null || typeof body.sourceThreadTitle === "string"
      ? body.sourceThreadTitle
      : undefined;
  const text = typeof body.text === "string" ? body.text : "";
  const rawDomains = stringList(body.domains, 18);
  const canonicalReferences = stringList(body.canonicalReferences, 80);
  const notes = stringList(body.notes, 80);
  const truthState = typeof body.truthState === "string" ? body.truthState : undefined;
  const implementationState =
    typeof body.implementationState === "string" ? body.implementationState : undefined;
  const mode = body.mode === "promote_work_order" ? "promote_work_order" : "intake_only";

  if (!SOURCE_KINDS.includes(sourceKind as PantavionConversationSourceKind)) {
    throw new Error("conversation_intake_source_kind_invalid");
  }
  if (!sourceId.trim()) throw new Error("conversation_intake_source_id_required");
  if (!text.trim()) throw new Error("conversation_intake_text_required");
  if (body.domains !== undefined && !rawDomains) {
    throw new Error("conversation_intake_domains_invalid");
  }
  if (
    rawDomains &&
    !rawDomains.every((domain) => DOMAINS.includes(domain as PantavionConversationDomain))
  ) {
    throw new Error("conversation_intake_domain_unknown");
  }
  if (body.canonicalReferences !== undefined && !canonicalReferences) {
    throw new Error("conversation_intake_references_invalid");
  }
  if (body.notes !== undefined && !notes) {
    throw new Error("conversation_intake_notes_invalid");
  }
  if (
    truthState !== undefined &&
    !TRUTH_STATES.includes(truthState as PantavionConversationTruthState)
  ) {
    throw new Error("conversation_intake_truth_state_invalid");
  }
  if (
    implementationState !== undefined &&
    !IMPLEMENTATION_STATES.includes(
      implementationState as PantavionConversationImplementationState,
    )
  ) {
    throw new Error("conversation_intake_implementation_state_invalid");
  }

  return {
    input: {
      sourceKind: sourceKind as PantavionConversationSourceKind,
      sourceId,
      sourceDate,
      sourceThreadTitle,
      text,
      domains: (rawDomains ?? ["general"]) as PantavionConversationDomain[],
      truthState: truthState as PantavionConversationTruthState | undefined,
      implementationState:
        implementationState as PantavionConversationImplementationState | undefined,
      canonicalReferences,
      notes,
    },
    mode,
  } as const;
}

function safeError(error: unknown) {
  const marker = error instanceof Error ? error.message : "conversation_intake_error";
  const safeMarkers = new Set([
    "conversation_intake_source_kind_invalid",
    "conversation_intake_source_id_required",
    "conversation_intake_source_id_invalid",
    "conversation_intake_source_date_invalid",
    "conversation_intake_text_required",
    "conversation_intake_text_too_large",
    "conversation_intake_domains_invalid",
    "conversation_intake_domain_unknown",
    "conversation_intake_references_invalid",
    "conversation_intake_notes_invalid",
    "conversation_intake_truth_state_invalid",
    "conversation_intake_implementation_state_invalid",
    "durable_execution_runtime_unavailable",
    "idempotency_key_used_by_another_task",
  ]);
  return safeMarkers.has(marker) ? marker : "conversation_intake_error";
}

export async function POST(request: Request) {
  if (!(await isPantavionKernelFounderRequestAllowed(request))) return denied();

  try {
    const body = asRecord(await request.json());
    if (!body) {
      return noStore(
        NextResponse.json(
          { ok: false, status: "invalid", reason: "json_object_required" },
          { status: 400 },
        ),
      );
    }

    const parsed = parsePayload(body);
    const intake = createPantavionConversationIntakeRecord(parsed.input);
    const candidate = createPantavionConversationWorkOrderCandidate(intake);

    if (parsed.mode === "intake_only") {
      return noStore(
        NextResponse.json({
          ok: true,
          status: "intake_validated",
          intake,
          workOrderCandidate: candidate,
          persisted: false,
          truth:
            "The recovered conversation item is validated and classified as Pantavion intake evidence. It has not been persisted as executable work yet.",
        }),
      );
    }

    const persisted = await persistPantavionFounderWorkOrder(candidate.submission);

    return noStore(
      NextResponse.json({
        ok: true,
        status: "work_order_persisted",
        intake,
        workOrderCandidate: candidate,
        persisted: true,
        execution: {
          executionId: persisted.execution.executionId,
          executionStatus: persisted.execution.status,
          workOrderId: persisted.workOrder.id,
          deduplicated: persisted.deduplicated,
          approvalScope: candidate.authority.approvalScope,
        },
        truth:
          "The conversation item entered the Pantavion durable work-order pipeline. Persisted does not mean executed, merged, deployed, or VERIFIED_LIVE.",
      }),
    );
  } catch (error) {
    const reason = safeError(error);
    const status = reason === "durable_execution_runtime_unavailable" ? 503 : 400;
    return noStore(
      NextResponse.json({ ok: false, status: "blocked", reason }, { status }),
    );
  }
}
