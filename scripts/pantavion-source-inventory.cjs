const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = process.cwd();

const outDir = path.join(root, "data", "pantavion-source-inventory");
const docsDir = path.join(root, "docs", "continuity");
const jsonOut = path.join(outDir, "inventory.json");
const mdOut = path.join(docsDir, "pantavion-source-inventory.md");

const ignoredDirs = new Set([
  ".git",
  ".next",
  ".vercel",
  "node_modules",
  "data/water-network-private",
]);

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    shell: process.platform === "win32",
  });

  return {
    command: [command, ...args].join(" "),
    ok: result.status === 0,
    status: result.status,
    stdout: String(result.stdout || "").slice(0, 20000),
    stderr: String(result.stderr || "").slice(0, 12000),
  };
}

function kindOf(filePath) {
  if (filePath.endsWith("/page.tsx")) return "app_page";
  if (filePath.endsWith("/route.ts")) return "api_route";
  if (filePath.startsWith("core/kernel/")) return "kernel";
  if (filePath.startsWith("core/translation/")) return "translation";
  if (filePath.startsWith("scripts/")) return "script";
  if (filePath.startsWith("_local_backups/")) return "local_backup";
  if (filePath.startsWith("_pantavion_archive_txt/")) return "archive_text";
  if (filePath.endsWith(".md")) return "markdown";
  if (filePath.endsWith(".json")) return "json";
  return "file";
}

function walk(relativeDir, output, limit) {
  if (output.length >= limit) return;

  const absoluteDir = path.join(root, relativeDir);
  if (!fs.existsSync(absoluteDir)) return;

  const entries = fs.readdirSync(absoluteDir, { withFileTypes: true });

  for (const entry of entries) {
    if (output.length >= limit) return;

    const relativePath = (relativeDir
      ? path.join(relativeDir, entry.name)
      : entry.name
    ).replace(/\\/g, "/");

    if (entry.isDirectory()) {
      if (ignoredDirs.has(entry.name) || ignoredDirs.has(relativePath)) continue;
      walk(relativePath, output, limit);
      continue;
    }

    if (!entry.isFile()) continue;

    const stat = fs.statSync(path.join(root, relativePath));

    output.push({
      path: relativePath,
      size: stat.size,
      kind: kindOf(relativePath),
    });
  }
}

function summarize(files) {
  const counts = {};

  for (const file of files) {
    counts[file.kind] = (counts[file.kind] || 0) + 1;
  }

  return {
    total: files.length,
    counts,
    importantFiles: files
      .filter((file) => {
        return (
          file.kind === "app_page" ||
          file.kind === "api_route" ||
          file.kind === "kernel" ||
          file.kind === "translation" ||
          file.kind === "script" ||
          file.kind === "local_backup" ||
          file.kind === "archive_text" ||
          file.path.toLowerCase().includes("pantavion")
        );
      })
      .slice(0, 1200),
  };
}

function main() {
  console.log("PANTAVION SOURCE INVENTORY: START");

  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(docsDir, { recursive: true });

  const files = [];
  walk("", files, 10000);

  const inventory = {
    id: "pantavion_source_inventory_v1",
    generatedAt: new Date().toISOString(),
    activeRepo: "C:\\Users\\gnkkm\\pantavion-planet",
    activeGitHub: "pandaconnect1/pantavion-planet",
    git: {
      status: run("git", ["status", "--short", "--untracked-files=all"]),
      log: run("git", ["log", "--oneline", "-12"]),
      remotes: run("git", ["remote", "-v"]),
      branch: run("git", ["branch", "--show-current"]),
    },
    local: {
      files: summarize(files),
    },
    knownExternalSourcesToConsolidateNext: {
      githubRepos: [
        "pandaconnect1/pantavion-planet",
        "pandaconnect1/pantavion-one-clean",
        "pandaconnect1/pantavion-one",
        "pandaconnect1/pantavion-one-main",
        "pandaconnect1/pantavion-one-clean-ui",
        "pandaconnect1/pantavion-voice",
        "pandaconnect1/pantavion-voice-",
        "pandaconnect1/pantavion.com",
        "pandaconnect1/pantavion",
        "pandaconnect1/pantavion-socialhub",
        "pandaconnect1/pantavion-app."
      ],
      publicDomains: [
        "https://pantavion.com",
        "https://www.pantavion.com",
        "https://pantavion.net",
        "https://www.pantavion.net",
        "https://pantavion.info",
        "https://www.pantavion.info"
      ],
      vercel: "Run Vercel CLI inventory in next slice if CLI/login/token is available."
    },
    rules: [
      "repo and inventory are source of truth, not chat memory",
      "nothing discovered is implemented until it has real route/function/kernel/test/audit",
      "no blanket staging",
      "no private water raw data exposure",
      "no fake/static completion",
      "all consolidation must pass audit TypeScript and build"
    ],
  };

  fs.writeFileSync(jsonOut, JSON.stringify(inventory, null, 2) + "\n", "utf8");

  const md = `# Pantavion Source Inventory

Generated at: ${inventory.generatedAt}

This is operational inventory, not static vision.

## Active Repo

- Local repo: ${inventory.activeRepo}
- GitHub repo: ${inventory.activeGitHub}

## Local Repo Scan

- Total files scanned: ${inventory.local.files.total}
- App pages: ${inventory.local.files.counts.app_page || 0}
- API routes: ${inventory.local.files.counts.api_route || 0}
- Kernel files: ${inventory.local.files.counts.kernel || 0}
- Translation files: ${inventory.local.files.counts.translation || 0}
- Scripts: ${inventory.local.files.counts.script || 0}
- Local backup/archive files: ${(inventory.local.files.counts.local_backup || 0) + (inventory.local.files.counts.archive_text || 0)}

## External Sources To Consolidate Next

- GitHub old Pantavion repos listed in inventory JSON.
- Pantavion domains listed in inventory JSON.
- Vercel CLI truth to be collected in next slice.

## Rule

Nothing discovered in VS Code, old GitHub repos, Vercel, domains, backups, or archives is treated as implemented until it has a real route, function, kernel, test, audit, TypeScript verification, and build verification.
`;

  fs.writeFileSync(mdOut, md, "utf8");

  console.log("PANTAVION SOURCE INVENTORY: PASSED");
  console.log("WROTE data/pantavion-source-inventory/inventory.json");
  console.log("WROTE docs/continuity/pantavion-source-inventory.md");
}

try {
  main();
} catch (error) {
  console.error("PANTAVION SOURCE INVENTORY: FAILED");
  console.error(error && error.message ? error.message : error);
  process.exitCode = 1;
}