import { NextResponse } from "next/server";
import {
  buildPantavionTranslationPrompt,
  pantavionUniversalTranslationContract,
  type PantavionTranslationRequest,
} from "@/core/translation/pantavion-universal-translation-runtime";
import { translateWithPantavionProvider } from "@/core/translation/pantavion-translation-provider-adapters";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    contract: pantavionUniversalTranslationContract,
    providerConfigured: Boolean(
      process.env.OPENAI_API_KEY ||
        process.env.PANTAVION_TRANSLATE_ENDPOINT ||
        process.env.PANTAVION_TRANSLATE_PROVIDER,
    ),
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  // The public /translate UI historically sends from/to while the API contract
  // used sourceLanguage/targetLanguage. Accept both so bidirectional translation
  // uses the languages the user actually selected.
  const sourceLanguage = asString(
    body.sourceLanguage,
    asString(body.from, "auto"),
  );
  const targetLanguage = asString(
    body.targetLanguage,
    asString(body.to, "en"),
  );
  const text = asString(body.text);

  if (!text.trim()) {
    return NextResponse.json({ ok: false, error: "Missing text." }, { status: 400 });
  }

  if (!targetLanguage.trim()) {
    return NextResponse.json({ ok: false, error: "Missing target language." }, { status: 400 });
  }

  // Use the configured OpenAI translation route when available because it can
  // handle broader language/context requests. Otherwise use Pantavion's real
  // provider adapter/fallback runtime.
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    const result = await translateWithPantavionProvider({
      text,
      sourceLanguage,
      targetLanguage,
      mode: "text",
      sessionId: asString(body.sessionId) || null,
    });

    return NextResponse.json(result, {
      status: result.ok ? 200 : result.status === "provider_pending" ? 503 : 502,
    });
  }

  const translationRequest: PantavionTranslationRequest = {
    text,
    sourceLanguage,
    targetLanguage,
    domain: asString(body.domain, "general") as PantavionTranslationRequest["domain"],
    tone: asString(body.tone, "natural") as PantavionTranslationRequest["tone"],
    bidirectional: Boolean(body.bidirectional ?? true),
  };

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

  const payload = await providerResponse.json().catch(() => ({}));

  if (!providerResponse.ok) {
    return NextResponse.json(
      {
        ok: false,
        status: "provider_error",
        contract: pantavionUniversalTranslationContract,
        error: payload?.error?.message || "Translation provider error.",
      },
      { status: 502 },
    );
  }

  const translatedText =
    payload.output_text ||
    payload.output
      ?.flatMap((item: any) => item.content || [])
      ?.map((content: any) => content.text || "")
      ?.join("\n")
      ?.trim() ||
    "";

  if (!translatedText) {
    return NextResponse.json(
      {
        ok: false,
        status: "provider_error",
        error: "Translation provider returned no text.",
      },
      { status: 502 },
    );
  }

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
