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
    endpoint: "/api/sos/dispatch",
    method: "POST",
    rule:
      "Validates SOS packet. Does not claim SMS, authority, hospital, police, maritime, or responder dispatch until lawful integrations exist.",
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
    trigger?: unknown;
    consent?: unknown;
    location?: unknown;
    emergencyType?: unknown;
    trustedContacts?: unknown;
  };

  if (data.consent !== true) {
    return NextResponse.json(
      {
        ok: false,
        error: "emergency_data_consent_required",
      },
      { status: 400 }
    );
  }

  if (typeof data.trigger !== "string" || !data.trigger.trim()) {
    return NextResponse.json(
      {
        ok: false,
        error: "trigger_required",
      },
      { status: 400 }
    );
  }

  if (process.env.NODE_ENV === "production" && !hasPersistentStorage()) {
    return NextResponse.json(
      {
        ...blockedBecauseNoPersistentStorage("sos_dispatch"),
        emergencyPacketValidated: true,
        externalDispatch: false,
        legalBoundary:
          "No automatic authority dispatch without official opt-in, responder contract, delivery channel, audit, and regional legal review.",
      },
      { status: 503 }
    );
  }

  return NextResponse.json({
    ok: true,
    emergencyPacketValidated: true,
    sessionId: `sos_${Date.now()}`,
    emergencyType:
      typeof data.emergencyType === "string" ? data.emergencyType : "unspecified",
    locationReceived: typeof data.location === "object" && data.location !== null,
    trustedContactsCount: Array.isArray(data.trustedContacts)
      ? data.trustedContacts.length
      : 0,
    externalDispatch: false,
    persistence: hasPersistentStorage()
      ? "persistent"
      : "ephemeral_development_only",
    nextRequired:
      "Connect trusted contact store and lawful delivery transport before claiming real dispatch.",
  });
}
