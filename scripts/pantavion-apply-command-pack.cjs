const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");
const cp = require("node:child_process");

const root = process.cwd();

function run(command) {
  console.log(`\n> ${command}`);
  cp.execSync(command, { cwd: root, stdio: "inherit", shell: true });
}

function out(command) {
  return cp.execSync(command, {
    cwd: root,
    encoding: "utf8",
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function normalizeRepoPath(input) {
  const clean = String(input || "").replaceAll("\\", "/").replace(/^\/+/, "");
  const resolved = path.resolve(root, clean);

  if (!resolved.startsWith(root + path.sep)) {
    throw new Error(`Blocked unsafe path: ${input}`);
  }

  return clean;
}

function classifyPath(repoPath) {
  const p = repoPath.toLowerCase();

  const z4 = [
    ".env",
    "private",
    "secret",
    "pem",
    "key",
    "data/water-network-private",
    "george_map_master",
    ".dwg",
    ".sqlite",
    ".db",
  ];

  const z3 = [
    "package-lock.json",
    ".github/workflows",
    "app/api/auth",
    "core/auth",
    "billing",
    "payment",
    "storage",
    "database",
    "migration",
  ];

  if (z4.some((x) => p.includes(x))) return "Z4_BLOCKED_MANUAL_ONLY";
  if (z3.some((x) => p.includes(x))) return "Z3_FOUNDER_APPROVAL_REQUIRED";
  if (p.startsWith("app/api/") || p.startsWith("core/") || p.startsWith("scripts/")) return "Z2_PREVIEW_REQUIRED";

  return "Z1_AUTO_SAFE";
}

function founderApproved() {
  return process.env.PANTAVION_FOUNDER_APPROVED === "YES";
}

function ensureCleanWorkingTree() {
  const status = out("git status --porcelain");

  if (status) {
    throw new Error("Working tree is not clean. Commit or stash first.\n" + status);
  }
}

function validatePack(pack) {
  if (!pack || typeof pack !== "object") throw new Error("Invalid command pack.");
  if (!pack.packId) throw new Error("Command pack missing packId.");
  if (!Array.isArray(pack.files)) throw new Error("Command pack missing files array.");

  for (const file of pack.files) {
    const repoPath = normalizeRepoPath(file.path);
    const actualZone = classifyPath(repoPath);
    const declaredZone = file.zone || actualZone;

    if (actualZone === "Z4_BLOCKED_MANUAL_ONLY") {
      throw new Error(`Blocked Z4 path: ${repoPath}`);
    }

    if (
      (actualZone === "Z3_FOUNDER_APPROVAL_REQUIRED" ||
        declaredZone === "Z3_FOUNDER_APPROVAL_REQUIRED") &&
      !founderApproved()
    ) {
      throw new Error(
        `Founder approval required for: ${repoPath}. Set PANTAVION_FOUNDER_APPROVED=YES only when approved.`,
      );
    }

    if (file.mode && file.mode !== "write") {
      throw new Error(`Only write mode is supported for safety. Path: ${repoPath}`);
    }

    if (typeof file.content !== "string") {
      throw new Error(`File content must be string. Path: ${repoPath}`);
    }
  }
}

async function appendAudit(record) {
  const dir = path.join(root, ".pantavion", "kernel");
  await fsp.mkdir(dir, { recursive: true });
  await fsp.appendFile(path.join(dir, "command-pack-audit.jsonl"), `${JSON.stringify(record)}\n`, "utf8");
}

async function applyPack(packPath) {
  ensureCleanWorkingTree();

  const fullPackPath = path.resolve(root, packPath);
  const pack = JSON.parse(fs.readFileSync(fullPackPath, "utf8"));

  validatePack(pack);

  const branch = `command-pack/${String(pack.packId).replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 60)}`;

  run(`git checkout -b ${branch}`);

  const written = [];

  for (const file of pack.files) {
    const repoPath = normalizeRepoPath(file.path);
    const full = path.join(root, repoPath);
    await fsp.mkdir(path.dirname(full), { recursive: true });
    await fsp.writeFile(full, file.content, "utf8");
    written.push(repoPath);
  }

  await appendAudit({
    id: crypto.randomUUID(),
    type: "command_pack.applied",
    packId: pack.packId,
    title: pack.title || "",
    createdAt: new Date().toISOString(),
    files: written,
  });

  run("npm run build");
  run("npx tsc --noEmit --pretty false");

  if (fs.existsSync(path.join(root, "scripts/pantavion-kernel-tick.cjs"))) {
    run("node scripts/pantavion-kernel-tick.cjs");
  }

  for (const repoPath of written) {
    run(`git add "${repoPath}"`);
  }

  const message = pack.commitMessage || `Apply Pantavion command pack ${pack.packId}`;
  run(`git commit -m "${message.replaceAll('"', "'")}"`);

  console.log("");
  console.log(`Command pack applied on branch: ${branch}`);
  console.log(`Push with: git push -u origin ${branch}`);
}

const packPath = process.argv[2];

if (!packPath) {
  console.error("Usage: node scripts/pantavion-apply-command-pack.cjs .pantavion/inbox/pack.json");
  process.exit(1);
}

applyPack(packPath).catch((error) => {
  console.error(error);
  process.exit(1);
});
