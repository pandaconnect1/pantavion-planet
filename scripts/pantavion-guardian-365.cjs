#!/usr/bin/env node
/*
  Pantavion Guardian 365
  Safe audit/report/proposal foundation.

  It does NOT:
  - auto-delete
  - auto-merge
  - expose secrets
  - send payments/messages/emails
  - make destructive production changes
  - claim guaranteed SOS/satellite/authority rescue
*/

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = process.cwd();
const REPORT_DIR = path.join(ROOT, "artifacts", "pantavion-guardian-365");
const REPORT_MD = path.join(REPORT_DIR, "report.md");
const REPORT_JSON = path.join(REPORT_DIR, "report.json");

const requiredFiles = [
  "package.json",
  "app/pantavion/layout.tsx",
  "app/pantavion/page.tsx",
  "app/pantavion/kernel/page.tsx",
  "app/pantavion/ai/page.tsx",
  "app/pantavion/ai/router/page.tsx",
  "app/pantavion/ai/agents/page.tsx",
  "app/pantavion/protocol/page.tsx",
  "app/pantavion/voice/page.tsx",
  "app/pantavion/sos/page.tsx",
  "app/pantavion/offgrid/page.tsx",
  "app/pantavion/control-room/page.tsx",
  "app/pantavion/readiness/page.tsx"
];

const requiredPackageScripts = [
  "build",
  "audit:pantavion",
  "audit:implementation",
  "audit:autonomous-builder",
  "audit:intelligence",
  "audit:guardian:365"
];

const forbiddenClaims = [
  "automatic authority dispatch",
  "guaranteed rescue",
  "guaranteed satellite rescue",
  "unlimited ai without fair-use",
  "public raw water"
];

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function walk(dir, predicate, output = []) {
  const absolute = path.join(ROOT, dir);
  if (!fs.existsSync(absolute)) return output;

  for (const item of fs.readdirSync(absolute, { withFileTypes: true })) {
    const full = path.join(absolute, item.name);
    const rel = path.relative(ROOT, full).replace(/\\/g, "/");

    if (item.isDirectory()) {
      if ([".git", "node_modules", ".next", "artifacts"].includes(item.name)) continue;
      walk(rel, predicate, output);
    } else if (predicate(rel)) {
      output.push(rel);
    }
  }

  return output;
}

function runOptional(command, args) {
  try {
    const output = execFileSync(command, args, {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"]
    });
    return { ok: true, output: output.trim() };
  } catch (error) {
    return {
      ok: false,
      output: String((error.stdout || "") + (error.stderr || error.message || error)).trim()
    };
  }
}

function checkPackageScripts() {
  const findings = [];

  if (!exists("package.json")) {
    findings.push({ level: "critical", title: "package.json missing", detail: "Cannot verify package scripts." });
    return findings;
  }

  let pkg;
  try {
    pkg = JSON.parse(read("package.json"));
  } catch (error) {
    findings.push({ level: "critical", title: "package.json invalid JSON", detail: String(error.message || error) });
    return findings;
  }

  const scripts = pkg.scripts || {};
  for (const script of requiredPackageScripts) {
    if (!scripts[script]) {
      findings.push({ level: "high", title: `Missing package script: ${script}`, detail: "Required by Guardian 365 baseline." });
    }
  }

  return findings;
}

function checkRequiredFiles() {
  return requiredFiles
    .filter((file) => !exists(file))
    .map((file) => ({
      level: "high",
      title: `Missing required file: ${file}`,
      detail: "Expected by Pantavion Guardian 365 baseline."
    }));
}

function checkPantavionRoutes() {
  const pages = walk("app/pantavion", (rel) => rel.endsWith("/page.tsx"));
  const findings = [];

  for (const page of pages) {
    const content = read(page);

    if (content.trim().length < 400) {
      findings.push({ level: "warning", title: `Thin Pantavion page: ${page}`, detail: "Page may be hollow or incomplete." });
    }

    if (!content.includes("export default")) {
      findings.push({ level: "warning", title: `Missing default export: ${page}`, detail: "Next.js route page should export a default component." });
    }
  }

  return { pages, findings };
}

function checkForbiddenClaims() {
  const files = walk(".", (rel) => /\.(ts|tsx|js|cjs|mjs|md|yml|yaml|json)$/.test(rel));
  const findings = [];

  for (const file of files) {
    let content = "";

    try {
      content = read(file).toLowerCase();
    } catch {
      continue;
    }

    for (const claim of forbiddenClaims) {
      if (content.includes(claim.toLowerCase())) {
        findings.push({ level: "warning", title: `Sensitive claim phrase found: ${claim}`, detail: file });
      }
    }
  }

  return findings;
}

function summarize(findings) {
  return {
    critical: findings.filter((f) => f.level === "critical").length,
    high: findings.filter((f) => f.level === "high").length,
    warning: findings.filter((f) => f.level === "warning").length,
    info: findings.filter((f) => f.level === "info").length
  };
}

function markdownReport(report) {
  const lines = [];

  lines.push("# Pantavion Guardian 365 Report");
  lines.push("");
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(`Repository: ${report.repo}`);
  lines.push(`SHA: ${report.sha}`);
  lines.push(`Pantavion route pages detected: ${report.pantavionRoutesDetected}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Critical: ${report.summary.critical}`);
  lines.push(`- High: ${report.summary.high}`);
  lines.push(`- Warning: ${report.summary.warning}`);
  lines.push(`- Info: ${report.summary.info}`);
  lines.push("");
  lines.push("## Findings");
  lines.push("");

  if (report.findings.length === 0) {
    lines.push("No findings. Guardian deterministic baseline passed.");
  } else {
    for (const finding of report.findings) {
      lines.push(`- **${finding.level.toUpperCase()}** - ${finding.title}`);
      lines.push(`  - ${String(finding.detail || "").replace(/\n/g, "\n    ")}`);
    }
  }

  lines.push("");
  lines.push("## Founder safety boundary");
  lines.push("");
  lines.push("Guardian 365 is currently an audit/report/proposal foundation. It does not auto-delete, auto-merge, auto-pay, auto-message, expose secrets, or make destructive production changes without explicit founder approval.");

  return lines.join("\n");
}

function main() {
  fs.mkdirSync(REPORT_DIR, { recursive: true });

  const routeCheck = checkPantavionRoutes();

  const findings = [
    ...checkPackageScripts(),
    ...checkRequiredFiles(),
    ...routeCheck.findings,
    ...checkForbiddenClaims()
  ];

  const report = {
    generatedAt: new Date().toISOString(),
    repo: process.env.GITHUB_REPOSITORY || "local",
    sha: process.env.GITHUB_SHA || "local",
    pantavionRoutesDetected: routeCheck.pages.length,
    summary: summarize(findings),
    findings
  };

  fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2));
  const md = markdownReport(report);
  fs.writeFileSync(REPORT_MD, md);

  console.log(md);

  if (report.summary.critical > 0 || report.summary.high > 0) {
    process.exitCode = 1;
  }
}

main();
