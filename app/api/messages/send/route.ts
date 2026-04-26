import { NextRequest, NextResponse } from "next/server";
import {
  blockedBecauseNoPersistentStorage,
  hasPersistentStorage,
  getPantavionStorageMode,
} from "@/core/pantavion/live-backend-contract";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "/api/messages/send",
    method: "POST",
    rule:
      "Own Pantavion messaging entry point. Production send requires auth, recipient identity, persistent store, encryption policy, delivery receipts, and abuse controls.",
    storageMode: getPantavionStorageMode(),
  });
}

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const data = body as {
    fromUserId?: unknown;
    toUserId?: unknown;
    message?: unknown;
  };

  if (typeof data.message !== "string" || !data.message.trim()) {
    return NextResponse.json({ ok: false, error: "message_required" }, { status: 400 });
  }

  if (process.env.NODE_ENV === "production" && !hasPersistentStorage()) {
    return NextResponse.json(blockedBecauseNoPersistentStorage("messages"), {
      status: 503,
    });
  }

  return NextResponse.json({
    ok: true,
    acceptedForValidation: true,
    fromUserId:
      typeof data.fromUserId === "string" ? data.fromUserId : "anonymous_dev",
    toUserId:
      typeof data.toUserId === "string" ? data.toUserId : "unknown_recipient",
    messageLength: data.message.length,
    delivered: false,
    persistence: hasPersistentStorage()
      ? "persistent"
      : "ephemeral_development_only",
    nextRequired:
      "Add identity, message database, delivery receipts, encryption rules, and abuse controls before public messaging claim.",
  });
}
