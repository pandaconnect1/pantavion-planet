import { NextResponse } from "next/server";
import { pantavionUniversalTranslationContract } from "@/core/translation/pantavion-universal-translation-runtime";
import {
  normalizePantavionTranslationSurface,
  pantavionSharedTranslationCapabilities,
  translateWithPantavionSharedService,
} from "@/core/translation/pantavion-shared-translation-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    contract: pantavionUniversalTranslationContract,
    sharedService: pantavionSharedTranslationCapabilities,
    providerConfigured: Boolean(
      process.env.OPENAI_API_KEY ||
        process.env.PANTAVION_TRANSLATE_ENDPOINT ||
        process.env.PANTAVION_TRANSLATE_PROVIDER,
    ),
    publicTextFallback: true,
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  const sourceLanguage = asString(
    body.sourceLanguage,
    asString(body.from, "auto"),
  );
  const targetLanguage = asString(
    body.targetLanguage,
    asString(body.to, "en"),
  );
  const text = asString(body.text);

  if (!text.trim()) {
    return NextResponse.json({ ok: false, error: "Missing text." }, { status: 400 });
  }

  if (!targetLanguage.trim()) {
    return NextResponse.json({ ok: false, error: "Missing target language." }, { status: 400 });
  }

  const surface = normalizePantavionTranslationSurface(body.surface);
  const result = await translateWithPantavionSharedService({
    text,
    sourceLanguage,
    targetLanguage,
    surface,
    mode: surface === "voice" || surface === "video" ? "speech" : "text",
    sessionId: asString(body.sessionId) || null,
    domain: surface === "social" || surface === "chat" ? "social" : "general",
    tone: "natural",
    bidirectional: Boolean(body.bidirectional ?? true),
  });

  return NextResponse.json(result, {
    status: result.ok ? 200 : result.status === "provider_pending" ? 503 : 502,
  });
}
