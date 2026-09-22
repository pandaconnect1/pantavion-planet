import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

const projectRef = process.env.SUPABASE_PROJECT_REF || "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const mode = process.argv.includes("--apply") ? "apply" : "dry-run";

if (!projectRef || !serviceKey) throw new Error("missing_supabase_recovery_credentials");

const supabase = createClient(
  `https://${projectRef}.supabase.co`,
  serviceKey,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const bucket = "vercel-recovery-private";
const priorityRoots = [
  "water/private/access-requests/",
  "water/private/approved-devices/",
  "water/private/approved-contacts/",
  "water/private/rejected-requests/",
  "water/private/revoked-devices/"
];

function clean(v) {
  return typeof v === "string" ? v.trim() : "";
}
function safeDate(v) {
  const s = clean(v);
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
function bool(v) {
  return v === true;
}
function pathnameFromRecoveredObject(name) {
  const marker = "/water/private/";
  const i = name.indexOf(marker);
  return i >= 0 ? name.slice(i + 1) : null;
}
function normalizePhone(v) {
  return clean(v).toLowerCase().replace(/[\s().-]/g, "");
}
function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

async function walk(prefix) {
  const rows = [];
  let offset = 0;
  const limit = 1000;
  while (true) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, {
      limit,
      offset,
      sortBy: { column: "name", order: "asc" }
    });
    if (error) throw error;
    const items = data || [];
    for (const item of items) {
      const full = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id) {
        rows.push(full);
      } else {
        rows.push(...await walk(full));
      }
    }
    if (items.length < limit) break;
    offset += items.length;
  }
  return rows;
}

async function readJsonObject(name) {
  const { data, error } = await supabase.storage.from(bucket).download(name);
  if (error) throw error;
  const text = await data.text();
  return { payload: JSON.parse(text), sha256: sha256(text), bytes: Buffer.byteLength(text) };
}

const allObjects = await walk("");
const waterObjects = allObjects
  .map(name => ({ name, originalPath: pathnameFromRecoveredObject(name) }))
  .filter(x => x.originalPath && priorityRoots.some(root => x.originalPath.startsWith(root)));

const requests = new Map();
const devices = new Map();
const contacts = new Map();
const evidence = [];
const errors = [];

for (const item of waterObjects) {
  try {
    const { payload, sha256: objectSha256, bytes } = await readJsonObject(item.name);
    const originalPath = item.originalPath;
    evidence.push({ originalPath, recoveryObject: item.name, sha256: objectSha256, bytes });

    if (originalPath.startsWith("water/private/access-requests/")) {
      const device = payload.device || {};
      const row = {
        id: clean(payload.id) || originalPath.split("/").pop()?.replace(/\.json$/,""),
        device_id: clean(device.id) || clean(payload.deviceId),
        token_hash: clean(device.tokenHash) || clean(payload.tokenHash),
        first_name: clean(payload.firstName),
        last_name: clean(payload.lastName),
        title: clean(payload.title) || clean(payload.roleTitle),
        organization: clean(payload.organization),
        email_or_phone: normalizePhone(payload.emailOrPhone || payload.phone),
        reason: clean(payload.reason),
        device_label: clean(device.label) || clean(payload.deviceLabel),
        user_agent: clean(device.userAgent) || clean(payload.userAgent),
        status: clean(payload.status) || "pending_founder_review",
        attempt_count: Math.max(1, Number(payload.attemptCount || 1) || 1),
        created_at: safeDate(payload.createdAt) || new Date(0).toISOString(),
        updated_at: safeDate(payload.updatedAt || payload.lastRequestedAt || payload.decidedAt) || safeDate(payload.createdAt) || new Date(0).toISOString(),
        last_requested_at: safeDate(payload.lastRequestedAt || payload.updatedAt || payload.createdAt) || new Date(0).toISOString(),
        decided_at: safeDate(payload.decidedAt || payload.approvedAt || payload.rejectedAt || payload.revokedAt),
        decided_by: clean(payload.decidedBy || payload.approvedBy || payload.rejectedBy || payload.revokedBy) || null,
        revoked_device_id: clean(payload.revokedDeviceId) || null
      };
      if (row.id && row.device_id && row.token_hash && row.first_name && row.last_name && row.title && row.email_or_phone) {
        const prior = requests.get(row.device_id);
        if (!prior || String(row.updated_at) > String(prior.updated_at)) requests.set(row.device_id,row);
      } else {
        errors.push({ originalPath, reason:"request_missing_required_fields" });
      }
      continue;
    }

    if (originalPath.startsWith("water/private/approved-devices/")) {
      const row = {
        device_id: clean(payload.deviceId) || clean(payload.device?.id) || originalPath.split("/").pop()?.replace(/\.json$/,""),
        token_hash: clean(payload.tokenHash) || clean(payload.device?.tokenHash),
        phone: normalizePhone(payload.phone || payload.emailOrPhone || payload.sourceRequest?.emailOrPhone),
        first_name: clean(payload.firstName || payload.sourceRequest?.firstName),
        last_name: clean(payload.lastName || payload.sourceRequest?.lastName),
        title: clean(payload.title || payload.roleTitle || payload.sourceRequest?.title),
        organization: clean(payload.organization || payload.sourceRequest?.organization),
        request_id: clean(payload.requestId) || null,
        approved_at: safeDate(payload.approvedAt) || new Date(0).toISOString(),
        approved_by: clean(payload.approvedBy) || "pantavion-founder",
        status: clean(payload.status) || (bool(payload.revoked) ? "revoked" : "approved"),
        revoked: bool(payload.revoked) || clean(payload.status).toLowerCase()==="revoked",
        revoked_at: safeDate(payload.revokedAt),
        revoked_by: clean(payload.revokedBy) || null,
        updated_at: safeDate(payload.updatedAt || payload.revokedAt || payload.approvedAt) || new Date(0).toISOString()
      };
      if (row.device_id && row.token_hash) {
        const prior = devices.get(row.device_id);
        if (!prior || String(row.updated_at) > String(prior.updated_at)) devices.set(row.device_id,row);
      } else {
        errors.push({ originalPath, reason:"approved_device_missing_required_fields" });
      }
      continue;
    }

    if (originalPath.startsWith("water/private/approved-contacts/")) {
      const phone = normalizePhone(payload.phone) || normalizePhone(originalPath.split("/").pop()?.replace(/\.json$/,""));
      if (phone) contacts.set(phone,{
        phone,
        first_name:clean(payload.firstName),
        last_name:clean(payload.lastName),
        title:clean(payload.title || payload.roleTitle),
        organization:clean(payload.organization),
        last_approved_device_id:clean(payload.lastApprovedDeviceId),
        request_id:clean(payload.requestId),
        approved_at:safeDate(payload.approvedAt),
        status:clean(payload.status) || "approved"
      });
      continue;
    }
  } catch (error) {
    errors.push({ originalPath:item.originalPath, reason:String(error?.message || error).slice(0,300) });
  }
}

const summary = {
  marker:"pantavion_water_access_recovery_import_v1",
  mode,
  bucket,
  recoveredWaterObjects:waterObjects.length,
  requestsReady:requests.size,
  approvedDevicesReady:devices.size,
  approvedContactsObserved:contacts.size,
  parseOrValidationErrors:errors.length,
  zeroDelete:true,
  evidenceOnlyUntilApply: mode !== "apply"
};

if (mode === "apply") {
  const requestRows=[...requests.values()];
  const deviceRows=[...devices.values()];
  if (requestRows.length) {
    const { error } = await supabase.from("water_access_requests").upsert(requestRows,{onConflict:"device_id"});
    if (error) throw error;
  }
  if (deviceRows.length) {
    const { error } = await supabase.from("water_approved_devices").upsert(deviceRows,{onConflict:"device_id"});
    if (error) throw error;
  }

  const auditRows = evidence.map(e => ({
    event:"recovered_from_vercel_blob",
    device_id:null,
    request_id:null,
    actor:"pantavion-recovery",
    payload:{
      source:"vercel_blob_recovery",
      original_path:e.originalPath,
      recovery_object:e.recoveryObject,
      sha256:e.sha256,
      bytes:e.bytes,
      privacy:"protected_water_access_state"
    }
  }));
  if (auditRows.length) {
    const { error } = await supabase.from("water_access_audit").insert(auditRows);
    if (error) throw error;
  }
}

console.log(JSON.stringify({summary,errors:errors.slice(0,100)},null,2));
