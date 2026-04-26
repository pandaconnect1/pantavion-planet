import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  return NextResponse.json({
    ok: false,
    route: "/api/contacts/import",
    status: "guarded",
    reason: "Contact import requires explicit user consent, official export/API source, auth, and storage. No scraping. No third-party passwords.",
    received: body,
    nextGate: "contact_import_consent_matrix",
  }, { status: 202 });
}
