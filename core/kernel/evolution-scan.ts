import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import type { KernelFinding } from "./kernel-state";

export type EvolutionScanResult = {
  repoRoot: string;
  scannedAt: string;
  checkedFiles: number;
  findings: KernelFinding[];
  recommendedActions: string[];
};

const ignoredDirectories = new Set([
  ".git",
  ".next",
  ".vercel",
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".pantavion",
]);

const allowedExtensions = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".json",
  ".yml",
  ".yaml",
  ".md",
]);

function idFor(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex").slice(0, 16);
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function walk(dir: string, root: string, output: string[], limit = 700): Promise<void> {
  if (output.length >= limit) return;

  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (output.length >= limit) return;

    const full = path.join(dir, entry.name);
    const rel = path.relative(root, full).replaceAll("\\", "/");

    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        await walk(full, root, output, limit);
      }
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (allowedExtensions.has(ext)) {
      output.push(rel);
    }
  }
}

function pushFinding(findings: KernelFinding[], finding: Omit<KernelFinding, "id">): void {
  findings.push({
    id: idFor(`${finding.title}:${finding.path ?? ""}:${finding.evidence ?? ""}`),
    ...finding,
  });
}

export async function runEvolutionScan(): Promise<EvolutionScanResult> {
  const repoRoot = process.cwd();
  const findings: KernelFinding[] = [];
  const files: string[] = [];

  await walk(repoRoot, repoRoot, files);

  const packageJsonPath = path.join(repoRoot, "package.json");
  const packageLockPath = path.join(repoRoot, "package-lock.json");
  const workflowDir = path.join(repoRoot, ".github", "workflows");

  if (!(await exists(packageJsonPath))) {
    pushFinding(findings, {
      title: "Missing package.json",
      severity: "critical",
      zone: "Z3_FOUNDER_APPROVAL_REQUIRED",
      path: "package.json",
      recommendation: "Kernel cannot run build/typecheck guards without package metadata.",
    });
  } else {
    try {
      const pkg = JSON.parse(await fs.readFile(packageJsonPath, "utf8"));
      const scripts = pkg.scripts ?? {};
      for (const scriptName of ["preinstall", "install", "postinstall", "prepare"]) {
        if (scripts[scriptName]) {
          pushFinding(findings, {
            title: `Dependency lifecycle script detected: ${scriptName}`,
            severity: "high",
            zone: "Z3_FOUNDER_APPROVAL_REQUIRED",
            path: "package.json",
            evidence: String(scripts[scriptName]).slice(0, 180),
            recommendation: "Review dependency lifecycle scripts before any merge or deployment.",
          });
        }
      }

      if (!scripts.build) {
        pushFinding(findings, {
          title: "Missing build script",
          severity: "high",
          zone: "Z3_FOUNDER_APPROVAL_REQUIRED",
          path: "package.json",
          recommendation: "Add or restore a real build script before production deployment.",
        });
      }
    } catch (error) {
      pushFinding(findings, {
        title: "package.json parse failed",
        severity: "critical",
        zone: "Z3_FOUNDER_APPROVAL_REQUIRED",
        path: "package.json",
        evidence: error instanceof Error ? error.message : "Unknown parse error",
        recommendation: "Fix package.json syntax before any automation continues.",
      });
    }
  }

  if (!(await exists(packageLockPath))) {
    pushFinding(findings, {
      title: "Missing package-lock.json",
      severity: "warning",
      zone: "Z2_PREVIEW_REQUIRED",
      path: "package-lock.json",
      recommendation: "Use a lockfile so CI/CD and local builds install the same dependency graph.",
    });
  }

  if (!(await exists(workflowDir))) {
    pushFinding(findings, {
      title: "Missing GitHub Actions workflow directory",
      severity: "warning",
      zone: "Z2_PREVIEW_REQUIRED",
      path: ".github/workflows",
      recommendation: "Add CI/CD guardrails for build, typecheck, audit and kernel tick.",
    });
  }

  const patterns = [
    { text: "placeholder", title: "Placeholder capability marker" },
    { text: "coming soon", title: "Coming-soon capability marker" },
    { text: "fake", title: "Fake/static capability marker" },
    { text: "href=\"#\"", title: "Dead button/link marker" },
    { text: "TODO", title: "TODO marker" },
  ];

  for (const rel of files) {
    if (findings.length > 120) break;

    const full = path.join(repoRoot, rel);
    let content = "";

    try {
      const stat = await fs.stat(full);
      if (stat.size > 240_000) continue;
      content = await fs.readFile(full, "utf8");
    } catch {
      continue;
    }

    const lower = content.toLowerCase();

    for (const pattern of patterns) {
      const matched = pattern.text === "TODO" ? content.includes("TODO") : lower.includes(pattern.text.toLowerCase());
      if (!matched) continue;

      pushFinding(findings, {
        title: pattern.title,
        severity: rel.startsWith("app/") ? "warning" : "info",
        zone: rel.startsWith("app/") ? "Z2_PREVIEW_REQUIRED" : "Z1_AUTO_SAFE",
        path: rel,
        evidence: pattern.text,
        recommendation:
          "Capability must have real route, logic, state/data flow, provider/source when needed, and clear disabled/internal status.",
      });
      break;
    }
  }

  const recommendedActions = Array.from(
    new Set(findings.map((finding) => finding.recommendation)),
  ).slice(0, 20);

  return {
    repoRoot,
    scannedAt: new Date().toISOString(),
    checkedFiles: files.length,
    findings,
    recommendedActions,
  };
}
