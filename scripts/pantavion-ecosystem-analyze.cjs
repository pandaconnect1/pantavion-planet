const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");

const root = process.cwd();
const kernelDir = path.join(root, ".pantavion", "kernel");

const expectedFiles = [
  "scripts/pantavion-kernel-tick.cjs",
  "scripts/pantavion-evolution-pr-writer.cjs",
  "scripts/pantavion-apply-command-pack.cjs",
  "scripts/pantavion-founder-command-code-writer.cjs",
  "core/kernel/live-kernel.ts",
  "core/kernel/evolution-scan.ts",
  "core/kernel/founder-command.ts",
  "core/kernel/ecosystem-gap-finder.ts",
  "core/runtime/execution-safety.ts",
  "core/ai/provider-router.ts",
  "app/api/kernel/tick/route.ts",
  "app/api/kernel/founder-command/route.ts",
  "app/api/kernel/ecosystem/analyze/route.ts",
  "app/kernel/founder-command/page.tsx"
];

function idFor(input) {
  return crypto.createHash("sha256").update(input).digest("hex").slice(0, 16);
}

function add(findings, finding) {
  findings.push({
    id: idFor(`${finding.title}:${finding.path || ""}:${finding.evidence || ""}`),
    ...finding
  });
}

function readJson(rel) {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
  } catch {
    return null;
  }
}

function inferCommandGaps(commandText) {
  const text = String(commandText || "").toLowerCase();
  const gaps = [];

  if (text.includes("λάθ") || text.includes("lath") || text.includes("bug") || text.includes("error")) {
    gaps.push("needs_ecosystem_diagnostics");
  }

  if (text.includes("κεν") || text.includes("gap") || text.includes("missing")) {
    gaps.push("needs_gap_detection");
  }

  if (text.includes("startup") || text.includes("agent")) {
    gaps.push("needs_startup_builder_agent_depth");
  }

  if (text.includes("φων") || text.includes("voice") || text.includes("μιλώ")) {
    gaps.push("needs_voice_command_runtime");
  }

  if (text.includes("χρηστ") || text.includes("users") || text.includes("feedback")) {
    gaps.push("needs_user_signal_intake");
  }

  if (text.includes("αυτο") || text.includes("upgrade") || text.includes("evolution")) {
    gaps.push("needs_auto_evolution_loop");
  }

  return Array.from(new Set(gaps));
}

function checkProvider(findings) {
  const provider = String(process.env.PANTAVION_AI_PROVIDER || "").trim().toLowerCase();

  if (!provider || provider === "none") {
    add(findings, {
      title: "AI provider not configured",
      severity: "info",
      zone: "Z2_PREVIEW_REQUIRED",
      source: "provider",
      recommendation: "Set PANTAVION_AI_PROVIDER plus a real provider key before expecting AI code writing."
    });
    return;
  }

  if (provider === "openai" && !process.env.OPENAI_API_KEY) {
    add(findings, {
      title: "OpenAI provider selected but key is not loaded",
      severity: "info",
      zone: "Z2_PREVIEW_REQUIRED",
      source: "provider",
      evidence: "PANTAVION_AI_PROVIDER=openai",
      recommendation: "Load OPENAI_API_KEY only when credits are available, then run founder:write-code once."
    });
    return;
  }

  if (provider === "anthropic" && !process.env.ANTHROPIC_API_KEY) {
    add(findings, {
      title: "Anthropic provider selected but key is not loaded",
      severity: "info",
      zone: "Z2_PREVIEW_REQUIRED",
      source: "provider",
      evidence: "PANTAVION_AI_PROVIDER=anthropic",
      recommendation: "Load ANTHROPIC_API_KEY only when the provider account is ready, then run founder:write-code once."
    });
    return;
  }

  if (provider !== "openai" && provider !== "anthropic") {
    add(findings, {
      title: "Unsupported AI provider configured",
      severity: "warning",
      zone: "Z2_PREVIEW_REQUIRED",
      source: "provider",
      evidence: provider,
      recommendation: "Use PANTAVION_AI_PROVIDER=openai or anthropic unless a new provider adapter is implemented."
    });
  }
}

async function main() {
  await fsp.mkdir(kernelDir, { recursive: true });

  const findings = [];

  for (const file of expectedFiles) {
    if (!fs.existsSync(path.join(root, file))) {
      add(findings, {
        title: "Missing expected Pantavion runtime file",
        severity: "high",
        zone: "Z2_PREVIEW_REQUIRED",
        source: "runtime",
        path: file,
        recommendation: "Restore or implement this file before claiming the related capability is real."
      });
    }
  }

  const pkg = readJson("package.json");
  const scripts = pkg && pkg.scripts ? pkg.scripts : {};
  const expectedScripts = [
    "kernel:tick",
    "kernel:evolve",
    "kernel:apply-pack",
    "founder:write-code",
    "safety:pantavion"
  ];

  for (const scriptName of expectedScripts) {
    if (!scripts[scriptName]) {
      add(findings, {
        title: "Missing package script",
        severity: "warning",
        zone: "Z2_PREVIEW_REQUIRED",
        source: "repo",
        path: "package.json",
        evidence: scriptName,
        recommendation: "Add the missing package script so the capability can be executed repeatably."
      });
    }
  }

  checkProvider(findings);

  const founderDbPath = path.join(kernelDir, "founder-commands.json");

  if (fs.existsSync(founderDbPath)) {
    const db = JSON.parse(fs.readFileSync(founderDbPath, "utf8"));
    const commands = Array.isArray(db.commands) ? db.commands : [];

    for (const command of commands.slice(0, 20)) {
      const gaps = inferCommandGaps(command.commandText);

      for (const gap of gaps) {
        add(findings, {
          title: "Founder command implies ecosystem gap",
          severity: "warning",
          zone: "Z2_PREVIEW_REQUIRED",
          source: "founder_command",
          evidence: `${gap}: ${String(command.commandText || "").slice(0, 180)}`,
          recommendation: "Convert this repeated need into a scoped implementation plan, then run build/typecheck/kernel tick before PR."
        });
      }
    }
  }

  const report = {
    ok: !findings.some((finding) => finding.severity === "critical"),
    reportId: crypto.randomUUID(),
    generatedAt: new Date().toISOString(),
    mode: "local-script",
    repoRoot: root,
    findingCount: findings.length,
    approvalRequired: findings.some((finding) =>
      String(finding.zone).startsWith("Z3") ||
      String(finding.zone).startsWith("Z4")
    ),
    findings,
    nextActions: Array.from(new Set(findings.map((finding) => finding.recommendation))).slice(0, 20)
  };

  await fsp.writeFile(
    path.join(kernelDir, "ecosystem-gap-report.json"),
    JSON.stringify(report, null, 2),
    "utf8"
  );

  await fsp.appendFile(
    path.join(kernelDir, "ecosystem-gap-audit.jsonl"),
    `${JSON.stringify({
      type: "kernel.ecosystem_gap_report.generated",
      createdAt: new Date().toISOString(),
      reportId: report.reportId,
      findingCount: report.findingCount
    })}\n`,
    "utf8"
  );

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
