const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { Readable } = require("stream");
const { put } = require("@vercel/blob");

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/);
    if (!match) continue;
    const key = match[1];
    if (process.env[key]) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

function hashFile(file) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(file);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

async function main() {
  loadEnv(".env.local");

  const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.PANTAVION_BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error("BLOB_READ_WRITE_TOKEN_MISSING_PULL_VERCEL_ENV_FIRST");
  }

  const source = path.join(
    process.cwd(),
    "data",
    "water-network-private",
    "source-masters",
    "master-b-c-final",
    "GEORGE_MAP_MASTER_B_C_FINAL.dwg"
  );

  if (!fs.existsSync(source)) {
    throw new Error("DWG_SOURCE_NOT_FOUND");
  }

  const stat = fs.statSync(source);
  if (stat.size < 100 * 1024 * 1024) {
    throw new Error(`DWG_TOO_SMALL_NOT_REAL_MASTER: ${stat.size}`);
  }

  const sha256 = await hashFile(source);
  const pathname = "pantavion/water/final-master/GEORGE_MAP_MASTER_B_C_FINAL.dwg";

  const webStream = Readable.toWeb(fs.createReadStream(source));

  const blob = await put(pathname, webStream, {
    access: "private",
    addRandomSuffix: false,
    token,
  });

  const sourceTs = `export const FINAL_MASTER_DWG_BLOB_URL = ${JSON.stringify(blob.url)};
export const FINAL_MASTER_DWG_FILE_NAME = "GEORGE_MAP_MASTER_B_C_FINAL.dwg";
export const FINAL_MASTER_DWG_SIZE_BYTES = ${stat.size};
export const FINAL_MASTER_DWG_SHA256 = ${JSON.stringify(sha256)};
`;

  fs.mkdirSync(path.join(process.cwd(), "core", "water"), { recursive: true });
  fs.writeFileSync(
    path.join(process.cwd(), "core", "water", "final-master-dwg-source.ts"),
    sourceTs,
    "utf8"
  );

  const manifest = {
    marker: "pantavion_final_master_dwg_uploaded_as_original_file",
    fileName: "GEORGE_MAP_MASTER_B_C_FINAL.dwg",
    sizeBytes: stat.size,
    sizeMB: Math.round((stat.size / 1024 / 1024) * 100) / 100,
    sha256,
    blobUrl: blob.url,
    blobPathname: blob.pathname,
    access: "private",
    uploadedAt: new Date().toISOString(),
  };

  fs.writeFileSync(
    path.join(
      process.cwd(),
      "data",
      "water-network-private",
      "source-masters",
      "master-b-c-final",
      "final-master-dwg-blob-manifest.json"
    ),
    JSON.stringify(manifest, null, 2),
    "utf8"
  );

  console.log("=== ORIGINAL DWG UPLOADED ===");
  console.log("File:", source);
  console.log("SizeMB:", manifest.sizeMB);
  console.log("SHA256:", sha256);
  console.log("Blob:", blob.url);
  console.log("Generated: core/water/final-master-dwg-source.ts");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
