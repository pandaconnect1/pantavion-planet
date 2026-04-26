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
    endpoint: "/api/contacts/import",
    method: "POST",
    rule:
      "Only user-provided contacts with explicit consent. No scraping. No third-party password collection. No illegal import.",
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
    source?: unknown;
    consent?: unknown;
    contacts?: unknown;
  };

  if (data.consent !== true) {
    return NextResponse.json(
      {
        ok: false,
        error: "explicit_consent_required",
      },
      { status: 400 }
    );
  }

  if (!Array.isArray(data.contacts)) {
    return NextResponse.json(
      {
        ok: false,
        error: "contacts_array_required",
      },
      { status: 400 }
    );
  }

  if (process.env.NODE_ENV === "production" && !hasPersistentStorage()) {
    return NextResponse.json(blockedBecauseNoPersistentStorage("contacts_import"), {
      status: 503,
    });
  }

  return NextResponse.json({
    ok: true,
    acceptedForValidation: true,
    importedCount: data.contacts.length,
    source: typeof data.source === "string" ? data.source : "user_provided",
    persistence: hasPersistentStorage()
      ? "persistent"
      : "ephemeral_development_only",
    strictRule:
      "Pantavion does not scrape WhatsApp, Viber, Telegram, Gmail, SMS, or any third-party app. Only official APIs, exports, OAuth scopes, or user-provided files are allowed.",
  });
}
