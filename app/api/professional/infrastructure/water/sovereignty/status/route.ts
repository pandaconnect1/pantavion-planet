import { NextResponse } from "next/server";

import { getPantavionWaterObjectStorageSafeStatus } from "@/core/infrastructure/water/water-object-storage-contract";
import { getPantavionWaterSovereignGisContract } from "@/core/infrastructure/water/water-sovereign-gis-contract";
import { authorizeWaterMapIngestActor } from "@/core/water/water-map-ingest-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const actor = await authorizeWaterMapIngestActor(request);

  if (!actor.ok) {
    return NextResponse.json(
      { ok: false, error: actor.error },
      {
        status: 403,
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      actorKind: actor.kind,
      sovereignty: getPantavionWaterSovereignGisContract(),
      storage: getPantavionWaterObjectStorageSafeStatus(),
    },
    {
      status: 200,
      headers: { "Cache-Control": "private, no-store" },
    },
  );
}
