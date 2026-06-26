import crypto from "node:crypto";
import { appendKernelAudit } from "./kernel-audit";
import { ensureKernelStorage, writeKernelState } from "./kernel-state";
import { runEvolutionScan } from "./evolution-scan";

export type KernelTickReport = {
  ok: boolean;
  tickId: string;
  status: "completed" | "completed_with_high_risk_findings";
  trigger: string;
  actor: string;
  startedAt: string;
  finishedAt: string;
  persistenceMode: "local_file" | "temporary_file";
  statePath: string;
  auditPath: string;
  checkedFiles: number;
  findingCount: number;
  approvalRequired: boolean;
  findings: Awaited<ReturnType<typeof runEvolutionScan>>["findings"];
  recommendedActions: string[];
};

export async function runLiveKernelTick(input?: {
  trigger?: string;
  actor?: string;
}): Promise<KernelTickReport> {
  const startedAt = new Date().toISOString();
  const tickId = crypto.randomUUID();
  const actor = input?.actor ?? "kernel";
  const trigger = input?.trigger ?? "manual";

  const scan = await runEvolutionScan();
  const paths = await ensureKernelStorage();

  const approvalRequired = scan.findings.some((finding) =>
    finding.zone === "Z3_FOUNDER_APPROVAL_REQUIRED" ||
    finding.zone === "Z4_BLOCKED_MANUAL_ONLY",
  );

  const report: KernelTickReport = {
    ok: !scan.findings.some((finding) => finding.severity === "critical"),
    tickId,
    status: approvalRequired ? "completed_with_high_risk_findings" : "completed",
    trigger,
    actor,
    startedAt,
    finishedAt: new Date().toISOString(),
    persistenceMode: paths.persistenceMode,
    statePath: paths.statePath,
    auditPath: paths.auditPath,
    checkedFiles: scan.checkedFiles,
    findingCount: scan.findings.length,
    approvalRequired,
    findings: scan.findings,
    recommendedActions: scan.recommendedActions,
  };

  await writeKernelState({
    tickId,
    status: report.status,
    startedAt: report.startedAt,
    finishedAt: report.finishedAt,
    findingCount: report.findingCount,
    approvalRequired: report.approvalRequired,
  });

  await appendKernelAudit({
    id: crypto.randomUUID(),
    type: "kernel.tick.completed",
    actor,
    createdAt: new Date().toISOString(),
    payload: report,
  });

  return report;
}
