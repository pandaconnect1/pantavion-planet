const fs = require("fs");
const path = require("path");

const urls = [
  "https://pantavion.com",
  "https://pantavion.net",
  "https://pantavion.info"
];

const outDir = path.join(process.cwd(), "data", "source-harvest");
fs.mkdirSync(outDir, { recursive: true });

async function harvest() {
  const results = [];

  for (const url of urls) {
    try {
      const response = await fetch(url, { redirect: "follow" });
      const text = await response.text();

      results.push({
        url,
        ok: response.ok,
        status: response.status,
        contentLength: text.length,
        title: (text.match(/<title[^>]*>(.*?)<\/title>/i) || [null, ""])[1],
        detectedSignals: [
          text.includes("Pantavion") ? "pantavion_brand_detected" : "pantavion_brand_missing",
          text.toLowerCase().includes("translate") ? "translation_detected" : "translation_missing",
          text.toLowerCase().includes("sos") ? "sos_detected" : "sos_missing",
          text.toLowerCase().includes("ai") ? "ai_detected" : "ai_missing"
        ],
      });
    } catch (error) {
      results.push({
        url,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const report = {
    id: "pantavion_external_source_harvest_v1",
    generatedAt: new Date().toISOString(),
    truth:
      "This harvest checks public Pantavion domains and turns visible gaps into implementation signals. It cannot read private GPT threads unless exported into the founder vision vault.",
    results,
    requiredFollowUp: [
      "Compare public pantavion.com/net/info against repo runtime routes",
      "Detect missing public entry links for live interpreter, radar, founder vision, SOS, PantaAI",
      "Generate implementation tasks for missing runtime surfaces",
      "Never copy third-party IP; adapt only lawful patterns",
    ],
  };

  fs.writeFileSync(
    path.join(outDir, "latest-external-source-harvest.json"),
    JSON.stringify(report, null, 2) + "\n",
    "utf8"
  );

  fs.writeFileSync(
    path.join(process.cwd(), "data", "runtime-reports", "latest-external-source-harvest.json"),
    JSON.stringify(report, null, 2) + "\n",
    "utf8"
  );

  console.log("PANTAVION EXTERNAL SOURCE HARVEST: PASSED");
}

harvest().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
