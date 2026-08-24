const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const cp = require("child_process");

const root = process.cwd();
const outDir = path.join(root, "data", "runtime-reports");
fs.mkdirSync(outDir, { recursive: true });

function git(args, options = {}) {
  return cp.execFileSync("git", args, {
    cwd: root,
    encoding: options.encoding || "utf8",
    maxBuffer: 1024 * 1024 * 256,
  });
}

const refs = git(["for-each-ref", "--format=%(refname)", "refs/remotes/origin/recovery/snapshots/"])
  .split(/\r?\n/).filter(Boolean);

const filenameRules = [
  ["ENV_FILE", /(^|\/)\.env(?:$|\.(?!(?:[^/]*\.)?(?:example|sample|template)$)[^/]+$)/i],
  ["PRIVATE_KEY_FILE", /(^|\/)(?:id_rsa|id_ed25519|.*\.(?:pem|p12|pfx|key))$/i],
  ["CREDENTIAL_EXPORT", /(^|\/)(?:credentials?|service[-_]?account).*\.json$/i],
];

const contentRules = [
  ["PRIVATE_KEY", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ["GITHUB_TOKEN", /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/],
  ["AWS_ACCESS_KEY", /\bAKIA[0-9A-Z]{16}\b/],
  ["GOOGLE_API_KEY", /\bAIza[0-9A-Za-z_-]{30,}\b/],
  ["SLACK_TOKEN", /\bxox[baprs]-[0-9A-Za-z-]{10,}\b/],
  ["ASSIGNED_SECRET", /\b(?:SUPABASE_SERVICE_ROLE_KEY|VERCEL_TOKEN|GITHUB_TOKEN|OPENAI_API_KEY|ANTHROPIC_API_KEY|AWS_SECRET_ACCESS_KEY)\s*[:=]\s*["']?(?!\$|\{|<|your_|example|placeholder|process\.env)[A-Za-z0-9_./+=-]{16,}/i],
];

const findings = [];
const blobScan = new Map();
let fileReferences = 0;
let uniqueBlobs = 0;
let skippedLarge = 0;
let skippedBinary = 0;

for (const ref of refs) {
  const branch = ref.replace("refs/remotes/origin/", "");
  const raw = git(["ls-tree", "-r", "-z", ref]);
  for (const row of raw.split("\0")) {
    if (!row) continue;
    const match = row.match(/^(\d+)\s+(\w+)\s+([0-9a-f]+)\t(.+)$/s);
    if (!match || match[2] !== "blob") continue;
    const [, mode, , sha, file] = match;
    fileReferences += 1;

    for (const [rule, re] of filenameRules) {
      if (re.test(file)) findings.push({ branch, file, blobSha: sha, mode, rule, evidence: "filename-only" });
    }

    if (!blobScan.has(sha)) {
      uniqueBlobs += 1;
      const size = Number(git(["cat-file", "-s", sha]).trim());
      if (size > 2 * 1024 * 1024) {
        skippedLarge += 1;
        blobScan.set(sha, []);
        continue;
      }
      const buf = cp.execFileSync("git", ["cat-file", "-p", sha], { cwd: root, maxBuffer: 3 * 1024 * 1024 });
      if (buf.includes(0)) {
        skippedBinary += 1;
        blobScan.set(sha, []);
        continue;
      }
      const text = buf.toString("utf8");
      const hits = contentRules.filter(([, re]) => re.test(text)).map(([rule]) => rule);
      blobScan.set(sha, hits);
    }
    for (const rule of blobScan.get(sha)) {
      findings.push({ branch, file, blobSha: sha, mode, rule, evidence: "redacted; secret value never written" });
    }
  }
}

const dedupeKey = (x) => [x.branch, x.file, x.blobSha, x.rule].join("\0");
const uniqueFindings = [...new Map(findings.map(x => [dedupeKey(x), x])).values()];
const report = {
  id: "pantavion_branch_snapshot_security_scan_v1",
  generatedAt: new Date().toISOString(),
  truth: "Scans exact recovery snapshot refs. Secret values are never emitted; only branch, path, blob SHA and rule are recorded.",
  totals: { snapshotRefs: refs.length, fileReferences, uniqueBlobs, findings: uniqueFindings.length, skippedLarge, skippedBinary },
  status: uniqueFindings.length ? "QUARANTINE_REQUIRED" : "PASSED_NO_MATCHES",
  deletionGate: "BLOCKED",
  findings: uniqueFindings,
};
const json = JSON.stringify(report, null, 2) + "\n";
fs.writeFileSync(path.join(outDir, "latest-branch-snapshot-security-scan.json"), json);
console.log(JSON.stringify(report.totals));
console.log("status:", report.status);
if (uniqueFindings.length) process.exitCode = 2;
