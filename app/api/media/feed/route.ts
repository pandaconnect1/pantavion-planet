import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = new Set([
  "article",
  "sports_update",
  "radio_station",
  "audio_episode",
  "video",
  "announcement",
  "event",
  "other",
]);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const country = url.searchParams.get("country")?.toUpperCase();
  const language = url.searchParams.get("language")?.toLowerCase();
  const category = url.searchParams.get("category");
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 40) || 40, 1), 100);

  if (type && !ALLOWED_TYPES.has(type)) {
    return NextResponse.json({ ok: false, error: "unsupported_media_type" }, { status: 400 });
  }

  const supabase = await createClient();
  let query = supabase
    .from("media_items")
    .select("id,source_id,item_type,title,summary,canonical_url,media_url,image_url,country_code,region,city,language_code,category,published_at,correction_note,provenance")
    .eq("editorial_state", "published")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (type) query = query.eq("item_type", type);
  if (country) query = query.eq("country_code", country);
  if (language) query = query.eq("language_code", language);
  if (category) query = query.eq("category", category);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({
      ok: false,
      status: "backend_unavailable",
      error: "media_feed_unavailable",
      detail: error.message,
    }, { status: 503 });
  }

  return NextResponse.json({
    ok: true,
    status: data?.length ? "live_data" : "verified_empty",
    count: data?.length ?? 0,
    items: data ?? [],
    truth: "Only RLS-approved published media items are returned. Empty means no currently eligible verified content is stored.",
  });
}
