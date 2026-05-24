import { NextResponse } from "next/server";
import {
  buildPantavionTranslationPrompt,
  createProviderPendingTranslation,
  pantavionUniversalTranslationContract,
  type PantavionTranslationRequest,
} from "@/core/translation/pantavion-universal-translation-runtime";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    contract: pantavionUniversalTranslationContract,
    providerConfigured: Boolean(process.env.OPENAI_API_KEY),
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  const translationRequest: PantavionTranslationRequest = {
    text: asString(body.text),
    sourceLanguage: asString(body.sourceLanguage, "auto-detect"),
    targetLanguage: asString(body.targetLanguage, "Greek"),
    domain: asString(body.domain, "general") as PantavionTranslationRequest["domain"],
    tone: asString(body.tone, "natural") as PantavionTranslationRequest["tone"],
    bidirectional: Boolean(body.bidirectional),
  };

  if (!translationRequest.text.trim()) {
    return NextResponse.json({ ok: false, error: "Missing text." }, { status: 400 });
  }

  if (!translationRequest.targetLanguage.trim()) {
    return NextResponse.json({ ok: false, error: "Missing targetLanguage." }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(createProviderPendingTranslation(translationRequest), { status: 503 });
  }

  const prompt = buildPantavionTranslationPrompt(translationRequest);

  const providerResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.PANTAVION_TRANSLATION_MODEL || "gpt-4.1-mini",
      input: prompt,
    }),
  });

  const payload = await providerResponse.json();

  if (!providerResponse.ok) {
    return NextResponse.json(
      {
        ok: false,
        status: "provider_error",
        contract: pantavionUniversalTranslationContract,
        error: payload.error?.message || "Translation provider error.",
      },
      { status: 502 },
    );
  }

  const translatedText =
    payload.output_text ||
    payload.output?.flatMap((item: any) => item.content || [])
      ?.map((content: any) => content.text || "")
      ?.join("\n")
      ?.trim() ||
    "";

  return NextResponse.json({
    ok: true,
    status: "translated",
    contract: pantavionUniversalTranslationContract,
    input: translationRequest,
    translatedText,
    provider: "openai_responses",
    model: process.env.PANTAVION_TRANSLATION_MODEL || "gpt-4.1-mini",
    generatedAt: new Date().toISOString(),
  });
}
