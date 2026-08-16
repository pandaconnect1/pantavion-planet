import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { runPantavionExecution } from "../../../../core/execution/pantavion-execution-kernel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIVE_DIR = path.join(process.cwd(), ".pantavion", "live");
const CHAT_PATH = path.join(LIVE_DIR, "chat.jsonl");

type ChatRecord = {
  id: string;
  type: "pantavion_chat_message";
  actor: string;
  input: string;
  createdAt: string;
  result: unknown;
};

async function readJsonl(filePath: string, limit = 30) {
  try {
    const text = await fs.readFile(filePath, "utf8");
    return text
      .split(/\r?\n/)
      .filter(Boolean)
      .slice(-limit)
      .map((line) => JSON.parse(line) as unknown);
  } catch {
    return [];
  }
}

async function appendRecord(record: ChatRecord) {
  await fs.mkdir(LIVE_DIR, { recursive: true });
  await fs.appendFile(CHAT_PATH, JSON.stringify(record) + "\n", "utf8");
}

export async function GET() {
  const messages = await readJsonl(CHAT_PATH);

  return NextResponse.json({
    ok: true,
    route: "/api/pantavion/chat",
    storage: "local_runtime_jsonl",
    messages,
    note:
      "This is a live foundation. Production chat needs auth, durable database, privacy policy and retention controls."
  });
}

export async function POST(request: Request) {
  let body: { input?: string; actor?: string } = {};

  try {
    body = (await request.json()) as { input?: string; actor?: string };
  } catch {
    body = {};
  }

  const input = String(body.input || "").trim();

  if (!input) {
    return NextResponse.json(
      {
        ok: false,
        error: "input_required",
        message: "Write a message for Pantavion Chat."
      },
      { status: 400 }
    );
  }

  const actor = body.actor || "pantavion_live_user";
  const result = await runPantavionExecution(input, actor);

  const record: ChatRecord = {
    id: `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: "pantavion_chat_message",
    actor,
    input,
    createdAt: new Date().toISOString(),
    result
  };

  await appendRecord(record);

  return NextResponse.json({
    ok: true,
    route: "/api/pantavion/chat",
    saved: true,
    record
  });
}
