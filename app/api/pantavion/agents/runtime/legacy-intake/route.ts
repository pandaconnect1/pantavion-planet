import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getPantavionLegacySourceIntakeContract } from "../../../../../../core/intelligence/pantavion-legacy-source-intake";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function readJson(relativePath: string) {
  try {
    const text = await fs.readFile(path.join(process.cwd(), relativePath), "utf8");
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

export async function GET() {
  const manifest = await readJson("data/pantavion-legacy-intake/legacy-source-manifest.json");
  const workOrders = await readJson("data/pantavion-legacy-intake/legacy-work-orders.json");

  return NextResponse.json({
    ok: true,
    route: "/api/pantavion/agents/runtime/legacy-intake",
    contract: getPantavionLegacySourceIntakeContract(),
    manifest,
    workOrders,
    note:
      "Legacy sources are ingested as sanitized intelligence and work orders. Old repos are not raw-added blindly."
  });
}
