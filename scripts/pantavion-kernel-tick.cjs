const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");

const root = process.cwd();
const kernelDir = path.join(root, ".pantavion", "kernel");
const auditPath = path.join(kernelDir, "script-audit.jsonl");
const reportPath = path.join(kernelDir, "script-last-report.json");

function idFor(input) {
  return crypto.createHash("sha256").update(input).digest("hex").slice(0, 16);
}

async function localTick() {
  await fsp.mkdir(kernelDir, { recursive: true });

  const findings = [];
  const packageJson = path.join(root, "package.json");
  const packageLock = path.join(root, "package-lock.json");

  if (!fs.existsSync(packageJson)) {
    findings.push({
      id: idFor("missing package.json"),
      severity: "critical",
      zone: "Z3_FOUNDER_APPROVAL_REQUIRED",
      title: "Missing package.json",
      recommendation: "Restore package.json before CI/CD automation.",
    });
  } else {
    const pkg = JSON.parse(await fsp.readFile(packageJson, "utf8"));
    const scripts = pkg.scripts || {};

    for (const name of ["preinstall", "install", "postinstall", "prepare"]) {
      if (scripts[name]) {
        findings.push({
          id: idFor(`script ${name}`),
          severity: "high",
          zone: "Z3_FOUNDER_APPROVAL_REQUIRED",
          title: `Dependency lifecycle script detected: ${name}`,
          evidence: String(scripts[name]).slice(0, 160),
          recommendation: "Review lifecycle scripts before merge/deploy.",
        });
      }
    }

    if (!scripts.build) {
      findings.push({
        id: idFor("missing build script"),
        severity: "high",
        zone: "Z3_FOUNDER_APPROVAL_REQUIRED",
        title: "Missing build script",
        recommendation: "Add a real build script before production deployment.",
      });
    }
  }

  if (!fs.existsSync(packageLock)) {
    findings.push({
      id: idFor("missing lockfile"),
      severity: "warning",
      zone: "Z2_PREVIEW_REQUIRED",
      title: "Missing package-lock.json",
      recommendation: "Use a lockfile for deterministic CI/CD builds.",
    });
  }

  const report = {
    ok: !findings.some((finding) => finding.severity === "critical"),
    tickId: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    mode: "local-script",
    repoRoot: root,
    findings,
    approvalRequired: findings.some((finding) => finding.zone.startsWith("Z3") || finding.zone.startsWith("Z4")),
  };

  await fsp.writeFile(reportPath, JSON.stringify(report, null, 2), "utf8");
  await fsp.appendFile(auditPath, `${JSON.stringify({ type: "kernel.script.tick", report })}\n`, "utf8");

  console.log(JSON.stringify(report, null, 2));
}

async function remoteTick() {
  const baseUrl = process.env.PANTAVION_KERNEL_BASE_URL;
  if (!baseUrl) return false;

  const url = `${baseUrl.replace(/\/$/, "")}/api/kernel/tick`;
  const headers = { "content-type": "application/json" };

  if (process.env.PANTAVION_KERNEL_SECRET) {
    headers["x-pantavion-kernel-secret"] = process.env.PANTAVION_KERNEL_SECRET;
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ trigger: "script" }),
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`Remote kernel tick failed: HTTP ${res.status} ${text}`);
  }

  console.log(text);
  return true;
}

remoteTick()
  .then((usedRemote) => {
    if (!usedRemote) return localTick();
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
