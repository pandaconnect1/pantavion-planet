#!/usr/bin/env node

const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const FOUNDER_APPROVAL_ENV = "PANTAVION_FOUNDER_APPROVED";

const protectedRules = [
  {
    id: "water-private-infrastructure",
    severity: "critical",
    patterns: [
      /^data[\\/]+water-network-private[\\/]/i,
      /^core[\\/]+infrastructure[\\/]+water[\\/]/i,
      /^app[\\/]+professional[\\/]+infrastructure[\\/]+water[\\/]/i,
      /\.(dwg|dxf|kmz|kml)$/i,
    ],
  },
  {
    id: "identity-access-and-recovery",
    severity: "critical",
    patterns: [
      /(^|[\\/_-])(access|approved-user|approved-device|founder|admin|session|recovery|auth)([\\/_-]|$)/i,
    ],
  },
  {
    id: "legal-sos-minors-privacy",
    severity: "critical",
    patterns: [
      /^app[\\/]+sos[\\/]/i,
      /(terms|privacy|legal|minors|consent|guardian|sos)/i,
    ],
  },
  {
    id: "secrets-provider-env",
    severity: "critical",
    patterns: [
      /^\.env/i,
      /(secret|credential|api[_-]?key|token|provider|vercel|blob)/i,
    ],
  },
  {
    id: "billing-payment-compliance",
    severity: "critical",
    patterns: [/(billing|payment|stripe|merchant|invoice|tax|compliance)/i],
  },
  {
    id: "production-deploy-config",
    severity: "high",
    patterns: [
      /^next\.config\./i,
      /^vercel\.json$/i,
      /^\.github[\\/]+workflows[\\/]/i,
      /^package(?:-lock)?\.json$/i,
    ],
  },
  {
    id: "data-deletion-migration",
    severity: "critical",
    patterns: [/(migration|delete|truncate|reset|drop|purge|overwrite)/i],
  },
];

const forbiddenPublicDataPatterns = [
  /^public[\\/]+.*\.(dwg|dxf|kmz|kml|geojson|zip|7z|rar)$/i,
  /^app[\\/]+.*\.(dwg|dxf|kmz|kml)$/i,
];

function runGit(args) {
  return execFileSync("git", args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function parseChangedPaths() {
  // Keep this explicit: the Foundation Audit verifies the use of git status --porcelain.
  const raw = runGit(["status", "--porcelain=v1", "--untracked-files=all"]);

  if (!raw) {
    return [];
  }

  return raw
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const pathPart = line.slice(3).trim();
      return pathPart.includes(" -> ") ? pathPart.split(" -> ").at(-1).trim() : pathPart;
    });
}

function matchingRules(file) {
  return protectedRules.filter((rule) => rule.patterns.some((pattern) => pattern.test(file)));
}

function listDiffStat(args) {
  try {
    return runGit(args) || "No diff.";
  } catch {
    return "Diff unavailable.";
  }
}

function assertNoApprovalArtifact() {
  const localApprovalPath = path.join(ROOT, ".pantavion-founder-approval.json");

  if (!fs.existsSync(localApprovalPath)) {
    return;
  }

  throw new Error(
    "Local approval artifacts must not substitute for an explicit owner decision. Remove .pantavion-founder-approval.json before running this gate.",
  );
}

function main() {
  console.log("=== Pantavion Runtime Safety Gate ===");
  console.log("Rule: Never use git add .; stage reviewed paths explicitly.");

  assertNoApprovalArtifact();

  const changedPaths = parseChangedPaths();
  const forbiddenPaths = changedPaths.filter((file) =>
    forbiddenPublicDataPatterns.some((pattern) => pattern.test(file)),
  );

  if (forbiddenPaths.length > 0) {
    throw new Error(
      "Forbidden public/raw infrastructure data path detected:\n" + forbiddenPaths.map((file) => `- ${file}`).join("\n"),
    );
  }

  const sensitiveChanges = changedPaths
    .map((file) => ({ file, rules: matchingRules(file) }))
    .filter((entry) => entry.rules.length > 0);

  if (sensitiveChanges.length > 0 && process.env[FOUNDER_APPROVAL_ENV] !== "true") {
    const details = sensitiveChanges
      .map((entry) => `- ${entry.file}: ${entry.rules.map((rule) => rule.id).join(", ")}`)
      .join("\n");

    throw new Error(
      `Sensitive/protected changes detected. Set ${FOUNDER_APPROVAL_ENV}=true only when the owner has explicitly authorized this exact bounded review.\n${details}`,
    );
  }

  if (sensitiveChanges.length > 0) {
    console.log(`Owner-authorized sensitive scope acknowledged through ${FOUNDER_APPROVAL_ENV}.`);
    for (const entry of sensitiveChanges) {
      console.log(`- ${entry.file}: ${entry.rules.map((rule) => rule.id).join(", ")}`);
    }
  } else {
    console.log("No sensitive/protected changed paths detected.");
  }

  console.log("\nScoped diff summary");
  console.log("Cached diff:");
  console.log(listDiffStat(["diff", "--cached", "--stat"]));
  console.log("\nUnstaged diff:");
  console.log(listDiffStat(["diff", "--stat"]));

  console.log("\nPASS: Pantavion Runtime Safety Gate passed.");
}

try {
  main();
} catch (error) {
  console.error("\nPantavion Runtime Safety Gate failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
