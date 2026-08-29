import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  persistPantavionFounderWorkOrder,
  type PantavionFounderApprovalScope,
  type PantavionFounderWorkOrderSubmission,
} from "./pantavion-work-order-runtime";
import type {
  PantavionAutonomousBuilderCapability,
  PantavionAutonomousBuildTarget,
} from "./pantavion-autonomous-builder-kernel";
import type { PantavionFoundryWorkloadRequest } from "./pantavion-foundry-workload-planner";

const TARGETS = new Set<PantavionAutonomousBuildTarget>([
  "pantavion_internal",
  "external_app",
  "api_integration",
  "admin_tool",
  "safety_system",
  "water_infrastructure",
  "sos_elder",
  "translation",
  "marketplace",
  "social_universe",
  "pantaai_center",
]);

const CAPABILITIES = new Set<PantavionAutonomousBuilderCapability>([
  "repo_truth",
  "code_audit",
  "error_repair",
  "scoped_patch",
  "internal_feature_build",
  "external_app_build",
  "provider_integration",
  "deployment_plan",
  "founder_approval_gate",
  "verification",
]);

const APPROVAL_SCOPES = new Set<PantavionFounderApprovalScope>([
  "proposal_only",
  "scoped_draft_patch",
]);

export interface PantavionFounderCanonicalStateRecord {
  stateId: string;
  stateKind: string;
  title: string;
  content: string;
  contentSha256: string;
  sourceRef: string | null;
  truthState: string;
  status: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface PantavionFounderExecutionIntentRecord {
  intentId: string;
  canonicalStateId: string;
  idempotencyKey: string;
  title: string;
  founderIntent: string;
  target: string;
  capabilities: string[];
  targetFiles: string[];
  approvalScope: string;
  workload: unknown;
  status: string;
  workOrderExecutionId: string | null;
  lastError: string | null;
  materializedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PantavionCanonicalIntentMaterializationReport {
  marker: "pantavion_canonical_execution_intent_materialization_v1";
  status: "operational" | "degraded" | "blocked";
  scanned: number;
  materialized: number;
  deduplicated: number;
  blocked: number;
  reclaimedStaleMaterializing: number;
  executionIds: string[];
  issues: string[];
  checkedAt: string;
}

type CanonicalStateRow = {
  state_id: string;
  state_kind: string;
  title: string;
  content: string;
  content_sha256: string;
  source_ref: string | null;
  truth_state: string;
  status: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

type ExecutionIntentRow = {
  intent_id: string;
  canonical_state_id: string;
  idempotency_key: string;
  title: string;
  founder_intent: string;
  target: string;
  capabilities: string[] | null;
  target_files: string[] | null;
  approval_scope: string;
  workload: unknown;
  status: string;
  work_order_execution_id: string | null;
  last_error: string | null;
  materialized_at: string | null;
  created_at: string;
  updated_at: string;
};

function mapCanonicalState(row: CanonicalStateRow): PantavionFounderCanonicalStateRecord {
  return {
    stateId: row.state_id,
    stateKind: row.state_kind,
    title: row.title,
    content: row.content,
    contentSha256: row.content_sha256,
    sourceRef: row.source_ref,
    truthState: row.truth_state,
    status: row.status,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapExecutionIntent(row: ExecutionIntentRow): PantavionFounderExecutionIntentRecord {
  return {
    intentId: row.intent_id,
    canonicalStateId: row.canonical_state_id,
    idempotencyKey: row.idempotency_key,
    title: row.title,
    founderIntent: row.founder_intent,
    target: row.target,
    capabilities: row.capabilities ?? [],
    targetFiles: row.target_files ?? [],
    approvalScope: row.approval_scope,
    workload: row.workload,
    status: row.status,
    workOrderExecutionId: row.work_order_execution_id,
    lastError: row.last_error,
    materializedAt: row.materialized_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseWorkload(value: unknown): PantavionFoundryWorkloadRequest | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const candidate = value as Record<string, unknown>;
  const kind = candidate.kind;
  if (kind !== "single_work_order" && kind !== "recovery_excavation") return undefined;

  const unitCount = typeof candidate.unitCount === "number" ? candidate.unitCount : undefined;
  const batchSize = typeof candidate.batchSize === "number" ? candidate.batchSize : undefined;
  const intakeReference = typeof candidate.intakeReference === "string"
    ? candidate.intakeReference.trim()
    : undefined;

  if (unitCount !== undefined && (!Number.isInteger(unitCount) || unitCount < 1 || unitCount > 100_000)) {
    return undefined;
  }
  if (batchSize !== undefined && (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 1_000)) {
    return undefined;
  }
  if (kind === "single_work_order" && unitCount !== undefined && unitCount !== 1) return undefined;
  if (kind === "recovery_excavation" && unitCount === undefined) return undefined;

  return {
    kind,
    ...(unitCount !== undefined ? { unitCount } : {}),
    ...(batchSize !== undefined ? { batchSize } : {}),
    ...(intakeReference ? { intakeReference } : {}),
  };
}

function submissionFromIntent(row: ExecutionIntentRow): PantavionFounderWorkOrderSubmission | null {
  if (!TARGETS.has(row.target as PantavionAutonomousBuildTarget)) return null;
  if (!APPROVAL_SCOPES.has(row.approval_scope as PantavionFounderApprovalScope)) return null;

  const capabilities = row.capabilities ?? [];
  if (!capabilities.every((value) => CAPABILITIES.has(value as PantavionAutonomousBuilderCapability))) {
    return null;
  }

  const workload = parseWorkload(row.workload);
  if (row.workload != null && !workload) return null;

  return {
    idempotencyKey: row.idempotency_key,
    founderIntent: row.founder_intent,
    target: row.target as PantavionAutonomousBuildTarget,
    capabilities: capabilities as PantavionAutonomousBuilderCapability[],
    targetFiles: row.target_files ?? [],
    approvalScope: row.approval_scope as PantavionFounderApprovalScope,
    ...(workload ? { workload } : {}),
  };
}

function safeIssue(error: unknown): string {
  const message = error instanceof Error ? error.message : "unknown_error";
  return message.replace(/[^a-zA-Z0-9_.:-]/g, "_").slice(0, 160) || "unknown_error";
}

export async function listPantavionFounderCanonicalStates(limit = 10) {
  const admin = createAdminClient();
  const bounded = Math.max(1, Math.min(limit, 50));
  const { data, error } = await admin
    .from("pantavion_founder_canonical_states")
    .select("state_id,state_kind,title,content,content_sha256,source_ref,truth_state,status,metadata,created_at,updated_at")
    .order("created_at", { ascending: false })
    .limit(bounded);

  if (error) throw error;
  return ((data ?? []) as CanonicalStateRow[]).map(mapCanonicalState);
}

export async function listPantavionFounderExecutionIntents(limit = 100) {
  const admin = createAdminClient();
  const bounded = Math.max(1, Math.min(limit, 250));
  const { data, error } = await admin
    .from("pantavion_founder_execution_intents")
    .select("intent_id,canonical_state_id,idempotency_key,title,founder_intent,target,capabilities,target_files,approval_scope,workload,status,work_order_execution_id,last_error,materialized_at,created_at,updated_at")
    .order("created_at", { ascending: true })
    .limit(bounded);

  if (error) throw error;
  return ((data ?? []) as ExecutionIntentRow[]).map(mapExecutionIntent);
}

/**
 * Materializes private founder execution intents through the canonical
 * Pantavion work-order constructor. This prevents conversation notes or raw
 * database rows from becoming an alternate execution system.
 */
export async function materializePantavionFounderExecutionIntents(
  limit = 20,
): Promise<PantavionCanonicalIntentMaterializationReport> {
  const admin = createAdminClient();
  const checkedAt = new Date().toISOString();
  const bounded = Math.max(1, Math.min(limit, 50));
  const staleBefore = new Date(Date.now() - 15 * 60_000).toISOString();

  const { data: reclaimed, error: reclaimError } = await admin
    .from("pantavion_founder_execution_intents")
    .update({
      status: "pending_materialization",
      last_error: "materialization_lease_expired",
      updated_at: checkedAt,
    })
    .eq("status", "materializing")
    .lt("updated_at", staleBefore)
    .select("intent_id");

  if (reclaimError) {
    return {
      marker: "pantavion_canonical_execution_intent_materialization_v1",
      status: "blocked",
      scanned: 0,
      materialized: 0,
      deduplicated: 0,
      blocked: 0,
      reclaimedStaleMaterializing: 0,
      executionIds: [],
      issues: ["execution_intent_reclaim_failed"],
      checkedAt,
    };
  }

  const { data, error } = await admin
    .from("pantavion_founder_execution_intents")
    .select("intent_id,canonical_state_id,idempotency_key,title,founder_intent,target,capabilities,target_files,approval_scope,workload,status,work_order_execution_id,last_error,materialized_at,created_at,updated_at")
    .eq("status", "pending_materialization")
    .order("created_at", { ascending: true })
    .limit(bounded);

  if (error) {
    return {
      marker: "pantavion_canonical_execution_intent_materialization_v1",
      status: "blocked",
      scanned: 0,
      materialized: 0,
      deduplicated: 0,
      blocked: 0,
      reclaimedStaleMaterializing: reclaimed?.length ?? 0,
      executionIds: [],
      issues: ["execution_intent_list_failed"],
      checkedAt,
    };
  }

  const rows = (data ?? []) as ExecutionIntentRow[];
  let materialized = 0;
  let deduplicated = 0;
  let blocked = 0;
  const executionIds: string[] = [];
  const issues: string[] = [];

  for (const row of rows) {
    const submission = submissionFromIntent(row);
    if (!submission) {
      blocked += 1;
      issues.push(`invalid_intent:${row.intent_id}`);
      await admin
        .from("pantavion_founder_execution_intents")
        .update({
          status: "blocked",
          last_error: "invalid_canonical_execution_intent",
          updated_at: new Date().toISOString(),
        })
        .eq("intent_id", row.intent_id)
        .eq("status", "pending_materialization");
      continue;
    }

    const claimAt = new Date().toISOString();
    const { data: claimed, error: claimError } = await admin
      .from("pantavion_founder_execution_intents")
      .update({ status: "materializing", last_error: null, updated_at: claimAt })
      .eq("intent_id", row.intent_id)
      .eq("status", "pending_materialization")
      .select("intent_id")
      .maybeSingle();

    if (claimError || !claimed) continue;

    try {
      const persisted = await persistPantavionFounderWorkOrder(submission);
      const materializedAt = new Date().toISOString();
      const { error: finishError } = await admin
        .from("pantavion_founder_execution_intents")
        .update({
          status: "materialized",
          work_order_execution_id: persisted.execution.executionId,
          last_error: null,
          materialized_at: materializedAt,
          updated_at: materializedAt,
        })
        .eq("intent_id", row.intent_id)
        .eq("status", "materializing");

      if (finishError) {
        blocked += 1;
        issues.push(`materialization_state_update_failed:${row.intent_id}`);
        continue;
      }

      materialized += 1;
      if (persisted.deduplicated) deduplicated += 1;
      executionIds.push(persisted.execution.executionId);
    } catch (error) {
      blocked += 1;
      const issue = safeIssue(error);
      issues.push(`${row.intent_id}:${issue}`);
      await admin
        .from("pantavion_founder_execution_intents")
        .update({
          status: "blocked",
          last_error: issue,
          updated_at: new Date().toISOString(),
        })
        .eq("intent_id", row.intent_id)
        .eq("status", "materializing");
    }
  }

  return {
    marker: "pantavion_canonical_execution_intent_materialization_v1",
    status: blocked > 0 ? "degraded" : "operational",
    scanned: rows.length,
    materialized,
    deduplicated,
    blocked,
    reclaimedStaleMaterializing: reclaimed?.length ?? 0,
    executionIds,
    issues,
    checkedAt,
  };
}
