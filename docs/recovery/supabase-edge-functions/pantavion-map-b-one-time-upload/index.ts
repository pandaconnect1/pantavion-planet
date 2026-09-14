import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const BUCKET = "personal-media";
const PATH = "water-network-private/source-masters/map-b-original/MASTER 2025_Μ_15.1.2026_ANDREASPAP-01-02-014.dwg";
const EXPECTED_SIZE = 205565159;
const EXPECTED_SHA256 = "6d05c02b350ed21ba8bb03632a3aa47f138fd8d7b5ff85c540ecd8b33c016f16";
const ALLOWED_ORIGINS = new Set(["https://www.pantavion.com", "https://pantavion.com"]);

function cors(origin: string) {
  const allowed = ALLOWED_ORIGINS.has(origin) ? origin : "https://pantavion.com";
  return {
    "access-control-allow-origin": allowed,
    "access-control-allow-methods": "POST,OPTIONS",
    "access-control-allow-headers": "content-type",
    "vary": "Origin",
    "cache-control": "no-store",
  };
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin") || "";
  const headers = cors(origin);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method !== "POST") return new Response(JSON.stringify({ ok: false, status: "method_not_allowed" }), { status: 405, headers: { ...headers, "content-type": "application/json" } });
  if (!ALLOWED_ORIGINS.has(origin)) return new Response(JSON.stringify({ ok: false, status: "origin_not_allowed" }), { status: 403, headers: { ...headers, "content-type": "application/json" } });

  const url = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRoleKey) return new Response(JSON.stringify({ ok: false, status: "supabase_runtime_not_configured" }), { status: 500, headers: { ...headers, "content-type": "application/json" } });

  const admin = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const folder = "water-network-private/source-masters/map-b-original";
  const filename = "MASTER 2025_Μ_15.1.2026_ANDREASPAP-01-02-014.dwg";
  const { data: existing } = await admin.storage.from(BUCKET).list(folder, { search: filename, limit: 10 });
  const match = existing?.find((item) => item.name === filename);
  if (match) return new Response(JSON.stringify({ ok: true, status: "already_present", bucket: BUCKET, path: PATH, expectedSizeBytes: EXPECTED_SIZE, expectedSha256: EXPECTED_SHA256 }), { headers: { ...headers, "content-type": "application/json" } });

  const { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(PATH, { upsert: true });
  if (error || !data?.token) return new Response(JSON.stringify({ ok: false, status: "signed_upload_url_failed", message: error?.message || "missing_upload_token" }), { status: 500, headers: { ...headers, "content-type": "application/json" } });

  return new Response(JSON.stringify({ ok: true, status: "ready", bucket: BUCKET, path: data.path || PATH, signedUrl: data.signedUrl, token: data.token, expectedSizeBytes: EXPECTED_SIZE, expectedSha256: EXPECTED_SHA256 }), { headers: { ...headers, "content-type": "application/json" } });
});
