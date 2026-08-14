import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const HEALTH_SCHEMA = "interpreter-20260814-v1";

async function probeLanguageProvider(apiKey: string) {
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.PANTAVION_TRANSLATION_MODEL || "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content: "Return exactly: ok",
          },
          {
            role: "user",
            content: "Pantavion interpreter health probe",
          },
        ],
        max_output_tokens: 8,
      }),
      signal: AbortSignal.timeout(10000),
    });

    const payload = await response.json().catch(() => ({}));
    const output = String(
      payload.output_text ||
        payload.output
          ?.flatMap((item: { content?: Array<{ text?: string }> }) => item.content || [])
          ?.map((content: { text?: string }) => content.text || "")
          ?.join("") ||
        "",
    )
      .trim()
      .toLowerCase();

    return {
      ready: response.ok && output === "ok",
      diagnostic: response.ok && output === "ok" ? "ready" : "provider_error",
      status: response.status,
    };
  } catch {
    return { ready: false, diagnostic: "provider_unreachable", status: null };
  }
}

export async function GET() {
  const revision = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA ?? null;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        schema: HEALTH_SCHEMA,
        revision,
        provider: { ready: false, diagnostic: "provider_not_configured" },
        capabilities: {
          languageDetection: { ready: true, mode: "script_first_provider_fallback" },
          transcription: { ready: false, diagnostic: "provider_not_configured" },
          translation: { ready: false, diagnostic: "provider_not_configured" },
        },
      },
      { status: 503, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }

  const provider = await probeLanguageProvider(apiKey);
  const ok = provider.ready;

  return NextResponse.json(
    {
      ok,
      schema: HEALTH_SCHEMA,
      revision,
      provider,
      capabilities: {
        languageDetection: { ready: true, mode: "script_first_provider_fallback" },
        transcription: {
          ready: provider.ready,
          model: process.env.PANTAVION_TRANSCRIPTION_MODEL || "whisper-1",
        },
        translation: {
          ready: provider.ready,
          model: process.env.PANTAVION_TRANSLATION_MODEL || "gpt-4.1-mini",
        },
      },
    },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
