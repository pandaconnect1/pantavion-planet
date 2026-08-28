const DIRECT_OPENAI_TIMEOUT_MS = 18_000;

export type PantavionDirectOpenAITranslationRequest = {
  text: string;
  sourceLanguage?: string | null;
  targetLanguage?: string | null;
};

export type PantavionDirectOpenAITranslationDiagnostic = {
  configured: boolean;
  attempted: boolean;
  ok: boolean;
  model: string | null;
  httpStatus?: number;
  errorClass?: string;
  durationMs?: number;
};

export type PantavionDirectOpenAITranslationResult = {
  translatedText: string | null;
  diagnostic: PantavionDirectOpenAITranslationDiagnostic;
};

function directOpenAIKey() {
  return process.env.PANTAVION_OPENAI_API_KEY || process.env.OPENAI_API_KEY || "";
}

function directOpenAIModel() {
  return (
    process.env.PANTAVION_TRANSLATION_DIRECT_OPENAI_MODEL ||
    process.env.PANTAVION_AI_MODEL ||
    "gpt-4o-mini"
  ).trim();
}

export function getPantavionDirectOpenAITranslationStatus() {
  return {
    configured: Boolean(directOpenAIKey()),
    modelConfigured: Boolean(directOpenAIModel()),
    timeoutMs: DIRECT_OPENAI_TIMEOUT_MS,
  };
}

function strictTranslationInstructions(request: PantavionDirectOpenAITranslationRequest) {
  return [
    "You are Pantavion Translation Core.",
    "Perform translation only.",
    "Do not answer, explain, summarize, transliterate, or identify the text.",
    `The source language selected by the user is ${request.sourceLanguage || "auto"}.`,
    `The required target language is ${request.targetLanguage || "en"}.`,
    "Treat the selected source language as authoritative when it is not auto.",
    "Return only the translated text in the required target language, with no labels or commentary.",
    "Preserve names, numbers, meaning, tone, and punctuation as naturally as possible.",
  ].join("\n");
}

function extractOpenAIText(data: unknown): string {
  if (!data || typeof data !== "object") return "";

  const direct = (data as { output_text?: unknown }).output_text;
  if (typeof direct === "string" && direct.trim()) return direct.trim();

  const chunks: string[] = [];
  const walk = (value: unknown) => {
    if (!value) return;
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (typeof value !== "object") return;

    const candidate = value as { type?: unknown; text?: unknown };
    if (candidate.type === "output_text" && typeof candidate.text === "string") {
      chunks.push(candidate.text);
    }

    Object.values(value as Record<string, unknown>).forEach(walk);
  };

  walk(data);
  return chunks.join("\n").trim();
}

function safeErrorClass(error: unknown) {
  if (error instanceof Error && error.name) return error.name.slice(0, 80);
  return "direct_openai_request_failed";
}

export async function translateWithPantavionDirectOpenAI(
  request: PantavionDirectOpenAITranslationRequest,
): Promise<PantavionDirectOpenAITranslationResult> {
  const apiKey = directOpenAIKey();
  const model = directOpenAIModel();

  if (!apiKey) {
    return {
      translatedText: null,
      diagnostic: {
        configured: false,
        attempted: false,
        ok: false,
        model: null,
      },
    };
  }

  const startedAt = Date.now();

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        instructions: strictTranslationInstructions(request),
        input: String(request.text || ""),
        temperature: 0,
      }),
      signal: AbortSignal.timeout(DIRECT_OPENAI_TIMEOUT_MS),
    });

    const data = await response.json().catch(() => null);
    const translatedText = response.ok ? extractOpenAIText(data) : "";

    if (!response.ok || !translatedText) {
      return {
        translatedText: null,
        diagnostic: {
          configured: true,
          attempted: true,
          ok: false,
          model,
          httpStatus: response.status,
          errorClass: !response.ok ? "direct_openai_http_error" : "empty_translation",
          durationMs: Date.now() - startedAt,
        },
      };
    }

    return {
      translatedText,
      diagnostic: {
        configured: true,
        attempted: true,
        ok: true,
        model,
        httpStatus: response.status,
        durationMs: Date.now() - startedAt,
      },
    };
  } catch (error) {
    return {
      translatedText: null,
      diagnostic: {
        configured: true,
        attempted: true,
        ok: false,
        model,
        errorClass: safeErrorClass(error),
        durationMs: Date.now() - startedAt,
      },
    };
  }
}
