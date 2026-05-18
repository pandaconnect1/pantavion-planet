import { NextResponse } from "next/server";
import {
  getPantavionCloudCronStatus,
  readLocalLedgerEvents,
} from "@/core/intelligence/pantavion-intelligence-ledger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const events = await readLocalLedgerEvents(50);

  return NextResponse.json({
    ok: true,
    route: "/api/pantavion/intelligence/ledger",
    health: getPantavionCloudCronStatus(),
    eventCount: events.length,
    events,
  });
}

