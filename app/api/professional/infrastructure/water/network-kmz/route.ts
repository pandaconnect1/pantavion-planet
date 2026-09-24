import { createHash, randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { hasWaterAdminAuthorization } from "@/core/security/water-admin-authorization";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const BUCKET = "personal-media";
const PREFIX = "water-network-private/imports/kmz";
const TEMP_UPLOAD_HOST = "pantavion-planet-production-deb2.up.railway.app";
const MAX_SIZE_BYTES = 512 * 1024 * 1024;

function clean(value: unknown, max = 512) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function safeFileName(value: string) {
  const base = value
    .replace(/[\\/]+/g, "_")
    .replace(/[^A-Za-z0-9._()\- ]+/g, "_")
    .replace(/\s+/g, " ")
    .trim();
  return base || "water-network.kmz";
}

function hasTemporaryUploadWindow(request: Request) {
  if (process.env.PANTAVION_WATER_TEMP_UPLOAD_OPEN !== "true") return false;
  const host = (request.headers.get("host") || "").split(":")[0].toLowerCase();
  if (host !== TEMP_UPLOAD_HOST) return false;
  const until = Date.parse(process.env.PANTAVION_WATER_TEMP_UPLOAD_UNTIL || "");
  return Number.isFinite(until) && Date.now() < until;
}

async function allowed(request: Request) {
  return (await hasWaterAdminAuthorization(request)) || hasTemporaryUploadWindow(request);
}

function validPath(path: string) {
  return path.startsWith(PREFIX + "/") && !path.includes("..");
}

export async function POST(request: Request) {
  if (!(await allowed(request))) {
    return NextResponse.json(
      { ok: false, error: "water_admin_session_required" },
      { status: 403, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const body = await request.json().catch(() => null);
  const action = body?.action === "verify" ? "verify" : "sign";

  if (action === "sign") {
    const originalName = clean(body?.fileName);
    const sizeBytes = Number(body?.sizeBytes);

    if (!originalName.toLowerCase().endsWith(".kmz")) {
      return NextResponse.json(
        { ok: false, error: "kmz_file_required" },
        { status: 400, headers: { "Cache-Control": "private, no-store" } },
      );
    }
    if (!Number.isSafeInteger(sizeBytes) || sizeBytes <= 0 || sizeBytes > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { ok: false, error: "invalid_kmz_size" },
        { status: 400, headers: { "Cache-Control": "private, no-store" } },
      );
    }

    const fileName = safeFileName(originalName);
    const objectId = randomUUID();
    const path = `${PREFIX}/${objectId}/${fileName}`;

    const admin = createAdminClient();
    const { data, error } = await admin.storage
      .from(BUCKET)
      .createSignedUploadUrl(path, { upsert: false });

    if (error || !data?.token) {
      return NextResponse.json(
        { ok: false, error: error?.message || "kmz_signed_upload_failed" },
        { status: 500, headers: { "Cache-Control": "private, no-store" } },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        bucket: BUCKET,
        path: data.path || path,
        token: data.token,
        originalName,
        sizeBytes,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const path = clean(body?.path, 1200);
  const expectedSize = Number(body?.sizeBytes);

  if (!validPath(path)) {
    return NextResponse.json(
      { ok: false, error: "invalid_kmz_path" },
      { status: 400, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(BUCKET).download(path);
  if (error || !data) {
    return NextResponse.json(
      { ok: false, error: error?.message || "kmz_readback_failed" },
      { status: 404, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const bytes = Buffer.from(await data.arrayBuffer());
  const sha256 = createHash("sha256").update(bytes).digest("hex");

  if (Number.isSafeInteger(expectedSize) && expectedSize > 0 && bytes.length !== expectedSize) {
    return NextResponse.json(
      {
        ok: false,
        error: "kmz_size_mismatch_after_upload",
        actualSizeBytes: bytes.length,
        sha256,
      },
      { status: 409, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      status: "stored",
      bucket: BUCKET,
      path,
      actualSizeBytes: bytes.length,
      sha256,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
