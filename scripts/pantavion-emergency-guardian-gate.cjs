
/*
  Pantavion Emergency Guardian Gate v1

  Read-only safety gate for:
  - Water Master / DWG-derived maps
  - protected segment rendering
  - private source boundaries
  - access/users/devices protection
  - public infrastructure exposure checks

  It does not delete, upload, deploy, mutate Blob, mutate users, or expose raw DWG.
*/

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = process.cwd();
const REPORT_DIR = path.join(ROOT, "artifacts", "pantavion-emergency-guardian-gate");
const REPORT_JSON = path.join(REPORT_DIR, "report.json");
const REPORT_MD = path.join(REPORT_DIR, "report.md");

const requiredFiles = [
  "package.json",
  "app/api/professional/infrastructure/water/segment/bbox/route.ts",
  "core/infrastructure/water/controlled-water-segment-index-provider.ts",
  "app/api/professional/infrastructure/water/master/b/route.ts",
  "app/professional/infrastructure/water/b/page.tsx",
  "app/professional/infrastructure/water/c/page.tsx",
  "app/professional/infrastructure/water/components/water-derived-map-client.tsx"
];

const requiredPackageScripts = [
  "build",
  "audit:water",
  "audit:water:abc",
  "audit:guardian:365",
  "runtime:heartbeat",
  "audit:emergency-guardian"
];

const blockedPublicExtensions = new Set([
  ".dwg",
  ".dxf",
  ".kmz",
  ".kml",
  ".geojson",
  ".mbtiles",
  ".pmtiles"
]);

const blockedRootFiles = new Set([
  "water-network.geojson",
  "water-network-mobile.geojson",
  "water-network-mobile-from-kmz.geojson",
  "water-network-mobile-v2-classified.geojson",
  "water-network-mobile-googleearth-style.geojson"
]);

const protectedPathPrefixes = [
  "data/water-network-private/",
  "data/water-access/",
  "data/water-approved-users/",
  "data/water-approved-devices/",
  "app/api/professional/infrastructure/water/access/",
  "app/api/professional/infrastructure/water/admin/",
  "app/api/professional/infrastructure/water/master/b/",
  "core/infrastructure/water/controlled-water-segment-index-provider.ts",
  "core/infrastructure/water/water-authorized-person-store.ts"
];

const markerRules = [
  {
    label: "B master private source registry",
    file: "app/api/professional/infrastructure/water/master/b/route.ts",
    mustContain: [
      "sourceFormat: \"DWG\"",
      "storageFormat: \"gzip-chunked-private-blob\"",
      "rawDwgDownloadAllowedForApprovedUsers: false",
      "publicAccessAllowed: false",
      "githubUploadAllowed: false",
      "browserFullNetworkLoadAllowed: false",
      "directMasterMutationAllowed: false"
    ],
    mustNotContain: [
      "rawDwgDownloadAllowedForApprovedUsers: true",
      "publicAccessAllowed: true",
      "githubUploadAllowed: true",
      "browserFullNetworkLoadAllowed: true",
      "directMasterMutationAllowed: true"
    ]
  },
  {
    label: "Protected bbox segment API",
    file: "app/api/professional/infrastructure/water/segment/bbox/route.ts",
    mustContain: [
      "authorizeWaterSegmentRequest",
      "approvedDeviceMatches",
      "getControlledWaterSegmentFromPrivateIndex",
      "completeNetworkReturned: false",
      "rawMasterReturned: false",
      "browserFullNetworkLoaded: false"
    ],
    mustNotContain: [
      "completeNetworkReturned: true",
      "rawMasterReturned: true",
      "browserFullNetworkLoaded: true"
    ]
  },
  {
    label: "Verified private segment provider",
    file: "core/infrastructure/water/controlled-water-segment-index-provider.ts",
    mustContain: [
      "EXPECTED_PLACEMARKS = 122857",
      "EXPECTED_LINE_STRINGS = 125398",
      "EXPECTED_COORDINATE_POINTS = 528063",
      "assertTruthReport",
      "assertIndexManifest",
      "indexBuiltFromFullMaster: true",
      "sampleAsFinal: false",
      "previewAsProduction: false",
      "completeNetworkReturned: false",
      "rawMasterReturned: false",
      "browserFullNetworkLoaded: false",
      "segment:"
    ],
    mustNotContain: [
      "indexBuiltFromFullMaster: false",
      "sampleAsFinal: true",
      "previewAsProduction: true",
      "completeNetworkReturned: true",
      "rawMasterReturned: true",
      "browserFullNetworkLoaded: true"
    ]
  },
  {
    label: "B/C protected map client",
    file: "app/professional/infrastructure/water/components/water-derived-map-client.tsx",
    mustContain: [
      "WaterDerivedMapClient",
      "L.geoJSON",
      "/api/professional/infrastructure/water/segment/bbox",
      "setFeatureCount"
    ],
    mustNotContain: [
      "fetch(\"/data/",
      "fetch('/data/",
      "fetch(\"/water-network",
      "fetch('/water-network"
    ]
  }
];

function normalizePath(value) {
  return value.replace(/\\/g, "/");
}

function absolute(relativePath) {
  return path.join(ROOT, relativePath);
}

function exists(relativePath) {
  return fs.existsSync(absolute(relativePath));
}

function read(relativePath) {
  return fs.readFileSync(absolute(relativePath), "utf8");
}

function walk(relativePath, output = []) {
  const start = absolute(relativePath);
  if (!fs.existsSync(start)) return output;

  for (const entry of fs.readdirSync(start, { withFileTypes: true })) {
    if ([".git", "node_modules", ".next", "artifacts"].includes(entry.name)) continue;

    const full = path.join(start, entry.name);
    const rel = normalizePath(path.relative(ROOT, full));

    if (entry.isDirectory()) {
      walk(rel, output);
    } else {
      output.push(rel);
    }
  }

  return output;
}

function runGit(args) {
  try {
    return execFileSync("git", args, {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    })
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function changedFiles() {
  const files = new Set([
    ...runGit(["diff", "--name-only"]),
    ...runGit(["diff", "--cached", "--name-only"]),
    ...runGit(["ls-files", "--others", "--exclude-standard"])
  ]);

  return Array.from(files).map(normalizePath).sort();
}

function finding(level, title, detail) {
  return { level, title, detail: detail || "" };
}

function checkRequiredFiles() {
  return requiredFiles
    .filter((file) => !exists(file))
    .map((file) => finding("critical", "Missing required file", file));
}

function checkPackageScripts() {
  if (!exists("package.json")) {
    return [finding("critical", "package.json missing", "Cannot verify package scripts.")];
  }

  let pkg;

  try {
    pkg = JSON.parse(read("package.json"));
  } catch (error) {
    return [finding("critical", "package.json invalid JSON", String(error.message || error))];
  }

  const scripts = pkg.scripts || {};
  return requiredPackageScripts
    .filter((scriptName) => !scripts[scriptName])
    .map((scriptName) => finding("high", "Missing package script", scriptName));
}

function checkPublicExposure() {
  const findings = [];

  for (const file of walk("public")) {
    const ext = path.extname(file).toLowerCase();
    if (blockedPublicExtensions.has(ext)) {
      findings.push(finding("critical", "Blocked public infrastructure file", file));
    }
  }

  for (const file of blockedRootFiles) {
    if (exists(file)) {
      findings.push(finding("critical", "Blocked root water/geodata file", file));
    }
  }

  return findings;
}

function checkMarkerRules() {
  const findings = [];

  for (const rule of markerRules) {
    if (!exists(rule.file)) {
      findings.push(finding("critical", `${rule.label} missing`, rule.file));
      continue;
    }

    const content = read(rule.file);

    for (const marker of rule.mustContain) {
      if (!content.includes(marker)) {
        findings.push(finding("high", `${rule.label}: required marker missing`, `${rule.file} :: ${marker}`));
      }
    }

    for (const marker of rule.mustNotContain) {
      if (content.includes(marker)) {
        findings.push(finding("critical", `${rule.label}: forbidden marker present`, `${rule.file} :: ${marker}`));
      }
    }
  }

  return findings;
}

function checkChangedProtectedPaths(files) {
  const findings = [];

  for (const file of files) {
    if (protectedPathPrefixes.some((prefix) => file === prefix || file.startsWith(prefix))) {
      findings.push(finding("warning", "Protected water/access/source path changed; founder review required", file));
    }

    if (file.startsWith("public/") && blockedPublicExtensions.has(path.extname(file).toLowerCase())) {
      findings.push(finding("critical", "Changed file would expose infrastructure publicly", file));
    }

    if (blockedRootFiles.has(file)) {
      findings.push(finding("critical", "Changed blocked root geodata file", file));
    }
  }

  return findings;
}

function summarize(findings) {
  return {
    critical: findings.filter((item) => item.level === "critical").length,
    high: findings.filter((item) => item.level === "high").length,
    warning: findings.filter((item) => item.level === "warning").length,
    info: findings.filter((item) => item.level === "info").length
  };
}

function markdown(report) {
  const lines = [];

  lines.push("# Pantavion Emergency Guardian Gate Report");
  lines.push("");
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(`Marker: ${report.marker}`);
  lines.push(`Changed files detected: ${report.changedFiles.length}`);
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
    lines.push("Gate passed.");
  } else {
    for (const item of report.findings) {
      lines.push(`- **${item.level.toUpperCase()}** - ${item.title}`);
      if (item.detail) lines.push(`  - ${String(item.detail).replace(/\n/g, "\n    ")}`);
    }
  }

  lines.push("");
  lines.push("## Boundary");
  lines.push("");
  lines.push("Read-only emergency gate. It does not delete, upload, deploy, mutate Blob, mutate users, expose raw DWG, or approve production changes.");

  return lines.join("\n");
}

function main() {
  fs.mkdirSync(REPORT_DIR, { recursive: true });

  const changed = changedFiles();
  const findings = [
    ...checkRequiredFiles(),
    ...checkPackageScripts(),
    ...checkPublicExposure(),
    ...checkMarkerRules(),
    ...checkChangedProtectedPaths(changed)
  ];

  const report = {
    marker: "pantavion_emergency_guardian_gate_v1",
    generatedAt: new Date().toISOString(),
    changedFiles: changed,
    summary: summarize(findings),
    findings
  };

  fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2));
  fs.writeFileSync(REPORT_MD, markdown(report));

  console.log(markdown(report));

  if (report.summary.critical > 0 || report.summary.high > 0) {
    process.exitCode = 1;
  }
}

main();
