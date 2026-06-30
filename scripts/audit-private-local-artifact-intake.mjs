import { readFileSync } from "node:fs";

const core = readFileSync("core/storage/private-local-artifact-intake.ts", "utf8");
const route = readFileSync("app/api/kernel/private-local-artifact-intake/route.ts", "utf8");
const docs = readFileSync("docs/pantavion/private-local-artifact-intake-dwg-upload.md", "utf8");
const gitignore = readFileSync(".gitignore", "utf8");

const required = [
  [core, "ingestPantavionPrivateLocalArtifact"],
  [core, "assessPantavionPrivateLocalArtifactIntake"],
  [core, "fileSha256Copy"],
  [core, "data/private-artifacts/originals"],
  [core, "private-local-artifact-intake-state.json"],
  [core, "private-local-artifact-intake-audit.jsonl"],
  [core, "originalDwgMutationAllowed: false"],
  [core, "noGitStorage: true"],
  [core, "noPublicFolder: true"],
  [core, "publicAccessAllowed: false"],
  [core, "requestedSurface"],
  [core, "sha256_mismatch"],
  [core, "ingested"],
  [route, "export async function GET"],
  [route, "export async function POST"],
  [route, "pantavion_private_local_artifact_intake_dwg_upload"],
  [route, "mode === \"ingest\""],
  [docs, "PATCH 8T"],
  [docs, "Private Local Artifact Intake"],
  [docs, "Original DWG is never mutated."],
  [docs, "SHA256"],
  [gitignore, "data/private-artifacts/"],
  [gitignore, "data/kernel/private-local-artifact-intake-state.json"],
  [gitignore, "data/kernel/private-local-artifact-intake-audit.jsonl"]
];

const missing = required.filter(([source, token]) => !source.includes(token)).map(([, token]) => token);

if (missing.length > 0) {
  console.error("Private local artifact intake audit failed. Missing tokens:");
  for (const token of missing) console.error(`- ${token}`);
  process.exit(1);
}

console.log("Private local artifact intake audit passed.");
