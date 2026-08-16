const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = process.cwd();
const outDir = path.join(root, "data", "pantavion-legacy-intake");
const manifestPath = path.join(outDir, "legacy-source-manifest.json");
const extractsPath = path.join(outDir, "legacy-extracts.jsonl");
const workOrdersPath = path.join(outDir, "legacy-work-orders.json");
const reportPath = path.join(root, "docs", "continuity", "pantavion-legacy-source-intake-report.md");

const candidates = [
  root,
  "C:\\Users\\gnkkm\\Documents\\pantavion-one-clean",
  "C:\\pantavion-one",
  "C:\\Users\\gnkkm\\OneDrive\\Έγγραφα\\pantavion.com",
  "C:\\Users\\gnkkm\\AppData\\Roaming\\Code\\User\\agent-sessions",
  "C:\\desktop\\New folder (2)\\pantavion-one-unified\\New folder\\pantavion-core",
  "C:\\desktop\\New folder (2)\\pantavion-one-unified\\New folder\\pantavion-core\\pantavion-core",
  "C:\\desktop\\PANTAVION-MASTER-DOCTRINE 2-5-2026.md",
  "E:\\GEORGE_MAP_MASTER_B_C_FINAL (1).dwg",
  "E:\\DTX MAP\\MASTER 2025_M_15.1 (2).dxf",
  "F:\\DTX MAP"
];

const skipDirs = new Set([
  ".git",
  ".next",
  "node_modules",
  ".vercel",
  ".turbo",
  "dist",
  "build",
  ".cache",
  "data\\pantavion-legacy-intake",
  "data/pantavion-legacy-intake"
]);

const textExts = new Set([
  ".md",
  ".txt",
  ".ts",
  ".tsx",
  ".js",
  ".cjs",
  ".mjs",
  ".json",
  ".yml",
  ".yaml",
  ".css"
]);

const sourceTruthExts = new Set([".dwg", ".dxf"]);
const maxFilesPerDirectory = 3000;
const maxExtractFiles = 900;
const maxExtractChars = 6000;
const maxTextFileBytes = 400000;

function normalizeSlash(value) {
  return String(value || "").replace(/\\/g, "/");
}

function exists(p) {
  try {
    fs.statSync(p);
    return true;
  } catch {
    return false;
  }
}

function statOf(p) {
  try {
    const s = fs.statSync(p);
    return {
      exists: true,
      isFile: s.isFile(),
      isDirectory: s.isDirectory(),
      sizeBytes: s.size,
      modifiedAt: s.mtime.toISOString()
    };
  } catch {
    return {
      exists: false,
      isFile: false,
      isDirectory: false,
      sizeBytes: null,
      modifiedAt: null
    };
  }
}

function hashFileSmall(p, maxBytes = 100000000) {
  try {
    const s = fs.statSync(p);
    if (s.size > maxBytes) {
      return "sha256_skipped_large_file";
    }
    return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
  } catch {
    return "sha256_unavailable";
  }
}

function walk(dir) {
  const files = [];
  const stack = [dir];

  while (stack.length && files.length < maxFilesPerDirectory) {
    const current = stack.pop();

    let entries = [];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const full = path.join(current, entry.name);

      if (entry.isDirectory()) {
        if (!skipDirs.has(entry.name) && !skipDirs.has(normalizeSlash(path.relative(root, full)))) {
          stack.push(full);
        }
      } else if (entry.isFile()) {
        files.push(full);
      }

      if (files.length >= maxFilesPerDirectory) break;
    }
  }

  return files;
}

function pathLooksSecret(p) {
  const lower = normalizeSlash(p).toLowerCase();
  return (
    lower.includes("/.env") ||
    lower.endsWith(".env") ||
    lower.endsWith(".pem") ||
    lower.endsWith(".key") ||
    lower.endsWith(".p12") ||
    lower.endsWith(".pfx") ||
    lower.includes("secret") ||
    lower.includes("private-key")
  );
}

function redactSecrets(text) {
  let out = text;

  const patterns = [
    /([A-Z0-9_]*API[_-]?KEY[A-Z0-9_]*\s*[:=]\s*)["']?[^"'\s]+["']?/gi,
    /([A-Z0-9_]*SECRET[A-Z0-9_]*\s*[:=]\s*)["']?[^"'\s]+["']?/gi,
    /([A-Z0-9_]*TOKEN[A-Z0-9_]*\s*[:=]\s*)["']?[^"'\s]+["']?/gi,
    /([A-Z0-9_]*PASSWORD[A-Z0-9_]*\s*[:=]\s*)["']?[^"'\s]+["']?/gi,
    /(bearer\s+)[a-z0-9._-]+/gi,
    /sk-[a-z0-9_-]{10,}/gi
  ];

  for (const pattern of patterns) {
    out = out.replace(pattern, "$1[REDACTED]");
  }

  return out;
}

function classifyText(text, rel) {
  const lower = `${rel}\n${text}`.toLowerCase();
  const categories = [];

  if (/kernel|agent|runtime|evolve|supervisor|daemon|tick/.test(lower)) categories.push("kernel_agent");
  if (/voice|translation|translate|language|7000|interpreter/.test(lower)) categories.push("voice_translation");
  if (/social|people|chat|messaging|telegram|instagram|facebook|dating|grindr|tinder|gaydar/.test(lower)) categories.push("social_messaging_dating");
  if (/stripe|payment|billing|vip|premium|subscription/.test(lower)) categories.push("payments_vip");
  if (/login|auth|otp|session|identity|profile|user/.test(lower)) categories.push("auth_identity");
  if (/dwg|dxf|cad|gis|geojson|water|map|υδρευση|ύδρευση/.test(lower)) categories.push("water_dwg_gis");
  if (/sos|emergency|rescue|recovery|account recovery|lost phone/.test(lower)) categories.push("sos_rescue_recovery");
  if (/convert|conversion|format|file|pdf|docx|xlsx|pptx|image|audio|video/.test(lower)) categories.push("files_conversion");
  if (/todo|fixme|placeholder|fake|dead button|missing|gap|requires_adapter/.test(lower)) categories.push("implementation_gaps");

  return categories.length ? categories : ["general_pantavion"];
}

function workOrderForCategory(category) {
  const map = {
    kernel_agent: {
      priority: "P0",
      title: "Merge legacy kernel/agent/runtime ideas into Agent Supervisor and Safe Runner.",
      requiredOutcome: "Supervisor route, script/source truth ledger, work-order queue, state and audit."
    },
    voice_translation: {
      priority: "P1",
      title: "Convert legacy voice/translation/language ideas into provider-adapter work orders.",
      requiredOutcome: "Voice/text/camera translation status, provider adapter gates, minors policy and audit."
    },
    social_messaging_dating: {
      priority: "P0",
      title: "Convert social/messaging/dating ideas into governed identity and safety modules.",
      requiredOutcome: "Real routes with identity, consent, moderation, report/block, age gates and founder approval."
    },
    payments_vip: {
      priority: "P0",
      title: "Convert payments/VIP ideas into billing and entitlement foundation.",
      requiredOutcome: "Stripe/provider plan, VIP entitlements, billing audit and production approval gate."
    },
    auth_identity: {
      priority: "P0",
      title: "Convert auth/login/profile ideas into real account foundation.",
      requiredOutcome: "Auth provider plan, sessions, profile, consent memory and security audit."
    },
    water_dwg_gis: {
      priority: "P0",
      title: "Convert water/DWG/GIS ideas into source-truth protected infrastructure module.",
      requiredOutcome: "Original DWG read-only contract, licensed viewer adapter work order, C overlays and audit."
    },
    sos_rescue_recovery: {
      priority: "P0",
      title: "Convert SOS/rescue/recovery ideas into lawful safety and recovery modules.",
      requiredOutcome: "SOS/rescue routes, emergency circle, official recovery flows, prohibited actions and audit."
    },
    files_conversion: {
      priority: "P1",
      title: "Convert file/conversion ideas into Conversion Matrix and adapter registry.",
      requiredOutcome: "Format support levels, adapter/provider/license/cost status and derivative-only outputs."
    },
    implementation_gaps: {
      priority: "P0",
      title: "Turn legacy TODO/fake/placeholder/gap findings into implementation work orders.",
      requiredOutcome: "Every gap gets owner category, required files, route/state/audit and verification gate."
    },
    general_pantavion: {
      priority: "P2",
      title: "Review general Pantavion legacy ideas and classify into modules.",
      requiredOutcome: "Module classification, priority, risk zone and next implementation slice."
    }
  };

  return map[category] || map.general_pantavion;
}

function analyzeFile(file, baseLabel) {
  const stat = statOf(file);
  const ext = path.extname(file).toLowerCase();
  const rel = normalizeSlash(path.relative(root, file));
  const normalized = normalizeSlash(file);

  const record = {
    source: baseLabel,
    absolutePath: normalized,
    relativeToCurrentRepo: rel.startsWith("..") ? null : rel,
    extension: ext || "none",
    sizeBytes: stat.sizeBytes,
    modifiedAt: stat.modifiedAt,
    sourceTruthMetadataOnly: sourceTruthExts.has(ext),
    sha256: null,
    extracted: false,
    secretsRedacted: false,
    contentOmittedReason: null,
    categories: []
  };

  if (sourceTruthExts.has(ext)) {
    record.sha256 = hashFileSmall(file);
    record.contentOmittedReason = "CAD/DWG/DXF source-truth metadata only. No conversion or content extraction.";
    record.categories = ["water_dwg_gis"];
    return { record, extract: null };
  }

  if (!textExts.has(ext)) {
    record.contentOmittedReason = "Non-text or unsupported extension for safe legacy extraction.";
    return { record, extract: null };
  }

  if (pathLooksSecret(file)) {
    record.contentOmittedReason = "Sensitive path. Content not committed.";
    record.secretsRedacted = true;
    record.categories = ["auth_identity", "implementation_gaps"];
    return { record, extract: null };
  }

  if (stat.sizeBytes > maxTextFileBytes) {
    record.contentOmittedReason = "Text file too large for canonical extract. Metadata only.";
    return { record, extract: null };
  }

  let text = "";
  try {
    text = fs.readFileSync(file, "utf8");
  } catch {
    record.contentOmittedReason = "Could not read as utf8.";
    return { record, extract: null };
  }

  const redacted = redactSecrets(text);
  record.secretsRedacted = redacted !== text;
  record.sha256 = crypto.createHash("sha256").update(text).digest("hex");
  record.categories = classifyText(redacted, normalized);
  record.extracted = true;

  const extract = {
    source: baseLabel,
    absolutePath: normalized,
    extension: record.extension,
    sizeBytes: record.sizeBytes,
    modifiedAt: record.modifiedAt,
    sha256: record.sha256,
    secretsRedacted: record.secretsRedacted,
    categories: record.categories,
    excerpt: redacted.slice(0, maxExtractChars)
  };

  return { record, extract };
}

function analyzeCandidate(candidate) {
  const stat = statOf(candidate);
  const item = {
    path: normalizeSlash(candidate),
    ...stat,
    filesScanned: 0,
    extractedCount: 0,
    metadataOnlyCount: 0,
    missing: !stat.exists,
    notes: []
  };

  if (!stat.exists) {
    item.notes.push("Path not found on this machine.");
    return { item, records: [], extracts: [] };
  }

  const records = [];
  const extracts = [];

  if (stat.isFile) {
    const analyzed = analyzeFile(candidate, normalizeSlash(candidate));
    records.push(analyzed.record);
    if (analyzed.extract) extracts.push(analyzed.extract);
    item.filesScanned = 1;
    item.extractedCount = extracts.length;
    item.metadataOnlyCount = records.filter((r) => r.sourceTruthMetadataOnly).length;
    return { item, records, extracts };
  }

  if (!stat.isDirectory) {
    item.notes.push("Not a file or directory.");
    return { item, records, extracts };
  }

  const files = walk(candidate);
  item.filesScanned = files.length;

  for (const file of files) {
    const analyzed = analyzeFile(file, normalizeSlash(candidate));
    records.push(analyzed.record);

    if (analyzed.extract && extracts.length < maxExtractFiles) {
      extracts.push(analyzed.extract);
    }
  }

  item.extractedCount = extracts.length;
  item.metadataOnlyCount = records.filter((r) => r.sourceTruthMetadataOnly).length;

  return { item, records, extracts };
}

function main() {
  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });

  const candidateReports = [];
  const allRecords = [];
  const allExtracts = [];

  for (const candidate of candidates) {
    const result = analyzeCandidate(candidate);
    candidateReports.push(result.item);
    allRecords.push(...result.records);
    allExtracts.push(...result.extracts);
  }

  const categoryEvidence = new Map();

  for (const extract of allExtracts) {
    for (const category of extract.categories) {
      if (!categoryEvidence.has(category)) categoryEvidence.set(category, []);
      const list = categoryEvidence.get(category);
      if (list.length < 40) {
        list.push({
          source: extract.source,
          path: extract.absolutePath,
          extension: extract.extension,
          modifiedAt: extract.modifiedAt,
          secretsRedacted: extract.secretsRedacted
        });
      }
    }
  }

  const workOrders = Array.from(categoryEvidence.entries()).map(([category, evidence], index) => {
    const base = workOrderForCategory(category);
    return {
      id: `legacy_${category}_${String(index + 1).padStart(3, "0")}`,
      category,
      priority: base.priority,
      title: base.title,
      reason: `Legacy intake found ${evidence.length} relevant evidence item(s) for ${category}.`,
      requiredOutcome: base.requiredOutcome,
      evidence,
      status: "ready_for_kernel_agent_review",
      requiresFounderApproval:
        category.includes("dwg") ||
        category.includes("auth") ||
        category.includes("payments") ||
        category.includes("social") ||
        category.includes("sos"),
      createdAt: new Date().toISOString()
    };
  });

  const manifest = {
    ok: true,
    id: "pantavion_legacy_source_manifest_v1",
    generatedAt: new Date().toISOString(),
    currentRoot: normalizeSlash(root),
    candidates: candidateReports,
    totals: {
      candidates: candidates.length,
      foundCandidates: candidateReports.filter((x) => x.exists).length,
      filesIndexed: allRecords.length,
      safeExtracts: allExtracts.length,
      workOrders: workOrders.length,
      cadSourceTruthMetadataOnly: allRecords.filter((x) => x.sourceTruthMetadataOnly).length,
      redactedExtracts: allExtracts.filter((x) => x.secretsRedacted).length
    },
    rules: [
      "Raw old repos are not blindly committed.",
      "Safe text/source excerpts are committed as sanitized legacy intake intelligence.",
      "Secrets are redacted or omitted.",
      "DWG/DXF/CAD source-truth artifacts are metadata-only.",
      "Every idea becomes a work order before implementation."
    ],
    records: allRecords.slice(0, 2500)
  };

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  fs.writeFileSync(workOrdersPath, JSON.stringify({ ok: true, workOrders }, null, 2) + "\n", "utf8");
  fs.writeFileSync(extractsPath, allExtracts.map((x) => JSON.stringify(x)).join("\n") + "\n", "utf8");

  const report = [
    "# Pantavion Legacy Source Intake Report",
    "",
    `Generated: ${manifest.generatedAt}`,
    "",
    "## Totals",
    "",
    `- Found candidates: ${manifest.totals.foundCandidates}/${manifest.totals.candidates}`,
    `- Files indexed: ${manifest.totals.filesIndexed}`,
    `- Safe extracts: ${manifest.totals.safeExtracts}`,
    `- Redacted extracts: ${manifest.totals.redactedExtracts}`,
    `- CAD/DWG/DXF metadata-only records: ${manifest.totals.cadSourceTruthMetadataOnly}`,
    `- Work orders: ${manifest.totals.workOrders}`,
    "",
    "## Work orders",
    "",
    ...workOrders.map((wo) => `- ${wo.priority} ${wo.id}: ${wo.title}`),
    "",
    "## Rule",
    "",
    "Old Pantavion material is not discarded and is not raw-added blindly. It is converted into sanitized source intelligence, work orders, and Kernel/Agent review material."
  ].join("\n");

  fs.writeFileSync(reportPath, report + "\n", "utf8");

  console.log(JSON.stringify({
    ok: true,
    generatedAt: manifest.generatedAt,
    totals: manifest.totals,
    wrote: [
      "data/pantavion-legacy-intake/legacy-source-manifest.json",
      "data/pantavion-legacy-intake/legacy-extracts.jsonl",
      "data/pantavion-legacy-intake/legacy-work-orders.json",
      "docs/continuity/pantavion-legacy-source-intake-report.md"
    ]
  }, null, 2));
}

main();
