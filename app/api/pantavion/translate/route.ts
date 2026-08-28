import { NextResponse } from "next/server";
import { generateText } from "ai";
import {
  pantavionUniversalTranslationContract,
  type PantavionTranslationRequest,
} from "@/core/translation/pantavion-universal-translation-runtime";
import {
  getPantavionTranslationProviderStatus,
  translateWithPantavionProvider,
} from "@/core/translation/pantavion-translation-provider-adapters";
import {
  getPantavionLanguageRuntimeSnapshot,
  pantavionGatewayRuntimeAvailable,
  pantavionPublicTranslationFallbackAllowed,
} from "@/core/translation/pantavion-language-provider-runtime";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const GATEWAY_ROUND_BUDGETS_MS = [18_000, 12_000] as const;

type GatewayAttempt = {
  round: number;
  model: string;
  ok: boolean;
  errorClass?: string;
  errorCode?: string;
  httpStatus?: number;
};

type GatewayRoundPlan = {
  primaryModel: string;
  fallbackModels: string[];
};

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

function safeGatewayFailure(error: unknown): Omit<GatewayAttempt, "round" | "model" | "ok"> {
  if (!error || typeof error !== "object") {
    return { errorClass: "unknown_gateway_error" };
  }

  const candidate = error as {
    name?: unknown;
    status?: unknown;
    statusCode?: unknown;
    code?: unknown;
    cause?: { status?: unknown; statusCode?: unknown; code?: unknown };
  };

  const statusValue = candidate.status ?? candidate.statusCode ?? candidate.cause?.status ?? candidate.cause?.statusCode;
  const parsedStatus = typeof statusValue === "number" ? statusValue : Number(statusValue);
  const codeValue = candidate.code ?? candidate.cause?.code;

  return {
    errorClass: typeof candidate.name === "string" && candidate.name ? candidate.name : "gateway_request_failed",
    errorCode: typeof codeValue === "string" && codeValue ? codeValue.slice(0, 80) : undefined,
    httpStatus: Number.isFinite(parsedStatus) ? parsedStatus : undefined,
  };
}

function retryableGatewayFailure(failure: ReturnType<typeof safeGatewayFailure>) {
  if (failure.httpStatus === undefined) return true;
  return [408, 425, 429, 500, 502, 503, 504].includes(failure.httpStatus);
}

function gatewayModelPlan() {
  const configured = [
    process.env.PANTAVION_TRANSLATION_GATEWAY_MODEL,
    process.env.PANTAVION_TRANSLATION_MODEL,
    process.env.PANTAVION_TRANSLATION_FALLBACK_MODEL,
    process.env.PANTAVION_TRANSLATION_SECONDARY_MODEL,
  ]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));

  // Defaults are current AI Gateway model IDs verified against Vercel documentation.
  // Environment configuration always has priority; the defaults provide provider
  // diversity so one provider outage does not make translation unavailable.
  const ordered = Array.from(
    new Set([
      ...configured,
      "openai/gpt-5.6-sol",
      "google/gemini-3.6-flash",
      "anthropic/claude-sonnet-5",
    ]),
  );

  return {
    primaryModel: ordered[0],
    fallbackModels: ordered.slice(1),
  };
}

function gatewayModelRounds(): GatewayRoundPlan[] {
  const first = gatewayModelPlan();
  const ordered = [first.primaryModel, ...first.fallbackModels];
  const secondPrimary = ordered[1] ?? ordered[0];
  const secondFallbacks = ordered.length > 1
    ? [...ordered.slice(2), ordered[0]]
    : [];

  return [
    first,
    {
      primaryModel: secondPrimary,
      fallbackModels: secondFallbacks,
    },
  ];
}

function resolvedGatewayModel(providerMetadata: unknown, fallback: string) {
  if (!providerMetadata || typeof providerMetadata !== "object") return fallback;
  const gateway = (providerMetadata as Record<string, unknown>).gateway;
  if (!gateway || typeof gateway !== "object") return fallback;
  const routing = (gateway as Record<string, unknown>).routing;
  if (!routing || typeof routing !== "object") return fallback;

  const routingRecord = routing as Record<string, unknown>;
  const candidate = routingRecord.modelId ?? routingRecord.model ?? routingRecord.canonicalSlug;
  return typeof candidate === "string" && candidate.trim() ? candidate : fallback;
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

  try {
    return await translateWithPantavionProvider(request);
  } catch (error) {
    console.warn("pantavion_translation_provider_exception", {
      sourceLanguage: input.sourceLanguage,
      targetLanguage: input.targetLanguage,
      errorClass: error instanceof Error ? error.name : "provider_exception",
    });
    return null;
  }
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

async function runGatewayRound(input: {
  request: PantavionTranslationRequest;
  plan: GatewayRoundPlan;
  round: number;
  roundBudgetMs: number;
}) {
  try {
    const result = await generateText({
      model: input.plan.primaryModel,
      prompt: strictTranslationPrompt(input.request),
      temperature: 0,
      // AI Gateway performs provider/model failover inside each request. A second
      // bounded outer round handles transient gateway-level 5xx/429/network failures
      // with a rotated primary rather than repeating the same first hop.
      maxRetries: 0,
      abortSignal: AbortSignal.timeout(input.roundBudgetMs),
      providerOptions: {
        gateway: {
          models: input.plan.fallbackModels,
          tags: ["feature:translation", "env:production", "runtime:pantavion"],
        },
      },
    });

    const translatedText = String(result.text || "").trim();
    const servedModel = resolvedGatewayModel(result.providerMetadata, input.plan.primaryModel);

    if (!translatedText) {
      return {
        result: null,
        attempt: {
          round: input.round,
          model: servedModel,
          ok: false,
          errorClass: "empty_translation",
        } satisfies GatewayAttempt,
        retryable: true,
      };
    }

    return {
      result: {
        ok: true as const,
        status: "translated" as const,
        contract: pantavionUniversalTranslationContract,
        input: input.request,
        translatedText,
        provider: "vercel_ai_gateway",
        model: servedModel,
        generatedAt: new Date().toISOString(),
      },
      attempt: {
        round: input.round,
        model: servedModel,
        ok: true,
      } satisfies GatewayAttempt,
      retryable: false,
    };
  } catch (error) {
    const failure = safeGatewayFailure(error);
    return {
      result: null,
      attempt: {
        round: input.round,
        model: `${input.plan.primaryModel} + ${input.plan.fallbackModels.join(" + ")}`,
        ok: false,
        ...failure,
      } satisfies GatewayAttempt,
      retryable: retryableGatewayFailure(failure),
    };
  }
}

async function translateWithGateway(request: PantavionTranslationRequest) {
  if (!(await pantavionGatewayRuntimeAvailable())) {
    return { result: null, attempts: [] as GatewayAttempt[], runtimeAvailable: false };
  }

  const rounds = gatewayModelRounds();
  const attempts: GatewayAttempt[] = [];

  for (let roundIndex = 0; roundIndex < rounds.length; roundIndex += 1) {
    const outcome = await runGatewayRound({
      request,
      plan: rounds[roundIndex],
      round: roundIndex + 1,
      roundBudgetMs: GATEWAY_ROUND_BUDGETS_MS[roundIndex] ?? 10_000,
    });
    attempts.push(outcome.attempt);

    if (outcome.result) {
      return { result: outcome.result, attempts, runtimeAvailable: true };
    }
    if (!outcome.retryable) break;
  }

  return { result: null, attempts, runtimeAvailable: true };
}

export async function GET() {
  const languageRuntime = await getPantavionLanguageRuntimeSnapshot();
  const providerStatus = getPantavionTranslationProviderStatus();
  const modelPlan = gatewayModelPlan();
  const rounds = gatewayModelRounds();

  return NextResponse.json({
    ok: languageRuntime.capabilities.some(
      (capability) => capability.capability === "text_translation" && capability.available,
    ),
    contract: pantavionUniversalTranslationContract,
    gatewayPreferred: languageRuntime.gatewayRuntimeAvailable,
    gatewayFailover: {
      nativeModelFallback: true,
      modelCount: 1 + modelPlan.fallbackModels.length,
      boundedGatewayRounds: rounds.length,
      roundBudgetsMs: GATEWAY_ROUND_BUDGETS_MS,
      rotatedPrimaryOnRetry: true,
    },
    strictLanguageRouting: true,
    publicTextFallback: languageRuntime.publicFallbackAllowed,
    providerStatus: {
      provider: providerStatus.provider,
      endpointConfigured: providerStatus.endpointConfigured,
      apiKeyConfigured: providerStatus.apiKeyConfigured,
    },
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

  const gateway = await translateWithGateway(translationRequest);
  if (gateway.result) return NextResponse.json(gateway.result);

  const providerStatus = getPantavionTranslationProviderStatus();
  const publicFallbackAllowed = pantavionPublicTranslationFallbackAllowed();
  const configuredProviderAllowed =
    providerStatus.provider !== "mymemory" || publicFallbackAllowed;

  const configuredResult = configuredProviderAllowed
    ? await translateThroughConfiguredProvider({
        text,
        sourceLanguage,
        targetLanguage,
        sessionId,
      })
    : null;

  if (configuredResult?.ok && configuredResult.translatedText.trim()) {
    return responseForResult(configuredResult);
  }

  const diagnostic = {
    event: "pantavion_translation_exhausted",
    sourceLanguage,
    targetLanguage,
    gatewayRuntimeAvailable: gateway.runtimeAvailable,
    gatewayAttempts: gateway.attempts,
    configuredProvider: providerStatus.provider,
    configuredProviderEndpoint: providerStatus.endpointConfigured,
    configuredProviderApiKey: providerStatus.apiKeyConfigured,
    configuredProviderAllowed,
    publicFallbackAllowed,
    configuredProviderStatus: configuredResult?.status || "exception_or_unavailable",
  };

  console.warn("pantavion_translation_exhausted", diagnostic);

  return NextResponse.json(
    {
      ok: false,
      status: "provider_unavailable",
      translatedText: "",
      sourceLanguage,
      targetLanguage,
      providerRequired: true,
      message: "The live translation provider is temporarily unavailable. Please retry.",
      diagnostic: {
        gatewayRuntimeAvailable: gateway.runtimeAvailable,
        gatewayAttempts: gateway.attempts,
        configuredProvider: providerStatus.provider,
        configuredProviderAllowed,
        publicFallbackAllowed,
        configuredProviderStatus: configuredResult?.status || "unavailable",
      },
    },
    { status: 503 },
  );
}
