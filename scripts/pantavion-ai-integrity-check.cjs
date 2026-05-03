
const fs = require("fs");
const path = require("path");

const root = process.cwd();
const roots = ["app", "core", "components", "kernel"].filter((dir) => fs.existsSync(path.join(root, dir)));
const extensions = new Set([".ts", ".tsx", ".js", ".jsx"]);

const forbidden = [
  { text: "Route not mapped", reason: "public debug route text must not appear live" },
  { text: "works-now", reason: "internal registry language must not appear live" },
  { text: "next integrations", reason: "internal roadmap text must not appear live" },
  { text: "pantavion-home-language", reason: "language must be global, not homepage-only" },
  { text: "pantavion-emergency-language", reason: "language must be global, not emergency-only" },
  { text: "Λληνικά", reason: "Greek language label must be Ελληνικά" },
];

function walk(dir) {
  const out = [];
  for (const item of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = path.join(dir, item.name);
    if (item.isDirectory()) {
      if (["node_modules", ".next", ".git", "dist", "out"].includes(item.name)) continue;
      out.push(...walk(rel));
    } else if (extensions.has(path.extname(item.name))) {
      out.push(rel);
    }
  }
  return out;
}

const files = roots.flatMap(walk);
const failures = [];

for (const file of files) {
  const content = fs.readFileSync(path.join(root, file), "utf8");
  for (const rule of forbidden) {
    if (content.includes(rule.text)) {
      failures.push({ file, text: rule.text, reason: rule.reason });
    }
  }
}

console.log("\nPANTAVION AI READINESS AUDIT");
console.log("Checked files:", files.length);

if (failures.length) {
  console.log("\nFAILURES:");
  for (const item of failures) {
    console.log("- " + item.file + " contains " + JSON.stringify(item.text) + " -> " + item.reason);
  }
  process.exit(1);
}

console.log("PASS: no known public debug strings, wrong Greek label, or non-global language keys found.");
