import fs from "fs";
import path from "path";

const LEDGER_PATH = path.join(process.cwd(), "pantavion-kernel-ledger.json");

export interface KernelLedgerRecord {
  id: string;
  createdAt: string;
  mission: any;
  status: string;
  verifier: any;
  finalDecision: string;
  taskGraph: any[];
  missing: string[];
  repairs: any[];
}

function ensureLedgerFile() {
  if (!fs.existsSync(LEDGER_PATH)) {
    fs.writeFileSync(LEDGER_PATH, "[]", "utf-8");
  }
}

export function readKernelLedger(): KernelLedgerRecord[] {
  ensureLedgerFile();
  try {
    const raw = fs.readFileSync(LEDGER_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function appendKernelLedger(record: KernelLedgerRecord) {
  const current = readKernelLedger();
  current.push(record);
  fs.writeFileSync(LEDGER_PATH, JSON.stringify(current, null, 2), "utf-8");
  return record;
}
