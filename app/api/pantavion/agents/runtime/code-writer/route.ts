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
  const plan = await readJson("data/pantavion-agent-code-writer/codewriter-plan.json");
  const slices = await readJson("data/pantavion-agent-code-writer/implementation-slices.json");

  return NextResponse.json({
    ok: true,
    route: "/api/pantavion/agents/runtime/code-writer",
    plan,
    slices,
    note:
      "Code writer converts doctrine work orders into safe implementation slices. Z3/Z4 remains approval-gated."
  });
}
