import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabasePublicConfig } from "@/lib/supabase/public-config";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const EXPECTED_SCHEMA = "social-20260813-v2";

type CapabilityId =
  | "posts"
  | "reactions"
  | "comments"
  | "media"
  | "map"
  | "contact_discovery";

type DiagnosticCode =
  | "ready"
  | "auth_required"
  | "client_init_failed"
  | "table_missing"
  | "permission_denied"
  | "query_failed";

type Capability = {
  id: CapabilityId;
  label: string;
  ready: boolean;
  diagnostic: DiagnosticCode;
};

function classifyQueryError(error: { code?: string | null; message?: string | null } | null): DiagnosticCode {
  if (!error) return "ready";

  const code = error.code ?? "";
  const message = (error.message ?? "").toLowerCase();

  if (code === "42P01" || code === "PGRST205" || message.includes("does not exist")) {
    return "table_missing";
  }

  if (
    code === "42501" ||
    message.includes("permission denied") ||
    message.includes("row-level security") ||
    message.includes("jwt") ||
    message.includes("unauthorized")
  ) {
    return "permission_denied";
  }

  return "query_failed";
}

async function checkCapability(
  supabase: Awaited<ReturnType<typeof createClient>>,
  id: CapabilityId,
  label: string,
  table: string,
  authenticated: boolean,
): Promise<Capability> {
  try {
    const { error } = await supabase.from(table).select("*", { head: true, count: "exact" }).limit(1);
    const diagnostic = classifyQueryError(error);

    if (!authenticated && diagnostic === "permission_denied") {
      return { id, label, ready: true, diagnostic: "auth_required" };
    }

    return { id, label, ready: diagnostic === "ready", diagnostic };
  } catch {
    return { id, label, ready: false, diagnostic: "query_failed" };
  }
}

function json(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

export async function GET() {
  const revision = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA ?? null;
  const publicConfig = getSupabasePublicConfig();

  let supabase: Awaited<ReturnType<typeof createClient>>;
  try {
    supabase = await createClient();
  } catch {
    return json(
      {
        ok: false,
        schema: EXPECTED_SCHEMA,
        revision,
        supabase: {
          ready: false,
          diagnostic: "client_init_failed" as DiagnosticCode,
          configSource: publicConfig.source,
        },
        capabilities: [],
      },
      503,
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const authenticated = Boolean(user);

  const capabilities = await Promise.all([
    checkCapability(supabase, "posts", "Δημοσιεύσεις", "social_posts", authenticated),
    checkCapability(supabase, "reactions", "Αντιδράσεις", "social_reactions", authenticated),
    checkCapability(supabase, "comments", "Σχόλια", "social_comments", authenticated),
    checkCapability(supabase, "media", "Φωτογραφίες / Βίντεο", "social_post_media", authenticated),
    checkCapability(supabase, "map", "Χάρτης / Τοποθεσία", "social_location_shares", authenticated),
    checkCapability(
      supabase,
      "contact_discovery",
      "Εύρεση επαφών",
      "contact_discovery_tokens",
      authenticated,
    ),
  ]);

  const ok = capabilities.every((capability) => capability.ready);

  return json(
    {
      ok,
      schema: EXPECTED_SCHEMA,
      revision,
      supabase: {
        ready: true,
        diagnostic: "ready" as DiagnosticCode,
        configSource: publicConfig.source,
        authenticated,
      },
      capabilities,
    },
    ok ? 200 : 503,
  );
}
