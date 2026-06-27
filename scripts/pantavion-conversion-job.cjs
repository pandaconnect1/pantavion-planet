const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const kernelDir = path.join(root, ".pantavion", "kernel");

const options = [
  {
    id: "text-to-text-local",
    label: "Text / Markdown local derivative",
    input: [".txt", ".md"],
    output: [".txt", ".md"],
    adapterStatus: "available_local",
    estimatedBaseCostCents: 1,
    currency: "EUR"
  },
  {
    id: "json-to-text-local",
    label: "JSON pretty/text derivative",
    input: [".json"],
    output: [".txt", ".json"],
    adapterStatus: "available_local",
    estimatedBaseCostCents: 1,
    currency: "EUR"
  },
  {
    id: "csv-to-text-local",
    label: "CSV text derivative",
    input: [".csv"],
    output: [".txt", ".csv"],
    adapterStatus: "available_local",
    estimatedBaseCostCents: 1,
    currency: "EUR"
  },
  {
    id: "document-provider",
    label: "Document conversion adapter",
    input: [".pdf", ".docx"],
    output: [".pdf", ".txt", ".png", ".jpg"],
    adapterStatus: "provider_required",
    estimatedBaseCostCents: 5,
    currency: "EUR"
  },
  {
    id: "image-provider",
    label: "Image/photo conversion adapter",
    input: [".png", ".jpg", ".jpeg", ".webp", ".tif", ".tiff"],
    output: [".png", ".jpg", ".webp", ".pdf"],
    adapterStatus: "provider_required",
    estimatedBaseCostCents: 3,
    currency: "EUR"
  },
  {
    id: "cad-dwg-provider",
    label: "Professional CAD/DWG conversion adapter",
    input: [".dwg", ".dxf"],
    output: [".pdf", ".png", ".svg", ".dxf", ".dwg"],
    adapterStatus: "provider_required",
    estimatedBaseCostCents: 120,
    currency: "EUR",
    policy: "Original CAD/DWG remains source truth. Outputs are derivative only."
  }
];

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function main() {
  const args = process.argv.slice(2);

  if (args.includes("--list") || args.length === 0) {
    console.log(JSON.stringify({ ok: true, options }, null, 2));
    return;
  }

  const intakeIndex = args.indexOf("--from-intake");
  const toIndex = args.indexOf("--to");

  if (intakeIndex < 0 || toIndex < 0) {
    console.error("Usage: node scripts/pantavion-conversion-job.cjs --list");
    console.error("Usage: node scripts/pantavion-conversion-job.cjs --from-intake <id> --to .txt");
    process.exit(1);
  }

  const intakeId = args[intakeIndex + 1];
  const desiredOutput = args[toIndex + 1];

  const intakeDb = readJson(path.join(kernelDir, "omnimodal-intake.json"), {
    records: []
  });

  const source = Array.isArray(intakeDb.records)
    ? intakeDb.records.find((record) => record.id === intakeId)
    : null;

  if (!source) {
    throw new Error(`Omnimodal intake record not found: ${intakeId}`);
  }

  const found = options.find((option) =>
    option.input.includes(source.extension) &&
    option.output.includes(desiredOutput)
  );

  const job = {
    id: cryptoRandomId(),
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    actor: "local-script",
    sourceIntakeId: source.id,
    sourceOriginalName: source.originalName,
    sourceExtension: source.extension,
    sourceCategory: source.category,
    sourceSha256: source.sha256,
    desiredOutputExtension: desiredOutput,
    status: found && found.adapterStatus === "available_local" ? "planned" : "requires_adapter",
    adapterStatus: found ? found.adapterStatus : "requires_adapter",
    adapterName: found ? found.id : "pantavion.registry.requires-new-adapter",
    estimatedCostCents: found ? found.estimatedBaseCostCents : 0,
    currency: "EUR",
    recommendation:
      found && found.adapterStatus === "available_local"
        ? "Local adapter exists in TypeScript runtime. Use API/page path for execution."
        : "Adapter/provider required. Original remains preserved; output cannot be claimed yet."
  };

  const dbPath = path.join(kernelDir, "conversion-jobs.json");
  const db = readJson(dbPath, { version: 1, updatedAt: new Date().toISOString(), jobs: [] });

  db.jobs = [job, ...(Array.isArray(db.jobs) ? db.jobs : [])].slice(0, 500);
  db.updatedAt = new Date().toISOString();

  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf8");

  console.log(JSON.stringify({ ok: true, job }, null, 2));
}

function cryptoRandomId() {
  return require("node:crypto").randomUUID();
}

main();
