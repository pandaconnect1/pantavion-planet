import { generateText } from "ai";

export type PersonalAITransliteration = "none" | "greeklish" | "other" | "greeklish_possible";

export type PersonalAILanguageUnderstanding = {
  originalText: string;
  normalizedText: string;
  detectedLanguage: string | null;
  codeSwitching: boolean;
  transliteration: PersonalAITransliteration;
  normalizationApplied: boolean;
  ambiguityPreserved: boolean;
  confidence: number;
  provider: string;
  providerAuth: "api_key" | "vercel_oidc" | "none";
  preservedOriginal: true;
  translated: false;
  integrityAccepted: boolean;
};

type ProviderShape = {
  normalizedText?: unknown;
  detectedLanguage?: unknown;
  codeSwitching?: unknown;
  transliteration?: unknown;
  ambiguityPreserved?: unknown;
  confidence?: unknown;
};

type UnderstandOptions = {
  userId: string;
  languageHint?: string | null;
};

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.normalize("NFKC").replace(/\s+/g, " ").trim().slice(0, maxLength) : "";
}

function normalizeLanguage(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase().replace(/_/g, "-");
  if (!/^[a-z]{2,3}(?:-[a-z0-9]{2,8})?$/i.test(normalized)) return null;
  return normalized.slice(0, 24);
}

function detectScriptLanguage(text: string) {
  if (/\p{Script=Greek}/u.test(text)) return "el";
  if (/\p{Script=Cyrillic}/u.test(text)) return "ru";
  if (/\p{Script=Arabic}/u.test(text)) return "ar";
  if (/\p{Script=Hebrew}/u.test(text)) return "he";
  if (/\p{Script=Hiragana}|\p{Script=Katakana}/u.test(text)) return "ja";
  if (/\p{Script=Hangul}/u.test(text)) return "ko";
  if (/\p{Script=Devanagari}/u.test(text)) return "hi";
  if (/\p{Script=Han}/u.test(text)) return "zh";
  return null;
}

function looksLikeGreeklish(text: string) {
  if (/\p{Script=Greek}/u.test(text)) return false;
  const tokens = text
    .toLocaleLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  const markers = new Set([
    "kai", "den", "nai", "einai", "thelo", "thelw", "pame", "synexise", "sinehise",
    "kane", "kano", "pos", "pws", "gia", "apo", "mou", "sou", "sto", "stin", "sthn",
    "alla", "oraia", "wraia", "prepei", "mporei", "exei", "echo", "exw", "tora", "twra",
  ]);
  let score = 0;
  for (const token of tokens) if (markers.has(token)) score += 1;
  return score >= 3;
}

function protectedTokens(text: string) {
  return text.match(/https?:\/\/\S+|\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b|\b\d+(?:[.,:]\d+)*\b/gi) || [];
}

function integrityAccepted(original: string, normalized: string) {
  if (!normalized) return false;
  const ratio = normalized.length / Math.max(1, original.length);
  if (ratio < 0.35 || ratio > 2.5) return false;
  return protectedTokens(original).every((token) => normalized.includes(token));
}

function extractJsonObject(text: string): ProviderShape | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const parsed: unknown = JSON.parse(text.slice(start, end + 1));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as ProviderShape;
  } catch {
    return null;
  }
}

function clampConfidence(value: unknown) {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) return 0.5;
  return Math.min(1, Math.max(0, number));
}

function transliterationValue(value: unknown): PersonalAITransliteration {
  if (value === "greeklish" || value === "other" || value === "none") return value;
  return "none";
}

function localFallback(originalText: string): PersonalAILanguageUnderstanding {
  const detectedLanguage = detectScriptLanguage(originalText);
  return {
    originalText,
    normalizedText: originalText,
    detectedLanguage,
    codeSwitching: false,
    transliteration: looksLikeGreeklish(originalText) ? "greeklish_possible" : "none",
    normalizationApplied: false,
    ambiguityPreserved: true,
    confidence: detectedLanguage ? 0.85 : 0.4,
    provider: "local_conservative",
    providerAuth: "none",
    preservedOriginal: true,
    translated: false,
    integrityAccepted: true,
  };
}

function buildPrompt(originalText: string, languageHint: string | null) {
  return [
    "You are Pantavion Human Language Understanding (HLU), a conservative meaning-normalization layer.",
    "Return one JSON object only. Do not use markdown or commentary.",
    "Your job is to understand natural user writing before the main Personal AI answers it.",
    "The user may use spelling mistakes, missing accents, abbreviations, slang, dialect, incomplete grammar, mixed languages, code-switching, or transliteration such as Greeklish.",
    "Preserve intended meaning exactly. Never add facts, requests, permissions or intent that are not present.",
    "Never translate the message into another language. Mixed-language segments must remain in their original languages.",
    "Preserve names, usernames, URLs, email addresses, numbers, dates, money amounts, negation, tense and modality.",
    "Correct or normalize only when high-confidence from context. If wording is genuinely ambiguous, keep the ambiguous original wording instead of guessing and set ambiguityPreserved=true.",
    "For Romanized Greek/Greeklish, transliterate into Greek script only when it is clearly Greek. Do not reinterpret ordinary English or another Latin-script language as Greek.",
    "normalizedText must contain the same message and intent, only made easier for downstream understanding.",
    "detectedLanguage should be a primary ISO/BCP-47 language code when reasonably known. If multiple languages are materially used, set codeSwitching=true and detectedLanguage to the dominant language or null if none dominates.",
    "transliteration must be one of: none, greeklish, other.",
    "confidence must be a number from 0 to 1.",
    "JSON schema: {\"normalizedText\":string,\"detectedLanguage\":string|null,\"codeSwitching\":boolean,\"transliteration\":\"none\"|\"greeklish\"|\"other\",\"ambiguityPreserved\":boolean,\"confidence\":number}",
    `Language hint: ${languageHint || "auto"}`,
    "Original user text:",
    originalText,
  ].join("\n");
}

export async function understandPersonalAIText(
  input: string,
  options: UnderstandOptions,
): Promise<PersonalAILanguageUnderstanding> {
  const originalText = cleanText(input, 30_000);
  if (!originalText) return localFallback("");

  const hasApiKey = Boolean(process.env.AI_GATEWAY_API_KEY?.trim());
  const hasOidc = Boolean(process.env.VERCEL_OIDC_TOKEN?.trim());
  const providerAuth: "api_key" | "vercel_oidc" | "none" = hasApiKey ? "api_key" : hasOidc ? "vercel_oidc" : "none";
  if (providerAuth === "none" || originalText.length > 8_000 || process.env.PANTAVION_HLU_ENABLED === "false") {
    return localFallback(originalText);
  }

  const model = process.env.PANTAVION_HLU_MODEL?.trim() || "openai/gpt-4.1-mini";
  try {
    const result = await generateText({
      model,
      prompt: buildPrompt(originalText, normalizeLanguage(options.languageHint)),
      temperature: 0,
      maxRetries: 1,
      providerOptions: {
        gateway: {
          user: options.userId,
          tags: ["pantavion-personal-ai", "human-language-understanding"],
          disallowPromptTraining: true,
        },
      },
    });

    const parsed = extractJsonObject(result.text || "");
    if (!parsed) return localFallback(originalText);

    const candidate = cleanText(parsed.normalizedText, 30_000);
    const accepted = integrityAccepted(originalText, candidate);
    const normalizedText = accepted ? candidate : originalText;
    const detectedLanguage = normalizeLanguage(parsed.detectedLanguage) || detectScriptLanguage(originalText);

    return {
      originalText,
      normalizedText,
      detectedLanguage,
      codeSwitching: parsed.codeSwitching === true,
      transliteration: transliterationValue(parsed.transliteration),
      normalizationApplied: accepted && normalizedText !== originalText,
      ambiguityPreserved: parsed.ambiguityPreserved === true || !accepted,
      confidence: accepted ? clampConfidence(parsed.confidence) : 0.35,
      provider: `vercel-ai-gateway:${model}`,
      providerAuth,
      preservedOriginal: true,
      translated: false,
      integrityAccepted: accepted,
    };
  } catch {
    return localFallback(originalText);
  }
}
