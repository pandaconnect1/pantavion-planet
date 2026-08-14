import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_AUDIO_BYTES = 20 * 1024 * 1024;

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ ok: false, status: "provider_required", message: "Multilingual speech transcription provider is not configured." }, { status: 503 });

  const incoming = await request.formData().catch(() => null);
  const audio = incoming?.get("audio");
  if (!(audio instanceof File)) return NextResponse.json({ ok: false, status: "invalid_audio", message: "Audio file is required." }, { status: 400 });
  if (!audio.size || audio.size > MAX_AUDIO_BYTES) return NextResponse.json({ ok: false, status: "invalid_audio", message: audio.size > MAX_AUDIO_BYTES ? "Audio clip is too large." : "Audio clip is empty." }, { status: 400 });

  const form = new FormData();
  form.set("file", audio, audio.name || "conversation.webm");
  form.set("model", process.env.PANTAVION_TRANSCRIPTION_MODEL || "whisper-1");
  form.set("response_format", "verbose_json");

  try {
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", { method: "POST", headers: { Authorization: `Bearer ${apiKey}` }, body: form, signal: AbortSignal.timeout(30000) });
    const payload = await response.json().catch(() => ({}));
    const text = typeof payload.text === "string" ? payload.text.trim() : "";
    if (!response.ok || !text) {
      const upstreamStatus = response.status >= 400 && response.status < 600 ? response.status : 502;
      return NextResponse.json({ ok: false, status: "transcription_error", message: payload?.error?.message || payload?.message || "Speech transcription failed." }, { status: upstreamStatus });
    }
    return NextResponse.json({ ok: true, status: "transcribed", text, providerLanguage: typeof payload.language === "string" ? payload.language : null });
  } catch (error) {
    return NextResponse.json({ ok: false, status: "transcription_error", message: error instanceof Error ? error.message : "Speech transcription failed." }, { status: 502 });
  }
}
