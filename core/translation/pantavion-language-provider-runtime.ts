import { getVercelOidcToken } from "@vercel/oidc";
import { getPantavionTranslationProviderStatus } from "./pantavion-translation-provider-adapters";

export type PantavionLanguageCapability =
  | "text_translation"
  | "speech_to_text"
  | "text_to_speech";

export type PantavionLanguageRuntimeCapability = {
  capability: PantavionLanguageCapability;
  available: boolean;
  mode: "server" | "device" | "hybrid" | "unavailable";
  providers: string[];
  notes: string[];
};

export type PantavionLanguageRuntimeSnapshot = {
  id: "pantavion_language_provider_runtime_v1";
  generatedAt: string;
  gatewayRuntimeAvailable: boolean;
  publicFallbackAllowed: boolean;
  capabilities: PantavionLanguageRuntimeCapability[];
  overallOperational: boolean;
  truthBoundary: string;
};

export async function pantavionGatewayRuntimeAvailable() {
  if (process.env.AI_GATEWAY_API_KEY) return true;
  try {
    return Boolean(await getVercelOidcToken());
  } catch {
    return false;
  }
}

export function pantavionPublicTranslationFallbackAllowed() {
  return process.env.PANTAVION_TRANSLATE_ALLOW_PUBLIC_FALLBACK === "true";
}

export async function getPantavionLanguageRuntimeSnapshot(): Promise<PantavionLanguageRuntimeSnapshot> {
  const gatewayAvailable = await pantavionGatewayRuntimeAvailable();
  const translationProvider = getPantavionTranslationProviderStatus();
  const directOpenAiStt =
    process.env.PANTAVION_ENABLE_DIRECT_OPENAI_STT === "true" && Boolean(process.env.OPENAI_API_KEY);
  const pantavionSttEndpoint = Boolean(process.env.PANTAVION_SPEECH_TO_TEXT_ENDPOINT);
  const publicFallbackAllowed = pantavionPublicTranslationFallbackAllowed();

  const translationAvailable =
    gatewayAvailable ||
    translationProvider.configuredProviderAvailable ||
    (publicFallbackAllowed && translationProvider.provider === "mymemory");

  const speechToTextAvailable = gatewayAvailable || pantavionSttEndpoint || directOpenAiStt;

  const capabilities: PantavionLanguageRuntimeCapability[] = [
    {
      capability: "text_translation",
      available: translationAvailable,
      mode: translationAvailable ? "server" : "unavailable",
      providers: [
        ...(gatewayAvailable ? ["vercel_ai_gateway"] : []),
        ...(translationProvider.configuredProviderAvailable ? [translationProvider.provider] : []),
        ...(publicFallbackAllowed && translationProvider.provider === "mymemory" ? ["mymemory_public"] : []),
      ],
      notes: [
        "Provider brands remain internal implementation details.",
        publicFallbackAllowed
          ? "Explicit public translation fallback is enabled."
          : "Public translation fallback is disabled unless explicitly enabled.",
      ],
    },
    {
      capability: "speech_to_text",
      available: speechToTextAvailable,
      mode: speechToTextAvailable ? "server" : "hybrid",
      providers: [
        ...(gatewayAvailable ? ["vercel_ai_gateway"] : []),
        ...(pantavionSttEndpoint ? ["pantavion_speech_provider"] : []),
        ...(directOpenAiStt ? ["direct_openai_fallback"] : []),
      ],
      notes: [
        "Browser SpeechRecognition remains a client fallback where supported.",
        "Recorded audio is not retained by this runtime contract.",
      ],
    },
    {
      capability: "text_to_speech",
      available: true,
      mode: "device",
      providers: ["device_speech_synthesis"],
      notes: ["Voice availability and quality depend on voices installed on the user device/browser."],
    },
  ];

  return {
    id: "pantavion_language_provider_runtime_v1",
    generatedAt: new Date().toISOString(),
    gatewayRuntimeAvailable: gatewayAvailable,
    publicFallbackAllowed,
    capabilities,
    overallOperational: capabilities.some((item) => item.available),
    truthBoundary:
      "Pantavion exposes a unified language runtime, but live coverage varies by configured provider, language pair, device voice availability, region, quota and provider health.",
  };
}
