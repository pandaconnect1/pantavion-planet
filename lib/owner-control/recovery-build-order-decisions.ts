import { createAdminClient } from "@/lib/supabase/admin";
import type { RecoveryBuildOwnerDecisionReceipt } from "@/core/recovery/pantavion-recovery-owner-decision";

export type StoredRecoveryBuildOwnerDecision = {
  id: string;
  build_order_id: string;
  readiness_digest: string;
  decision: "approve_scoped_implementation" | "reject";
  receipt_digest: string;
  decided_at: string;
  created_at: string;
};

export async function recordRecoveryBuildOwnerDecision(
  receipt: RecoveryBuildOwnerDecisionReceipt,
) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("owner_recovery_build_decisions")
    .insert({
      owner_user_id: receipt.ownerUserId,
      build_order_id: receipt.buildOrderId,
      build_order_digest: receipt.buildOrderDigest,
      readiness_digest: receipt.readinessDigest,
      readiness_index_digest: receipt.readinessIndexDigest,
      decision: receipt.decision,
      decision_scope: receipt.decisionScope,
      note: receipt.note,
      assurance_level: receipt.assuranceLevel,
      source_implementation_state: receipt.sourceImplementationState,
      next_permitted_lifecycle_state: receipt.nextPermittedLifecycleState,
      decided_at: receipt.decidedAt,
      receipt_digest: receipt.receiptDigest,
      receipt_payload: receipt,
    })
    .select("id,build_order_id,readiness_digest,decision,receipt_digest,decided_at,created_at")
    .single();

  if (error) {
    if (error.code === "23505") throw new Error("recovery_build_decision_already_recorded");
    throw new Error(`recovery_build_decision_record_failed:${error.message}`);
  }
  return data as StoredRecoveryBuildOwnerDecision;
}

export async function listRecoveryBuildOwnerDecisions(ownerUserId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("owner_recovery_build_decisions")
    .select("id,build_order_id,readiness_digest,decision,receipt_digest,decided_at,created_at")
    .eq("owner_user_id", ownerUserId)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) throw new Error(`recovery_build_decision_list_failed:${error.message}`);
  return (data ?? []) as StoredRecoveryBuildOwnerDecision[];
}
