import { NextResponse } from "next/server";
import {
  PANTAVION_AI_ASSISTANTS,
  buildPantaAiSystemInstruction,
} from "../../../../core/ai/pantavion-ai-command-center";
import {
  answerWithOwnedInference,
  getOwnedInferenceConfig,
} from "../../../../core/ai/pantavion-owned-inference";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PantaAiBody {
  assistantKey?: string;
  message?: string;
}

export async function POST(request: Request) {
  const declaredSize = Number(request.headers.get("content-length") || "0");
  if (declaredSize > 32768) {
    return NextResponse.json({ ok: false, error: "PANTAVION_AI_INPUT_TOO_LARGE" }, { status: 413 });
  }

  const body = (await request.json().catch(() => null)) as PantaAiBody | null;
  const message = typeof body?.message === "string" ? body.message.trim().slice(0, 16000) : "";
  if (!message) {
    return NextResponse.json(
      { ok: false, error: "PANTAVION_AI_EMPTY_MESSAGE", message: "Ask PantaAI a question first." },
      { status: 400 },
    );
  }

  const assistantKey = body?.assistantKey || "publicGuide";
  const assistant = PANTAVION_AI_ASSISTANTS[assistantKey as keyof typeof PANTAVION_AI_ASSISTANTS];
  // Privileged Guardian instructions must not be reachable through a public AI route.
  if (!assistant || !assistant.visibleToPublic || assistant.audience === "user") {
    return NextResponse.json({ ok: false, error: "PANTAVION_AI_ASSISTANT_NOT_PUBLIC" }, { status: 403 });
  }

  // No fallback to OpenAI, Vercel Gateway or another external AI vendor.
  const config = process.env.PANTAVION_OWNED_AI_ENABLED === "true"
    ? getOwnedInferenceConfig()
    : null;
  if (!config) {
    return NextResponse.json(
      {
        ok: false,
        error: "PANTAVION_OWNED_AI_NOT_READY",
        message: "The private Pantavion AI model endpoint is not yet configured or validated.",
      },
      { status: 503 },
    );
  }

  try {
    const answer = await answerWithOwnedInference(
      config,
      message,
      buildPantaAiSystemInstruction(assistantKey),
      AbortSignal.timeout(45000),
    );
    return NextResponse.json({
      ok: true,
      answer,
      assistantKey,
      provider: "pantavion-owned-inference",
      model: config.model,
    });
  } catch {
    // Never return private upstream URLs, tokens or raw inference responses.
    return NextResponse.json(
      { ok: false, error: "PANTAVION_OWNED_AI_UNAVAILABLE", message: "The private AI model did not return a valid response." },
      { status: 503 },
    );
  }
}
