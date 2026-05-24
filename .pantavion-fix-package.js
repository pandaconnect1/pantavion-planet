const fs = require("fs");

const p = "package.json";
let text = fs.readFileSync(p, "utf8").replace(/^\uFEFF/, "");
const j = JSON.parse(text);

j.scripts = j.scripts || {};

j.scripts["dev"] = "next dev";
j.scripts["build"] = "next build";
j.scripts["start"] = "next start";
j.scripts["audit:pantavion"] = "node scripts/pantavion-master-audit.cjs";
j.scripts["audit:water"] = "node scripts/pantavion-water-kernel-gate.cjs && node scripts/water-guardian-surface-audit.cjs && node scripts/pantavion-multimodal-language-audit.cjs";
j.scripts["audit:water:production"] = "node scripts/water-guardian-production-smoke.cjs";
j.scripts["audit:continuity-runtime"] = "node scripts/pantavion-continuity-runtime-gate.cjs";
j.scripts["runtime:heartbeat"] = "node scripts/pantavion-runtime-heartbeat.cjs";
j.scripts["radar:report"] = "node scripts/pantavion-market-radar-report.cjs";
j.scripts["autonomy:supervisor"] = "node scripts/pantavion-autonomy-supervisor.cjs";
j.scripts["plans:ingest"] = "node scripts/pantavion-unfinished-plan-ingestion.cjs";
j.scripts["audit:unfinished-plans"] = "node scripts/pantavion-unfinished-plan-ingestion-gate.cjs";
j.scripts["vision:ingest"] = "node scripts/pantavion-founder-vision-ingestion.cjs";
j.scripts["sources:harvest"] = "node scripts/pantavion-external-source-harvest.cjs";
j.scripts["audit:translation-runtime"] = "node scripts/pantavion-translation-runtime-gate.cjs";
j.scripts["audit:vision"] = "node scripts/pantavion-vision-registry-gate.cjs";
j.scripts["audit:guardian:365"] = "node scripts/pantavion-guardian-365.cjs";

fs.writeFileSync(p, JSON.stringify(j, null, 2) + "\n", "utf8");
console.log("PACKAGE_JSON_REPAIRED");
