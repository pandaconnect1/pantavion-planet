import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

export const dynamic = "force-dynamic";

function verifySignature(rawBody: string, signatureHeader?: string, secret?: string) {
  if (!signatureHeader || !secret) return false;
  try {
    const provided = signatureHeader.replace(/^sha256=/, "");
    const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(provided, "hex"));
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const raw = await request.text();
  const sig = request.headers.get("x-pantavion-gpt-signature") || undefined;
  const secret = process.env.PANTAVION_CONTROL_SHARED_SECRET;

  if (!verifySignature(raw, sig, secret)) {
    return NextResponse.json({ ok: false, error: "signature_verification_failed" }, { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(raw);
  } catch (err) {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  // basic schema validation
  if (!payload?.id || !payload?.intent) {
    return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
  }

  const admin = createAdminClient();
  try {
    await admin.from("control_requests").insert({
      request_id: payload.id,
      actor_type: payload.actor?.type ?? "gpt",
      actor_id: payload.actor?.id ?? null,
      raw_payload: payload,
      signature: sig ?? null,
      status: "pending",
      created_at: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("control insert error", err?.message ?? err);
    return NextResponse.json({ ok: false, error: "db_insert_failed", detail: err?.message ?? String(err) }, { status: 500 });
  }

  return NextResponse.json({ ok: true, status: "queued" }, { status: 202 });
}
