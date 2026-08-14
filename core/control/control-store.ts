import { createAdminClient } from "@/lib/supabase/admin";

export async function createControlRequestRecord(record: {
  requestId: string;
  actorType?: string;
  actorId?: string | null;
  rawPayload: any;
  signature?: string | null;
}) {
  const admin = createAdminClient();
  const { data, error } = await admin.from("control_requests").insert({
    request_id: record.requestId,
    actor_type: record.actorType ?? "gpt",
    actor_id: record.actorId ?? null,
    raw_payload: record.rawPayload,
    signature: record.signature ?? null,
    status: "pending",
  });
  if (error) throw error;
  return data;
}

export async function markControlRequest(requestId: string, status: string, result?: any) {
  const admin = createAdminClient();
  const { data, error } = await admin.from("control_requests").update({ status, result }).eq("request_id", requestId);
  if (error) throw error;
  return data;
}
