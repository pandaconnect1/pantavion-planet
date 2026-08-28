import {
  createProviderPendingTranslationResult,
  normalizeTranslationRequest,
  type PantavionTranslationRequest,
  type PantavionTranslationResult,
} from "./pantavion-translation-provider-router";
import {
  getPantavionDirectOpenAITranslationStatus,
  translateWithPantavionDirectOpenAI,
} from "./pantavion-direct-openai-translation";

type ProviderName =
  | "generic"
  | "libretranslate"
  | "deepl"
  | "azure"
  | "google"
  | "openai"
  | "mymemory";

function providerName(): ProviderName {
  const raw = (process.env.PANTAVION_TRANSLATE_PROVIDER || "").toLowerCase();

  if (
    raw === "libretranslate" ||
    raw === "deepl" ||
    raw === "azure" ||
    raw === "google" ||
    raw === "openai" ||
    raw === "mymemory" ||
    raw === "generic"
  ) {
    return raw;
  }

  if (process.env.PANTAVION_TRANSLATE_ENDPOINT) return "generic";
  if (getPantavionDirectOpenAITranslationStatus().configured) return "openai";
  return "mymemory";
}

function endpointFor(provider: ProviderName) {
  if (process.env.PANTAVION_TRANSLATE_ENDPOINT) {
    return process.env.PANTAVION_TRANSLATE_ENDPOINT;
  }

  if (provider === "deepl") {
    return process.env.DEEPL_TRANSLATE_ENDPOINT || "https://api-free.deepl.com/v2/translate";
  }

  if (provider === "google") {
    return "https://translation.googleapis.com/language/translate/v2";
  }

  if (provider === "azure") {
    return (
      process.env.AZURE_TRANSLATOR_ENDPOINT ||
      "https://api.cognitive.microsofttranslator.com"
    );
  }

  if (provider === "openai") {
    return "https://api.openai.com/v1/responses";
  }

  if (provider === "mymemory") {
    return "https://api.mymemory.translated.net/get";
  }

  return "";
}

function apiKeyFor(provider: ProviderName) {
  const explicitPantavionOverride = process.env.PANTAVION_TRANSLATE_API_KEY || "";
  if (explicitPantavionOverride) return explicitPantavionOverride;

  if (provider === "deepl") return process.env.DEEPL_API_KEY || "";
  if (provider === "google") return process.env.GOOGLE_TRANSLATE_API_KEY || "";
  if (provider === "azure") return process.env.AZURE_TRANSLATOR_KEY || "";
  if (provider === "openai") {
    return process.env.PANTAVION_OPENAI_API_KEY || process.env.OPENAI_API_KEY || "";
  }

  return "";
}

function envStatus() {
  const provider = providerName();
  const endpoint = endpointFor(provider);
  const apiKey = apiKeyFor(provider);

  return {
    provider,
    endpoint,
    hasApiKey: Boolean(apiKey),
    azureRegion: process.env.AZURE_TRANSLATOR_REGION || "",
  };
}

function extractTranslatedText(data: unknown): string {
  const value = data as {
    translatedText?: unknown;
    translation?: unknown;
    text?: unknown;
    output?: unknown;
    responseData?: { translatedText?: unknown };
    translations?: Array<{ text?: unknown; translatedText?: unknown }>;
    data?: { translations?: Array<{ translatedText?: unknown }> };
  };

  const direct =
    value.translatedText ||
    value.translation ||
    value.text ||
    value.output ||
    value.responseData?.translatedText ||
    value.translations?.[0]?.text ||
    value.translations?.[0]?.translatedText ||
    value.data?.translations?.[0]?.translatedText ||
    "";

  return typeof direct === "string" ? direct : "";
}

function decodeHtmlEntities(input: string) {
  return input
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

async function callLibreTranslate(
  request: PantavionTranslationRequest,
  endpoint: string,
  apiKey: string
): Promise<PantavionTranslationResult> {
  const normalized = normalizeTranslationRequest(request);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      q: normalized.inputText,
      source: normalized.sourceLanguage === "auto" ? "auto" : normalized.sourceLanguage,
      target: normalized.targetLanguage,
      format: "text",
      api_key: apiKey || undefined,
    }),
  });

  const data = await response.json().catch(() => ({}));
  const translatedText = extractTranslatedText(data);

  if (!response.ok || !translatedText) {
    return providerError(request, "libretranslate", endpoint, data);
  }

  return providerOk(request, "libretranslate", endpoint, translatedText);
}

async function callDeepL(
  request: PantavionTranslationRequest,
  endpoint: string,
  apiKey: string
): Promise<PantavionTranslationResult> {
  if (!apiKey) return createProviderPendingTranslationResult(request);

  const normalized = normalizeTranslationRequest(request);
  const body = new URLSearchParams();

  body.set("text", normalized.inputText);
  body.set("target_lang", normalized.targetLanguage.toUpperCase());

  if (normalized.sourceLanguage !== "auto") {
    body.set("source_lang", normalized.sourceLanguage.toUpperCase());
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: "DeepL-Auth-Key " + apiKey,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const data = await response.json().catch(() => ({}));
  const translatedText = extractTranslatedText(data);

  if (!response.ok || !translatedText) {
    return providerError(request, "deepl", endpoint, data);
  }

  return providerOk(request, "deepl", endpoint, translatedText);
}

async function callGoogle(
  request: PantavionTranslationRequest,
  endpoint: string,
  apiKey: string
): Promise<PantavionTranslationResult> {
  if (!apiKey) return createProviderPendingTranslationResult(request);

  const normalized = normalizeTranslationRequest(request);
  const url = endpoint.includes("?")
    ? endpoint + "&key=" + encodeURIComponent(apiKey)
    : endpoint + "?key=" + encodeURIComponent(apiKey);

  const body: Record<string, string> = {
    q: normalized.inputText,
    target: normalized.targetLanguage,
    format: "text",
  };

  if (normalized.sourceLanguage !== "auto") {
    body.source = normalized.sourceLanguage;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  const translatedText = decodeHtmlEntities(extractTranslatedText(data));

  if (!response.ok || !translatedText) {
    return providerError(request, "google", endpoint, data);
  }

  return providerOk(request, "google", endpoint, translatedText);
}

async function callAzure(
  request: PantavionTranslationRequest,
  endpoint: string,
  apiKey: string
): Promise<PantavionTranslationResult> {
  if (!apiKey) return createProviderPendingTranslationResult(request);

  const normalized = normalizeTranslationRequest(request);
  const params = new URLSearchParams();

  params.set("api-version", "3.0");
  params.set("to", normalized.targetLanguage);

  if (normalized.sourceLanguage !== "auto") {
    params.set("from", normalized.sourceLanguage);
  }

  const url = endpoint.replace(/\/$/, "") + "/translate?" + params.toString();

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": apiKey,
      ...(process.env.AZURE_TRANSLATOR_REGION
        ? { "Ocp-Apim-Subscription-Region": process.env.AZURE_TRANSLATOR_REGION }
        : {}),
      "Content-Type": "application/json",
    },
    body: JSON.stringify([{ text: normalized.inputText }]),
  });

  const data = await response.json().catch(() => ({}));
  const translatedText = Array.isArray(data)
    ? String(data?.[0]?.translations?.[0]?.text || "")
    : extractTranslatedText(data);

  if (!response.ok || !translatedText) {
    return providerError(request, "azure", endpoint, data);
  }

  return providerOk(request, "azure", endpoint, translatedText);
}

async function callOpenAI(
  request: PantavionTranslationRequest,
): Promise<PantavionTranslationResult> {
  const normalized = normalizeTranslationRequest(request);
  const direct = await translateWithPantavionDirectOpenAI({
    text: normalized.inputText,
    sourceLanguage: normalized.sourceLanguage,
    targetLanguage: normalized.targetLanguage,
  });

  if (direct.translatedText) {
    return providerOk(
      request,
      "openai",
      "direct-openai-responses",
      direct.translatedText,
    );
  }

  if (!direct.diagnostic.configured) {
    return createProviderPendingTranslationResult(request);
  }

  return providerError(request, "openai", "direct-openai-responses", {
    message: direct.diagnostic.httpStatus
      ? `Direct private AI provider returned HTTP ${direct.diagnostic.httpStatus}.`
      : "Direct private AI provider did not return translated text.",
  });
}

async function callMyMemory(
  request: PantavionTranslationRequest,
  endpoint: string
): Promise<PantavionTranslationResult> {
  const normalized = normalizeTranslationRequest(request);

  if (normalized.sourceLanguage === "auto") {
    return {
      ...createProviderPendingTranslationResult(request),
      message:
        "Automatic source-language detection requires a configured provider. Select the source language for the public text fallback.",
    };
  }

  const url =
    endpoint +
    "?q=" +
    encodeURIComponent(normalized.inputText) +
    "&langpair=" +
    encodeURIComponent(normalized.sourceLanguage + "|" + normalized.targetLanguage);

  const response = await fetch(url, { method: "GET" });
  const data = await response.json().catch(() => ({}));
  const translatedText = decodeHtmlEntities(extractTranslatedText(data));

  if (!response.ok || !translatedText) {
    return providerError(request, "mymemory", endpoint, data);
  }

  return providerOk(request, "mymemory", endpoint, translatedText);
}

async function callGeneric(
  request: PantavionTranslationRequest,
  endpoint: string,
  apiKey: string
): Promise<PantavionTranslationResult> {
  if (!endpoint) return createProviderPendingTranslationResult(request);

  const normalized = normalizeTranslationRequest(request);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: "Bearer " + apiKey } : {}),
    },
    body: JSON.stringify({
      q: normalized.inputText,
      text: normalized.inputText,
      source: normalized.sourceLanguage,
      sourceLanguage: normalized.sourceLanguage,
      target: normalized.targetLanguage,
      targetLanguage: normalized.targetLanguage,
      mode: normalized.mode,
      sessionId: normalized.sessionId,
      format: "text",
      api_key: apiKey || undefined,
    }),
  });

  const data = await response.json().catch(() => ({}));
  const translatedText = extractTranslatedText(data);

  if (!response.ok || !translatedText) {
    return providerError(request, "generic", endpoint, data);
  }

  return providerOk(request, "generic", endpoint, translatedText);
}

function providerOk(
  request: PantavionTranslationRequest,
  provider: string,
  endpoint: string,
  translatedText: string
): PantavionTranslationResult {
  const normalized = normalizeTranslationRequest(request);

  return {
    ok: true,
    status: "translated",
    sourceLanguage: normalized.sourceLanguage,
    targetLanguage: normalized.targetLanguage,
    inputText: normalized.inputText,
    translatedText,
    provider,
    providerRequired: false,
    message: "Translated through " + provider + " provider.",
  };
}

function providerError(
  request: PantavionTranslationRequest,
  provider: string,
  endpoint: string,
  data: unknown
): PantavionTranslationResult {
  const normalized = normalizeTranslationRequest(request);
  const payload = data as { message?: unknown; error?: { message?: unknown } };

  return {
    ok: false,
    status: "provider_error",
    sourceLanguage: normalized.sourceLanguage,
    targetLanguage: normalized.targetLanguage,
    inputText: normalized.inputText,
    translatedText: "",
    provider,
    providerRequired: true,
    message:
      typeof payload?.message === "string"
        ? payload.message
        : typeof payload?.error?.message === "string"
          ? payload.error.message
          : "Translation provider returned no translated text.",
  };
}

export function getPantavionTranslationProviderStatus() {
  const status = envStatus();

  return {
    ok: Boolean(
      status.endpoint ||
      status.provider === "google" ||
      status.provider === "deepl" ||
      status.provider === "azure" ||
      status.provider === "openai" ||
      status.provider === "mymemory"
    ),
    provider: status.provider,
    endpointConfigured: Boolean(status.endpoint),
    apiKeyConfigured: status.hasApiKey,
    azureRegionConfigured: Boolean(status.azureRegion),
    supportedProviders: [
      "generic",
      "libretranslate",
      "deepl",
      "azure",
      "google",
      "openai",
      "mymemory",
    ],
    requiredEnv: [
      "PANTAVION_TRANSLATE_PROVIDER",
      "PANTAVION_TRANSLATE_ENDPOINT",
      "PANTAVION_TRANSLATE_API_KEY",
      "PANTAVION_OPENAI_API_KEY",
      "OPENAI_API_KEY",
      "PANTAVION_TRANSLATION_DIRECT_OPENAI_MODEL",
      "DEEPL_API_KEY",
      "GOOGLE_TRANSLATE_API_KEY",
      "AZURE_TRANSLATOR_KEY",
      "AZURE_TRANSLATOR_REGION"
    ],
  };
}

export async function translateWithPantavionProvider(
  request: PantavionTranslationRequest
): Promise<PantavionTranslationResult> {
  const normalized = normalizeTranslationRequest(request);

  if (!normalized.inputText) {
    return createProviderPendingTranslationResult(request);
  }

  const provider = providerName();
  const endpoint = endpointFor(provider);
  const apiKey = apiKeyFor(provider);

  if (provider === "deepl") return callDeepL(request, endpoint, apiKey);
  if (provider === "google") return callGoogle(request, endpoint, apiKey);
  if (provider === "azure") return callAzure(request, endpoint, apiKey);
  if (provider === "openai") return callOpenAI(request);
  if (provider === "libretranslate") return callLibreTranslate(request, endpoint, apiKey);
  if (provider === "mymemory") return callMyMemory(request, endpoint);

  return callGeneric(request, endpoint, apiKey);
}
