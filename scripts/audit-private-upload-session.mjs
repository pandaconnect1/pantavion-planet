import { readFileSync } from "node:fs";

const core = readFileSync("core/storage/private-upload-session-contract.ts", "utf8");
const store = readFileSync("core/storage/private-upload-session-store.ts", "utf8");
const route = readFileSync("app/api/kernel/private-upload-session/route.ts", "utf8");
const docs = readFileSync("docs/pantavion/private-storage-upload-session-multipart-contract.md", "utf8");

const required = [
  [core, "PANTAVION_PRIVATE_UPLOAD_SUPPORTED_EXTENSIONS"],
  [core, "assessPantavionPrivateUploadSession"],
  [core, "dwg"],
  [core, "dxf"],
  [core, "dgn"],
  [core, "gpkg"],
  [core, "xlsx"],
  [core, "docx"],
  [core, "multipart_private_upload"],
  [core, "chunked_resumable_upload"],
  [core, "privateStorageOnly: true"],
  [core, "noGitStorage: true"],
  [core, "noPublicFolder: true"],
  [core, "publicAccessAllowed: false"],
  [core, "uploadBytesAllowedNow: false"],
  [core, "originalDwgMutationAllowed: false"],
  [store, "private-upload-session-contracts.json"],
  [store, "private-upload-session-audit.jsonl"],
  [store, "registerPantavionPrivateUploadSessionContract"],
  [store, "registered_pending_adapter"],
  [route, "export async function GET"],
  [route, "export async function POST"],
  [route, "pantavion_private_storage_upload_session_multipart_contract"],
  [route, "mode === \"register\""],
  [docs, "PATCH 8S"],
  [docs, "Private Storage Upload Session / Multipart Contract"],
  [docs, "This patch does not upload bytes yet."],
  [docs, "Private storage only."],
  [docs, "No Git storage."],
  [docs, "No public folder."],
  [docs, "Original DWG is never mutated."],
  [docs, "multipart/chunked upload"]
];

const missing = required.filter(([source, token]) => !source.includes(token)).map(([, token]) => token);

if (missing.length > 0) {
  console.error("Private upload session audit failed. Missing tokens:");
  for (const token of missing) console.error(`- ${token}`);
  process.exit(1);
}

console.log("Private upload session audit passed.");
