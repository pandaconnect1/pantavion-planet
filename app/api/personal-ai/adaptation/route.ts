import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getPersonalAIState } from "@/core/intelligence/personal-ai-runtime";
import {
  loadPersonalAIAdaptivePlan,
  type PersonalAIAdaptiveRequest,
  type PersonalAIAdaptiveSignal,
} from "@/core/intelligence/personal-ai-adaptive-runtime";

export const dynamic = "force-dynamic";

const INPUT_MODES = ["text", "voice", "image", "video", "file", "mixed"] as const;
const SIGNALS = [
  "asks_for_simpler_explanation",
  "asks_for_step_by_step",
  "asks_to_repeat_or_rephrase",
  "asks_for_example",
  "requests_translation_help",
  "requests_shorter_chunks",
  "uses_voice_preference",
  "uses_captions_preference",
  "requests_reduced_stimulation",
  "requests_low_bandwidth",
] as const satisfies readonly PersonalAIAdaptiveSignal[];

function safeMetadata(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function parseSignals(value: unknown): PersonalAIAdaptiveSignal[] {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value.filter(
        (item): item is PersonalAIAdaptiveSignal =>
          typeof item === "string" && (SIGNALS as readonly string[]).includes(item),
      ),
    ),
  );
}

function parseRequest(body: unknown): PersonalAIAdaptiveRequest {
  const value = typeof body === "object" && body !== null && !Array.isArray(body)
    ? (body as Record<string, unknown>)
    : {};
  const inputMode =
    typeof value.inputMode === "string" &&
    (INPUT_MODES as readonly string[]).includes(value.inputMode)
      ? (value.inputMode as PersonalAIAdaptiveRequest["inputMode"])
      : undefined;

  return {
    input: typeof value.input === "string" ? value.input.slice(0, 30_000) : null,
    inputMode,
    metadata: safeMetadata(value.metadata),
    explicitSignals: parseSignals(value.explicitSignals),
  };
}

async function authenticatedPlan(request: PersonalAIAdaptiveRequest) {
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) {
    return {
      response: NextResponse.json(
        { ok: false, error: "authentication_required" },
        { status: 401 },
      ),
    };
  }

  try {
    // Ensure the canonical Personal AI profile exists before resolving adaptation.
    await getPersonalAIState(supabase, auth.user.id);
    const plan = await loadPersonalAIAdaptivePlan(supabase, auth.user.id, request);
    return {
      response: NextResponse.json({
        ok: true,
        plan,
        truth:
          "Personalization is resolved inside Pantavion. This endpoint does not execute user actions or bypass capability, safety, age or jurisdiction gates.",
      }),
    };
  } catch (error) {
    return {
      response: NextResponse.json(
        {
          ok: false,
          error: "personal_ai_adaptation_failed",
          detail: error instanceof Error ? error.message : "unknown",
        },
        { status: 500 },
      ),
    };
  }
}

export async function GET() {
  return (await authenticatedPlan({})).response;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return (await authenticatedPlan(parseRequest(body))).response;
}
