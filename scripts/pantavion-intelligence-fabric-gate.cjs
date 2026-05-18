const fs = require("fs");
const path = require("path");

const root = process.cwd();

const requiredFiles = [
  "core/intelligence/pantavion-sovereign-intelligence-fabric.ts",
  "app/pantavion/intelligence/page.tsx",
  "app/api/pantavion/intelligence/status/route.ts",
  "app/api/pantavion/intelligence/tick/route.ts",
  "app/api/pantavion/intelligence/opportunities/route.ts",
  "app/api/pantavion/intelligence/build-queue/route.ts",
  "scripts/pantavion-intelligence-fabric-gate.cjs",
  "docs/continuity/pantavion-sovereign-intelligence-fabric.md",
  "package.json"
];

const failures = [];

function read(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    failures.push("Missing required file: " + relativePath);
    return "";
  }
  return fs.readFileSync(absolutePath, "utf8");
}

for (const file of requiredFiles) read(file);

const fabric = read("core/intelligence/pantavion-sovereign-intelligence-fabric.ts");
const page = read("app/pantavion/intelligence/page.tsx");
const statusRoute = read("app/api/pantavion/intelligence/status/route.ts");
const tickRoute = read("app/api/pantavion/intelligence/tick/route.ts");
const opportunitiesRoute = read("app/api/pantavion/intelligence/opportunities/route.ts");
const buildQueueRoute = read("app/api/pantavion/intelligence/build-queue/route.ts");
const packageJsonText = read("package.json");

const requiredMarkers = [
  "PANTAVION_SOVEREIGN_INTELLIGENCE_FABRIC_ID",
  "continentWatch",
  "brainLayers",
  "agentRoles",
  "productAbsorptionPipeline",
  "legalTransformationRules",
  "cloudRuntimeRequirements",
  "buildFactoryStages",
  "runPantavionIntelligenceTick",
  "getPantavionOpportunities",
  "getPantavionBuildQueue",
];

for (const marker of requiredMarkers) {
  if (!fabric.includes(marker)) failures.push("Fabric missing marker: " + marker);
}

if (!page.includes("Sovereign Multi-Brain Intelligence Fabric")) {
  failures.push("visible intelligence page must expose the fabric.");
}

if (!statusRoute.includes("getPantavionSovereignIntelligenceFabric")) {
  failures.push("status route must expose fabric status.");
}

if (!tickRoute.includes("runPantavionIntelligenceTick")) {
  failures.push("tick route must execute intelligence tick.");
}

if (!opportunitiesRoute.includes("getPantavionOpportunities")) {
  failures.push("opportunities route must expose opportunities.");
}

if (!buildQueueRoute.includes("getPantavionBuildQueue")) {
  failures.push("build queue route must expose build queue.");
}

let packageJson = null;
try {
  packageJson = JSON.parse(packageJsonText);
} catch {
  failures.push("package.json is invalid JSON.");
}

if (
  packageJson &&
  packageJson.scripts &&
  packageJson.scripts["audit:intelligence"] !== "node scripts/pantavion-intelligence-fabric-gate.cjs"
) {
  failures.push("package.json must include audit:intelligence script.");
}

if (fabric.includes("git add .")) {
  failures.push("Fabric must not contain blanket git add.");
}

if (failures.length > 0) {
  console.error("PANTAVION INTELLIGENCE FABRIC GATE: FAILED");
  for (const failure of failures) console.error("- " + failure);
  process.exitCode = 1;
} else {
  console.log("PANTAVION INTELLIGENCE FABRIC GATE: PASSED");
  console.log("- visible page present");
  console.log("- multi-brain kernel contract present");
  console.log("- agent workforce present");
  console.log("- six-continent watch present");
  console.log("- product absorption pipeline present");
  console.log("- legal transformation rules present");
  console.log("- invention/build queue present");
  console.log("- cloud 24/365 requirements present");
  console.log("- status/tick/opportunities/build-queue routes present");
}

