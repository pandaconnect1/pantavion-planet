import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import {
  createPantavionAgentSupervisorReport,
  type PantavionImplementationSlice
} from "../../../../../../core/agents/pantavion-agent-supervisor";

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

async function fileExists(relativePath: string) {
  try {
    await fs.stat(path.join(process.cwd(), relativePath));
    return true;
  } catch {
    return false;
  }
}

async function collectExistingTargets(slices: PantavionImplementationSlice[]) {
  const targets = new Set<string>();

  for (const slice of slices) {
    for (const target of slice.targetFiles || []) {
      if (await fileExists(target)) {
        targets.add(target.replace(/\\/g, "/"));
      }
    }
  }

  return [...targets];
}

function extractSlices(value: unknown): PantavionImplementationSlice[] {
  if (
    value &&
    typeof value === "object" &&
    "slices" in value &&
    Array.isArray((value as { slices?: unknown }).slices)
  ) {
    return (value as { slices: PantavionImplementationSlice[] }).slices;
  }

  return [];
}

export async function GET() {
  const slicesFile = await readJson("data/pantavion-agent-code-writer/implementation-slices.json");
  const slices = extractSlices(slicesFile);
  const existingFiles = await collectExistingTargets(slices);

  const report = createPantavionAgentSupervisorReport({
    slices,
    existingFiles,
    gitStatusShort: "api_route_read_only",
    gitHead: "api_route_read_only",
    gitBranch: "api_route_read_only"
  });

  return NextResponse.json({
    ok: true,
    route: "/api/pantavion/agents/runtime/supervisor",
    report,
    note:
      "Supervisor reads implementation slices and selects the next safe work order. It does not mutate repo or deploy."
  });
}

export async function POST() {
  const slicesFile = await readJson("data/pantavion-agent-code-writer/implementation-slices.json");
  const slices = extractSlices(slicesFile);
  const existingFiles = await collectExistingTargets(slices);

  const report = createPantavionAgentSupervisorReport({
    slices,
    existingFiles,
    gitStatusShort: "api_route_write_local_report",
    gitHead: "api_route_write_local_report",
    gitBranch: "api_route_write_local_report"
  });

  const outDir = path.join(process.cwd(), ".pantavion", "agent-runtime");
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(
    path.join(outDir, "supervisor-report.json"),
    JSON.stringify(report, null, 2) + "\n",
    "utf8"
  );

  return NextResponse.json({
    ok: true,
    route: "/api/pantavion/agents/runtime/supervisor",
    wrote: ".pantavion/agent-runtime/supervisor-report.json",
    report
  });
}
