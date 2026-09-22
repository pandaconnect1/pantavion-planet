import { createAdminClient } from "../../lib/supabase/admin.ts";
import { persistPantavionFounderWorkOrder } from "../../core/kernel/pantavion-work-order-runtime.ts";

const INTENT_ID = "vercel_phase3_20260922";

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string" && Boolean(v.trim())).map(v => v.trim())
    : [];
}

function parseWorkload(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const w = value as Record<string, unknown>;
  const kind = w.kind === "recovery_excavation" || w.kind === "single_work_order" ? w.kind : undefined;
  if (!kind) return undefined;
  const unitCount = typeof w.unitCount === "number" ? w.unitCount : undefined;
  const batchSize = typeof w.batchSize === "number" ? w.batchSize : undefined;
  const intakeReference = typeof w.intakeReference === "string" ? w.intakeReference.trim() : undefined;
  return {
    kind,
    ...(unitCount !== undefined ? { unitCount } : {}),
    ...(batchSize !== undefined ? { batchSize } : {}),
    ...(intakeReference ? { intakeReference } : {}),
  };
}

const admin = createAdminClient();

const { data: row, error: readError } = await admin
  .from("pantavion_founder_execution_intents")
  .select("intent_id,idempotency_key,founder_intent,target,capabilities,target_files,approval_scope,workload,status,work_order_execution_id")
  .eq("intent_id", INTENT_ID)
  .maybeSingle();

if (readError) throw readError;
if (!row) throw new Error("vercel_phase3_intent_missing");

if (row.status === "materialized" && row.work_order_execution_id) {
  console.log(JSON.stringify({
    marker: "pantavion_vercel_phase3_materialization_v1",
    status: "already_materialized",
    executionId: row.work_order_execution_id,
  }));
  process.exit(0);
}

if (row.status !== "pending_materialization" && row.status !== "materializing") {
  throw new Error(`vercel_phase3_intent_not_materializable:${row.status}`);
}

if (row.status === "pending_materialization") {
  const { data: claimed, error: claimError } = await admin
    .from("pantavion_founder_execution_intents")
    .update({ status: "materializing", last_error: null, updated_at: new Date().toISOString() })
    .eq("intent_id", INTENT_ID)
    .eq("status", "pending_materialization")
    .select("intent_id")
    .maybeSingle();

  if (claimError) throw claimError;
  if (!claimed) throw new Error("vercel_phase3_materialization_claim_lost");
}

try {
  const persisted = await persistPantavionFounderWorkOrder({
    idempotencyKey: String(row.idempotency_key),
    founderIntent: String(row.founder_intent),
    target: row.target as any,
    capabilities: asStringArray(row.capabilities) as any,
    targetFiles: asStringArray(row.target_files),
    approvalScope: row.approval_scope as any,
    workload: parseWorkload(row.workload) as any,
  });

  const at = new Date().toISOString();
  const { error: finishError } = await admin
    .from("pantavion_founder_execution_intents")
    .update({
      status: "materialized",
      work_order_execution_id: persisted.execution.executionId,
      last_error: null,
      materialized_at: at,
      updated_at: at,
    })
    .eq("intent_id", INTENT_ID)
    .eq("status", "materializing");

  if (finishError) throw finishError;

  console.log(JSON.stringify({
    marker: "pantavion_vercel_phase3_materialization_v1",
    status: "materialized",
    executionId: persisted.execution.executionId,
    deduplicated: persisted.deduplicated,
    workload: {
      units: persisted.workloadPlan.unitCount,
      batchSize: persisted.workloadPlan.partitionContract.batchSize,
      batchCount: persisted.workloadPlan.partitionContract.batchCount,
      kind: persisted.workloadPlan.kind,
    },
    agentFleet: {
      count: persisted.agentFleet.agents.length,
      modelRuntime: persisted.agentFleet.modelRuntime,
    },
    authority: {
      productionDeployAllowed: false,
      externalWorkerDependency: false,
    }
  }));
} catch (error) {
  const message = error instanceof Error ? error.message : "unknown_materialization_error";
  await admin
    .from("pantavion_founder_execution_intents")
    .update({
      status: "blocked",
      last_error: message.slice(0, 500),
      updated_at: new Date().toISOString(),
    })
    .eq("intent_id", INTENT_ID)
    .eq("status", "materializing");
  throw error;
}
