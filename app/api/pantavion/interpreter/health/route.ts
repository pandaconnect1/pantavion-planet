import { NextResponse } from "next/server";
import { generateText } from "ai";
import {
  getPantavionTranslationProviderStatus,
  translateWithPantavionProvider,
} from "@/core/translation/pantavion-translation-provider-adapters";
import {
  getPantavionLanguageRuntimeSnapshot,
  pantavionPublicTranslationFallbackAllowed,
} from "@/core/translation/pantavion-language-provider-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const HEALTH_SCHEMA = "interpreter-20260814-v1";

type ProviderProbe = {
  ready: boolean;
  diagnostic: string;
  provider: string | null;
  model?: string;
  status?: number | null;
};

async function probeGateway(gatewayRuntimeAvailable: boolean): Promise<ProviderProbe> {
  if (!gatewayRuntimeAvailable) {
    return { ready: false, diagnostic: "gateway_not_available", provider: null };
  }

  const models = Array.from(
    new Set(
      [
        process.env.PANTAVION_TRANSLATION_GATEWAY_MODEL,
        process.env.PANTAVION_TRANSLATION_MODEL,
        "openai/gpt-4.1-mini",
      ].filter((value): value is string => Boolean(value)),
    ),
  );

  for (const model of models) {
    try {
      const result = await generateText({
        model,
        prompt: [
          "Pantavion Interpreter production health probe.",
          "Return exactly: ok",
        ].join("\n"),
        temperature: 0,
        maxRetries: 1,
        abortSignal: AbortSignal.timeout(10_000),
      });

      if (String(result.text || "").trim().toLowerCase() === "ok") {
        return {
          ready: true,
          diagnostic: "gateway_ready",
          provider: "vercel_ai_gateway",
          model,
        };
      }
    } catch {
      // Try the next configured gateway model before falling back to the
      // provider adapter used by the canonical translation runtime.
    }
  }

  return {
    ready: false,
    diagnostic: "gateway_error",
    provider: "vercel_ai_gateway",
  };
}

async function probeConfiguredProvider(): Promise<ProviderProbe> {
  const providerStatus = getPantavionTranslationProviderStatus();
  const publicFallbackAllowed = pantavionPublicTranslationFallbackAllowed();

  if (!providerStatus.ok) {
    return { ready: false, diagnostic: "provider_not_configured", provider: null };
  }

  if (providerStatus.provider === "mymemory" && !publicFallbackAllowed) {
    return {
      ready: false,
      diagnostic: "provider_not_configured",
      provider: "mymemory",
    };
  }

  try {
    const result = await translateWithPantavionProvider({
      text: "Pantavion interpreter health probe",
      sourceLanguage: "en",
      targetLanguage: "el",
      mode: "text",
      sessionId: "pantavion-interpreter-health",
    });

    return {
      ready: Boolean(result.ok && result.translatedText.trim()),
      diagnostic: result.ok ? "configured_provider_ready" : result.status,
      provider: providerStatus.provider,
    };
  } catch {
    return {
      ready: false,
      diagnostic: "provider_unreachable",
      provider: providerStatus.provider,
    };
  }
}

export async function GET() {
  const revision = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA ?? null;
  const languageRuntime = await getPantavionLanguageRuntimeSnapshot();

  const gatewayProbe = await probeGateway(languageRuntime.gatewayRuntimeAvailable);
  const configuredProbe = gatewayProbe.ready ? null : await probeConfiguredProvider();
  const provider = gatewayProbe.ready ? gatewayProbe : configuredProbe ?? gatewayProbe;

  const translationCapability = languageRuntime.capabilities.find(
    (capability) => capability.capability === "text_translation",
  );
  const transcriptionCapability = languageRuntime.capabilities.find(
    (capability) => capability.capability === "speech_to_text",
  );
  const transcriptionProviders = transcriptionCapability?.providers ?? [];
  const hasNonGatewayTranscriptionProvider = transcriptionProviders.some(
    (providerName) => providerName !== "vercel_ai_gateway",
  );

  const translationReady = Boolean(provider.ready && translationCapability?.available);
  const transcriptionReady = Boolean(
    transcriptionCapability?.available &&
      (gatewayProbe.ready || hasNonGatewayTranscriptionProvider),
  );
  const ok = translationReady && transcriptionReady;

  return NextResponse.json(
    {
      ok,
      schema: HEALTH_SCHEMA,
      revision,
      provider: {
        ...provider,
        gatewayRuntimeAvailable: languageRuntime.gatewayRuntimeAvailable,
        publicFallbackAllowed: languageRuntime.publicFallbackAllowed,
      },
      capabilities: {
        languageDetection: { ready: true, mode: "script_first_provider_fallback" },
        transcription: {
          ready: transcriptionReady,
          mode: transcriptionCapability?.mode ?? "unavailable",
          providers: transcriptionProviders,
          model: process.env.PANTAVION_TRANSCRIPTION_MODEL || "whisper-1",
        },
        translation: {
          ready: translationReady,
          mode: translationCapability?.mode ?? "unavailable",
          providers: translationCapability?.providers ?? [],
          model:
            provider.model ||
            process.env.PANTAVION_TRANSLATION_MODEL ||
            "openai/gpt-4.1-mini",
        },
      },
    },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
