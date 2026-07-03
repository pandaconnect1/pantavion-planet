import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import {
  assessPantavionUniversalEntry,
  getPantavionUniversalEntryGateway,
  type PantavionUniversalEntryAssessmentInput
} from "../../../../core/access/pantavion-universal-entry";

export const runtime = "nodejs";

const ENTRY_DIR = path.join(process.cwd(), ".pantavion", "entry");
const SAVED_CHATS_PATH = path.join(ENTRY_DIR, "saved-chats.jsonl");

async function appendSavedEntry(record: unknown) {
  await fs.mkdir(ENTRY_DIR, { recursive: true });
  await fs.appendFile(SAVED_CHATS_PATH, JSON.stringify(record) + "\n", "utf8");
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/pantavion/entry",
    gateway: getPantavionUniversalEntryGateway()
  });
}

export async function POST(request: Request) {
  let body: PantavionUniversalEntryAssessmentInput = {};

  try {
    body = (await request.json()) as PantavionUniversalEntryAssessmentInput;
  } catch {
    body = {};
  }

  const assessment = assessPantavionUniversalEntry(body);

  let saved = false;

  if (assessment.saveRequested) {
    await appendSavedEntry({
      type: "pantavion_entry_saved_chat_request",
      savedAt: new Date().toISOString(),
      actor: body.actor ?? "anonymous_or_internal_user",
      assessment
    });

    saved = true;
  }

  return NextResponse.json({
    ok: true,
    route: "/api/pantavion/entry",
    saved,
    assessment,
    note:
      "This is the universal entry foundation. Production login, billing, social, dating, messaging, voice, and external adapters require dedicated gates."
  });
}

