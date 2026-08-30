import { NextResponse } from "next/server";

import { enforcePantavionKernelPrivilegedMutationBoundary } from "@/core/kernel/kernel-privileged-mutation-boundary";

import {
  createPantavionKernelAccessDeniedReport,
  isPantavionKernelFounderRequestAllowed,
} from "@/core/kernel/kernel-access-guard";
import { persistPantavionFounderWorkOrder } from "@/core/kernel/pantavion-work-order-runtime";
import {
  createPantavionArtifactIntakeRecord,
  createPantavionArtifactWorkOrderCandidate,
  getPantavionUniversalFormatRegistrySummary,
  type PantavionArtifactSourceKind,
} from "@/core/intake/pantavion-universal-artifact-intake";
import type { PantavionConversationDomain } from "@/core/intake/pantavion-conversation-intake";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SOURCE_KINDS = [
  "device_upload",
  "storage_reference",
  "connector",
  "repo_recovery",
  "conversation_attachment",
  "archive_import",
  "legacy_media",
  "url_reference",
] as const satisfies readonly PantavionArtifactSourceKind[];

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

function safeError(error: unknown): string {
  const marker = error instanceof Error ? error.message : "artifact_intake_error";
  const allowed = new Set([
    "artifact_source_id_invalid",
    "artifact_source_date_invalid",
    "artifact_file_name_invalid",
    "artifact_size_invalid",
    "artifact_sha256_invalid",
    "artifact_sample_too_large",
    "artifact_sample_invalid",
    "artifact_source_kind_invalid",
    "artifact_domains_invalid",
    "artifact_domain_unknown",
    "artifact_notes_invalid",
    "artifact_payload_invalid",
    "durable_execution_runtime_unavailable",
    "idempotency_key_used_by_another_task",
  ]);
  return allowed.has(marker) ? marker : "artifact_intake_error";
}

export async function GET(request: Request) {
  if (!(await isPantavionKernelFounderRequestAllowed(request))) return denied();
  return noStore(
    NextResponse.json({
      ok: true,
      status: "registry_ready",
      registry: getPantavionUniversalFormatRegistrySummary(),
    }),
  );
}

export async function POST(request: Request) {
  const mutationBoundaryResponse = enforcePantavionKernelPrivilegedMutationBoundary(request);
  if (mutationBoundaryResponse) return mutationBoundaryResponse;

  if (!(await isPantavionKernelFounderRequestAllowed(request))) return denied();

  try {
    const body = asRecord(await request.json());
    if (!body) throw new Error("artifact_payload_invalid");

    const sourceKind = typeof body.sourceKind === "string" ? body.sourceKind : "";
    const sourceId = typeof body.sourceId === "string" ? body.sourceId : "";
    const fileName = typeof body.fileName === "string" ? body.fileName : "";
    const sizeBytes = typeof body.sizeBytes === "number" ? body.sizeBytes : Number.NaN;
    const mimeType = body.mimeType === null || typeof body.mimeType === "string" ? body.mimeType : undefined;
    const sha256 = body.sha256 === null || typeof body.sha256 === "string" ? body.sha256 : undefined;
    const firstBytesBase64 =
      body.firstBytesBase64 === null || typeof body.firstBytesBase64 === "string"
        ? body.firstBytesBase64
        : undefined;
    const storageReference =
      body.storageReference === null || typeof body.storageReference === "string"
        ? body.storageReference
        : undefined;
    const sourceDate = body.sourceDate === null || typeof body.sourceDate === "string" ? body.sourceDate : undefined;
    const domains = stringList(body.domains, 18);
    const notes = stringList(body.notes, 80);
    const mode = body.mode === "promote_work_order" ? "promote_work_order" : "intake_only";

    if (!SOURCE_KINDS.includes(sourceKind as PantavionArtifactSourceKind)) {
      throw new Error("artifact_source_kind_invalid");
    }
    if (!sourceId.trim() || !fileName.trim()) throw new Error("artifact_payload_invalid");
    if (body.domains !== undefined && !domains) throw new Error("artifact_domains_invalid");
    if (domains && !domains.every((domain) => DOMAINS.includes(domain as PantavionConversationDomain))) {
      throw new Error("artifact_domain_unknown");
    }
    if (body.notes !== undefined && !notes) throw new Error("artifact_notes_invalid");

    const artifact = createPantavionArtifactIntakeRecord({
      sourceKind: sourceKind as PantavionArtifactSourceKind,
      sourceId,
      fileName,
      sizeBytes,
      mimeType,
      sha256,
      firstBytesBase64,
      storageReference,
      sourceDate,
      domains: (domains ?? ["general"]) as PantavionConversationDomain[],
      notes,
    });
    const workOrderCandidate = createPantavionArtifactWorkOrderCandidate(artifact);

    if (mode === "intake_only") {
      return noStore(
        NextResponse.json({
          ok: true,
          status: "artifact_classified",
          artifact,
          workOrderCandidate,
          persisted: false,
          truth:
            "Artifact metadata/signature was classified into the Pantavion universal registry. Original bytes are not claimed stored or verified unless a storage reference and independently verified SHA-256 exist.",
        }),
      );
    }

    const persisted = await persistPantavionFounderWorkOrder(workOrderCandidate.submission);
    return noStore(
      NextResponse.json({
        ok: true,
        status: "artifact_work_order_persisted",
        artifact,
        workOrderCandidate,
        persisted: true,
        execution: {
          executionId: persisted.execution.executionId,
          executionStatus: persisted.execution.status,
          workOrderId: persisted.workOrder.id,
          deduplicated: persisted.deduplicated,
        },
        truth:
          "Artifact processing entered the durable Pantavion work-order pipeline. Persisted does not mean parsed, transformed, executed, merged, deployed or VERIFIED_LIVE.",
      }),
    );
  } catch (error) {
    const reason = safeError(error);
    return noStore(
      NextResponse.json(
        { ok: false, status: "blocked", reason },
        { status: reason === "durable_execution_runtime_unavailable" ? 503 : 400 },
      ),
    );
  }
}
