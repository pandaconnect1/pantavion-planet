import { NextResponse } from "next/server";
import {
  buildPantaAiSystemInstruction,
  canUsePantaAiAssistant,
} from "@/core/ai/pantavion-ai-command-center";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_CHARS = 32_768;
const MAX_MESSAGE_CHARS = 16_000;

interface PantaAiBody {
  assistantKey?: unknown;
  message?: unknown;
}

export async function POST(request: Request) {
  const declaredSize = Number(request.headers.get("content-length") || "0");
  if (declaredSize > MAX_BODY_CHARS) {
    return NextResponse.json({ ok: false, error: "PANTAVION_AI_INPUT_TOO_LARGE" }, { status: 413 });
  }

  const rawBody = await request.text().catch(() => "");
  if (rawBody.length > MAX_BODY_CHARS) {
    return NextResponse.json({ ok: false, error: "PANTAVION_AI_INPUT_TOO_LARGE" }, { status: 413 });
  }

  let body: PantaAiBody | null = null;
  try {
    body = JSON.parse(rawBody) as PantaAiBody;
  } catch {
    return NextResponse.json({ ok: false, error: "PANTAVION_AI_INVALID_BODY" }, { status: 400 });
  }

  const message = typeof body?.message === "string"
    ? body.message.trim().slice(0, MAX_MESSAGE_CHARS)
    : "";
  if (!message) {
    return NextResponse.json({ ok: false, error: "PANTAVION_AI_EMPTY_MESSAGE" }, { status: 400 });
  }

  const assistantKey = body?.assistantKey ?? "publicGuide";
  if (typeof assistantKey !== "string" || !canUsePantaAiAssistant(assistantKey, false)) {
    // Internal/Guardian assistants are never exposed here, even to signed-in visitors.
    const isPersonal = assistantKey === "personalUserAssistant";
    if (!isPersonal) {
      return NextResponse.json({ ok: false, error: "PANTAVION_AI_ASSISTANT_FORBIDDEN" }, { status: 403 });
    }

    let authenticated = false;
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.getUser();
      authenticated = !error && Boolean(data.user?.id);
    } catch {
      authenticated = false;
    }
    if (!canUsePantaAiAssistant(assistantKey, authenticated)) {
      return NextResponse.json({ ok: false, error: "PANTAVION_AI_LOGIN_REQUIRED" }, { status: 401 });
    }
  }

  const apiKey = process.env.OPENAI_API_KEY || process.env.PANTAVION_OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "PANTAVION_AI_PROVIDER_MISSING", message: "AI provider is not configured." },
      { status: 503 },
    );
  }
  const model = process.env.PANTAVION_AI_MODEL || "gpt-4o-mini";

  try {
    const upstream = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        instructions: buildPantaAiSystemInstruction(assistantKey),
        input: message,
      }),
      signal: AbortSignal.timeout(25_000),
      redirect: "error",
      cache: "no-store",
    });
    if (!upstream.ok) {
      // Do not leak the provider's response, error body, credentials or diagnostics.
      return NextResponse.json({ ok: false, error: "PANTAVION_AI_PROVIDER_ERROR" }, { status: 502 });
    }

    const data = await upstream.json().catch(() => null);
    const answer = extractOpenAiText(data);
    if (!answer) {
      return NextResponse.json({ ok: false, error: "PANTAVION_AI_EMPTY_PROVIDER_RESPONSE" }, { status: 502 });
    }
    return NextResponse.json({
      ok: true,
      answer: answer.slice(0, 16_000),
      assistantKey,
      provider: "openai-responses",
      model,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "PANTAVION_AI_PROVIDER_UNAVAILABLE" },
      { status: 503 },
    );
  }
}

function extractOpenAiText(data: unknown): string {
  if (typeof data !== "object" || data === null) return "";
  const direct = (data as { output_text?: unknown }).output_text;
  if (typeof direct === "string") return direct.trim();

  const chunks: string[] = [];
  function walk(value: unknown) {
    if (!value) return;
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (typeof value !== "object") return;
    const candidate = value as { type?: unknown; text?: unknown };
    if (candidate.type === "output_text" && typeof candidate.text === "string") {
      chunks.push(candidate.text);
    }
    Object.values(value as Record<string, unknown>).forEach(walk);
  }
  walk(data);
  return chunks.join("\n").trim();
}
