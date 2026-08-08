import { generateText } from "ai";
import { gateway } from "@ai-sdk/gateway";

export type PantavionSpeechAccessibilityInput = {
  transcript: string;
  language?: string | null;
  accessibilityMode?: boolean;
};

export type PantavionSpeechAccessibilityResult = {
  rawText: string;
  normalizedText: string;
  changed: boolean;
  provider: "local_conservative" | "vercel_ai_gateway_context_normalizer" | "openai_context_normalizer";
};

function collapseExactRepeatedWords(text: string) {
  const words = text.split(/(\s+)/);
  const output: string[] = [];
  let lastWord = "";

  for (const token of words) {
    if (/^\s+$/.test(token)) {
      if (output.length && output[output.length - 1] !== " ") output.push(" ");
      continue;
    }

    const comparable = token
      .toLocaleLowerCase()
      .replace(/^[\p{P}\p{S}]+|[\p{P}\p{S}]+$/gu, "");

    if (comparable && comparable === lastWord) continue;
    output.push(token);
    if (comparable) lastWord = comparable;
  }

  return output.join("").replace(/\s+/g, " ").trim();
}

export function normalizeSpeechTranscriptConservatively(transcript: string) {
  const clean = String(transcript || "").replace(/\s+/g, " ").trim();
  if (!clean) return "";

  return collapseExactRepeatedWords(clean)
    .replace(/\b([\p{L}])(?:\s*-\s*\1){1,}\s*-\s*([\p{L}])/giu, "$1$2")
    .replace(/\s+([,.;!?])/g, "$1")
    .trim();
}

function textFromResponsesPayload(payload: any) {
  return String(
    payload?.output_text ||
      payload?.output
        ?.flatMap((item: any) => item?.content || [])
        ?.map((content: any) => content?.text || "")
        ?.join("\n") ||
      "",
  ).trim();
}

function buildContextNormalizationPrompt(rawText: string, locallyNormalized: string, language: string) {
  return [
    "You are Pantavion Speech Understanding Core.",
    "Normalize a speech-recognition transcript before translation.",
    "The speaker may stutter, repeat words or syllables, pause, speak quickly, use a regional accent or dialect, or have articulation differences such as difficulty pronouncing r or s sounds.",
    "The selected language hint is authoritative unless the transcript clearly contains code-switching.",
    "Preserve the intended meaning, names, numbers, negation, tense, and important wording.",
    "Remove only obvious disfluency repetitions.",
    "Correct transcription noise only when the surrounding context makes the intended wording high-confidence.",
    "Do not rewrite style, summarize, translate, diagnose the speaker, or invent missing facts.",
    "If a word is genuinely ambiguous, keep the original wording rather than guessing.",
    "Return only the normalized transcript, with no explanation or labels.",
    `Language hint: ${language || "auto"}`,
    "Raw transcript:",
    rawText,
    "Conservative local normalization:",
    locallyNormalized,
  ].join("\n");
}

async function normalizeWithGateway(rawText: string, locallyNormalized: string, language: string) {
  const models = Array.from(
    new Set(
      [
        process.env.PANTAVION_SPEECH_NORMALIZATION_GATEWAY_MODEL,
        process.env.PANTAVION_SPEECH_NORMALIZATION_MODEL,
        "openai/gpt-4.1-mini",
      ].filter((value): value is string => Boolean(value)),
    ),
  );

  const prompt = buildContextNormalizationPrompt(rawText, locallyNormalized, language);

  for (const model of models) {
    try {
      const result = await generateText({
        model: gateway(model),
        prompt,
        temperature: 0,
        maxRetries: 2,
      });
      const normalized = String(result.text || "").replace(/\s+/g, " ").trim();
      if (normalized) return normalized;
    } catch {
      // Try next approved Gateway model, then direct OpenAI fallback below.
    }
  }

  return null;
}

async function normalizeWithDirectOpenAI(rawText: string, locallyNormalized: string, language: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const prompt = buildContextNormalizationPrompt(rawText, locallyNormalized, language);

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.PANTAVION_SPEECH_NORMALIZATION_MODEL || "gpt-4.1-mini",
        input: prompt,
      }),
      signal: AbortSignal.timeout(12_000),
    });

    const payload = await response.json().catch(() => ({}));
    const normalized = textFromResponsesPayload(payload);
    if (!response.ok || !normalized) return null;

    return normalized.replace(/\s+/g, " ").trim();
  } catch {
    return null;
  }
}

export async function normalizePantavionAccessibleSpeechTranscript(
  input: PantavionSpeechAccessibilityInput,
): Promise<PantavionSpeechAccessibilityResult> {
  const rawText = String(input.transcript || "").replace(/\s+/g, " ").trim();
  const locallyNormalized = normalizeSpeechTranscriptConservatively(rawText);

  if (!rawText || input.accessibilityMode === false) {
    return {
      rawText,
      normalizedText: rawText,
      changed: false,
      provider: "local_conservative",
    };
  }

  const language = String(input.language || "auto");
  const gatewayNormalized = await normalizeWithGateway(rawText, locallyNormalized || rawText, language);
  if (gatewayNormalized) {
    return {
      rawText,
      normalizedText: gatewayNormalized,
      changed: gatewayNormalized !== rawText,
      provider: "vercel_ai_gateway_context_normalizer",
    };
  }

  const directOpenAiNormalized = await normalizeWithDirectOpenAI(
    rawText,
    locallyNormalized || rawText,
    language,
  );
  if (directOpenAiNormalized) {
    return {
      rawText,
      normalizedText: directOpenAiNormalized,
      changed: directOpenAiNormalized !== rawText,
      provider: "openai_context_normalizer",
    };
  }

  return {
    rawText,
    normalizedText: locallyNormalized || rawText,
    changed: (locallyNormalized || rawText) !== rawText,
    provider: "local_conservative",
  };
}

export const pantavionSpeechAccessibilityPolicy = {
  id: "pantavion_speech_accessibility_v2",
  gatewayContextNormalizerPreferred: true,
  stutterTolerance: true,
  articulationVariationTolerance: true,
  accentAndDialectTolerance: true,
  preserveRawTranscript: true,
  preserveMeaningOverFluency: true,
  neverDiagnoseSpeaker: true,
  neverGuessWhenAmbiguous: true,
  sharedAcrossTranslationSocialChatVoiceVideo: true,
} as const;
