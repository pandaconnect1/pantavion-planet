import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const EXPECTED_SCHEMA = "social-20260811-v1";

type Capability = {
  id: "posts" | "reactions" | "comments" | "media" | "map" | "contact_discovery";
  label: string;
  ready: boolean;
};

async function tableReady(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: string,
): Promise<boolean> {
  const { error } = await supabase.from(table).select("*", { head: true, count: "exact" }).limit(1);
  return !error;
}

export async function GET() {
  const supabase = await createClient();

  const [posts, reactions, comments, media, map, contactDiscovery] = await Promise.all([
    tableReady(supabase, "social_posts"),
    tableReady(supabase, "social_reactions"),
    tableReady(supabase, "social_comments"),
    tableReady(supabase, "social_post_media"),
    tableReady(supabase, "social_location_shares"),
    tableReady(supabase, "contact_discovery_tokens"),
  ]);

  const capabilities: Capability[] = [
    { id: "posts", label: "Δημοσιεύσεις", ready: posts },
    { id: "reactions", label: "Αντιδράσεις", ready: reactions },
    { id: "comments", label: "Σχόλια", ready: comments },
    { id: "media", label: "Φωτογραφίες / Βίντεο", ready: media },
    { id: "map", label: "Χάρτης / Τοποθεσία", ready: map },
    { id: "contact_discovery", label: "Εύρεση επαφών", ready: contactDiscovery },
  ];

  const ok = capabilities.every((capability) => capability.ready);

  return NextResponse.json(
    {
      ok,
      schema: EXPECTED_SCHEMA,
      revision: process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA ?? null,
      capabilities,
    },
    {
      status: ok ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
