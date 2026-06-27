import fs from "node:fs/promises";
import path from "node:path";
import { ensureKernelStorage } from "./kernel-state";

export type UserSignalSource =
  | "founder"
  | "admin"
  | "user"
  | "support"
  | "system"
  | "future_voice";

export type UserSignalStatus =
  | "received"
  | "triaged"
  | "grouped"
  | "converted_to_gap"
  | "dismissed"
  | "blocked";

export type UserSignalCategory =
  | "bug"
  | "missing_capability"
  | "improvement"
  | "safety"
  | "performance"
  | "accessibility"
  | "voice"
  | "water_infrastructure"
  | "startup_builder"
  | "unknown";

export type UserSignalSeverity =
  | "info"
  | "low"
  | "medium"
  | "high"
  | "critical";

export type UserSignalRecord = {
  id: string;
  version: 1;
  createdAt: string;
  updatedAt: string;
  actor: string;
  source: UserSignalSource;
  status: UserSignalStatus;
  category: UserSignalCategory;
  severity: UserSignalSeverity;
  commandOrSignalText: string;
  safeSummary: string;
  trustBoundary: "no_code_execution" | "founder_review_required" | "blocked_sensitive";
  safetyZone:
    | "Z1_AUTO_SAFE"
    | "Z2_PREVIEW_REQUIRED"
    | "Z3_FOUNDER_APPROVAL_REQUIRED"
    | "Z4_BLOCKED_MANUAL_ONLY";
  recommendation: string;
};

type UserSignalDatabase = {
  version: 1;
  updatedAt: string;
  signals: UserSignalRecord[];
};

async function getUserSignalDbPath(): Promise<string> {
  const paths = await ensureKernelStorage();
  return path.join(paths.kernelDir, "user-signals.json");
}

async function readUserSignalDatabase(): Promise<UserSignalDatabase> {
  const dbPath = await getUserSignalDbPath();

  try {
    const raw = await fs.readFile(dbPath, "utf8");
    const parsed = JSON.parse(raw) as UserSignalDatabase;

    if (parsed.version !== 1 || !Array.isArray(parsed.signals)) {
      throw new Error("Invalid user signal database shape.");
    }

    return parsed;
  } catch {
    return {
      version: 1,
      updatedAt: new Date().toISOString(),
      signals: [],
    };
  }
}

async function writeUserSignalDatabase(db: UserSignalDatabase): Promise<void> {
  const dbPath = await getUserSignalDbPath();

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

export async function appendUserSignal(
  record: UserSignalRecord,
): Promise<UserSignalRecord> {
  const db = await readUserSignalDatabase();

  const next: UserSignalDatabase = {
    version: 1,
    updatedAt: new Date().toISOString(),
    signals: [record, ...db.signals].slice(0, 500),
  };

  await writeUserSignalDatabase(next);
  return record;
}

export async function listUserSignals(input?: {
  limit?: number;
}): Promise<UserSignalRecord[]> {
  const db = await readUserSignalDatabase();
  return db.signals.slice(0, Math.max(1, Math.min(input?.limit ?? 50, 150)));
}

export async function getUserSignal(
  signalId: string,
): Promise<UserSignalRecord | null> {
  const db = await readUserSignalDatabase();
  return db.signals.find((signal) => signal.id === signalId) ?? null;
}
