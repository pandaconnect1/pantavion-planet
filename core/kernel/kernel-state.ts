import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export type KernelFinding = {
  id: string;
  title: string;
  severity: "info" | "warning" | "high" | "critical";
  zone: "Z1_AUTO_SAFE" | "Z2_PREVIEW_REQUIRED" | "Z3_FOUNDER_APPROVAL_REQUIRED" | "Z4_BLOCKED_MANUAL_ONLY";
  path?: string;
  evidence?: string;
  recommendation: string;
};

export type KernelTickSummary = {
  tickId: string;
  status: string;
  startedAt: string;
  finishedAt: string;
  findingCount: number;
  approvalRequired: boolean;
};

export type KernelState = {
  version: 1;
  updatedAt: string;
  tickCount: number;
  lastTickId?: string;
  reports: KernelTickSummary[];
};

export type KernelPaths = {
  kernelDir: string;
  statePath: string;
  auditPath: string;
  persistenceMode: "local_file" | "temporary_file";
};

export function getKernelPaths(): KernelPaths {
  const explicit = process.env.PANTAVION_KERNEL_STATE_DIR?.trim();
  const isProduction = process.env.NODE_ENV === "production";

  const kernelDir =
    explicit ||
    (isProduction
      ? path.join(os.tmpdir(), "pantavion-kernel")
      : path.join(process.cwd(), ".pantavion", "kernel"));

  return {
    kernelDir,
    statePath: path.join(kernelDir, "state.json"),
    auditPath: path.join(kernelDir, "audit.jsonl"),
    persistenceMode: isProduction && !explicit ? "temporary_file" : "local_file",
  };
}

export async function ensureKernelStorage(): Promise<KernelPaths> {
  const paths = getKernelPaths();
  await fs.mkdir(paths.kernelDir, { recursive: true });
  return paths;
}

export async function readKernelState(): Promise<KernelState> {
  const paths = await ensureKernelStorage();

  try {
    const raw = await fs.readFile(paths.statePath, "utf8");
    const parsed = JSON.parse(raw) as KernelState;

    if (parsed.version !== 1 || !Array.isArray(parsed.reports)) {
      throw new Error("Invalid kernel state shape.");
    }

    return parsed;
  } catch {
    return {
      version: 1,
      updatedAt: new Date().toISOString(),
      tickCount: 0,
      reports: [],
    };
  }
}

export async function writeKernelState(summary: KernelTickSummary): Promise<KernelState> {
  const paths = await ensureKernelStorage();
  const current = await readKernelState();

  const next: KernelState = {
    version: 1,
    updatedAt: new Date().toISOString(),
    tickCount: current.tickCount + 1,
    lastTickId: summary.tickId,
    reports: [summary, ...current.reports].slice(0, 50),
  };

  await fs.writeFile(paths.statePath, JSON.stringify(next, null, 2), "utf8");
  return next;
}
