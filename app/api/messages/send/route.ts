import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  return NextResponse.json({
    ok: false,
    route: "/api/messages/send",
    status: "guarded",
    reason: "Pantavion messaging requires auth, user identity, recipient consent, abuse protection, and database persistence before live sending.",
    received: body,
    nextGate: "identity_messaging_database_gate",
  }, { status: 202 });
}
