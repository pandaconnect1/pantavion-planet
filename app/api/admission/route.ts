import { NextRequest, NextResponse } from "next/server";
import {
  blockedBecauseNoPersistentStorage,
  hasPersistentStorage,
  getPantavionStorageMode,
} from "@/core/pantavion/live-backend-contract";

export const dynamic = "force-dynamic";

type AdmissionRecord = {
  id: string;
  name: string;
  email: string;
  country?: string;
  language?: string;
  consent: true;
  createdAt: string;
};

declare global {
  var __pantavionAdmissionRecords: AdmissionRecord[] | undefined;
}

function memoryStore(): AdmissionRecord[] {
  globalThis.__pantavionAdmissionRecords =
    globalThis.__pantavionAdmissionRecords || [];

  return globalThis.__pantavionAdmissionRecords;
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "/api/admission",
    method: "POST",
    storageMode: getPantavionStorageMode(),
    persistentStorage: hasPersistentStorage(),
    note:
      "In production, admission writes are blocked until persistent storage is configured. In local development, ephemeral memory may be used only for testing.",
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
    name?: unknown;
    email?: unknown;
    country?: unknown;
    language?: unknown;
    consent?: unknown;
  };

  if (data.consent !== true) {
    return NextResponse.json(
      {
        ok: false,
        error: "consent_required",
        message:
          "Pantavion requires explicit consent before admission/contact collection.",
      },
      { status: 400 }
    );
  }

  if (typeof data.email !== "string" || !data.email.includes("@")) {
    return NextResponse.json(
      {
        ok: false,
        error: "valid_email_required",
      },
      { status: 400 }
    );
  }

  if (process.env.NODE_ENV === "production" && !hasPersistentStorage()) {
    return NextResponse.json(blockedBecauseNoPersistentStorage("admission"), {
      status: 503,
    });
  }

  const record: AdmissionRecord = {
    id: `adm_${Date.now()}`,
    name:
      typeof data.name === "string" && data.name.trim()
        ? data.name.trim()
        : "Pantavion Member",
    email: data.email.trim().toLowerCase(),
    country: typeof data.country === "string" ? data.country.trim() : undefined,
    language: typeof data.language === "string" ? data.language.trim() : undefined,
    consent: true,
    createdAt: new Date().toISOString(),
  };

  memoryStore().push(record);

  return NextResponse.json({
    ok: true,
    stored: process.env.NODE_ENV !== "production",
    persistence: hasPersistentStorage()
      ? "persistent"
      : "ephemeral_development_only",
    record,
    warning:
      "Local/dev memory is not production persistence. Configure database before public launch.",
  });
}
