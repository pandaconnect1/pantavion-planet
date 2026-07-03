import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

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
  const index = await readJson("data/pantavion-founder-doctrine/founder-doctrine-index.json");
  const workOrders = await readJson("data/pantavion-founder-doctrine/founder-doctrine-work-orders.json");
  const codeTargets = await readJson("data/pantavion-founder-doctrine/founder-doctrine-code-targets.json");

  return NextResponse.json({
    ok: true,
    route: "/api/pantavion/agents/runtime/founder-doctrine",
    index,
    workOrders,
    codeTargets,
    note:
      "Founder doctrine is converted into work orders and code targets. This is not a static archive."
  });
}
