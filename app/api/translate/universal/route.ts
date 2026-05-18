import { NextResponse } from "next/server";
import {
  createProviderPendingTranslationResult,
  normalizeTranslationRequest,
  type PantavionTranslationRequest,
} from "@/core/translation/pantavion-translation-provider-router";

export const runtime = "nodejs";

async function callConfiguredTranslationProvider(
  request: PantavionTranslationRequest
) {
  const endpoint = process.env.PANTAVION_TRANSLATE_ENDPOINT;

  if (!endpoint) {
    return createProviderPendingTranslationResult(request);
  }

  const normalized = normalizeTranslationRequest(request);

  if (!normalized.inputText) {
    return createProviderPendingTranslationResult(request);
  }

  const apiKey = process.env.PANTAVION_TRANSLATE_API_KEY;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({
      q: normalized.inputText,
      text: normalized.inputText,
      source: normalized.sourceLanguage === "auto" ? "auto" : normalized.sourceLanguage,
      target: normalized.targetLanguage,
      format: "text",
      api_key: apiKey || undefined,
    }),
  });

  const data = await response.json().catch(() => ({}));

  const translatedText =
    data.translatedText ||
    data.translation ||
    data.text ||
    data.output ||
    data?.data?.translations?.[0]?.translatedText ||
    "";

  if (!response.ok || !translatedText) {
    return {
      ok: false,
      status: "provider_error" as const,
      sourceLanguage: normalized.sourceLanguage,
      targetLanguage: normalized.targetLanguage,
      inputText: normalized.inputText,
      translatedText: "",
      provider: endpoint,
      providerRequired: true,
      message:
        typeof data?.message === "string"
          ? data.message
          : "Configured translation provider did not return translated text.",
    };
  }

  return {
    ok: true,
    status: "translated" as const,
    sourceLanguage: normalized.sourceLanguage,
    targetLanguage: normalized.targetLanguage,
    inputText: normalized.inputText,
    translatedText: String(translatedText),
    provider: endpoint,
    providerRequired: false,
    message: "Translated through configured PantaTranslate provider.",
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PantavionTranslationRequest;
    const result = await callConfiguredTranslationProvider(body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        status: "provider_error",
        message: error instanceof Error ? error.message : "Translation request failed.",
      },
      { status: 500 }
    );
  }
}
