import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getPantavionCanonicalArchiveContract } from "../../../../../../core/archive/pantavion-canonical-archive";

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
  const sourceArchive = await readJson("data/pantavion-canonical-archive/source-archive.json");
  const queue = await readJson("data/pantavion-canonical-archive/agent-implementation-queue.json");
  const githubPlan = await readJson("data/pantavion-canonical-archive/github-sync-plan.json");

  return NextResponse.json({
    ok: true,
    route: "/api/pantavion/agents/runtime/archive",
    contract: getPantavionCanonicalArchiveContract(),
    sourceArchive,
    queue,
    githubPlan
  });
}
