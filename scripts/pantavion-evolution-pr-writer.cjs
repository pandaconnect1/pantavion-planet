const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const cp = require("node:child_process");

const root = process.cwd();

function run(command) {
  console.log(`\n> ${command}`);
  cp.execSync(command, {
    cwd: root,
    stdio: "inherit",
    shell: true,
  });
}

function out(command) {
  return cp.execSync(command, {
    cwd: root,
    encoding: "utf8",
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function nowStamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function readJsonIfExists(rel) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) return null;
  return JSON.parse(fs.readFileSync(full, "utf8"));
}

function ensurePackageScripts() {
  const pkgPath = path.join(root, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

  pkg.scripts = pkg.scripts || {};
  pkg.scripts["kernel:tick"] = "node scripts/pantavion-kernel-tick.cjs";
  pkg.scripts["kernel:evolve"] = "node scripts/pantavion-evolution-pr-writer.cjs --mode local";
  pkg.scripts["kernel:apply-pack"] = "node scripts/pantavion-apply-command-pack.cjs";
  pkg.scripts["safety:pantavion"] = "node scripts/pantavion-kernel-tick.cjs";

  if (pkg.scripts["founder:inbox"]) {
    delete pkg.scripts["founder:inbox"];
  }

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
}

function buildMarkdownReport(report) {
  const findings = Array.isArray(report?.findings) ? report.findings : [];
  const top = findings.slice(0, 60);

  const lines = [];
  lines.push("# Pantavion Kernel Evolution Report");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");
  lines.push("## Status");
  lines.push("");
  lines.push(`- Kernel tick id: ${report?.tickId || "unknown"}`);
  lines.push(`- Mode: ${report?.mode || report?.trigger || "unknown"}`);
  lines.push(`- Findings: ${findings.length}`);
  lines.push(`- Approval required: ${Boolean(report?.approvalRequired)}`);
  lines.push("");
  lines.push("## Guardrails");
  lines.push("");
  lines.push("- No production deploy is performed by this PR.");
  lines.push("- No water/DWG source files are touched.");
  lines.push("- No secrets are read or written.");
  lines.push("- No auth, billing, users, database, or infrastructure change is applied.");
  lines.push("- Merge/deploy remains blocked by build, typecheck, audit and founder approval policy.");
  lines.push("");
  lines.push("## Findings");
  lines.push("");

  if (top.length === 0) {
    lines.push("No findings were reported by the latest kernel tick.");
  } else {
    for (const finding of top) {
      lines.push(`### ${finding.title || finding.id || "Finding"}`);
      lines.push("");
      lines.push(`- Severity: ${finding.severity || "unknown"}`);
      lines.push(`- Zone: ${finding.zone || "unknown"}`);
      if (finding.path) lines.push(`- Path: ${finding.path}`);
      if (finding.evidence) lines.push(`- Evidence: ${String(finding.evidence).slice(0, 240)}`);
      if (finding.recommendation) lines.push(`- Recommendation: ${finding.recommendation}`);
      lines.push("");
    }
  }

  lines.push("## Next evolution step");
  lines.push("");
  lines.push("Convert repeated Z1/Z2 findings into small scoped PRs only after green build/typecheck/audit.");
  lines.push("");

  return lines.join("\n");
}

async function writeEvolutionReport() {
  if (!fs.existsSync(path.join(root, "scripts/pantavion-kernel-tick.cjs"))) {
    throw new Error("scripts/pantavion-kernel-tick.cjs missing. Install live kernel first.");
  }

  ensurePackageScripts();

  run("node scripts/pantavion-kernel-tick.cjs");

  const report =
    readJsonIfExists(".pantavion/kernel/script-last-report.json") ||
    readJsonIfExists(".pantavion/kernel/state.json") ||
    { findings: [] };

  await fsp.mkdir(path.join(root, "docs/kernel/evolution/history"), { recursive: true });

  const markdown = buildMarkdownReport(report);
  const stamp = nowStamp();

  fs.writeFileSync(
    path.join(root, "docs/kernel/evolution/latest-kernel-evolution.md"),
    markdown,
    "utf8",
  );

  fs.writeFileSync(
    path.join(root, `docs/kernel/evolution/history/${stamp}.md`),
    markdown,
    "utf8",
  );
}

function createOrUpdatePr(branch) {
  try {
    out("gh --version");
  } catch {
    console.log("GitHub CLI not available. Branch pushed, open PR manually.");
    return;
  }

  let existing = "";

  try {
    existing = out(`gh pr list --head "${branch}" --state open --json number --jq ".[0].number // empty"`);
  } catch {
    existing = "";
  }

  if (existing) {
    run(`gh pr edit ${existing} --title "Pantavion Kernel Evolution PR" --body-file docs/kernel/evolution/latest-kernel-evolution.md`);
    return;
  }

  run(`gh pr create --title "Pantavion Kernel Evolution PR" --body-file docs/kernel/evolution/latest-kernel-evolution.md --base main --head "${branch}"`);
}

async function main() {
  const args = process.argv.slice(2);
  const modeIndex = args.indexOf("--mode");
  const mode = modeIndex >= 0 ? args[modeIndex + 1] : "local";

  if (mode === "ci") {
    const branch = "kernel-evolution/auto";
    run(`git checkout -B ${branch}`);
    await writeEvolutionReport();

    run("npm run build");
    run("npx tsc --noEmit --pretty false");
    run("node scripts/pantavion-kernel-tick.cjs");

    const status = out("git status --porcelain");

    if (!status) {
      console.log("No evolution changes detected.");
      return;
    }

    run("git add package.json docs/kernel/evolution");
    run('git commit -m "Update Pantavion kernel evolution report"');
    run(`git push -u origin ${branch} --force-with-lease`);
    createOrUpdatePr(branch);
    return;
  }

  await writeEvolutionReport();

  run("npm run build");
  run("npx tsc --noEmit --pretty false");
  run("node scripts/pantavion-kernel-tick.cjs");

  console.log("");
  console.log("Evolution report written. Review git status and commit scoped files only.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
