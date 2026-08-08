export type PantavionSpeechAccessibilityInput = {
  transcript: string;
  language?: string | null;
  accessibilityMode?: boolean;
};

export type PantavionSpeechAccessibilityResult = {
  rawText: string;
  normalizedText: string;
  changed: boolean;
  provider: "local_conservative" | "openai_context_normalizer";
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

async function normalizeWithContextModel(
  rawText: string,
  locallyNormalized: string,
  language: string,
) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const prompt = [
    "You normalize a speech-recognition transcript for accessibility before translation.",
    "The speaker may stutter, repeat words or syllables, pause, or have articulation differences such as difficulty pronouncing r or s sounds.",
    "Preserve the intended meaning, names, numbers, negation, tense, and important wording.",
    "Remove only obvious disfluency repetitions and correct only high-confidence transcription noise when surrounding context makes the intended word clear.",
    "Do not diagnose the speaker. Do not rewrite style. Do not invent missing facts.",
    "If uncertain, keep the original wording rather than guessing.",
    "Return only the normalized transcript, with no explanation.",
    `Language hint: ${language || "auto"}`,
    "Raw transcript:",
    rawText,
    "Conservative local normalization:",
    locallyNormalized,
  ].join("\n");

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

    return normalized;
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

  const contextual = await normalizeWithContextModel(
    rawText,
    locallyNormalized || rawText,
    String(input.language || "auto"),
  );
  const normalizedText = contextual || locallyNormalized || rawText;

  return {
    rawText,
    normalizedText,
    changed: normalizedText !== rawText,
    provider: contextual ? "openai_context_normalizer" : "local_conservative",
  };
}

export const pantavionSpeechAccessibilityPolicy = {
  id: "pantavion_speech_accessibility_v1",
  stutterTolerance: true,
  articulationVariationTolerance: true,
  preserveRawTranscript: true,
  preserveMeaningOverFluency: true,
  neverDiagnoseSpeaker: true,
  neverGuessWhenAmbiguous: true,
  sharedAcrossTranslationSocialChatVoiceVideo: true,
} as const;
