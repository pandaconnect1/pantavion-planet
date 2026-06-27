import { NextResponse } from "next/server";
import { verifyKernelRequest } from "../../../../../core/kernel/kernel-auth";
import {
  ingestOmnimodalBlob,
  listOmnimodalIntakeRecords,
} from "../../../../../core/kernel/omnimodal-intake";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function resolveActor(request: Request) {
  const auth = verifyKernelRequest(request);

  if (auth.ok) {
    return {
      actor: auth.actor,
      authWarning: auth.warning,
      source: "api" as const,
    };
  }

  if (process.env.NODE_ENV !== "production") {
    return {
      actor: "local-omnimodal-api",
      authWarning: "Local development mode. Omnimodal intake accepted without production auth.",
      source: "api" as const,
    };
  }

  return null;
}

export async function GET(request: Request) {
  const actor = resolveActor(request);

  if (!actor) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized omnimodal intake access." },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? "50");
  const records = await listOmnimodalIntakeRecords({ limit });

  return NextResponse.json({
    ok: true,
    actor: actor.actor,
    authWarning: actor.authWarning,
    records,
  });
}

export async function POST(request: Request) {
  const actor = resolveActor(request);

  if (!actor) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized omnimodal upload." },
      { status: 401 },
    );
  }

  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      {
        ok: false,
        error: "Use multipart/form-data with field name 'file'.",
      },
      { status: 400 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof Blob)) {
    return NextResponse.json(
      { ok: false, error: "Missing file field." },
      { status: 400 },
    );
  }

  const named = file as Blob & { name?: string };
  const originalName =
    typeof named.name === "string" && named.name.trim()
      ? named.name
      : "upload.bin";

  const declaredPurpose = String(formData.get("purpose") ?? "").trim() || undefined;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const record = await ingestOmnimodalBlob({
    actor: actor.actor,
    source: actor.source,
    originalName,
    mimeType: file.type || "application/octet-stream",
    bytes,
    declaredPurpose,
  });

  return NextResponse.json({
    ok: true,
    authWarning: actor.authWarning,
    record,
  });
}
