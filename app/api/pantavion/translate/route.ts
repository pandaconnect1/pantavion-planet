import { NextResponse } from "next/server";
import { generateText } from "ai";
import { gateway } from "@ai-sdk/gateway";
import {
  pantavionUniversalTranslationContract,
  type PantavionTranslationRequest,
} from "@/core/translation/pantavion-universal-translation-runtime";
import { translateWithPantavionProvider } from "@/core/translation/pantavion-translation-provider-adapters";
import {
  getPantavionLanguageRuntimeSnapshot,
  pantavionGatewayRuntimeAvailable,
} from "@/core/translation/pantavion-language-provider-runtime";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function normalizeLanguage(value: string, fallback: string) {
  const normalized = value.trim().replace(/_/g, "-");
  return normalized || fallback;
}

function baseLanguage(value: string) {
  return value.toLowerCase().split("-")[0];
}

function responseForResult(result: Awaited<ReturnType<typeof translateWithPantavionProvider>>) {
  return NextResponse.json(result, {
    status: result.ok ? 200 : result.status === "provider_pending" ? 503 : 502,
  });
}

async function translateThroughConfiguredProvider(input: {
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

  return translateWithPantavionProvider(request).catch(() => null);
}

function strictTranslationPrompt(request: PantavionTranslationRequest) {
  return [
    "You are Pantavion Translation Core.",
    "Perform translation only. Do not answer, explain, summarize, transliterate, or identify the text.",
    `The source language selected by the user is ${request.sourceLanguage || "auto"}.`,
    `The required target language is ${request.targetLanguage}.`,
    "Treat the user-selected source language as authoritative when it is not auto.",
    "Return only the translated text in the required target language, with no labels or commentary.",
    "Preserve names, numbers, meaning, tone, and punctuation as naturally as possible.",
    "If the input already appears to be in the target language, return a faithful target-language rendering rather than switching to a third language.",
    "",
    "TEXT TO TRANSLATE:",
    request.text,
  ].join("\n");
}

async function translateWithGateway(request: PantavionTranslationRequest) {
  if (!(await pantavionGatewayRuntimeAvailable())) return null;

  const models = Array.from(
    new Set(
      [
        process.env.PANTAVION_TRANSLATION_GATEWAY_MODEL,
        process.env.PANTAVION_TRANSLATION_MODEL,
        "openai/gpt-4.1-mini",
      ].filter((value): value is string => Boolean(value)),
    ),
  );

  for (const model of models) {
    try {
      const result = await generateText({
        model: gateway(model),
        prompt: strictTranslationPrompt(request),
        temperature: 0,
        maxRetries: 1,
        abortSignal: AbortSignal.timeout(20_000),
      });
      const translatedText = String(result.text || "").trim();
      if (!translatedText) continue;

      return {
        ok: true as const,
        status: "translated" as const,
        contract: pantavionUniversalTranslationContract,
        input: request,
        translatedText,
        provider: "vercel_ai_gateway",
        model,
        generatedAt: new Date().toISOString(),
      };
    } catch {
      // Try the next approved Gateway model.
    }
  }

  return null;
}

export async function GET() {
  const languageRuntime = await getPantavionLanguageRuntimeSnapshot();
  return NextResponse.json({
    ok: languageRuntime.capabilities.some(
      (capability) => capability.capability === "text_translation" && capability.available,
    ),
    contract: pantavionUniversalTranslationContract,
    gatewayPreferred: languageRuntime.gatewayRuntimeAvailable,
    strictLanguageRouting: true,
    publicTextFallback: false,
    languageRuntime,
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  const sourceLanguage = normalizeLanguage(
    asString(body.sourceLanguage, asString(body.from, "auto")),
    "auto",
  );
  const targetLanguage = normalizeLanguage(
    asString(body.targetLanguage, asString(body.to, "en")),
    "en",
  );
  const text = asString(body.text).trim();
  const sessionId = asString(body.sessionId) || null;

  if (!text) {
    return NextResponse.json({ ok: false, error: "Missing text." }, { status: 400 });
  }

  if (!targetLanguage) {
    return NextResponse.json({ ok: false, error: "Missing target language." }, { status: 400 });
  }

  if (sourceLanguage !== "auto" && baseLanguage(sourceLanguage) === baseLanguage(targetLanguage)) {
    return NextResponse.json({
      ok: true,
      status: "translated",
      contract: pantavionUniversalTranslationContract,
      input: { text, sourceLanguage, targetLanguage },
      translatedText: text,
      provider: "pantavion_same_language",
      generatedAt: new Date().toISOString(),
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

  const gatewayResult = await translateWithGateway(translationRequest);
  if (gatewayResult) return NextResponse.json(gatewayResult);

  const configuredResult = await translateThroughConfiguredProvider({
    text,
    sourceLanguage,
    targetLanguage,
    sessionId,
  });
  if (configuredResult?.ok && configuredResult.translatedText.trim()) {
    return responseForResult(configuredResult);
  }

  return NextResponse.json(
    {
      ok: false,
      status: "provider_unavailable",
      translatedText: "",
      sourceLanguage,
      targetLanguage,
      providerRequired: true,
      message: "No approved Pantavion translation provider completed this language pair.",
    },
    { status: 503 },
  );
}
