import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_CONSENTS = new Set([
  "contacts_import",
  "people_discovery",
  "messaging",
  "translation",
  "voice",
]);

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("user_consents")
    .select("consent_key, granted, source, granted_at, revoked_at, updated_at")
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: "consent_read_failed" }, { status: 500 });
  return NextResponse.json({ consents: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null) as { consentKey?: string; granted?: boolean; source?: string } | null;
  const consentKey = body?.consentKey?.trim();
  if (!consentKey || !ALLOWED_CONSENTS.has(consentKey) || typeof body?.granted !== "boolean") {
    return NextResponse.json({ error: "invalid_consent_request" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const record = {
    user_id: user.id,
    consent_key: consentKey,
    granted: body.granted,
    source: body.source?.trim().slice(0, 80) || "pantavion",
    granted_at: body.granted ? now : null,
    revoked_at: body.granted ? null : now,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from("user_consents")
    .upsert(record, { onConflict: "user_id,consent_key" })
    .select("consent_key, granted, source, granted_at, revoked_at, updated_at")
    .single();

  if (error) return NextResponse.json({ error: "consent_write_failed" }, { status: 500 });
  return NextResponse.json({ consent: data });
}
