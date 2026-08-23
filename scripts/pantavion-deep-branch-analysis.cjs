const fs = require("fs");
const path = require("path");
const cp = require("child_process");
const crypto = require("crypto");

const root = process.cwd();
const outRoot = path.join(root, "data", "recovery", "deep-analysis");
const branchDir = path.join(outRoot, "branches");
fs.rmSync(outRoot, { recursive: true, force: true });
fs.mkdirSync(branchDir, { recursive: true });

function git(args, options = {}) {
  return cp.execFileSync("git", args, {
    cwd: root,
    encoding: options.encoding || "utf8",
    maxBuffer: 1024 * 1024 * 256,
    stdio: ["ignore", "pipe", "pipe"],
  });
}
function tryGit(args) {
  try { return git(args).trim(); } catch { return null; }
}
function safeName(ref) {
  return ref.replace(/^refs\/remotes\/origin\/recovery\/snapshots\//, "").replace(/[^A-Za-z0-9._-]+/g, "--");
}
function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}
function countMatches(text, re) {
  return [...text.matchAll(re)].length;
}
function uniqueMatches(text, re, limit = 100) {
  return [...new Set([...text.matchAll(re)].map(m => m[1]).filter(Boolean))].slice(0, limit);
}
function topicsFor(file, text) {
  const hay = (file + "\n" + text).toLowerCase();
  const rules = [
    ["identity-security", /auth|identity|rls|jwt|security|permission|secret/],
    ["social-people", /social|people|profile|follow|community|feed/],
    ["chat-translation", /chat|message|translation|interpreter|voice|speech|stt/],
    ["business-marketplace", /business|marketplace|product|payment|advert|listing/],
    ["maps-water", /water|map|geo|location|dwg|utility/],
    ["ai-kernel", /agent|kernel|runtime|orchestrat|pantaai|model/],
    ["recovery-continuity", /recovery|backup|archive|migration|continuity|manifest/],
    ["governance-safety", /governance|policy|moderation|minor|consent|compliance/],
    ["media-music", /music|media|audio|video|image/],
    ["infrastructure-deployment", /vercel|github|workflow|deploy|supabase|docker|terraform/],
  ];
  const found = rules.filter(([, re]) => re.test(hay)).map(([name]) => name);
  return found.length ? found : ["review-unclassified"];
}
function classifyPath(file) {
  if (/^supabase\/migrations\//.test(file)) return "database-migration";
  if (/^\.github\/workflows\//.test(file)) return "ci-workflow";
  if (/\/api\/.*\/route\.[cm]?[jt]sx?$/.test(file)) return "api-route";
  if (/\/page\.[jt]sx?$/.test(file)) return "ui-page";
  if (/\/layout\.[jt]sx?$/.test(file)) return "ui-layout";
  if (/\.(md|txt)$/i.test(file)) return "documentation";
  if (/\.(json|ya?ml)$/i.test(file)) return "configuration-data";
  if (/\.(sql)$/i.test(file)) return "database-sql";
  if (/\.(ts|tsx|js|jsx|cjs|mjs)$/i.test(file)) return "source-code";
  return "asset-or-other";
}
function parseNameStatus(raw) {
  const parts = raw.split("\0").filter(Boolean);
  const out = [];
  for (let i = 0; i < parts.length;) {
    const status = parts[i++];
    const code = status[0];
    if (code === "R" || code === "C") out.push({ status, previousPath: parts[i++], file: parts[i++] });
    else out.push({ status, file: parts[i++] });
  }
  return out;
}
function blobAt(ref, file) {
  const spec = ref + ":" + file;
  const sha = tryGit(["rev-parse", spec]);
  if (!sha) return null;
  const size = Number(tryGit(["cat-file", "-s", sha]) || 0);
  return { sha, size, spec };
}
function analyzeText(buffer, file) {
  if (buffer.includes(0)) return { binary: true };
  const text = buffer.toString("utf8");
  return {
    binary: false,
    lineCount: text.split(/\r?\n/).length,
    contentSha256: sha256(buffer),
    imports: uniqueMatches(text, /(?:from\s+|require\s*\(\s*)["']([^"']+)["']/g),
    exports: uniqueMatches(text, /export\s+(?:default\s+)?(?:async\s+)?(?:function|class|const|let|var|type|interface|enum)?\s*([A-Za-z_$][\w$]*)/g),
    envDependencies: uniqueMatches(text, /process\.env\.([A-Z0-9_]+)/g),
    sqlTables: uniqueMatches(text, /create\s+table(?:\s+if\s+not\s+exists)?\s+(?:public\.)?["']?([a-zA-Z0-9_]+)/gi),
    sqlPolicies: uniqueMatches(text, /create\s+policy\s+["']?([^"'\n]+)["']?/gi),
    apiMethods: uniqueMatches(text, /export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\b/g),
    markers: {
      todo: countMatches(text, /\bTODO\b/gi),
      fixme: countMatches(text, /\bFIXME\b/gi),
      blocked: countMatches(text, /\bblocked\b/gi),
      unfinished: countMatches(text, /\bunfinished\b/gi),
      providerPending: countMatches(text, /provider[_ -]?pending|provider[_ -]?required/gi),
    },
    topics: topicsFor(file, text),
  };
}

const refs = git(["for-each-ref", "--format=%(refname)", "refs/remotes/origin/recovery/snapshots/"])
  .split(/\r?\n/).filter(Boolean).sort();
if (refs.length !== 91) throw new Error("expected 91 snapshot refs, found " + refs.length);

const manifestBranches = [];
let globalFiles = 0;
let globalTextFiles = 0;
let globalBinaryFiles = 0;
let globalDeleted = 0;
let globalEnvDependencies = new Set();
const blobAnalysis = new Map();

for (const ref of refs) {
  const label = safeName(ref);
  const headSha = git(["rev-parse", ref + "^{commit}"]).trim();
  const mergeBase = git(["merge-base", "origin/main", ref]).trim();
  const counts = git(["rev-list", "--left-right", "--count", "origin/main..." + ref]).trim().split(/\s+/).map(Number);
  const changes = parseNameStatus(git(["diff", "--name-status", "-z", "origin/main..." + ref]));
  const files = [];

  for (const change of changes) {
    const item = {
      status: change.status,
      file: change.file,
      previousPath: change.previousPath || null,
      kind: classifyPath(change.file),
      canonicalPathProposal: "recovery/canonicalized/" + topicsFor(change.file, "")[0] + "/" + label + "/" + change.file,
    };
    if (change.status[0] === "D") {
      item.deletedInSnapshot = true;
      globalDeleted += 1;
      files.push(item);
      continue;
    }
    const blob = blobAt(ref, change.file);
    if (!blob) {
      item.readError = "blob-not-resolved";
      files.push(item);
      continue;
    }
    item.blobSha = blob.sha;
    item.sizeBytes = blob.size;
    const mainBlob = blobAt("origin/main", change.file);
    item.mainBlobSha = mainBlob ? mainBlob.sha : null;
    item.relationToMain = !mainBlob ? "ABSENT_FROM_MAIN" : mainBlob.sha === blob.sha ? "IDENTICAL_TO_MAIN" : "DIFFERS_FROM_MAIN";

    if (!blobAnalysis.has(blob.sha)) {
      if (blob.size > 2 * 1024 * 1024) blobAnalysis.set(blob.sha, { skippedContentAnalysis: "over-2MiB", topics: topicsFor(change.file, "") });
      else {
        const buffer = cp.execFileSync("git", ["cat-file", "-p", blob.sha], { cwd: root, maxBuffer: 3 * 1024 * 1024 });
        blobAnalysis.set(blob.sha, analyzeText(buffer, change.file));
      }
    }
    Object.assign(item, blobAnalysis.get(blob.sha));
    if (item.binary) globalBinaryFiles += 1; else {
      globalTextFiles += 1;
      for (const key of item.envDependencies || []) globalEnvDependencies.add(key);
    }
    globalFiles += 1;
    files.push(item);
  }

  const topicCounts = {};
  const kindCounts = {};
  const relationCounts = {};
  for (const file of files) {
    kindCounts[file.kind] = (kindCounts[file.kind] || 0) + 1;
    relationCounts[file.relationToMain || "DELETED_OR_UNRESOLVED"] = (relationCounts[file.relationToMain || "DELETED_OR_UNRESOLVED"] || 0) + 1;
    for (const topic of file.topics || topicsFor(file.file, "")) topicCounts[topic] = (topicCounts[topic] || 0) + 1;
  }
  const report = {
    id: "PANT-BRANCH-" + sha256(headSha).slice(0, 12).toUpperCase(),
    sourceRef: ref.replace("refs/remotes/origin/", ""),
    headSha,
    mergeBase,
    behindMainBy: counts[0],
    aheadOfMainBy: counts[1],
    changedFileCount: files.length,
    topicCounts,
    kindCounts,
    relationCounts,
    status: "DEEPLY_ANALYZED_MACHINE_PASS",
    verificationState: "NOT_CANONICALIZED_NOT_TESTED",
    files,
  };
  const reportPath = path.join(branchDir, label + ".json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");
  manifestBranches.push({
    id: report.id, sourceRef: report.sourceRef, headSha, mergeBase,
    aheadOfMainBy: report.aheadOfMainBy, behindMainBy: report.behindMainBy,
    changedFileCount: report.changedFileCount, topicCounts, kindCounts, relationCounts,
    report: path.relative(root, reportPath).replace(/\\/g, "/"),
    status: report.status, verificationState: report.verificationState,
  });
}

const manifest = {
  id: "pantavion_deep_branch_analysis_v1",
  generatedAt: new Date().toISOString(),
  truth: "Machine-generated file-level analysis of every exact snapshot against origin/main. It is evidence for review, not a claim of canonicalization, testing or live verification.",
  totals: {
    snapshotBranches: refs.length,
    changedFileReferences: globalFiles + globalDeleted,
    analyzedTextFileReferences: globalTextFiles,
    binaryFileReferences: globalBinaryFiles,
    deletedFileReferences: globalDeleted,
    uniqueAnalyzedBlobs: blobAnalysis.size,
  },
  environmentDependencies: [...globalEnvDependencies].sort(),
  stages: {
    preserved: true,
    deeplyAnalyzedMachinePass: true,
    humanSemanticReview: false,
    classified: false,
    canonicalized: false,
    tested: false,
    verified: false,
    deleteAllowed: false,
  },
  branches: manifestBranches,
};
fs.writeFileSync(path.join(outRoot, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(JSON.stringify(manifest.totals));
