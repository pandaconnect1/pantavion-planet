import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { createHash } from "node:crypto";

const BUCKET = "personal-media";
const DWG_HEADER = "AC1032";
const ALLOWED_ORIGINS = new Set([
  "https://pantavion.com",
  "https://www.pantavion.com",
  "https://pantavion-planet-production.up.railway.app",
]);

const SOURCES = {
  "canonical-2026-andreaspap": {
    sourceKey: "canonical-2026-andreaspap",
    mapId: "B",
    canonical: true,
    fileName: "MASTER 2025_Μ_15.1.2026_ANDREASPAP-01-02-014.dwg",
    sizeBytes: 205565159,
    sha256: "6d05c02b350ed21ba8bb03632a3aa47f138fd8d7b5ff85c540ecd8b33c016f16",
    storagePath:
      "water-network-private/source-masters/map-b-original/MASTER 2025_Μ_15.1.2026_ANDREASPAP-01-02-014.dwg",
    requestId: "map-b-authentic-master-20260927-6d05c02b",
    mapRole: "map-b-authentic-master",
    versionNumber: 1,
    versionLabel: "Map B — ANDREASPAP 2026",
  },
  "legacy-george-85m": {
    sourceKey: "legacy-george-85m",
    mapId: "C",
    canonical: true,
    fileName: "GEORGE_MAP_MASTER_B_C_FINAL (4).dwg",
    sizeBytes: 85703125,
    sha256: "038b9bceda2a660296a9162723f5279e5a2d10eb18d499b087d0e8ffa393b800",
    storagePath:
      "water-network-private/source-masters/map-c-original/GEORGE_MAP_MASTER_B_C_FINAL (4).dwg",
    requestId: "map-c-authentic-master-20260927-038b9bce",
    mapRole: "map-c-authentic-master",
    versionNumber: 1,
    versionLabel: "Map C — GEORGE 85 MB",
  },
} as const;

type SourceKey = keyof typeof SOURCES;
type Actor = {
  kind: "admin_session" | "approved_device";
  ref: string;
  deviceId: string | null;
};

function corsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "https://pantavion.com";
  return {
    "access-control-allow-origin": allowedOrigin,
    "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
    "access-control-allow-methods": "POST, OPTIONS",
    "vary": "Origin",
  };
}

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(req),
      "content-type": "application/json",
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

function clean(value: unknown, max = 2000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function cleanBearer(value: string) {
  const match = /^Bearer\s+(.+)$/i.exec(value.trim());
  return match?.[1] || "";
}

function resolveSourceKey(value: unknown): SourceKey {
  return value === "legacy-george-85m"
    ? "legacy-george-85m"
    : "canonical-2026-andreaspap";
}

function adminClient() {
  const url = Deno.env.get("SUPABASE_URL") || "";
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  return createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function tryFounder(req: Request): Promise<Actor | null> {
  const authHeader = req.headers.get("Authorization") || "";
  const token = cleanBearer(authHeader);
  if (!token) return null;

  const url = Deno.env.get("SUPABASE_URL") || "";
  const anon = Deno.env.get("SUPABASE_ANON_KEY") || "";
  const supabase = createClient(url, anon, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: auth, error: authError } = await supabase.auth.getUser(token);
  if (authError || !auth?.user) return null;

  const [{ data: founder, error: founderError }, { data: assurance, error: assuranceError }] =
    await Promise.all([
      supabase.rpc("pantavion_is_active_founder"),
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    ]);

  if (
    founderError ||
    founder !== true ||
    assuranceError ||
    assurance?.currentLevel !== "aal2"
  ) return null;

  return {
    kind: "admin_session",
    ref: auth.user.id,
    deviceId: null,
  };
}

async function tryApprovedDevice(body: any): Promise<Actor | null> {
  const deviceId = clean(body?.deviceId, 500);
  const deviceToken = clean(body?.deviceToken, 2000);
  if (!deviceId || !deviceToken) return null;

  const tokenHash = createHash("sha256").update(deviceToken).digest("hex");
  const admin = adminClient();
  const { data, error } = await admin
    .from("water_approved_devices")
    .select("device_id, token_hash, status, revoked")
    .eq("device_id", deviceId)
    .eq("token_hash", tokenHash)
    .eq("status", "approved")
    .eq("revoked", false)
    .maybeSingle();

  if (error || !data) return null;

  return {
    kind: "approved_device",
    ref: deviceId,
    deviceId,
  };
}

async function authorize(req: Request, body: any): Promise<Actor | null> {
  const founder = await tryFounder(req);
  if (founder) return founder;
  return await tryApprovedDevice(body);
}

async function registryState(
  admin: ReturnType<typeof adminClient>,
  source: (typeof SOURCES)[SourceKey],
) {
  const { data, error } = await admin
    .from("water_map_ingest_catalog")
    .select("source_id, storage_path, sha256, file_size_bytes, ingest_state, review_state")
    .eq("storage_path", source.storagePath)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function verifyExactObject(
  admin: ReturnType<typeof adminClient>,
  source: (typeof SOURCES)[SourceKey],
) {
  const { data, error } = await admin.storage.from(BUCKET).createSignedUrl(source.storagePath, 180);
  if (error || !data?.signedUrl) {
    return { ok: false as const, error: "map_b_source_not_present", status: 404 };
  }

  const response = await fetch(data.signedUrl, { cache: "no-store" });
  if (!response.ok || !response.body) {
    return { ok: false as const, error: "map_b_source_read_failed", status: 502 };
  }

  const hash = createHash("sha256");
  let sizeBytes = 0;
  let headerBytes = new Uint8Array();
  const reader = response.body.getReader();

  while (true) {
    const part = await reader.read();
    if (part.done) break;
    const chunk = part.value;
    sizeBytes += chunk.byteLength;
    hash.update(chunk);

    if (headerBytes.byteLength < 6) {
      const needed = 6 - headerBytes.byteLength;
      const take = chunk.subarray(0, Math.min(needed, chunk.byteLength));
      const merged = new Uint8Array(headerBytes.byteLength + take.byteLength);
      merged.set(headerBytes, 0);
      merged.set(take, headerBytes.byteLength);
      headerBytes = merged;
    }
  }

  const sha256 = hash.digest("hex");
  const header = new TextDecoder("ascii").decode(headerBytes);
  const verified =
    sizeBytes === source.sizeBytes &&
    sha256 === source.sha256 &&
    header === DWG_HEADER;

  return {
    ok: verified as boolean,
    error: verified ? null : "map_b_verification_mismatch",
    status: verified ? 200 : 409,
    sizeBytes,
    sha256,
    header,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }
  if (req.method !== "POST") {
    return json(req, { ok: false, error: "method_not_allowed" }, 405);
  }

  const body = await req.json().catch(() => ({}));
  const actor = await authorize(req, body);
  if (!actor) {
    return json(req, { ok: false, error: "water_access_required" }, 403);
  }

  const sourceKey = resolveSourceKey(body?.sourceKey);
  const source = SOURCES[sourceKey];
  const action = typeof body?.action === "string" ? body.action : "status";
  const admin = adminClient();

  try {
    if (action === "status") {
      const registry = await registryState(admin, source);
      const { data: version, error: versionError } = await admin
        .from("water_map_versions")
        .select("version_id,status,version_number,label")
        .eq("source_fingerprint", source.sha256)
        .maybeSingle();

      if (versionError) throw versionError;

      return json(req, {
        ok: true,
        sourceKey,
        canonical: source.canonical,
        present: Boolean(registry),
        verified: Boolean(
          registry &&
            registry.sha256 === source.sha256 &&
            Number(registry.file_size_bytes) === source.sizeBytes &&
            registry.ingest_state === "ready" &&
            (registry.review_state === "trusted_admin" || registry.review_state === "approved")
        ),
        fileName: source.fileName,
        sizeBytes: source.sizeBytes,
        sha256: source.sha256,
        accessMode: actor.kind,
        versionId: version?.version_id || null,
        versionStatus: version?.status || null,
        versionNumber: version?.version_number || null,
        versionLabel: version?.label || null,
      });
    }

    if (action === "sign") {
      if (actor.kind !== "admin_session") {
        return json(req, { ok: false, error: "founder_required_for_master_upload" }, 403);
      }

      const folder = source.storagePath.slice(0, source.storagePath.lastIndexOf("/"));
      const objectName = source.storagePath.slice(source.storagePath.lastIndexOf("/") + 1);
      const { data: existing, error: listError } = await admin.storage
        .from(BUCKET)
        .list(folder, { search: objectName, limit: 10 });
      if (listError) throw listError;

      if (existing?.some((item) => item.name === objectName)) {
        return json(req, {
          ok: true,
          status: "already_present",
          sourceKey,
          canonical: source.canonical,
          bucket: BUCKET,
          path: source.storagePath,
          fileName: source.fileName,
          expectedSizeBytes: source.sizeBytes,
          expectedSha256: source.sha256,
          accessMode: actor.kind,
        });
      }

      const { data, error } = await admin.storage
        .from(BUCKET)
        .createSignedUploadUrl(source.storagePath, { upsert: false });

      if (error || !data?.token) {
        return json(req, { ok: false, error: "signed_upload_failed" }, 500);
      }

      return json(req, {
        ok: true,
        status: "ready",
        sourceKey,
        canonical: source.canonical,
        bucket: BUCKET,
        path: data.path || source.storagePath,
        token: data.token,
        fileName: source.fileName,
        expectedSizeBytes: source.sizeBytes,
        expectedSha256: source.sha256,
        accessMode: actor.kind,
      });
    }

    if (action === "verify") {
      if (actor.kind !== "admin_session") {
        return json(req, { ok: false, error: "founder_required_for_master_verify" }, 403);
      }

      const result = await verifyExactObject(admin, source);
      if (!result.ok) {
        let quarantinePath: string | null = null;

        if ("sha256" in result && result.sha256) {
          const safeStamp = new Date().toISOString().replace(/[:.]/g, "-");
          quarantinePath =
            `water-network-private/quarantine/map-b/${sourceKey}/${safeStamp}-${result.sha256}.dwg`;

          const { error: moveError } = await admin.storage
            .from(BUCKET)
            .move(source.storagePath, quarantinePath);

          if (moveError) quarantinePath = null;
        }

        return json(req, {
          ok: false,
          sourceKey,
          canonical: source.canonical,
          error: result.error,
          expectedSizeBytes: source.sizeBytes,
          actualSizeBytes: "sizeBytes" in result ? result.sizeBytes : null,
          expectedSha256: source.sha256,
          actualSha256: "sha256" in result ? result.sha256 : null,
          header: "header" in result ? result.header : null,
          quarantined: Boolean(quarantinePath),
          quarantinePath,
        }, result.status);
      }

      const now = new Date().toISOString();
      const record = {
        request_id: source.requestId,
        actor_kind: actor.kind,
        actor_ref: actor.ref,
        device_id: actor.deviceId,
        original_file_name: source.fileName,
        normalized_extension: "dwg",
        mime_type: "application/acad",
        file_size_bytes: source.sizeBytes,
        storage_bucket: BUCKET,
        storage_path: source.storagePath,
        detected_format: "dwg",
        format_family: "cad",
        adapter_state: "known_adapter",
        ingest_state: "ready",
        review_state: "trusted_admin",
        coordinate_reference_system: null,
        sha256: source.sha256,
        metadata: {
          dwgHeader: DWG_HEADER,
          mapRole: source.mapRole,
          sourceKey,
          canonicalSource: source.canonical,
          mapId: source.mapId,
          mapRole: source.mapRole,
          viewer: "mlightcad-libredwg",
          readOnly: true,
        },
        provenance: {
          ownerConfirmed: true,
          immutableSource: true,
          uploadedAt: now,
          verification: "sha256+size+dwg-header",
          accessMode: actor.kind,
          sourceKey,
        },
        updated_at: now,
      };

      const current = await registryState(admin, source);
      if (current?.source_id) {
        const { error } = await admin
          .from("water_map_ingest_catalog")
          .update(record)
          .eq("source_id", current.source_id);
        if (error) throw error;
      } else {
        const { error } = await admin
          .from("water_map_ingest_catalog")
          .insert({ source_id: crypto.randomUUID(), ...record, created_at: now });
        if (error) throw error;
      }

      const { data: existingVersion, error: versionLookupError } = await admin
        .from("water_map_versions")
        .select("version_id,status")
        .eq("source_fingerprint", source.sha256)
        .maybeSingle();

      if (versionLookupError) throw versionLookupError;

      let versionId = existingVersion?.version_id || null;

      if (!existingVersion) {
        const versionRecord = {
          map_id: source.mapId,
          source_key: sourceKey,
          version_number: source.versionNumber,
          label: source.versionLabel,
          status: "candidate",
          source_ref: `supabase://${BUCKET}/${source.storagePath}`,
          source_fingerprint: source.sha256,
          storage_bucket: BUCKET,
          storage_path: source.storagePath,
          source_date: null,
          received_by: actor.ref,
          crs_authority: null,
          crs_code: null,
          immutable_source: true,
          deleted_automatically: false,
          notes: [
            "Exact DWG bytes verified by size, SHA-256 and AC1032 header.",
            "Geographic alignment and approved-reference status remain pending separate review."
          ],
          metadata: {
            dwgHeader: DWG_HEADER,
            sourceKey,
            canonicalSource: source.canonical,
          mapId: source.mapId,
          mapRole: source.mapRole,
            byteVerified: true,
            geographicAlignmentVerified: false
          }
        };

        const { data: insertedVersion, error: versionInsertError } = await admin
          .from("water_map_versions")
          .insert(versionRecord)
          .select("version_id")
          .single();

        if (versionInsertError) throw versionInsertError;
        versionId = insertedVersion.version_id;
      }

      return json(req, {
        ok: true,
        status: `verified_exact_owner_map_${source.mapId.toLowerCase()}`,
        sourceKey,
        canonical: source.canonical,
        fileName: source.fileName,
        actualSizeBytes: result.sizeBytes,
        actualSha256: result.sha256,
        header: result.header,
        bucket: BUCKET,
        path: source.storagePath,
        accessMode: actor.kind,
        versionId,
        versionStatus: existingVersion?.status || "candidate",
      });
    }

    if (action === "download") {
      if (actor.kind !== "admin_session") {
        return json(req, {
          ok: false,
          error: "founder_required_for_raw_master_download",
          approvedUsersUseDerivedMap: true,
        }, 403);
      }

      const registry = await registryState(admin, source);
      const verified = Boolean(
        registry &&
          registry.sha256 === source.sha256 &&
          Number(registry.file_size_bytes) === source.sizeBytes &&
          registry.ingest_state === "ready" &&
          (registry.review_state === "trusted_admin" || registry.review_state === "approved")
      );

      if (!verified) {
        return json(req, { ok: false, error: "map_b_source_not_verified", sourceKey }, 409);
      }

      const { data, error } = await admin.storage
        .from(BUCKET)
        .createSignedUrl(source.storagePath, 180);

      if (error || !data?.signedUrl) {
        return json(req, { ok: false, error: "map_b_signed_download_failed", sourceKey }, 404);
      }

      return json(req, {
        ok: true,
        status: "ready",
        sourceKey,
        canonical: source.canonical,
        signedUrl: data.signedUrl,
        fileName: source.fileName,
        sizeBytes: source.sizeBytes,
        sha256: source.sha256,
        accessMode: actor.kind,
      });
    }

    return json(req, { ok: false, error: "unknown_action" }, 400);
  } catch (error) {
    return json(req, {
      ok: false,
      error: "map_b_owner_dwg_error",
      message: error instanceof Error ? error.message : "unknown_error",
    }, 500);
  }
});
