import { list } from "@vercel/blob";

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


type LegacyBlob = {
  pathname: string;
  url?: string;
  downloadUrl?: string;
};

function legacyBlobToken() {
  return process.env.BLOB_READ_WRITE_TOKEN?.trim() || "";
}

async function readLegacyApprovedDevice(deviceId: string) {
  const token = legacyBlobToken();
  if (!token || !deviceId) return null;

  const pathname = `water/private/approved-devices/${deviceId}.json`;
  const result = await Promise.race([
    list({
      prefix: pathname,
      limit: 1,
      token,
    }),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("legacy_blob_timeout")), 5000);
    }),
  ]);

  const blob = (result.blobs as LegacyBlob[]).find(
    (item) => item.pathname === pathname,
  );
  if (!blob) return null;

  const url = blob.downloadUrl || blob.url;
  if (!url) return null;

  const response = await fetch(url, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) return null;
  return (await response.json()) as Record<string, unknown>;
}

function legacyString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function migrateLegacyApprovedDeviceIfPresent(
  deviceId: string,
  tokenHash: string,
) {
  if (!deviceId || !tokenHash) return null;

  // Primary path: the approval has already been migrated to Supabase.
  try {
    const current = await waterApprovedDeviceMatches(deviceId, tokenHash);
    if (current) return current;
  } catch {
    // Continuity rule: an unavailable Supabase admin credential must not
    // invalidate a previously approved device while the migration is in flight.
  }

  // Continuity fallback: validate the exact pre-existing approval in the old
  // private Blob store. This does not approve any new device.
  let legacy: Record<string, unknown> | null = null;

  try {
    legacy = await readLegacyApprovedDevice(deviceId);
  } catch {
    // Railway must never hang while a legacy Vercel Blob lookup is unavailable.
    // Existing Supabase approvals still work; legacy migration can be retried later.
    return null;
  }

  if (!legacy) return null;

  const legacyStatus = legacyString(legacy.status) || "approved";
  const legacyRevoked = legacy.revoked === true;
  const legacyTokenHash =
    legacyString(legacy.tokenHash) ||
    legacyString((legacy.device as Record<string, unknown> | undefined)?.tokenHash);

  if (
    legacyStatus !== "approved" ||
    legacyRevoked ||
    !legacyTokenHash ||
    legacyTokenHash !== tokenHash
  ) {
    return null;
  }

  const now = new Date().toISOString();
  const candidate: WaterApprovedDeviceRecord = {
    device_id: deviceId,
    token_hash: legacyTokenHash,
    phone: legacyString(legacy.phone) || legacyString(legacy.emailOrPhone),
    first_name: legacyString(legacy.firstName),
    last_name: legacyString(legacy.lastName),
    title: legacyString(legacy.title) || legacyString(legacy.roleTitle),
    organization: legacyString(legacy.organization),
    request_id: legacyString(legacy.requestId) || null,
    approved_at: legacyString(legacy.approvedAt) || now,
    approved_by: legacyString(legacy.approvedBy) || "legacy-vercel-blob",
    status: "approved",
    revoked: false,
    revoked_at: null,
    revoked_by: null,
    updated_at: now,
  };

  // Best-effort migration. Access continuity is based on the already-existing
  // legacy approval + matching device token, never on a new implicit approval.
  try {
    const imported = await upsertWaterApprovedDevice(candidate);

    await appendWaterAccessAudit({
      event: "legacy_approval_imported",
      actor: "pantavion-migration",
      deviceId,
      requestId: imported.request_id || undefined,
      payload: { source: "vercel-blob", target: "supabase" },
    });

    return imported;
  } catch {
    return candidate;
  }
}
