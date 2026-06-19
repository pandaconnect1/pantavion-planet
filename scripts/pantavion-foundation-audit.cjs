#!/usr/bin/env node

const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();

const requiredFiles = [
  {
    file: "core/kernel/capability-broker-contract.ts",
    markers: [
      "PANTAVION_CORE_CAPABILITY_CONTRACTS",
      "requiresFounderApproval",
      "evaluateCapabilityRequest",
      "voice.realtime_interpreter_beta",
      "sos.offgrid_identity_pack",
    ],
  },
  {
    file: "core/kernel/agent-authorization-contract.ts",
    markers: [
      "PANTAVION_GUARDIAN_AGENT_CONTRACT",
      "water.source_modify",
      "dwg.transform_original",
      "secrets.read_raw",
      "founder_approval_required",
    ],
  },
  {
    file: "core/kernel/provider-router-contract.ts",
    markers: [
      "PANTAVION_PROVIDER_ROUTES",
      "provider.realtime_voice.primary",
      "provider.translation.text_fallback",
      "provider.satellite.future_certified",
      "No guaranteed rescue claim",
    ],
  },
  {
    file: "core/security/mcp-gateway-policy.ts",
    markers: [
      "PANTAVION_DEFAULT_MCP_POLICY",
      "untrusted",
      "deniedTools",
      "block_untrusted_metadata",
      "evaluateMcpToolRequest",
    ],
  },
  {
    file: "core/connectivity/connectivity-state-contract.ts",
    markers: [
      "satellite_supported",
      "unsafe_to_claim_delivery",
      "queuedEvents",
      "certifiedProviderId",
      "cannot guarantee delivery",
    ],
  },
  {
    file: "core/recovery/protected-state-recovery-contract.ts",
    markers: [
      "PANTAVION_PROTECTED_STATE_BASELINE",
      "approved_users",
      "access_requests",
      "founder_admin_access",
      "water_records",
      "checksumManifestRequired",
    ],
  },
  {
    file: "scripts/pantavion-runtime-safety-gate.cjs",
    markers: [
      "Pantavion Runtime Safety Gate",
      "git status --porcelain",
      "PANTAVION_FOUNDER_APPROVED",
      "Sensitive/protected changes detected",
      "Never use git add .",
    ],
  },
  {
    file: "docs/implementation/runtime-safety-and-capability-broker.md",
    markers: [
      "Pantavion Runtime Safety",
      "No agent, tool, provider, MCP server or workspace automation may execute directly",
      "MCP servers are untrusted by default",
      "No static AI Voice button",
      "No patch may delete or reset protected state",
    ],
  },
];

const forbiddenChangedPathPatterns = [
  /^public[\/\\].*\.(dwg|dxf|kmz|kml|geojson|zip|7z|rar)$/i,
  /^app[\/\\].*\.(dwg|dxf|kmz|kml)$/i,
];

function run(command) {
  return execSync(command, {
    cwd: ROOT,
    encoding: "utf8",
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function readText(relativePath) {
  const fullPath = path.join(ROOT, relativePath);

  if (!fs.existsSync(fullPath)) {
    return null;
  }

  return fs.readFileSync(fullPath, "utf8");
}

function fail(message) {
  console.error("FAIL: " + message);
  process.exitCode = 1;
}

function parseStatusFiles() {
  const raw = run("git status --porcelain=v1");

  if (!raw) {
    return [];
  }

  return raw
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      let file = line.slice(3).trim();

      if (file.includes(" -> ")) {
        file = file.split(" -> ").pop().trim();
      }

      return file;
    });
}

console.log("=== Pantavion Foundation Audit ===");

for (const item of requiredFiles) {
  const content = readText(item.file);

  if (content === null) {
    fail("Missing required foundation file: " + item.file);
    continue;
  }

  for (const marker of item.markers) {
    if (!content.includes(marker)) {
      fail("Missing marker " + JSON.stringify(marker) + " in " + item.file);
    }
  }
}

const packageJsonText = readText("package.json");

if (packageJsonText === null) {
  fail("Missing package.json");
} else {
  try {
    const packageJson = JSON.parse(packageJsonText);
    const scripts = packageJson.scripts || {};

    if (scripts["safety:pantavion"] !== "node scripts/pantavion-runtime-safety-gate.cjs") {
      fail("package.json must expose safety:pantavion runtime gate.");
    }

    if (scripts["audit:foundation"] !== "node scripts/pantavion-foundation-audit.cjs") {
      fail("package.json must expose audit:foundation.");
    }
  } catch (error) {
    fail("Invalid package.json: " + error.message);
  }
}

for (const changedFile of parseStatusFiles()) {
  if (forbiddenChangedPathPatterns.some((pattern) => pattern.test(changedFile))) {
    fail("Forbidden changed public/raw infrastructure data path detected: " + changedFile);
  }
}

if (process.exitCode) {
  console.error("Pantavion Foundation Audit failed.");
  process.exit(process.exitCode);
}

console.log("PASS: Pantavion Foundation Audit passed.");
