import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "owner-safety",
    checks: {
      caseQueueRoute: "/api/owner/safety/cases",
      dossierRoute: "/api/owner/safety/dossier",
      protectedSurface: "/owner/safety",
      authModel: "authenticated+AAL2+role",
    },
  });
}
