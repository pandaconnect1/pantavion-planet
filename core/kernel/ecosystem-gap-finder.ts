import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { appendKernelAudit } from "./kernel-audit";
import { ensureKernelStorage } from "./kernel-state";

export type EcosystemFinding = {
  id: string;
  title: string;
  severity: "info" | "warning" | "high" | "critical";
  zone:
    | "Z1_AUTO_SAFE"
    | "Z2_PREVIEW_REQUIRED"
    | "Z3_FOUNDER_APPROVAL_REQUIRED"
    | "Z4_BLOCKED_MANUAL_ONLY";
  source: "repo" | "founder_command" | "provider" | "runtime" | "security";
  path?: string;
  evidence?: string;
  recommendation: string;
};

export type EcosystemGapReport = {
  ok: boolean;
  reportId: string;
  generatedAt: string;
  actor: string;
  findingCount: number;
  approvalRequired: boolean;
  findings: EcosystemFinding[];
  nextActions: string[];
};

function idFor(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex").slice(0, 16);
}

async function exists(repoRoot: string, repoPath: string): Promise<boolean> {
  try {
    await fs.access(path.join(repoRoot, repoPath));
    return true;
  } catch {
    return false;
  }
}

function pushFinding(
  findings: EcosystemFinding[],
  finding: Omit<EcosystemFinding, "id">,
) {
  findings.push({
    id: idFor(`${finding.title}:${finding.path ?? ""}:${finding.evidence ?? ""}`),
    ...finding,
  });
}

async function readJsonIfExists(filePath: string): Promise<unknown | null> {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    return null;
  }
}

function inferCommandGaps(commandText: string): string[] {
  const text = commandText.toLowerCase();
  const gaps: string[] = [];

  if (
    text.includes("λάθ") ||
    text.includes("lath") ||
    text.includes("bug") ||
    text.includes("error")
  ) {
    gaps.push("needs_ecosystem_diagnostics");
  }

  if (
    text.includes("κεν") ||
    text.includes("gap") ||
    text.includes("missing")
  ) {
    gaps.push("needs_gap_detection");
  }

  if (text.includes("startup") || text.includes("agent")) {
    gaps.push("needs_startup_builder_agent_depth");
  }

  if (
    text.includes("φων") ||
    text.includes("voice") ||
    text.includes("μιλώ")
  ) {
    gaps.push("needs_voice_command_runtime");
  }

  if (
    text.includes("χρηστ") ||
    text.includes("users") ||
    text.includes("feedback")
  ) {
    gaps.push("needs_user_signal_intake");
  }

  if (
    text.includes("αυτο") ||
    text.includes("upgrade") ||
    text.includes("evolution")
  ) {
    gaps.push("needs_auto_evolution_loop");
  }

  return Array.from(new Set(gaps));
}

function checkProviderReadiness(findings: EcosystemFinding[]) {
  const provider = process.env.PANTAVION_AI_PROVIDER?.trim().toLowerCase();

  if (!provider || provider === "none") {
    pushFinding(findings, {
      title: "AI provider not configured",
      severity: "info",
      zone: "Z2_PREVIEW_REQUIRED",
      source: "provider",
      recommendation:
        "Set PANTAVION_AI_PROVIDER plus a real provider key before expecting provider-backed code writing.",
    });
    return;
  }

  if (provider === "openai" && !process.env.OPENAI_API_KEY) {
    pushFinding(findings, {
      title: "OpenAI provider selected but key is not loaded",
      severity: "info",
      zone: "Z2_PREVIEW_REQUIRED",
      source: "provider",
      evidence: "PANTAVION_AI_PROVIDER=openai",
      recommendation:
        "Load OPENAI_API_KEY only when credits are available, then run founder:write-code once.",
    });
    return;
  }

  if (provider === "anthropic" && !process.env.ANTHROPIC_API_KEY) {
    pushFinding(findings, {
      title: "Anthropic provider selected but key is not loaded",
      severity: "info",
      zone: "Z2_PREVIEW_REQUIRED",
      source: "provider",
      evidence: "PANTAVION_AI_PROVIDER=anthropic",
      recommendation:
        "Load ANTHROPIC_API_KEY only when the provider account is ready, then run founder:write-code once.",
    });
    return;
  }

  if (provider !== "openai" && provider !== "anthropic") {
    pushFinding(findings, {
      title: "Unsupported AI provider configured",
      severity: "warning",
      zone: "Z2_PREVIEW_REQUIRED",
      source: "provider",
      evidence: provider,
      recommendation:
        "Use PANTAVION_AI_PROVIDER=openai or anthropic unless a new provider adapter is implemented.",
    });
  }
}

export async function runEcosystemGapFinder(input?: {
  actor?: string;
}): Promise<EcosystemGapReport> {
  const repoRoot = process.cwd();
  const actor = input?.actor ?? "kernel-ecosystem";
  const findings: EcosystemFinding[] = [];

  const expectedFiles = [
    "scripts/pantavion-kernel-tick.cjs",
    "scripts/pantavion-evolution-pr-writer.cjs",
    "scripts/pantavion-apply-command-pack.cjs",
    "scripts/pantavion-founder-command-code-writer.cjs",
    "core/kernel/live-kernel.ts",
    "core/kernel/evolution-scan.ts",
    "core/kernel/founder-command.ts",
    "core/runtime/execution-safety.ts",
    "core/ai/provider-router.ts",
    "app/api/kernel/tick/route.ts",
    "app/api/kernel/founder-command/route.ts",
    "app/kernel/founder-command/page.tsx",
  ];

  for (const file of expectedFiles) {
    if (!(await exists(repoRoot, file))) {
      pushFinding(findings, {
        title: "Missing expected Pantavion runtime file",
        severity: "high",
        zone: "Z2_PREVIEW_REQUIRED",
        source: "runtime",
        path: file,
        recommendation:
          "Restore or implement this file before claiming the related capability is real.",
      });
    }
  }

  const packageJson = (await readJsonIfExists(path.join(repoRoot, "package.json"))) as
    | { scripts?: Record<string, string> }
    | null;

  const scripts = packageJson?.scripts ?? {};
  const expectedScripts = [
    "kernel:tick",
    "kernel:evolve",
    "kernel:apply-pack",
    "founder:write-code",
    "safety:pantavion",
  ];

  for (const scriptName of expectedScripts) {
    if (!scripts[scriptName]) {
      pushFinding(findings, {
        title: "Missing package script",
        severity: "warning",
        zone: "Z2_PREVIEW_REQUIRED",
        source: "repo",
        path: "package.json",
        evidence: scriptName,
        recommendation:
          "Add the missing package script so the capability can be executed repeatably.",
      });
    }
  }

  checkProviderReadiness(findings);

  const paths = await ensureKernelStorage();
  const founderDb = (await readJsonIfExists(
    path.join(paths.kernelDir, "founder-commands.json"),
  )) as { commands?: Array<{ id?: string; commandText?: string; status?: string }> } | null;

  const commands = founderDb?.commands ?? [];

  for (const command of commands.slice(0, 20)) {
    const commandText = command.commandText ?? "";
    const gaps = inferCommandGaps(commandText);

    for (const gap of gaps) {
      pushFinding(findings, {
        title: "Founder command implies ecosystem gap",
        severity: "warning",
        zone: "Z2_PREVIEW_REQUIRED",
        source: "founder_command",
        evidence: `${gap}: ${commandText.slice(0, 180)}`,
        recommendation:
          "Convert this repeated need into a scoped implementation plan, then run build/typecheck/kernel tick before PR.",
      });
    }
  }

  const report: EcosystemGapReport = {
    ok: !findings.some((finding) => finding.severity === "critical"),
    reportId: crypto.randomUUID(),
    generatedAt: new Date().toISOString(),
    actor,
    findingCount: findings.length,
    approvalRequired: findings.some(
      (finding) =>
        finding.zone === "Z3_FOUNDER_APPROVAL_REQUIRED" ||
        finding.zone === "Z4_BLOCKED_MANUAL_ONLY",
    ),
    findings,
    nextActions: Array.from(
      new Set(findings.map((finding) => finding.recommendation)),
    ).slice(0, 20),
  };

  await fs.writeFile(
    path.join(paths.kernelDir, "ecosystem-gap-report.json"),
    JSON.stringify(report, null, 2),
    "utf8",
  );

  await appendKernelAudit({
    id: crypto.randomUUID(),
    type: "kernel.ecosystem_gap_report.generated",
    actor,
    createdAt: new Date().toISOString(),
    payload: {
      reportId: report.reportId,
      findingCount: report.findingCount,
      approvalRequired: report.approvalRequired,
    },
  });

  return report;
}
