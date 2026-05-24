const fs = require("fs");
const path = require("path");

const required = [
  ["scripts/pantavion-unfinished-plan-ingestion.cjs", "pantavion_unfinished_plan_ingestion_v1"],
  ["data/runtime-reports/latest-unfinished-plan-ingestion.json", "pantavion_unfinished_plan_ingestion_v1"],
  ["core/intelligence/pantavion-unfinished-plan-ingestion.ts", "pantavion_unfinished_plan_ingestion_runtime_v1"],
  ["app/api/pantavion/intelligence/unfinished-plans/route.ts", "getPantavionUnfinishedPlanRuntimeReport"],
  ["app/pantavion/unfinished-plans/page.tsx", "PANTAVION UNFINISHED PLAN INGESTION"],
];

const failures = [];

for (const [file, marker] of required) {
  const absolute = path.join(process.cwd(), file);
  if (!fs.existsSync(absolute)) {
    failures.push("Missing file: " + file);
    continue;
  }

  if (!fs.readFileSync(absolute, "utf8").includes(marker)) {
    failures.push("Missing marker in " + file + ": " + marker);
  }
}

if (failures.length) {
  console.error("PANTAVION UNFINISHED PLAN INGESTION GATE: FAILED");
  failures.forEach((failure) => console.error("- " + failure));
  process.exitCode = 1;
} else {
  console.log("PANTAVION UNFINISHED PLAN INGESTION GATE: PASSED");
}
