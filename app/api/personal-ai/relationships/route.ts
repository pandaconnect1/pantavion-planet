import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function authenticatedClient() {
  const supabase = await createClient();
  const { data: auth, error } = await supabase.auth.getUser();
  return { supabase, user: error ? null : auth.user };
}

function subjectKey(value: string) {
  return value
    .trim()
    .toLocaleLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
}

export async function GET() {
  const { supabase, user } = await authenticatedClient();
  if (!user) return NextResponse.json({ ok: false, error: "authentication_required" }, { status: 401 });

  const { data, error } = await supabase
    .from("personal_ai_relationship_contexts")
    .select("id,subject_key,display_name,relationship_type,aliases,notes,metadata,created_at,updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ ok: false, error: "relationship_context_read_failed", detail: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, relationships: data || [] });
}

export async function POST(request: Request) {
  const { supabase, user } = await authenticatedClient();
  if (!user) return NextResponse.json({ ok: false, error: "authentication_required" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const displayName = typeof body.displayName === "string" ? body.displayName.trim().slice(0, 500) : "";
  const relationshipType = typeof body.relationshipType === "string" ? body.relationshipType.trim().slice(0, 120) : "";
  const explicitKey = typeof body.subjectKey === "string" ? subjectKey(body.subjectKey) : "";
  const key = explicitKey || subjectKey(displayName);

  if (!displayName || !relationshipType || !key) {
    return NextResponse.json({ ok: false, error: "display_name_relationship_type_required" }, { status: 400 });
  }

  const aliases = Array.isArray(body.aliases)
    ? body.aliases.filter((value: unknown): value is string => typeof value === "string").map((value: string) => value.trim().slice(0, 200)).filter(Boolean).slice(0, 30)
    : [];

  const { data, error } = await supabase
    .from("personal_ai_relationship_contexts")
    .upsert({
      user_id: user.id,
      subject_key: key,
      display_name: displayName,
      relationship_type: relationshipType,
      aliases,
      notes: typeof body.notes === "string" ? body.notes.trim().slice(0, 30000) : "",
      metadata: body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata) ? body.metadata : {},
    }, { onConflict: "user_id,subject_key" })
    .select("id,subject_key,display_name,relationship_type,aliases,notes,metadata,created_at,updated_at")
    .single();

  if (error) return NextResponse.json({ ok: false, error: "relationship_context_write_failed", detail: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, relationship: data });
}
