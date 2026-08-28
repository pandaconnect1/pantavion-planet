import { NextResponse } from "next/server";
import { generateText } from "ai";
import {
  pantavionUniversalTranslationContract,
  type PantavionTranslationRequest,
} from "@/core/translation/pantavion-universal-translation-runtime";
import {
  buildPantavionGatewayModelPlan,
  type PantavionGatewayLanePlan,
} from "@/core/translation/pantavion-gateway-resilience";
import {
  getPantavionGatewayRateLimitCircuit,
  isPantavionGatewayRateLimitFailure,
  markPantavionGatewayRateLimited,
  type PantavionGatewayFailure,
} from "@/core/translation/pantavion-gateway-rate-limit";
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

const GATEWAY_HEDGE_DELAY_MS = 4_500;
const GATEWAY_TOTAL_TIMEOUT_MS = 36_000;
const GATEWAY_LANE_RETRIES = 1;

type GatewayFailureCause = PantavionGatewayFailure;

type GatewayAttempt = GatewayFailureCause & {
  lane: PantavionGatewayLanePlan["id"];
  model: string;
  ok: boolean;
  durationMs?: number;
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

function safeFailureCause(error: unknown): GatewayFailureCause {
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

function safeGatewayFailure(error: unknown): GatewayFailureCause {
  const primary = safeFailureCause(error);
  if (!error || typeof error !== "object") return primary;

  const errors = (error as { errors?: unknown }).errors;
  if (!Array.isArray(errors)) return primary;

  const causes = errors.slice(0, 6).map((item) => safeFailureCause(item));
  return causes.length > 0 ? { ...primary, causes } : primary;
}

function gatewayModelPlan() {
  return buildPantavionGatewayModelPlan([
    process.env.PANTAVION_TRANSLATION_GATEWAY_MODEL,
    process.env.PANTAVION_TRANSLATION_MODEL,
    process.env.PANTAVION_TRANSLATION_FALLBACK_MODEL,
    process.env.PANTAVION_TRANSLATION_SECONDARY_MODEL,
  ]);
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

function combinedAbortSignal(signals: AbortSignal[]) {
  const controller = new AbortController();
  const abort = () => {
    if (!controller.signal.aborted) controller.abort();
  };

  for (const signal of signals) {
    if (signal.aborted) {
      abort();
      break;
    }
    signal.addEventListener("abort", abort, { once: true });
  }

  return controller.signal;
}

async function delayWithAbort(delayMs: number, signal: AbortSignal) {
  if (delayMs <= 0) return;
  if (signal.aborted) throw new DOMException("Aborted", "AbortError");

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, delayMs);

    const onAbort = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", onAbort);
      reject(new DOMException("Aborted", "AbortError"));
    };

    signal.addEventListener("abort", onAbort, { once: true });
  });
}

async function runGatewayLane(input: {
  request: PantavionTranslationRequest;
  lane: PantavionGatewayLanePlan;
  delayMs: number;
  globalSignal: AbortSignal;
  laneController: AbortController;
  attempts: GatewayAttempt[];
  onGatewayRateLimit: (lane: PantavionGatewayLanePlan["id"], failure: GatewayFailureCause) => void;
}) {
  const signal = combinedAbortSignal([input.globalSignal, input.laneController.signal]);
  await delayWithAbort(input.delayMs, signal);

  const startedAt = Date.now();
  try {
    const result = await generateText({
      model: input.lane.primaryModel,
      prompt: strictTranslationPrompt(input.request),
      temperature: 0,
      maxRetries: GATEWAY_LANE_RETRIES,
      abortSignal: signal,
      providerOptions: {
        gateway: {
          models: input.lane.fallbackModels,
          tags: [
            "feature:translation",
            "env:production",
            "runtime:pantavion",
            `lane:${input.lane.id}`,
          ],
        },
      },
    });

    const translatedText = String(result.text || "").trim();
    const servedModel = resolvedGatewayModel(result.providerMetadata, input.lane.primaryModel);
    const durationMs = Date.now() - startedAt;

    if (!translatedText) {
      const emptyError = new Error("empty_translation");
      emptyError.name = "empty_translation";
      throw emptyError;
    }

    input.attempts.push({
      lane: input.lane.id,
      model: servedModel,
      ok: true,
      durationMs,
    });

    return {
      translatedText,
      servedModel,
      lane: input.lane.id,
    };
  } catch (error) {
    if (!input.laneController.signal.aborted) {
      const failure = safeGatewayFailure(error);
      input.attempts.push({
        lane: input.lane.id,
        model: `${input.lane.primaryModel} + ${input.lane.fallbackModels.join(" + ")}`,
        ok: false,
        durationMs: Date.now() - startedAt,
        ...failure,
      });
      if (isPantavionGatewayRateLimitFailure(failure)) {
        input.onGatewayRateLimit(input.lane.id, failure);
      }
    }
    throw error;
  }
}

async function translateWithGateway(request: PantavionTranslationRequest) {
  if (!(await pantavionGatewayRuntimeAvailable())) {
    return {
      result: null,
      attempts: [] as GatewayAttempt[],
      runtimeAvailable: false,
      rateLimitCircuit: getPantavionGatewayRateLimitCircuit(),
    };
  }

  const existingCircuit = getPantavionGatewayRateLimitCircuit();
  if (existingCircuit.open) {
    return {
      result: null,
      attempts: [] as GatewayAttempt[],
      runtimeAvailable: true,
      rateLimitCircuit: existingCircuit,
    };
  }

  const modelPlan = gatewayModelPlan();
  const attempts: GatewayAttempt[] = [];
  if (modelPlan.lanes.length === 0) {
    return {
      result: null,
      attempts,
      runtimeAvailable: true,
      rateLimitCircuit: getPantavionGatewayRateLimitCircuit(),
    };
  }

  const globalSignal = AbortSignal.timeout(GATEWAY_TOTAL_TIMEOUT_MS);
  const laneControllers = modelPlan.lanes.map(() => new AbortController());

  const onGatewayRateLimit = (lane: PantavionGatewayLanePlan["id"]) => {
    markPantavionGatewayRateLimited();
    if (lane === "primary" && laneControllers[1]) {
      laneControllers[1].abort();
    }
  };

  try {
    const winner = await Promise.any(
      modelPlan.lanes.map((lane, index) =>
        runGatewayLane({
          request,
          lane,
          delayMs: index === 0 ? 0 : GATEWAY_HEDGE_DELAY_MS,
          globalSignal,
          laneController: laneControllers[index],
          attempts,
          onGatewayRateLimit,
        }),
      ),
    );

    laneControllers.forEach((controller) => controller.abort());

    return {
      result: {
        ok: true as const,
        status: "translated" as const,
        contract: pantavionUniversalTranslationContract,
        input: request,
        translatedText: winner.translatedText,
        provider: "vercel_ai_gateway",
        model: winner.servedModel,
        executionLane: winner.lane,
        generatedAt: new Date().toISOString(),
      },
      attempts,
      runtimeAvailable: true,
      rateLimitCircuit: getPantavionGatewayRateLimitCircuit(),
    };
  } catch {
    laneControllers.forEach((controller) => controller.abort());
    return {
      result: null,
      attempts,
      runtimeAvailable: true,
      rateLimitCircuit: getPantavionGatewayRateLimitCircuit(),
    };
  }
}

export async function GET() {
  const languageRuntime = await getPantavionLanguageRuntimeSnapshot();
  const providerStatus = getPantavionTranslationProviderStatus();
  const modelPlan = gatewayModelPlan();

  return NextResponse.json({
    ok: languageRuntime.capabilities.some(
      (capability) => capability.capability === "text_translation" && capability.available,
    ),
    contract: pantavionUniversalTranslationContract,
    gatewayPreferred: languageRuntime.gatewayRuntimeAvailable,
    gatewayFailover: {
      nativeModelFallback: true,
      modelCount: modelPlan.orderedModels.length,
      hedgedLanes: modelPlan.lanes.length,
      hedgeDelayMs: GATEWAY_HEDGE_DELAY_MS,
      perLaneRetries: GATEWAY_LANE_RETRIES,
      totalTimeoutMs: GATEWAY_TOTAL_TIMEOUT_MS,
      rateLimitCircuit: getPantavionGatewayRateLimitCircuit(),
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
    gatewayRateLimitCircuit: gateway.rateLimitCircuit,
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
      status: gateway.rateLimitCircuit.open ? "gateway_rate_limited" : "provider_unavailable",
      translatedText: "",
      sourceLanguage,
      targetLanguage,
      providerRequired: true,
      retryAfterMs: gateway.rateLimitCircuit.remainingMs || undefined,
      message: gateway.rateLimitCircuit.open
        ? "The private translation gateway is temporarily rate limited. Please retry after the cooldown."
        : "The live translation provider is temporarily unavailable. Please retry.",
      diagnostic: {
        gatewayRuntimeAvailable: gateway.runtimeAvailable,
        gatewayAttempts: gateway.attempts,
        gatewayRateLimitCircuit: gateway.rateLimitCircuit,
        configuredProvider: providerStatus.provider,
        configuredProviderAllowed,
        publicFallbackAllowed,
        configuredProviderStatus: configuredResult?.status || "unavailable",
      },
    },
    { status: 503 },
  );
}
