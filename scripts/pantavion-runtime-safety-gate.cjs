#!/usr/bin/env node

const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const FOUNDER_APPROVAL_ENV = "PANTAVION_FOUNDER_APPROVED";

const protectedRules = [
  {
    id: "water-private-infrastructure",
    severity: "critical",
    patterns: [
      /^data[\/\\]water-network-private[\/\\]/i,
      /^core[\/\\]infrastructure[\/\\]water[\/\\]/i,
      /^app[\/\\]professional[\/\\]infrastructure[\/\\]water[\/\\]/i,
      /\.(dwg|dxf|kmz|kml)$/i,
    ],
  },
  {
    id: "users-access-records",
    severity: "critical",
    patterns: [
      /access/i,
      /approved-user/i,
      /approved-device/i,
      /founder/i,
      /admin/i,
      /session/i,
      /recovery/i,
    ],
  },
  {
    id: "legal-sos-minors-privacy",
    severity: "critical",
    patterns: [
      /^app[\/\\]sos[\/\\]/i,
      /(terms|privacy|legal|minors|consent|guardian|sos)/i,
    ],
  },
  {
    id: "secrets-provider-env",
    severity: "critical",
    patterns: [
      /^\.env/i,
      /secret/i,
      /credential/i,
      /api[_-]?key/i,
      /token/i,
      /provider/i,
      /vercel/i,
      /blob/i,
    ],
  },
  {
    id: "billing-payment-compliance",
    severity: "critical",
    patterns: [
      /billing/i,
      /payment/i,
      /stripe/i,
      /merchant/i,
      /invoice/i,
      /tax/i,
      /compliance/i,
    ],
  },
  {
    id: "production-deploy-config",
    severity: "high",
    patterns: [
      /^next\.config\./i,
      /^vercel\.json$/i,
      /^\.github[\/\\]workflows[\/\\]/i,
      /^package\.json$/i,
      /^package-lock\.json$/i,
    ],
  },
  {
    id: "data-deletion-migration",
    severity: "critical",
    patterns: [
      /migration/i,
      /delete/i,
      /truncate/i,
      /reset/i,
      /drop/i,
      /purge/i,
      /overwrite/i,
    ],
  },
];

const forbiddenPublicDataPatterns = [
  /^public[\/\\].*\.(dwg|dxf|kmz|kml|geojson|zip|7z|rar)$/i,
  /^app[\/\\].*\.(dwg|dxf|kmz|kml)$/i,
];

const allowedLocalApprovalFiles = new Set([
  ".pantavion-founder-approval.json",
]);

function run(command, options = {}) {
  return execSync(command, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: options.stdio || "pipe", { stdio: "inherit" });

  printSection("Running TypeScript");
  run("npx tsc --noEmit", { stdio: "inherit" });

  if (hasPackageScript("audit:pantavion")) {
    printSection("Running Pantavion audit");
    run("npm run audit:pantavion", { stdio: "inherit" });
  }

  printSection("Scoped diff summary");
  const cachedStat = run("git diff --cached --stat");
  const unstagedStat = run("git diff --stat");

  console.log("Cached diff:");
  console.log(cachedStat || "No cached diff.");

  console.log("");
  console.log("Unstaged diff:");
  console.log(unstagedStat || "No unstaged diff.");

  printSection("PASS");
  console.log("Pantavion Runtime Safety Gate passed.");
}

try {
  main();
} catch (error) {
  console.error("");
  console.error("Pantavion Runtime Safety Gate failed.");
  console.error(error && error.message ? error.message : error);
  process.exit(1);
}
