import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const EXPECTED_SCHEMA = "social-20260811-v1";

type CapabilityId =
  | "posts"
  | "reactions"
  | "comments"
  | "media"
  | "map"
  | "contact_discovery";

type DiagnosticCode =
  | "ready"
  | "missing_env"
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

  if (code === "42501" || message.includes("permission denied") || message.includes("row-level security")) {
    return "permission_denied";
  }

  return "query_failed";
}

async function checkCapability(
  supabase: Awaited<ReturnType<typeof createClient>>,
  id: CapabilityId,
  label: string,
  table: string,
): Promise<Capability> {
  try {
    const { error } = await supabase.from(table).select("*", { head: true, count: "exact" }).limit(1);
    const diagnostic = classifyQueryError(error);
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
  const hasUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasPublishableKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

  if (!hasUrl || !hasPublishableKey) {
    return json(
      {
        ok: false,
        schema: EXPECTED_SCHEMA,
        revision,
        supabase: {
          ready: false,
          diagnostic: "missing_env" as DiagnosticCode,
          urlConfigured: hasUrl,
          publishableKeyConfigured: hasPublishableKey,
        },
        capabilities: [],
      },
      503,
    );
  }

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
          urlConfigured: hasUrl,
          publishableKeyConfigured: hasPublishableKey,
        },
        capabilities: [],
      },
      503,
    );
  }

  const capabilities = await Promise.all([
    checkCapability(supabase, "posts", "Δημοσιεύσεις", "social_posts"),
    checkCapability(supabase, "reactions", "Αντιδράσεις", "social_reactions"),
    checkCapability(supabase, "comments", "Σχόλια", "social_comments"),
    checkCapability(supabase, "media", "Φωτογραφίες / Βίντεο", "social_post_media"),
    checkCapability(supabase, "map", "Χάρτης / Τοποθεσία", "social_location_shares"),
    checkCapability(supabase, "contact_discovery", "Εύρεση επαφών", "contact_discovery_tokens"),
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
        urlConfigured: true,
        publishableKeyConfigured: true,
      },
      capabilities,
    },
    ok ? 200 : 503,
  );
}
