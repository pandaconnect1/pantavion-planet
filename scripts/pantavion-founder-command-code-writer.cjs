const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const cp = require("node:child_process");
const crypto = require("node:crypto");

const root = process.cwd();

const safePrefixes = [
  "docs/",
  "core/agents/",
  "core/kernel/",
  "core/runtime/",
  "core/ai/",
  "app/api/kernel/",
  "app/kernel/",
  "scripts/"
];

const blockedFragments = [
  ".env",
  "secret",
  "private",
  "key",
  ".pem",
  ".dwg",
  "data/water-network-private",
  "george_map_master",
  "package-lock.json",
  ".github/workflows",
  "app/api/auth",
  "billing",
  "payment",
  "database",
  "migration"
];

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

function ensureCleanWorkingTree() {
  const status = out("git status --porcelain");
  if (status) {
    throw new Error("Working tree is not clean. Commit or stash before code writing.\n" + status);
  }
}

function normalizeRepoPath(input) {
  const clean = String(input || "").replaceAll("\\", "/").replace(/^\/+/, "");
  const resolved = path.resolve(root, clean);

  if (!resolved.startsWith(root + path.sep)) {
    throw new Error(`Unsafe path blocked: ${input}`);
  }

  return clean;
}

function validateRepoPath(repoPath) {
  const p = normalizeRepoPath(repoPath);
  const lower = p.toLowerCase();

  if (blockedFragments.some((fragment) => lower.includes(fragment))) {
    throw new Error(`Blocked sensitive path: ${p}`);
  }

  if (!safePrefixes.some((prefix) => p.startsWith(prefix))) {
    throw new Error(`Path outside allowed code-writer scope: ${p}`);
  }

  return p;
}

function loadFounderCommand(commandId) {
  const dbPath = path.join(root, ".pantavion", "kernel", "founder-commands.json");

  if (!fs.existsSync(dbPath)) {
    throw new Error("No founder command database found. Submit a command in /kernel/founder-command first.");
  }

  const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));
  const commands = Array.isArray(db.commands) ? db.commands : [];

  if (commands.length === 0) {
    throw new Error("No founder commands found.");
  }

  if (commandId && commandId !== "--latest") {
    const found = commands.find((command) => command.id === commandId);
    if (!found) throw new Error(`Founder command not found: ${commandId}`);
    return found;
  }

  return commands[0];
}

function extractJson(text) {
  const trimmed = String(text || "").trim();
  const withoutFence = trimmed
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  const start = withoutFence.indexOf("{");
  const end = withoutFence.lastIndexOf("}");

  if (start < 0 || end < 0 || end <= start) {
    throw new Error("AI response did not contain a JSON object.");
  }

  return JSON.parse(withoutFence.slice(start, end + 1));
}

async function callAI(system, prompt) {
  const provider = String(process.env.PANTAVION_AI_PROVIDER || "").trim().toLowerCase();

  if (!provider || provider === "none") {
    throw new Error("No AI provider configured. Set PANTAVION_AI_PROVIDER=anthropic or openai and the matching API key.");
  }

  if (provider === "anthropic") {
    const key = String(process.env.ANTHROPIC_API_KEY || "").trim();
    const model = String(process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest").trim();

    if (!key) throw new Error("ANTHROPIC_API_KEY is missing.");

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 4000,
        temperature: 0.1,
        system,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const body = await res.text();
    if (!res.ok) throw new Error(`Anthropic error HTTP ${res.status}: ${body.slice(0, 500)}`);

    const json = JSON.parse(body);
    const text = Array.isArray(json.content)
      ? json.content.map((part) => part.text || "").join("\n").trim()
      : "";

    if (!text) throw new Error("Anthropic response had no text.");
    return { provider, model, text };
  }

  if (provider === "openai") {
    const key = String(process.env.OPENAI_API_KEY || "").trim();
    const model = String(process.env.OPENAI_MODEL || "gpt-4.1-mini").trim();

    if (!key) throw new Error("OPENAI_API_KEY is missing.");

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
      }),
    });

    const body = await res.text();
    if (!res.ok) throw new Error(`OpenAI error HTTP ${res.status}: ${body.slice(0, 500)}`);

    const json = JSON.parse(body);
    const text = json?.choices?.[0]?.message?.content;

    if (!text) throw new Error("OpenAI response had no text.");
    return { provider, model, text };
  }

  throw new Error(`Unsupported PANTAVION_AI_PROVIDER: ${provider}`);
}

function validatePack(pack) {
  if (!pack || typeof pack !== "object") throw new Error("Generated pack is not an object.");
  if (!pack.packId) throw new Error("Generated pack missing packId.");
  if (!pack.title) throw new Error("Generated pack missing title.");
  if (!Array.isArray(pack.files)) throw new Error("Generated pack missing files array.");
  if (pack.files.length < 1) throw new Error("Generated pack has no files.");
  if (pack.files.length > 8) throw new Error("Generated pack has too many files. Max 8.");

  for (const file of pack.files) {
    const repoPath = validateRepoPath(file.path);

    if (file.mode && file.mode !== "write") {
      throw new Error(`Only write mode is allowed: ${repoPath}`);
    }

    if (typeof file.content !== "string") {
      throw new Error(`File content must be string: ${repoPath}`);
    }

    if (file.content.length > 80000) {
      throw new Error(`File too large for first auto-writer pass: ${repoPath}`);
    }

    file.path = repoPath;
    file.mode = "write";
    file.zone = file.zone || "Z2_PREVIEW_REQUIRED";
  }

  return pack;
}

async function appendAudit(record) {
  const dir = path.join(root, ".pantavion", "kernel");
  await fsp.mkdir(dir, { recursive: true });
  await fsp.appendFile(
    path.join(dir, "founder-code-writer-audit.jsonl"),
    `${JSON.stringify(record)}\n`,
    "utf8",
  );
}

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const idIndex = args.indexOf("--id");
  const commandId = idIndex >= 0 ? args[idIndex + 1] : "--latest";

  ensureCleanWorkingTree();

  const command = loadFounderCommand(commandId);

  const system = [
    "You are Pantavion Sovereign Code Writer Agent.",
    "Return ONLY strict JSON. No markdown. No explanation.",
    "Generate a command pack that can be applied by scripts/pantavion-apply-command-pack.cjs.",
    "Do not touch secrets, auth, billing, database, package-lock, workflows, DWG, water private data, production deploy, or destructive files.",
    "Every capability must be real: route, logic, state/data flow, provider/source when needed, disabled/internal status if not implemented.",
    "Prefer small safe Z1/Z2 changes only.",
  ].join("\n");

  const prompt = [
    "Founder command:",
    command.commandText,
    "",
    "Current command metadata:",
    JSON.stringify({
      id: command.id,
      status: command.status,
      intent: command.intent,
      zone: command.safetyVerdict?.zone,
      nextAction: command.plan?.nextAction,
    }, null, 2),
    "",
    "Return this exact JSON shape:",
    JSON.stringify({
      packId: "founder-command-short-id",
      title: "Short title",
      commitMessage: "Implement safe Pantavion founder command upgrade",
      files: [
        {
          path: "docs/kernel/example.md",
          mode: "write",
          zone: "Z1_AUTO_SAFE",
          content: "complete file content here"
        }
      ]
    }, null, 2),
    "",
    "Allowed path prefixes:",
    safePrefixes.join(", "),
  ].join("\n");

  const ai = await callAI(system, prompt);
  const packRaw = extractJson(ai.text);

  packRaw.packId =
    String(packRaw.packId || `founder-${command.id}`)
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .slice(0, 80);

  const pack = validatePack(packRaw);

  const inboxDir = path.join(root, ".pantavion", "inbox");
  await fsp.mkdir(inboxDir, { recursive: true });

  const packPath = path.join(inboxDir, `${pack.packId}.json`);
  await fsp.writeFile(packPath, JSON.stringify(pack, null, 2), "utf8");

  await appendAudit({
    id: crypto.randomUUID(),
    type: "founder.code_writer.pack_generated",
    createdAt: new Date().toISOString(),
    provider: ai.provider,
    model: ai.model,
    commandId: command.id,
    packId: pack.packId,
    fileCount: pack.files.length,
    apply,
  });

  console.log("");
  console.log("Generated command pack:");
  console.log(packPath);
  console.log("");

  if (apply) {
    run(`node scripts/pantavion-apply-command-pack.cjs "${packPath}"`);
  } else {
    console.log(`To apply: node scripts/pantavion-apply-command-pack.cjs "${packPath}"`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
