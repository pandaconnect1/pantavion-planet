const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = process.cwd();
const outRoot = path.join(root, "data", "recovery", "canonical-knowledge");
const batchSize = 1499;

const sourceSpecs = [
  {
    family: "founder-vision",
    roots: ["data/founder-vision-vault", "app", "core", "scripts"],
    extensions: [".md", ".txt", ".json", ".ts", ".tsx", ".js", ".cjs", ".html"],
    markers: [
      "voice", "translation", "interpreter", "language", "dialect", "7000",
      "SOS", "social", "marketplace", "work", "income", "media", "education",
      "kernel", "guardian", "PantaAI", "provider", "auth", "database",
      "satellite", "offline", "emergency", "identity", "vision", "planned",
      "blocked", "unfinished", "future", "missing"
    ],
  },
  {
    family: "unfinished-gap",
    roots: ["app", "core", "scripts", ".github"],
    extensions: [".ts", ".tsx", ".js", ".jsx", ".cjs", ".yml", ".yaml", ".json", ".md"],
    markers: [
      "planned", "blocked", "provider_pending", "provider-required", "TODO", "FIXME",
      "missing", "foundation", "future", "not yet", "requires", "Founder OK",
      "approval", "runtimeTarget", "mustNotFake", "translation", "interpreter", "voice",
      "sos", "marketplace", "social", "identity", "auth", "database", "provider",
      "radar", "guardian", "kernel"
    ],
  },
];

const blockedRoots = [
  ".next",
  "node_modules",
  "data/water-network-private",
  "_local_backups",
  ".pantavion-backups",
  "data/recovery/canonical-knowledge",
];

function normalizePath(value) {
  return value.replace(/\\/g, "/");
}

function isBlocked(rel) {
  const normalized = normalizePath(rel);
  return blockedRoots.some((blocked) => normalized === blocked || normalized.startsWith(`${blocked}/`));
}

function walk(relativeDir, extensions) {
  const absolute = path.join(root, relativeDir);
  if (!fs.existsSync(absolute)) return [];
  const out = [];

  for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
    const rel = normalizePath(path.join(relativeDir, entry.name));
    if (isBlocked(rel)) continue;
    if (entry.isDirectory()) out.push(...walk(rel, extensions));
    else if (extensions.has(path.extname(entry.name))) out.push(rel);
  }

  return out;
}

function stableId(sourceFamily, file, line, marker, text) {
  const raw = [sourceFamily, file, line ?? "", marker ?? "", text].join("\u001f");
  return `pk_${crypto.createHash("sha256").update(raw).digest("hex").slice(0, 24)}`;
}

function fingerprint(records) {
  return crypto
    .createHash("sha256")
    .update(records.map((record) => record.id).join("\n"))
    .digest("hex");
}

function batchLabel(index) {
  let value = index + 1;
  let label = "";
  while (value > 0) {
    value -= 1;
    label = String.fromCharCode(65 + (value % 26)) + label;
    value = Math.floor(value / 26);
  }
  return label;
}

function inferLayer(file) {
  if (file.startsWith("app/api/")) return "API";
  if (file.startsWith("app/")) return "UI";
  if (file.includes("/kernel/") || file.startsWith("kernel/")) return "KERNEL";
  if (file.includes("/runtime/")) return "RUNTIME";
  if (file.startsWith("services/")) return "SERVICE";
  if (file.startsWith("data/")) return "DATA";
  if (file.startsWith("scripts/") || file.startsWith(".github/")) return "SCRIPT";
  if (/(__tests__|\.test\.|\.spec\.)/.test(file)) return "TEST";
  if (file.startsWith("docs/") || file.endsWith(".md")) return "DOCS";
  if (file.includes("recovery")) return "RECOVERY";
  return "UNKNOWN";
}

function emptyClassification(file) {
  return {
    topicFamily: null,
    productDomain: null,
    module: null,
    subsystem: null,
    capability: null,
    feature: null,
    layer: inferLayer(file),
    recoveryState: "UNCLASSIFIED",
    decision: "UNCLASSIFIED",
    liveState: "UNCLASSIFIED",
    canonicalTarget: null,
    owningKernel: null,
    guardianLane: null,
    agentLane: null,
    blockers: [],
    nextAction: null,
  };
}

function collectSource(spec) {
  const extensions = new Set(spec.extensions);
  const files = [...new Set(spec.roots.flatMap((dir) => walk(dir, extensions)))].sort();
  const records = [];

  for (const file of files) {
    let content;
    try {
      content = fs.readFileSync(path.join(root, file), "utf8");
    } catch {
      continue;
    }

    const lines = content.split(/\r?\n/);
    for (let index = 0; index < lines.length; index += 1) {
      const original = lines[index];
      const lower = original.toLowerCase();
      const hits = spec.markers.filter((marker) => lower.includes(marker.toLowerCase()));
      if (!hits.length) continue;

      const text = original.trim().slice(0, 500);
      for (const marker of hits) {
        records.push({
          id: stableId(spec.family, file, index + 1, marker, text),
          ordinal: 0,
          provenance: {
            sourceFamily: spec.family,
            sourceFile: file,
            sourceLine: index + 1,
            sourceRef: process.env.GITHUB_SHA || "working-tree",
            sourceCommit: process.env.GITHUB_SHA || null,
            sourceReport: null,
          },
          marker,
          text,
          classification: emptyClassification(file),
          relations: [],
          reviewStatus: "UNCLASSIFIED",
          notes: [],
        });
      }
    }
  }

  return { family: spec.family, files, records };
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

const sourceResults = sourceSpecs.map(collectSource);
const corpus = sourceResults
  .flatMap((result) => result.records)
  .sort((a, b) => {
    const family = a.provenance.sourceFamily.localeCompare(b.provenance.sourceFamily);
    if (family !== 0) return family;
    const file = a.provenance.sourceFile.localeCompare(b.provenance.sourceFile);
    if (file !== 0) return file;
    const line = (a.provenance.sourceLine || 0) - (b.provenance.sourceLine || 0);
    if (line !== 0) return line;
    return String(a.marker).localeCompare(String(b.marker));
  })
  .map((record, index) => ({ ...record, ordinal: index + 1 }));

const corpusFingerprint = fingerprint(corpus);
const sourceCounts = Object.fromEntries(
  sourceResults.map((result) => [result.family, result.records.length])
);
const sourceFileCounts = Object.fromEntries(
  sourceResults.map((result) => [result.family, result.files.length])
);

writeJson(path.join(outRoot, "corpus-manifest.json"), {
  id: "pantavion_canonical_knowledge_corpus_v1",
  generatedAt: new Date().toISOString(),
  batchSize,
  totalRecords: corpus.length,
  sourceCounts,
  sourceFileCounts,
  corpusFingerprint,
  rule: "Classification and evolution mapping must happen before merge/deduplication decisions.",
});

writeJson(path.join(outRoot, "full-corpus.json"), {
  id: "pantavion_canonical_knowledge_full_corpus_v1",
  generatedAt: new Date().toISOString(),
  corpusFingerprint,
  records: corpus,
});

const batches = [];
for (let offset = 0, batchIndex = 0; offset < corpus.length; offset += batchSize, batchIndex += 1) {
  const records = corpus.slice(offset, offset + batchSize);
  const label = batchLabel(batchIndex);
  const perSource = {};
  for (const record of records) {
    const family = record.provenance.sourceFamily;
    perSource[family] = (perSource[family] || 0) + 1;
  }

  const checkpoint = {
    batchId: `batch-${label.toLowerCase()}`,
    batchLabel: label,
    startOrdinal: records[0]?.ordinal || 0,
    endOrdinal: records[records.length - 1]?.ordinal || 0,
    recordCount: records.length,
    sourceCounts: perSource,
    classifiedCount: 0,
    unresolvedCount: records.length,
    crossBatchRelationCount: 0,
    generatedAt: new Date().toISOString(),
    corpusFingerprint,
  };

  batches.push(checkpoint);
  writeJson(path.join(outRoot, "batches", `batch-${label.toLowerCase()}.json`), {
    checkpoint,
    records,
  });
}

writeJson(path.join(outRoot, "batch-index.json"), {
  id: "pantavion_canonical_knowledge_batch_index_v1",
  generatedAt: new Date().toISOString(),
  corpusFingerprint,
  batchSize,
  totalRecords: corpus.length,
  totalBatches: batches.length,
  batches,
});

console.log("PANTAVION CANONICAL KNOWLEDGE EXCAVATION: WRITTEN");
console.log("- total records:", corpus.length);
console.log("- batch size:", batchSize);
console.log("- total batches:", batches.length);
console.log("- fingerprint:", corpusFingerprint);
console.log("- output:", normalizePath(path.relative(root, outRoot)));
