const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");

const root = process.cwd();
const kernelDir = path.join(root, ".pantavion", "kernel");
const signalsPath = path.join(kernelDir, "user-signals.json");

function classify(text) {
  const value = String(text || "").toLowerCase();

  if (value.includes("bug") || value.includes("error") || value.includes("λάθ") || value.includes("lath")) {
    return { category: "bug", severity: "medium" };
  }

  if (value.includes("missing") || value.includes("λείπει") || value.includes("κεν")) {
    return { category: "missing_capability", severity: "medium" };
  }

  if (value.includes("voice") || value.includes("φων") || value.includes("μιλώ")) {
    return { category: "voice", severity: "medium" };
  }

  if (value.includes("water") || value.includes("dwg") || value.includes("νερό")) {
    return { category: "water_infrastructure", severity: "high" };
  }

  if (value.includes("startup") || value.includes("agent")) {
    return { category: "startup_builder", severity: "medium" };
  }

  return { category: "unknown", severity: "info" };
}

async function main() {
  const text = process.argv.slice(2).join(" ").trim();

  if (!text) {
    console.error("Usage: node scripts/pantavion-user-signal.cjs \"signal text\"");
    process.exit(1);
  }

  await fsp.mkdir(kernelDir, { recursive: true });

  let db = { version: 1, updatedAt: new Date().toISOString(), signals: [] };

  if (fs.existsSync(signalsPath)) {
    db = JSON.parse(fs.readFileSync(signalsPath, "utf8"));
  }

  const classified = classify(text);

  const signal = {
    id: crypto.randomUUID(),
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    actor: "local-script",
    source: "system",
    status: "received",
    category: classified.category,
    severity: classified.severity,
    commandOrSignalText: text,
    safeSummary: text.length <= 180 ? text : `${text.slice(0, 177)}...`,
    trustBoundary: "no_code_execution",
    safetyZone: classified.severity === "high" ? "Z2_PREVIEW_REQUIRED" : "Z1_AUTO_SAFE",
    recommendation: "Store signal for grouping and ecosystem gap analysis. Do not execute code from user signal."
  };

  db.signals = [signal, ...(Array.isArray(db.signals) ? db.signals : [])].slice(0, 500);
  db.updatedAt = new Date().toISOString();

  fs.writeFileSync(signalsPath, JSON.stringify(db, null, 2), "utf8");

  await fsp.appendFile(
    path.join(kernelDir, "user-signal-audit.jsonl"),
    `${JSON.stringify({
      type: "kernel.user_signal.created",
      createdAt: new Date().toISOString(),
      signalId: signal.id,
      category: signal.category,
      severity: signal.severity
    })}\n`,
    "utf8"
  );

  console.log(JSON.stringify({ ok: true, signal }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
