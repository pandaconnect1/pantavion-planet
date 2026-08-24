import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const MEMORY_TYPES = new Set(["working", "thread", "episodic", "semantic", "task", "artifact", "relationship", "preference"]);
const MEMORY_SCOPES = new Set(["private", "thread", "project", "shared_space", "organization", "public"]);
const USER_MEMORY_TRUTH_STATES = new Set(["KNOWN", "INFERRED"]);

async function authenticatedClient() {
  const supabase = await createClient();
  const { data: auth, error } = await supabase.auth.getUser();
  return { supabase, user: error ? null : auth.user };
}

export async function GET(request: Request) {
  const { supabase, user } = await authenticatedClient();
  if (!user) return NextResponse.json({ ok: false, error: "authentication_required" }, { status: 401 });

  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim().slice(0, 200).replace(/[%_]/g, "");
  const type = (url.searchParams.get("type") || "").trim();

  let query = supabase
    .from("personal_ai_memories")
    .select("id,thread_id,memory_type,scope,content,normalized_content,source_type,source_ref,confidence,truth_state,metadata,valid_from,valid_until,supersedes_memory_id,created_at,updated_at")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(100);

  if (q) query = query.ilike("content", `%${q}%`);
  if (type && MEMORY_TYPES.has(type)) query = query.eq("memory_type", type);

  const { data, error } = await query;
  if (error) return NextResponse.json({ ok: false, error: "memory_read_failed", detail: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, memories: data || [] });
}

export async function POST(request: Request) {
  const { supabase, user } = await authenticatedClient();
  if (!user) return NextResponse.json({ ok: false, error: "authentication_required" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const content = typeof body.content === "string" ? body.content.trim().slice(0, 30000) : "";
  const memoryType = typeof body.memoryType === "string" ? body.memoryType : "semantic";
  const scope = typeof body.scope === "string" ? body.scope : "private";
  const truthState = typeof body.truthState === "string" ? body.truthState : "KNOWN";
  const threadId = typeof body.threadId === "string" ? body.threadId : null;
  const confidence = typeof body.confidence === "number" ? Math.min(1, Math.max(0, body.confidence)) : 1;

  if (!content) return NextResponse.json({ ok: false, error: "memory_content_required" }, { status: 400 });
  if (!MEMORY_TYPES.has(memoryType) || !MEMORY_SCOPES.has(scope) || !USER_MEMORY_TRUTH_STATES.has(truthState)) {
    return NextResponse.json({ ok: false, error: "invalid_memory_classification" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("personal_ai_memories")
    .insert({
      user_id: user.id,
      thread_id: threadId,
      memory_type: memoryType,
      scope,
      content,
      normalized_content: typeof body.normalizedContent === "string" ? body.normalizedContent.trim().slice(0, 30000) : null,
      source_type: typeof body.sourceType === "string" ? body.sourceType.slice(0, 80) : "user_explicit",
      source_ref: typeof body.sourceRef === "string" ? body.sourceRef.slice(0, 500) : null,
      confidence,
      truth_state: truthState,
      metadata: body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata) ? body.metadata : {},
      valid_from: typeof body.validFrom === "string" ? body.validFrom : null,
      valid_until: typeof body.validUntil === "string" ? body.validUntil : null,
      supersedes_memory_id: typeof body.supersedesMemoryId === "string" ? body.supersedesMemoryId : null,
    })
    .select("id,thread_id,memory_type,scope,content,source_type,source_ref,confidence,truth_state,created_at")
    .single();

  if (error) return NextResponse.json({ ok: false, error: "memory_write_failed", detail: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, memory: data }, { status: 201 });
}

export async function DELETE(request: Request) {
  const { supabase, user } = await authenticatedClient();
  if (!user) return NextResponse.json({ ok: false, error: "authentication_required" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const id = typeof body.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ ok: false, error: "memory_id_required" }, { status: 400 });

  const { data, error } = await supabase
    .from("personal_ai_memories")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) return NextResponse.json({ ok: false, error: "memory_delete_failed", detail: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ ok: false, error: "memory_not_found" }, { status: 404 });
  return NextResponse.json({ ok: true, deleted: true, id });
}
