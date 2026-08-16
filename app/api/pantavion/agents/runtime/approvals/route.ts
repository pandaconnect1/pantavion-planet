import { NextResponse } from "next/server";
import {
  getPantavionApprovalDashboardSnapshot,
  recordPantavionFounderApproval
} from "../../../../../../core/agents/pantavion-autonomy-governance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getPantavionApprovalDashboardSnapshot());
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  const itemId = typeof body.itemId === "string" ? body.itemId : "";
  const decision = body.decision === "approved" ? "approved" : body.decision === "blocked" ? "blocked" : "";

  if (!itemId || !decision) {
    return NextResponse.json(
      {
        ok: false,
        error: "itemId and decision are required"
      },
      { status: 400 }
    );
  }

  const record = recordPantavionFounderApproval({
    itemId,
    decision,
    actor: typeof body.actor === "string" ? body.actor : "founder",
    note: typeof body.note === "string" ? body.note : ""
  });

  return NextResponse.json({
    ok: true,
    record
  });
}
