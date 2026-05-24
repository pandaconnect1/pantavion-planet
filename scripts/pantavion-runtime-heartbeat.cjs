const fs = require("fs");
const path = require("path");

const outDir = path.join(process.cwd(), "data", "runtime-reports");
fs.mkdirSync(outDir, { recursive: true });

const heartbeat = {
  id: "pantavion_runtime_heartbeat_v1",
  ok: true,
  alive: true,
  generatedAt: new Date().toISOString(),
  message: "Pantavion cloud continuity heartbeat generated.",
  pcRequired: false,
  cloudRequired: true
};

fs.writeFileSync(
  path.join(outDir, "latest-runtime-heartbeat.json"),
  JSON.stringify(heartbeat, null, 2) + "\n",
  "utf8"
);

console.log("PANTAVION RUNTIME HEARTBEAT: ALIVE");
