import {
  createProviderPendingTranslationResult,
  normalizeTranslationRequest,
  type PantavionTranslationRequest,
  type PantavionTranslationResult,
} from "./pantavion-translation-provider-router";

function decodeHtmlEntities(input: string) {
  return input
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export async function translateWithPantavionPublicTextFallback(
  request: PantavionTranslationRequest,
): Promise<PantavionTranslationResult> {
  const normalized = normalizeTranslationRequest(request);

  if (!normalized.inputText) {
    return createProviderPendingTranslationResult(request);
  }

  if (normalized.sourceLanguage === "auto") {
    return {
      ...createProviderPendingTranslationResult(request),
      message: "Select the source language for live fallback translation.",
    };
  }

  const endpoint = "https://api.mymemory.translated.net/get";
  const url =
    endpoint +
    "?q=" +
    encodeURIComponent(normalized.inputText) +
    "&langpair=" +
    encodeURIComponent(normalized.sourceLanguage + "|" + normalized.targetLanguage);

  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
      headers: {
        Accept: "application/json",
        "User-Agent": "Pantavion/1.0 translation-runtime",
      },
    });

    const data = (await response.json().catch(() => ({}))) as {
      responseData?: { translatedText?: unknown };
      responseStatus?: number;
      responseDetails?: unknown;
    };

    const translatedText =
      typeof data.responseData?.translatedText === "string"
        ? decodeHtmlEntities(data.responseData.translatedText).trim()
        : "";

    if (!response.ok || !translatedText) {
      return {
        ok: false,
        status: "provider_error",
        sourceLanguage: normalized.sourceLanguage,
        targetLanguage: normalized.targetLanguage,
        inputText: normalized.inputText,
        translatedText: "",
        provider: "mymemory_public_fallback",
        providerRequired: true,
        message:
          typeof data.responseDetails === "string"
            ? data.responseDetails
            : "Public translation fallback returned no translated text.",
      };
    }

    return {
      ok: true,
      status: "translated",
      sourceLanguage: normalized.sourceLanguage,
      targetLanguage: normalized.targetLanguage,
      inputText: normalized.inputText,
      translatedText,
      provider: "mymemory_public_fallback",
      providerRequired: false,
      message: "Translated through Pantavion public text fallback.",
    };
  } catch (error) {
    return {
      ok: false,
      status: "provider_error",
      sourceLanguage: normalized.sourceLanguage,
      targetLanguage: normalized.targetLanguage,
      inputText: normalized.inputText,
      translatedText: "",
      provider: "mymemory_public_fallback",
      providerRequired: true,
      message:
        error instanceof Error
          ? error.message
          : "Public translation fallback request failed.",
    };
  }
}
