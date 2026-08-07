import { NextResponse } from "next/server";
import {
  buildPantavionTranslationPrompt,
  pantavionUniversalTranslationContract,
  type PantavionTranslationRequest,
} from "@/core/translation/pantavion-universal-translation-runtime";
import { translateWithPantavionProvider } from "@/core/translation/pantavion-translation-provider-adapters";
import { translateWithPantavionPublicTextFallback } from "@/core/translation/pantavion-public-text-fallback";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function responseForResult(result: Awaited<ReturnType<typeof translateWithPantavionProvider>>) {
  return NextResponse.json(result, {
    status: result.ok ? 200 : result.status === "provider_pending" ? 503 : 502,
  });
}

async function translateThroughPantavionFallbacks(input: {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  sessionId: string | null;
}) {
  const request = {
    text: input.text,
    sourceLanguage: input.sourceLanguage,
    targetLanguage: input.targetLanguage,
    mode: "text" as const,
    sessionId: input.sessionId,
  };

  const configuredResult = await translateWithPantavionProvider(request).catch(() => null);
  if (configuredResult?.ok && configuredResult.translatedText.trim()) {
    return configuredResult;
  }

  const publicFallback = await translateWithPantavionPublicTextFallback(request);
  if (publicFallback.ok && publicFallback.translatedText.trim()) {
    return publicFallback;
  }

  return publicFallback;
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
    publicTextFallback: true,
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  const sourceLanguage = asString(
    body.sourceLanguage,
    asString(body.from, "auto"),
  );
  const targetLanguage = asString(
    body.targetLanguage,
    asString(body.to, "en"),
  );
  const text = asString(body.text);
  const sessionId = asString(body.sessionId) || null;

  if (!text.trim()) {
    return NextResponse.json({ ok: false, error: "Missing text." }, { status: 400 });
  }

  if (!targetLanguage.trim()) {
    return NextResponse.json({ ok: false, error: "Missing target language." }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    const result = await translateThroughPantavionFallbacks({
      text,
      sourceLanguage,
      targetLanguage,
      sessionId,
    });
    return responseForResult(result);
  }

  const translationRequest: PantavionTranslationRequest = {
    text,
    sourceLanguage,
    targetLanguage,
    domain: asString(body.domain, "general") as PantavionTranslationRequest["domain"],
    tone: asString(body.tone, "natural") as PantavionTranslationRequest["tone"],
    bidirectional: Boolean(body.bidirectional ?? true),
  };

  try {
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
      signal: AbortSignal.timeout(15000),
    });

    const payload = await providerResponse.json().catch(() => ({}));

    const translatedText =
      payload.output_text ||
      payload.output
        ?.flatMap((item: any) => item.content || [])
        ?.map((content: any) => content.text || "")
        ?.join("\n")
        ?.trim() ||
      "";

    if (providerResponse.ok && translatedText) {
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
  } catch {
    // Fall through to the real text provider path below.
  }

  const fallbackResult = await translateThroughPantavionFallbacks({
    text,
    sourceLanguage,
    targetLanguage,
    sessionId,
  });

  return responseForResult(fallbackResult);
}
