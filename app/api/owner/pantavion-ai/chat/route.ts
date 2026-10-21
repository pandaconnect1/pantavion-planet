import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireFounderIdentity } from "@/lib/owner-control/decision-queue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_HISTORY = 12;
export async function POST(request: NextRequest) {
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try { requireFounderIdentity(user.id); }
  catch { return NextResponse.json({ error: "forbidden" }, { status: 403 }); }
  const { data: assurance, error: mfaError } = await session.auth.mfa.getAuthenticatorAssuranceLevel();
  if (mfaError || assurance?.currentLevel !== "aal2")
    return NextResponse.json({ error: "mfa_required" }, { status: 403 });
  const endpoint = process.env.PANTAVION_AI_CHAT_ENDPOINT;
  const model = process.env.PANTAVION_AI_CHAT_MODEL;
  const token = process.env.PANTAVION_AI_CHAT_KEY;
  if (!endpoint || !model || !token)
    return NextResponse.json({ error: "local_ai_not_configured" }, { status: 503 });
  let url: URL;
  try { url = new URL(endpoint); }
  catch { return NextResponse.json({ error: "invalid_ai_endpoint" }, { status: 503 }); }
  if (url.protocol !== "https:" && !(url.protocol === "http:" && ["127.0.0.1", "localhost"].includes(url.hostname)))
    return NextResponse.json({ error: "secure_ai_endpoint_required" }, { status: 503 });
  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }
  if (!payload || typeof payload !== "object") return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  const body = payload as { message?: unknown; history?: unknown };
  if (typeof body.message !== "string" || !body.message.trim() || body.message.length > 8000)
    return NextResponse.json({ error: "invalid_message" }, { status: 400 });
  const history = Array.isArray(body.history) ? body.history.slice(-MAX_HISTORY) : [];
  if (!history.every((m: unknown) => m && typeof m === "object" &&
    ["user", "assistant"].includes((m as { role?: string }).role || "") &&
    typeof (m as { content?: unknown }).content === "string" &&
    (m as { content: string }).content.length <= 8000))
    return NextResponse.json({ error: "invalid_history" }, { status: 400 });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000);
  try {
    const upstream = await fetch(url.toString(), {
      method: "POST", signal: controller.signal, cache: "no-store",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ model, stream: false, max_tokens: 3000,
        messages: [{ role: "system", content: "You are Pantavion's private founder AI assistant. Respond in Greek unless asked otherwise. Help design and implement non-Water features. Never claim code execution, production deployment or verified tests without actual evidence. Do not reveal secrets. Do not provide executable file patches as if already applied." }, ...history, { role: "user", content: body.message.trim() }] })
    });
    if (!upstream.ok) return NextResponse.json({ error: "ai_upstream_failure", status: upstream.status }, { status: 502 });
    const response = await upstream.json();
    const answer = response?.choices?.[0]?.message?.content;
    if (typeof answer !== "string" || !answer.trim()) throw new Error("empty_ai_response");
    return NextResponse.json({ answer, model });
  } catch {
    return NextResponse.json({ error: "ai_request_failed" }, { status: 502 });
  } finally { clearTimeout(timeout); }
}
