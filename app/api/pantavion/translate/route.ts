import { NextResponse } from "next/server";
import { generateText } from "ai";
import {
  pantavionUniversalTranslationContract,
  type PantavionTranslationRequest,
} from "@/core/translation/pantavion-universal-translation-runtime";
import {
  buildPantavionGatewayModelPlan,
} from "@/core/translation/pantavion-gateway-resilience";
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

const GATEWAY_HEDGE_DELAY_MS = 2_000;
const GATEWAY_TOTAL_TIMEOUT_MS = 35_000;

type GatewayAttempt = {
  lane: "primary" | "hedge";
  model: string;
  ok: boolean;
  durationMs?: number;
  errorClass?: string;
  errorCode?: string;
  httpStatus?: number;
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

function safeGatewayFailure(error: unknown): Omit<GatewayAttempt, "lane" | "model" | "ok"> {
  if (!error || typeof error !== "object") {
    return { errorClass: "unknown_gateway_error" };
  }

  const candidate = error as {
    name?: unknown;
    status?: unknown;
    statusCode?: unknown;
    code?: unknown;
    cause?: { status?: unknown; statusCode?: unknown; code?: unknown; name?: unknown };
  };

  const statusValue = candidate.status ?? candidate.statusCode ?? candidate.cause?.status ?? candidate.cause?.statusCode;
  const parsedStatus = typeof statusValue === "number" ? statusValue : Number(statusValue);
  const codeValue = candidate.code ?? candidate.cause?.code;
  const classValue = candidate.name ?? candidate.cause?.name;

  return {
    errorClass: typeof classValue === "string" && classValue ? classValue : "gateway_request_failed",
    errorCode: typeof codeValue === "string" && codeValue ? codeValue.slice(0, 80) : undefined,
    httpStatus: Number.isFinite(parsedStatus) ? parsedStatus : undefined,
  };
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

function gatewayModelPlan() {
  return buildPantavionGatewayModelPlan(
    [
      process.env.PANTAVION_TRANSLATION_GATEWAY_MODEL,
      process.env.PANTAVION_TRANSLATION_MODEL,
      process.env.PANTAVION_TRANSLATION_FALLBACK_MODEL,
      process.env.PANTAVION_TRANSLATION_SECONDARY_MODEL,
    ],
    process.env.PANTAVION_TRANSLATION_GATEWAY_MODELS,
  );
}

function providerNamespace(model: string) {
  const slash = model.indexOf("/");
  return slash > 0 ? model.slice(0, slash).toLowerCase() : "unknown";
}

function chooseHedgeModel(models: string[], primaryModel: string) {
  const primaryProvider = providerNamespace(primaryModel);
  return (
    models.find(
      (model) => model !== primaryModel && providerNamespace(model) !== primaryProvider,
    ) || models.find((model) => model !== primaryModel)
  );
}

async function delayWithAbort(delayMs: number, signal: AbortSignal) {
  if (delayMs <= 0) return;
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, delayMs);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };
    if (signal.aborted) return onAbort();
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

async function runGatewayLane(input: {
  lane: "primary" | "hedge";
  model: string;
  fallbackModels: string[];
  delayMs: number;
  request: PantavionTranslationRequest;
  signal: AbortSignal;
  attempts: GatewayAttempt[];
}) {
  await delayWithAbort(input.delayMs, input.signal);
  const startedAt = Date.now();

  try {
    const result = await generateText({
      model: input.model,
      prompt: strictTranslationPrompt(input.request),
      temperature: 0,
      maxRetries: 2,
      abortSignal: input.signal,
      providerOptions: {
        gateway: {
          models: input.fallbackModels,
          tags: ["feature:translation", "runtime:pantavion", `lane:${input.lane}`],
        },
      },
    });

    const translatedText = String(result.text || "").trim();
    if (!translatedText) throw new Error("empty_translation");

    input.attempts.push({
      lane: input.lane,
      model: input.model,
      ok: true,
      durationMs: Date.now() - startedAt,
    });

    return {
      translatedText,
      model: input.model,
      lane: input.lane,
    };
  } catch (error) {
    if (!input.signal.aborted) {
      input.attempts.push({
        lane: input.lane,
        model: input.model,
        ok: false,
        durationMs: Date.now() - startedAt,
        ...safeGatewayFailure(error),
      });
    }
    throw error;
  }
}

async function translateWithGateway(request: PantavionTranslationRequest) {
  if (!(await pantavionGatewayRuntimeAvailable())) {
    return { result: null, attempts: [] as GatewayAttempt[], runtimeAvailable: false };
  }

  const plan = gatewayModelPlan();
  const attempts: GatewayAttempt[] = [];
  const primaryModel = plan.primaryModel;
  const hedgeModel = chooseHedgeModel(plan.orderedModels, primaryModel);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GATEWAY_TOTAL_TIMEOUT_MS);

  const lanes = [
    runGatewayLane({
      lane: "primary",
      model: primaryModel,
      fallbackModels: plan.orderedModels.filter((model) => model !== primaryModel),
      delayMs: 0,
      request,
      signal: controller.signal,
      attempts,
    }),
    ...(hedgeModel
      ? [
          runGatewayLane({
            lane: "hedge" as const,
            model: hedgeModel,
            fallbackModels: plan.orderedModels.filter((model) => model !== hedgeModel),
            delayMs: GATEWAY_HEDGE_DELAY_MS,
            request,
            signal: controller.signal,
            attempts,
          }),
        ]
      : []),
  ];

  try {
    const winner = await Promise.any(lanes);
    controller.abort();
    return {
      result: {
        ok: true as const,
        status: "translated" as const,
        contract: pantavionUniversalTranslationContract,
        input: request,
        translatedText: winner.translatedText,
        provider: "vercel_ai_gateway",
        model: winner.model,
        executionLane: winner.lane,
        generatedAt: new Date().toISOString(),
      },
      attempts,
      runtimeAvailable: true,
    };
  } catch {
    return { result: null, attempts, runtimeAvailable: true };
  } finally {
    clearTimeout(timeout);
    controller.abort();
  }
}

export async function GET() {
  const languageRuntime = await getPantavionLanguageRuntimeSnapshot();
  const providerStatus = getPantavionTranslationProviderStatus();
  const plan = gatewayModelPlan();
  return NextResponse.json({
    ok: languageRuntime.capabilities.some(
      (capability) => capability.capability === "text_translation" && capability.available,
    ),
    contract: pantavionUniversalTranslationContract,
    gatewayPreferred: languageRuntime.gatewayRuntimeAvailable,
    gatewayFailover: {
      nativeModelFallback: true,
      modelCount: plan.orderedModels.length,
      hedged: plan.orderedModels.length > 1,
      hedgeDelayMs: GATEWAY_HEDGE_DELAY_MS,
      totalTimeoutMs: GATEWAY_TOTAL_TIMEOUT_MS,
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
