const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { Readable } = require("stream");
const { put } = require("@vercel/blob");

const FILE_NAME = "MASTER 2025_Μ_15.1.2026_ANDREASPAP-01-02-014.dwg";
const EXPECTED_SIZE_BYTES = 205565159;
const EXPECTED_SHA256 = "6d05c02b350ed21ba8bb03632a3aa47f138fd8d7b5ff85c540ecd8b33c016f16";

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/);
    if (!match) continue;
    const key = match[1];
    if (process.env[key]) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
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
  if (!token) throw new Error("BLOB_READ_WRITE_TOKEN_MISSING_PULL_VERCEL_ENV_FIRST");

  const source = path.join(process.cwd(), "data", "water-network-private", "source-masters", "map-b-original", FILE_NAME);
  if (!fs.existsSync(source)) throw new Error("DWG_SOURCE_NOT_FOUND");

  const stat = fs.statSync(source);
  if (stat.size !== EXPECTED_SIZE_BYTES) throw new Error(`DWG_SIZE_MISMATCH:${stat.size}`);

  const sha256 = await hashFile(source);
  if (sha256 !== EXPECTED_SHA256) throw new Error(`DWG_SHA256_MISMATCH:${sha256}`);

  const pathname = `pantavion/water/map-b-original/${FILE_NAME}`;
  const webStream = Readable.toWeb(fs.createReadStream(source));
  const blob = await put(pathname, webStream, { access: "private", addRandomSuffix: false, token });

  const sourceTs = `export const FINAL_MASTER_DWG_BLOB_URL = ${JSON.stringify(blob.url)};\nexport const FINAL_MASTER_DWG_FILE_NAME = ${JSON.stringify(FILE_NAME)};\nexport const FINAL_MASTER_DWG_SIZE_BYTES = ${stat.size};\nexport const FINAL_MASTER_DWG_SHA256 = ${JSON.stringify(sha256)};\n`;
  fs.writeFileSync(path.join(process.cwd(), "core", "water", "final-master-dwg-source.ts"), sourceTs, "utf8");

  console.log("=== EXACT ORIGINAL MAP B DWG UPLOADED ===");
  console.log("File:", FILE_NAME);
  console.log("SizeBytes:", stat.size);
  console.log("SHA256:", sha256);
  console.log("Blob:", blob.url);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
