import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const ITEM_KINDS = new Set(["note", "birthday", "appointment", "reminder", "task", "follow_up", "important_date"]);
const ITEM_STATUSES = new Set(["open", "completed", "cancelled", "archived"]);

async function authenticatedClient() {
  const supabase = await createClient();
  const { data: auth, error } = await supabase.auth.getUser();
  return { supabase, user: error ? null : auth.user };
}

export async function GET(request: Request) {
  const { supabase, user } = await authenticatedClient();
  if (!user) return NextResponse.json({ ok: false, error: "authentication_required" }, { status: 401 });

  const url = new URL(request.url);
  const status = (url.searchParams.get("status") || "open").trim();
  const kind = (url.searchParams.get("kind") || "").trim();

  let query = supabase
    .from("personal_ai_items")
    .select("id,thread_id,kind,title,body,subject_label,due_at,recurrence,status,metadata,created_at,updated_at")
    .eq("user_id", user.id)
    .order("due_at", { ascending: true, nullsFirst: false })
    .limit(100);

  if (ITEM_STATUSES.has(status)) query = query.eq("status", status);
  if (kind && ITEM_KINDS.has(kind)) query = query.eq("kind", kind);

  const { data, error } = await query;
  if (error) return NextResponse.json({ ok: false, error: "personal_ai_items_read_failed", detail: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, items: data || [] });
}

export async function POST(request: Request) {
  const { supabase, user } = await authenticatedClient();
  if (!user) return NextResponse.json({ ok: false, error: "authentication_required" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const kind = typeof body.kind === "string" ? body.kind : "note";
  const title = typeof body.title === "string" ? body.title.trim().slice(0, 500) : null;
  const itemBody = typeof body.body === "string" ? body.body.trim().slice(0, 30000) : "";
  if (!ITEM_KINDS.has(kind)) return NextResponse.json({ ok: false, error: "invalid_item_kind" }, { status: 400 });
  if (!title && !itemBody) return NextResponse.json({ ok: false, error: "item_content_required" }, { status: 400 });

  const { data, error } = await supabase
    .from("personal_ai_items")
    .insert({
      user_id: user.id,
      thread_id: typeof body.threadId === "string" ? body.threadId : null,
      kind,
      title,
      body: itemBody,
      subject_label: typeof body.subjectLabel === "string" ? body.subjectLabel.trim().slice(0, 500) : null,
      due_at: typeof body.dueAt === "string" ? body.dueAt : null,
      recurrence: typeof body.recurrence === "string" ? body.recurrence.trim().slice(0, 500) : null,
      metadata: body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata) ? body.metadata : {},
    })
    .select("id,thread_id,kind,title,body,subject_label,due_at,recurrence,status,created_at")
    .single();

  if (error) return NextResponse.json({ ok: false, error: "personal_ai_item_write_failed", detail: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, item: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const { supabase, user } = await authenticatedClient();
  if (!user) return NextResponse.json({ ok: false, error: "authentication_required" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const id = typeof body.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ ok: false, error: "item_id_required" }, { status: 400 });

  const changes: Record<string, unknown> = {};
  if (typeof body.title === "string") changes.title = body.title.trim().slice(0, 500) || null;
  if (typeof body.body === "string") changes.body = body.body.trim().slice(0, 30000);
  if (typeof body.subjectLabel === "string") changes.subject_label = body.subjectLabel.trim().slice(0, 500) || null;
  if (body.dueAt === null || typeof body.dueAt === "string") changes.due_at = body.dueAt;
  if (body.recurrence === null || typeof body.recurrence === "string") changes.recurrence = body.recurrence;
  if (typeof body.status === "string" && ITEM_STATUSES.has(body.status)) changes.status = body.status;
  if (body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)) changes.metadata = body.metadata;
  if (Object.keys(changes).length === 0) return NextResponse.json({ ok: false, error: "no_valid_changes" }, { status: 400 });

  const { data, error } = await supabase
    .from("personal_ai_items")
    .update(changes)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id,thread_id,kind,title,body,subject_label,due_at,recurrence,status,updated_at")
    .maybeSingle();

  if (error) return NextResponse.json({ ok: false, error: "personal_ai_item_update_failed", detail: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ ok: false, error: "item_not_found" }, { status: 404 });
  return NextResponse.json({ ok: true, item: data });
}
