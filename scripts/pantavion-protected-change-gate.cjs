#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const marker = "pantavion_protected_change_gate_v1";

const protectedPathRules = [
  {
    level: "critical",
    label: "private water data",
    patterns: [
      /^data[\/\\]water-network-private[\/\\]/i,
    ],
  },
  {
    level: "critical",
    label: "water infrastructure app",
    patterns: [
      /^app[\/\\]professional[\/\\]infrastructure[\/\\]water[\/\\]/i,
      /^app[\/\\]api[\/\\]professional[\/\\]infrastructure[\/\\]water[\/\\]/i,
      /^core[\/\\](?:infrastructure[\/\\])?water[\/\\]/i,
    ],
  },
  {
    level: "critical",
    label: "access or security layer",
    patterns: [
      /^core[\/\\]security[\/\\]/i,
      /^core[\/\\]admin[\/\\]/i,
      /^app[\/\\]api[\/\\].*access/i,
      /^app[\/\\].*admin/i,
    ],
  },
  {
    level: "critical",
    label: "kernel control layer",
    patterns: [
      /^core[\/\\]kernel[\/\\]/i,
      /^app[\/\\]kernel[\/\\]/i,
      /^app[\/\\]api[\/\\]kernel[\/\\]/i,
    ],
  },
];

const textFileExtensions = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".cjs",
  ".mjs",
  ".json",
  ".md",
  ".txt",
  ".css",
  ".html",
  ".yml",
  ".yaml",
]);

const blockedPublicExtensions = new Set([
  ".dwg",
  ".dxf",
  ".kmz",
  ".kml",
  ".geojson",
  ".shp",
  ".gpkg",
  ".sqlite",
  ".db",
]);

const mojibakeMarkers = [
  "\uFFFD",
  "?",
  "?",
  "?",
  "?",
  "?",
  "?",
  "?",
  "?",
  "U+008",
];

const dangerousDiffMarkers = [
  "featureCount: 0",
  "featureCount\":0",
  "totalMasterFeatureCount: 0",
  "totalMasterFeatureCount\":0",
  "water-network.geojson",
  "water-network.kmz",
  "water-network.dwg",
  "water-network.dxf",
];

function run(command) {
  try {
    return cp.execSync(command, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch (error) {
    return "";
  }
}

function normalize(file) {
  return file.replace(/\\/g, "/");
}

function exists(file) {
  return fs.existsSync(file);
}

function isTextFile(file) {
  return textFileExtensions.has(path.extname(file).toLowerCase());
}

function walk(dir) {
  if (!exists(dir)) return [];

  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if ([".git", ".next", "node_modules"].includes(entry.name)) continue;
      out.push(...walk(full));
    } else {
      out.push(full);
    }
  }
  return out;
}

function getChangedFiles() {
  const changed = new Set();

  for (const line of run("git status --short").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const file = trimmed
      .replace(/^R\s+.+?\s+->\s+/, "")
      .replace(/^..\s+/, "")
      .trim();

    if (file) changed.add(normalize(file));
  }

  return Array.from(changed);
}

function findProtectedPathHits(changedFiles) {
  const findings = [];

  for (const file of changedFiles) {
    for (const rule of protectedPathRules) {
      if (rule.patterns.some((pattern) => pattern.test(file))) {
        findings.push({
          level: rule.level,
          title: "Protected path changed",
          detail: `${rule.label}: ${file}`,
        });
      }
    }
  }

  return findings;
}

function findPublicExposureRisks() {
  const findings = [];

  for (const file of walk("public")) {
    const ext = path.extname(file).toLowerCase();
    if (blockedPublicExtensions.has(ext)) {
      findings.push({
        level: "critical",
        title: "Blocked public infrastructure asset",
        detail: normalize(file),
      });
    }
  }

  for (const rootFile of fs.readdirSync(".", { withFileTypes: true })) {
    if (!rootFile.isFile()) continue;
    const ext = path.extname(rootFile.name).toLowerCase();
    if (blockedPublicExtensions.has(ext)) {
      findings.push({
        level: "critical",
        title: "Blocked root infrastructure asset",
        detail: rootFile.name,
      });
    }
  }

  return findings;
}

function findMojibakeInChangedTextFiles(changedFiles) {
  const findings = [];

  for (const file of changedFiles) {
    if (!exists(file) || !isTextFile(file)) continue;

    const content = fs.readFileSync(file, "utf8");
    const lines = content.split(/\r?\n/);

    lines.forEach((line, index) => {
      const matched = mojibakeMarkers.find((markerText) =>
        line.includes(markerText),
      );

      if (matched) {
        findings.push({
          level: "critical",
          title: "Mojibake marker in changed file",
          detail: `${file}:${index + 1} marker=${JSON.stringify(matched)}`,
        });
      }
    });
  }

  return findings;
}

function findDangerousDiffMarkers() {
  const findings = [];
  const diff = run("git diff --no-ext-diff --");

  for (const markerText of dangerousDiffMarkers) {
    if (diff.includes(markerText)) {
      findings.push({
        level: "high",
        title: "Dangerous water/data marker in diff",
        detail: markerText,
      });
    }
  }

  return findings;
}

function summarize(findings) {
  const counts = {
    critical: 0,
    high: 0,
    warning: 0,
    info: 0,
  };

  for (const finding of findings) {
    counts[finding.level] = (counts[finding.level] || 0) + 1;
  }

  return counts;
}

const changedFiles = getChangedFiles();
const findings = [
  ...findProtectedPathHits(changedFiles),
  ...findPublicExposureRisks(),
  ...findMojibakeInChangedTextFiles(changedFiles),
  ...findDangerousDiffMarkers(),
];

const counts = summarize(findings);

console.log(`# Pantavion Protected Change Gate`);
console.log(`Generated: ${new Date().toISOString()}`);
console.log(`Marker: ${marker}`);
console.log(`Changed files detected: ${changedFiles.length}`);
console.log("");
console.log("## Summary");
console.log(`- Critical: ${counts.critical}`);
console.log(`- High: ${counts.high}`);
console.log(`- Warning: ${counts.warning}`);
console.log(`- Info: ${counts.info}`);
console.log("");

if (findings.length) {
  console.log("## Findings");
  for (const finding of findings) {
    console.log(`- [${finding.level}] ${finding.title}: ${finding.detail}`);
  }
  console.log("");
} else {
  console.log("## Findings");
  console.log("Gate passed.");
  console.log("");
}

console.log("## Boundary");
console.log("Read-only blocking gate. It does not restore, delete, upload, deploy, mutate Blob, mutate users, or approve production changes.");

if (counts.critical > 0 || counts.high > 0) {
  process.exit(1);
}
