import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  return NextResponse.json({
    ok: false,
    route: "/api/sos/dispatch",
    status: "guarded",
    reason: "SOS dispatch is blocked until user auth, trusted emergency contacts, consent, audit storage, and legal safety boundaries exist.",
    received: body,
    nextGate: "sos_contacts_consent_audit_gate",
  }, { status: 202 });
}
