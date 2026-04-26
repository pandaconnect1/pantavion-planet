import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  return NextResponse.json({
    ok: false,
    route: "/api/admission",
    status: "guarded",
    reason: "Admission requires real auth, database, consent, and policy gates before public activation.",
    received: body,
    nextGate: "identity_database_gate",
  }, { status: 202 });
}
