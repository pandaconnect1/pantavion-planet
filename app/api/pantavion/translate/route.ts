import { NextResponse } from "next/server";
import {
  createPantavionTranslationPrompt,
  type PantavionInterpreterMode,
  type PantavionInterpreterSurface,
} from "../../../../core/translation/pantavion-universal-interpreter";

export const runtime = "nodejs";

interface PantavionTranslateBody {
  text?: string;
  imageDataUrl?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  mode?: PantavionInterpreterMode;
  surface?: PantavionInterpreterSurface;
  outputStyle?: "natural" | "literal" | "emergency" | "formal" | "simple";
  userContext?: string;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as PantavionTranslateBody | null;

  const text = typeof body?.text === "string" ? body.text.slice(0, 12000) : "";
  const imageDataUrl =
    typeof body?.imageDataUrl === "string" && body.imageDataUrl.startsWith("data:image/")
      ? body.imageDataUrl
      : "";

  if (!text.trim() && !imageDataUrl) {
    return NextResponse.json(
      {
        ok: false,
        error: "PANTAVION_TRANSLATION_EMPTY_INPUT",
        message: "Write, speak, or scan text before translation.",
      },
      { status: 400 },
    );
  }

  const apiKey = process.env.OPENAI_API_KEY ?? process.env.PANTAVION_OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        error: "PANTAVION_TRANSLATION_PROVIDER_MISSING",
        message:
          "Pantavion Universal Interpreter route is installed. Add OPENAI_API_KEY or PANTAVION_OPENAI_API_KEY to enable live AI translation.",
      },
      { status: 503 },
    );
  }

  const prompt = createPantavionTranslationPrompt({
    text,
    sourceLanguage: body?.sourceLanguage ?? "auto",
    targetLanguage: body?.targetLanguage ?? "en",
    mode: body?.mode ?? "auto-bidirectional",
    surface: body?.surface ?? "global",
    outputStyle: body?.outputStyle ?? "natural",
    userContext: body?.userContext,
  });

  const content: Array<Record<string, unknown>> = [
    {
      type: "input_text",
      text:
        prompt +
        "\n\nReturn only the final translated text. If an image is attached, read the visible text first and translate it.",
    },
  ];

  if (text.trim()) {
    content.push({ type: "input_text", text });
  }

  if (imageDataUrl) {
    content.push({ type: "input_image", image_url: imageDataUrl, detail: "auto" });
  }

  const model = process.env.PANTAVION_TRANSLATION_MODEL ?? "gpt-4o-mini";

  const upstream = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      instructions:
        "You are Pantavion Universal Interpreter. Translate accurately, naturally, and safely. Preserve names, numbers, addresses, urgency, and accessibility needs.",
      input: [
        {
          role: "user",
          content,
        },
      ],
    }),
  });

  const data = await upstream.json().catch(() => null);

  if (!upstream.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: "PANTAVION_TRANSLATION_PROVIDER_ERROR",
        status: upstream.status,
        providerResponse: data,
      },
      { status: 502 },
    );
  }

  const translatedText = extractOpenAiText(data).trim();

  return NextResponse.json({
    ok: true,
    translatedText,
    sourceLanguage: body?.sourceLanguage ?? "auto",
    targetLanguage: body?.targetLanguage ?? "en",
    mode: body?.mode ?? "auto-bidirectional",
    surface: body?.surface ?? "global",
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
  return chunks.join("\n");
}
