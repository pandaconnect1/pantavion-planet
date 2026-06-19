const fs = require("fs");
const path = require("path");

const root = process.cwd();
const inventoryPath = path.join(root, "exports", "project-intake", "local-project-inventory.json");

if (!fs.existsSync(inventoryPath)) {
  console.error("Missing local inventory. Run: node scripts\\pantavion-project-intake-inventory.cjs --write");
  process.exit(1);
}

const inventory = JSON.parse(fs.readFileSync(inventoryPath, "utf8"));

function countBy(items, key) {
  return items.reduce((acc, item) => {
    const value = item[key] || "unknown";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function countSignals(items) {
  const acc = {};
  for (const item of items) {
    for (const signal of item.signals || []) {
      acc[signal] = (acc[signal] || 0) + 1;
    }
  }
  return acc;
}

function countCapabilities(items) {
  const acc = {};
  for (const item of items) {
    for (const capability of item.mappedCapabilityIds || []) {
      acc[capability] = (acc[capability] || 0) + 1;
    }
  }
  return acc;
}

const summary = {
  generatedAt: new Date().toISOString(),
  sourceGeneratedAt: inventory.generatedAt,
  totals: {
    totalItems: inventory.totalItems,
    pageRoutes: inventory.pageRoutes,
    apiRoutes: inventory.apiRoutes,
    kernelFiles: inventory.kernelFiles,
    staticOrPrototypeItems: inventory.staticOrPrototypeItems,
    protectedItems: inventory.protectedItems,
    workOrderCandidates: inventory.workOrderCandidates
  },
  byRisk: countBy(inventory.items, "risk"),
  byKind: countBy(inventory.items, "kind"),
  bySignal: countSignals(inventory.items),
  byCapability: countCapabilities(inventory.items),
  founderInterpretation: [
    "This summary is safe for founder review because it does not include raw file paths.",
    "Raw inventory remains local only because it can expose internal paths and sensitive structure.",
    "Work order candidates should be processed through Project Intake before implementation.",
    "Protected items require scoped review and founder approval before production changes."
  ],
  nextActions: [
    "Generate work orders from static/prototype/provider/protected signals.",
    "Prioritize routes that already exist but are not fully real.",
    "Keep Water, SOS, identity, access, security and secrets under critical review.",
    "Convert useful old projects and ChatGPT thread doctrine into Pantavion Planet capabilities."
  ]
};

console.log("Pantavion Safe Project Intake Summary");
console.log("------------------------------------");
console.log(JSON.stringify(summary, null, 2));

const outDir = path.join(root, "exports", "project-intake");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, "safe-project-summary.json"),
  JSON.stringify(summary, null, 2) + "\n",
  "utf8"
);

console.log("");
console.log("Wrote exports/project-intake/safe-project-summary.json");
