import { createAdminClient } from "@/lib/supabase/admin";

export type OwnerDecisionStatus = "pending" | "approved" | "rejected";
export type OwnerDecisionCategory =
  | "security"
  | "privacy"
  | "legal"
  | "deployment"
  | "agent"
  | "data"
  | "product"
  | "moderation"
  | "billing"
  | "infrastructure"
  | "other";
export type OwnerDecisionSeverity = "low" | "medium" | "high" | "critical";

export type OwnerDecisionItem = {
  id: string;
  owner_user_id: string;
  category: OwnerDecisionCategory;
  severity: OwnerDecisionSeverity;
  title: string;
  summary: string;
  details: Record<string, unknown>;
  source: string;
  recommended_action: string | null;
  status: OwnerDecisionStatus;
  decision_note: string | null;
  created_at: string;
  updated_at: string;
  decided_at: string | null;
};

export function requireFounderIdentity(userId: string) {
  const founderUserId = process.env.PANTAVION_FOUNDER_USER_ID?.trim();
  if (!founderUserId) throw new Error("founder_identity_not_configured");
  if (userId !== founderUserId) throw new Error("founder_only");
  return founderUserId;
}

export async function listOwnerDecisionItems(ownerUserId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("owner_decision_queue")
    .select("id,owner_user_id,category,severity,title,summary,details,source,recommended_action,status,decision_note,created_at,updated_at,decided_at")
    .eq("owner_user_id", ownerUserId)
    .order("status", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) throw new Error(`owner_decision_list_failed:${error.message}`);
  return (data ?? []) as OwnerDecisionItem[];
}

export async function decideOwnerItem(params: {
  ownerUserId: string;
  id: string;
  decision: "approved" | "rejected";
  note?: string | null;
}) {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("owner_decision_queue")
    .update({
      status: params.decision,
      decision_note: params.note?.trim().slice(0, 2000) || null,
      decided_at: now,
      updated_at: now,
    })
    .eq("id", params.id)
    .eq("owner_user_id", params.ownerUserId)
    .eq("status", "pending")
    .select("id,status,decided_at")
    .maybeSingle();

  if (error) throw new Error(`owner_decision_update_failed:${error.message}`);
  if (!data) throw new Error("decision_item_not_pending_or_not_found");
  return data;
}

export async function enqueueOwnerDecision(params: {
  ownerUserId: string;
  category: OwnerDecisionCategory;
  severity?: OwnerDecisionSeverity;
  title: string;
  summary: string;
  details?: Record<string, unknown>;
  source?: string;
  recommendedAction?: string | null;
}) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("owner_decision_queue")
    .insert({
      owner_user_id: params.ownerUserId,
      category: params.category,
      severity: params.severity ?? "medium",
      title: params.title.trim().slice(0, 240),
      summary: params.summary.trim().slice(0, 4000),
      details: params.details ?? {},
      source: params.source?.trim().slice(0, 120) || "pantavion",
      recommended_action: params.recommendedAction?.trim().slice(0, 2000) || null,
    })
    .select("id,status,created_at")
    .single();

  if (error) throw new Error(`owner_decision_enqueue_failed:${error.message}`);
  return data;
}
