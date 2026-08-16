import type { SafetyVerdict } from "../runtime/execution-safety";
import fs from "node:fs/promises";
import path from "node:path";
import { ensureKernelStorage } from "./kernel-state";

export type FounderCommandSource = "web" | "api" | "script" | "voice_future";

export type FounderCommandStatus =
  | "received"
  | "planned"
  | "ready_for_evolution_pr"
  | "awaiting_founder_approval"
  | "blocked"
  | "failed";

export type FounderCommandIntent =
  | "startup_builder"
  | "kernel_upgrade"
  | "repo_change"
  | "runtime_safety"
  | "water_infrastructure"
  | "voice_command"
  | "unknown";

export type FounderCommandPlan = {
  summary: string;
  intent: FounderCommandIntent;
  executionMode:
    | "proposal_only"
    | "can_open_evolution_pr_after_checks"
    | "blocked_pending_founder_approval"
    | "blocked_manual_only";
  requiredRoutes: string[];
  requiredState: string[];
  requiredScripts: string[];
  requiredChecks: string[];
  nextAction: string;
  aiProviderStatus: string;
  aiPlanText?: string;
};

export type FounderCommandRecord = {
  id: string;
  version: 1;
  createdAt: string;
  updatedAt: string;
  actor: string;
  source: FounderCommandSource;
  commandText: string;
  status: FounderCommandStatus;
  intent: FounderCommandIntent;
  safetyVerdict: SafetyVerdict;
  plan: FounderCommandPlan;
  founderApproval?: {
    approved: boolean;
    approvedAt?: string;
    approvedBy?: string;
    note?: string;
  };
};

type FounderCommandDatabase = {
  version: 1;
  updatedAt: string;
  commands: FounderCommandRecord[];
};

async function getFounderCommandDbPath(): Promise<string> {
  const paths = await ensureKernelStorage();
  return path.join(paths.kernelDir, "founder-commands.json");
}

async function readFounderCommandDatabase(): Promise<FounderCommandDatabase> {
  const dbPath = await getFounderCommandDbPath();

  try {
    const raw = await fs.readFile(dbPath, "utf8");
    const parsed = JSON.parse(raw) as FounderCommandDatabase;

    if (parsed.version !== 1 || !Array.isArray(parsed.commands)) {
      throw new Error("Invalid Founder Command database shape.");
    }

    return parsed;
  } catch {
    return {
      version: 1,
      updatedAt: new Date().toISOString(),
      commands: [],
    };
  }
}

async function writeFounderCommandDatabase(db: FounderCommandDatabase): Promise<void> {
  const dbPath = await getFounderCommandDbPath();

  await fs.writeFile(
    dbPath,
    JSON.stringify(
      {
        ...db,
        updatedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
    "utf8",
  );
}

export async function appendFounderCommand(
  record: FounderCommandRecord,
): Promise<FounderCommandRecord> {
  const db = await readFounderCommandDatabase();

  const next: FounderCommandDatabase = {
    version: 1,
    updatedAt: new Date().toISOString(),
    commands: [record, ...db.commands].slice(0, 250),
  };

  await writeFounderCommandDatabase(next);
  return record;
}

export async function listFounderCommands(input?: {
  limit?: number;
}): Promise<FounderCommandRecord[]> {
  const db = await readFounderCommandDatabase();
  return db.commands.slice(0, Math.max(1, Math.min(input?.limit ?? 25, 100)));
}

export async function getFounderCommand(
  commandId: string,
): Promise<FounderCommandRecord | null> {
  const db = await readFounderCommandDatabase();
  return db.commands.find((command) => command.id === commandId) ?? null;
}

export async function updateFounderCommand(
  commandId: string,
  updater: (record: FounderCommandRecord) => FounderCommandRecord,
): Promise<FounderCommandRecord | null> {
  const db = await readFounderCommandDatabase();
  const index = db.commands.findIndex((command) => command.id === commandId);

  if (index < 0) {
    return null;
  }

  const updated = updater({
    ...db.commands[index],
    updatedAt: new Date().toISOString(),
  });

  db.commands[index] = {
    ...updated,
    updatedAt: new Date().toISOString(),
  };

  await writeFounderCommandDatabase(db);
  return db.commands[index];
}
