import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIVE_DIR = path.join(process.cwd(), ".pantavion", "live");
const PULSE_PATH = path.join(LIVE_DIR, "pulse.jsonl");

type PulseRecord = {
  id: string;
  type: "pantavion_pulse_post";
  actor: string;
  text: string;
  createdAt: string;
  status: "local_runtime_visible";
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

async function appendRecord(record: PulseRecord) {
  await fs.mkdir(LIVE_DIR, { recursive: true });
  await fs.appendFile(PULSE_PATH, JSON.stringify(record) + "\n", "utf8");
}

export async function GET() {
  const posts = await readJsonl(PULSE_PATH);

  return NextResponse.json({
    ok: true,
    route: "/api/pantavion/pulse",
    storage: "local_runtime_jsonl",
    posts,
    note:
      "This is a live feed foundation. Production Pulse needs auth, database, privacy, moderation and report/block controls."
  });
}

export async function POST(request: Request) {
  let body: { text?: string; actor?: string } = {};

  try {
    body = (await request.json()) as { text?: string; actor?: string };
  } catch {
    body = {};
  }

  const text = String(body.text || "").trim();

  if (!text) {
    return NextResponse.json(
      {
        ok: false,
        error: "text_required",
        message: "Write a Pantavion Pulse post."
      },
      { status: 400 }
    );
  }

  const record: PulseRecord = {
    id: `pulse_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: "pantavion_pulse_post",
    actor: body.actor || "pantavion_live_user",
    text,
    createdAt: new Date().toISOString(),
    status: "local_runtime_visible"
  };

  await appendRecord(record);

  return NextResponse.json({
    ok: true,
    route: "/api/pantavion/pulse",
    saved: true,
    record
  });
}
