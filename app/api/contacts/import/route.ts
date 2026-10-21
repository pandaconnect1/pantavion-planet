import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const headerSize = Number(request.headers.get("content-length") || "0");
  if (headerSize > 1_200_000) {
    return NextResponse.json({ ok: false, error: "file_too_large" }, { status: 413 });
  }

  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) {
    return NextResponse.json({ ok: false, error: "authentication_required" }, { status: 401 });
  }

  const text = await request.text().catch(() => "");
  if (!text || text.length > 1_200_000) {
    return NextResponse.json({ ok: false, error: "invalid_or_oversized_body" }, { status: 413 });
  }

  let payload: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("bad json");
    payload = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const confirmed = payload.confirmed === true;
  const sourceType = payload.sourceType;
  const filename = payload.filename;
  const contacts = payload.contacts;
  if (!confirmed || (sourceType !== "vcard" && sourceType !== "csv" && sourceType !== "device") ||
      typeof filename !== "string" || filename.length > 120 ||
      !Array.isArray(contacts) || contacts.length === 0 || contacts.length > 500) {
    return NextResponse.json({ ok: false, error: "confirmation_or_file_invalid" }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("pantavion_import_contacts_consented", {
    p_source_type: sourceType,
    p_filename: filename,
    p_contacts: contacts,
    p_confirmed: true,
  });

  if (error) {
    // Do not echo arbitrary contact data or database diagnostics to the client.
    return NextResponse.json({ ok: false, error: "contacts_import_failed" }, { status: 400 });
  }
  return NextResponse.json(
    { ok: true, importedCount: Number(data ?? 0), source: sourceType, status: "persisted" },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}
