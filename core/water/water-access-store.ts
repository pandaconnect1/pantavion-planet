import { createAdminClient } from "@/lib/supabase/admin";

export type WaterAccessRequestRecord = {
  id: string;
  device_id: string;
  token_hash: string;
  first_name: string;
  last_name: string;
  title: string;
  organization: string;
  email_or_phone: string;
  reason: string;
  device_label: string;
  user_agent: string;
  status: string;
  attempt_count: number;
  created_at: string;
  updated_at: string;
  last_requested_at: string;
  decided_at?: string | null;
  decided_by?: string | null;
  revoked_device_id?: string | null;
};

export type WaterApprovedDeviceRecord = {
  device_id: string;
  token_hash: string;
  phone: string;
  first_name: string;
  last_name: string;
  title: string;
  organization: string;
  request_id?: string | null;
  approved_at: string;
  approved_by: string;
  status: string;
  revoked: boolean;
  revoked_at?: string | null;
  revoked_by?: string | null;
  updated_at: string;
};

function admin() {
  return createAdminClient();
}

export async function getWaterAccessRequest(id: string) {
  const { data, error } = await admin()
    .from("water_access_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return (data || null) as WaterAccessRequestRecord | null;
}

export async function getWaterAccessRequestByDevice(deviceId: string) {
  const { data, error } = await admin()
    .from("water_access_requests")
    .select("*")
    .eq("device_id", deviceId)
    .maybeSingle();

  if (error) throw error;
  return (data || null) as WaterAccessRequestRecord | null;
}

export async function upsertWaterAccessRequest(
  record: Omit<WaterAccessRequestRecord, "created_at"> & { created_at?: string },
) {
  const { data, error } = await admin()
    .from("water_access_requests")
    .upsert(record, { onConflict: "device_id" })
    .select("*")
    .single();

  if (error) throw error;
  return data as WaterAccessRequestRecord;
}

export async function listWaterAccessRequests(limit = 200) {
  const { data, error } = await admin()
    .from("water_access_requests")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as WaterAccessRequestRecord[];
}

export async function getWaterApprovedDevice(deviceId: string) {
  const { data, error } = await admin()
    .from("water_approved_devices")
    .select("*")
    .eq("device_id", deviceId)
    .maybeSingle();

  if (error) throw error;
  return (data || null) as WaterApprovedDeviceRecord | null;
}

export async function waterApprovedDeviceMatches(deviceId: string, tokenHash: string) {
  if (!deviceId || !tokenHash) return null;

  const record = await getWaterApprovedDevice(deviceId);
  if (!record) return null;
  if (record.revoked || record.status !== "approved") return null;
  if (record.token_hash !== tokenHash) return null;
  return record;
}

export async function upsertWaterApprovedDevice(record: WaterApprovedDeviceRecord) {
  const { data, error } = await admin()
    .from("water_approved_devices")
    .upsert(record, { onConflict: "device_id" })
    .select("*")
    .single();

  if (error) throw error;
  return data as WaterApprovedDeviceRecord;
}

export async function listWaterApprovedDevices(limit = 1000) {
  const { data, error } = await admin()
    .from("water_approved_devices")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as WaterApprovedDeviceRecord[];
}

export async function updateWaterAccessRequest(
  id: string,
  patch: Partial<WaterAccessRequestRecord>,
) {
  const { data, error } = await admin()
    .from("water_access_requests")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data as WaterAccessRequestRecord;
}

export async function appendWaterAccessAudit(input: {
  event: string;
  actor: string;
  deviceId?: string;
  requestId?: string;
  payload?: Record<string, unknown>;
}) {
  const { error } = await admin().from("water_access_audit").insert({
    event: input.event,
    actor: input.actor,
    device_id: input.deviceId || null,
    request_id: input.requestId || null,
    payload: input.payload || {},
  });

  if (error) throw error;
}
