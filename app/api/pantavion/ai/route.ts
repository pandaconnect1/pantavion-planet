import { NextResponse } from "next/server";
import { buildPantaAiSystemInstruction } from "../../../../core/ai/pantavion-ai-command-center";

export const runtime = "nodejs";

interface PantaAiBody {
  assistantKey?: string;
  message?: string;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as PantaAiBody | null;
  const message = typeof body?.message === "string" ? body.message.slice(0, 16000) : "";

  if (!message.trim()) {
    return NextResponse.json(
      {
        ok: false,
        error: "PANTAVION_AI_EMPTY_MESSAGE",
        message: "Ask PantaAI a question first.",
      },
      { status: 400 },
    );
  }

  const apiKey = process.env.OPENAI_API_KEY ?? process.env.PANTAVION_OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        error: "PANTAVION_AI_PROVIDER_MISSING",
        message:
          "PantaAI route is installed. Add OPENAI_API_KEY or PANTAVION_OPENAI_API_KEY to enable live public/personal/internal AI answers.",
      },
      { status: 503 },
    );
  }

  const assistantKey = body?.assistantKey ?? "publicGuide";
  const model = process.env.PANTAVION_AI_MODEL ?? "gpt-4o-mini";

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
  });

  const data = await upstream.json().catch(() => null);

  if (!upstream.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: "PANTAVION_AI_PROVIDER_ERROR",
        status: upstream.status,
        providerResponse: data,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    answer: extractOpenAiText(data),
    assistantKey,
    provider: "openai-responses",
    model,
  });
}

function extractOpenAiText(data: unknown): string {
  if (typeof data !== "object" || data === null) return "";
  const direct = (data as { output_text?: unknown }).output_text;
  if (typeof direct === "string") return direct;

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
