import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function normalizeDetectedLanguage(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z-]/g, "")
    .split("-")[0]
    .slice(0, 3);
}

function detectByScript(text: string): string | null {
  if (/\p{Script=Greek}/u.test(text)) return "el";
  if (/\p{Script=Cyrillic}/u.test(text)) return "ru";
  if (/\p{Script=Arabic}/u.test(text)) return "ar";
  if (/\p{Script=Hebrew}/u.test(text)) return "he";
  if (/\p{Script=Han}/u.test(text)) return "zh";
  if (/\p{Script=Hiragana}|\p{Script=Katakana}/u.test(text)) return "ja";
  if (/\p{Script=Hangul}/u.test(text)) return "ko";
  if (/\p{Script=Devanagari}/u.test(text)) return "hi";
  return null;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const text = typeof body.text === "string" ? body.text.trim() : "";

  if (!text) {
    return NextResponse.json({ ok: false, error: "Missing text." }, { status: 400 });
  }

  const scriptLanguage = detectByScript(text);
  if (scriptLanguage) {
    return NextResponse.json({ ok: true, language: scriptLanguage, source: "script" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      ok: false,
      language: null,
      source: "provider_required",
      message: "Automatic language detection for Latin-script languages requires the configured language provider.",
    }, { status: 503 });
  }

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
            content:
              "Detect the language of the user's text. Return only the ISO 639-1 language code when available, otherwise the closest short BCP-47 primary language code. No punctuation or explanation.",
          },
          { role: "user", content: text },
        ],
      }),
      signal: AbortSignal.timeout(10000),
    });

    const payload = await response.json().catch(() => ({}));
    const raw =
      payload.output_text ||
      payload.output
        ?.flatMap((item: any) => item.content || [])
        ?.map((content: any) => content.text || "")
        ?.join("") ||
      "";

    const language = normalizeDetectedLanguage(raw);

    if (!response.ok || !language) {
      return NextResponse.json({
        ok: false,
        language: null,
        source: "provider_error",
        message: "Could not detect language.",
      }, { status: 502 });
    }

    return NextResponse.json({ ok: true, language, source: "model" });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      language: null,
      source: "provider_error",
      message: error instanceof Error ? error.message : "Could not detect language.",
    }, { status: 502 });
  }
}
