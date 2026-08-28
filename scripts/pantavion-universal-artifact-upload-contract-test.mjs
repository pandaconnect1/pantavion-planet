import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const root = process.cwd();

function read(relative) {
  return fs.readFileSync(path.join(root, relative), "utf8");
}

const authorize = read("app/api/kernel/artifact-upload/authorize/route.ts");
const complete = read("app/api/kernel/artifact-upload/complete/route.ts");
const client = read("app/kernel/artifact-upload/kernel-artifact-upload-client.tsx");
const page = read("app/kernel/artifact-upload/page.tsx");
const kernelPage = read("app/kernel/page.tsx");

for (const source of [authorize, complete]) {
  assert.match(source, /isPantavionKernelFounderRequestAllowed/);
  assert.match(source, /Cache-Control/);
  assert.match(source, /private, no-store/);
}

assert.match(authorize, /createSignedUploadUrl/);
assert.match(authorize, /1_073_741_824/);
assert.match(authorize, /6 \* 1024 \* 1024/);
assert.match(authorize, /\.storage\.supabase\.co\/storage\/v1\/upload\/resumable/);
assert.match(authorize, /artifact-quarantine/);
assert.match(authorize, /artifact-vault/);
assert.match(authorize, /directExecutionAllowed: false/);
assert.doesNotMatch(authorize, /SUPABASE_SERVICE_ROLE_KEY[^\n]*NextResponse/);

assert.match(complete, /Range: `bytes=0-\$\{HEADER_SAMPLE_BYTES - 1\}`/);
assert.match(complete, /createSignedUrl/);
assert.match(complete, /FULL_HASH_LIMIT_BYTES = 16 \* 1024 \* 1024/);
assert.match(complete, /fullHashVerification: "verified" \| "worker_required"/);
assert.match(complete, /sha256VerifiedFromBytes: fullHashVerification === "verified"/);
assert.match(complete, /artifact_declared_hash_mismatch/);
assert.match(complete, /artifact_server_quarantine_escalation/);
assert.match(complete, /preserved: true, deleted: false/);
assert.match(complete, /persistPantavionFounderWorkOrder/);
assert.match(complete, /personal_media/);
assert.doesNotMatch(complete, /\.remove\(/);

assert.match(client, /from "tus-js-client"/);
assert.match(client, /new tus\.Upload/);
assert.match(client, /chunkSize: upload\.chunkSizeBytes/);
assert.match(client, /findPreviousUploads/);
assert.match(client, /resumeFromPreviousUpload/);
assert.match(client, /"x-signature": upload\.token/);
assert.match(client, /type="file"/);
assert.doesNotMatch(client, /accept=/);
assert.doesNotMatch(client, /SUPABASE_SERVICE_ROLE_KEY/);
assert.doesNotMatch(client, /SUPABASE_SECRET_KEY/);
assert.match(client, /\/api\/kernel\/artifact-upload\/authorize/);
assert.match(client, /\/api\/kernel\/artifact-upload\/complete/);

assert.match(page, /isPantavionKernelFounderIdentityAllowed/);
assert.match(page, /KernelArtifactUploadClient/);
assert.match(kernelPage, /href="\/kernel\/artifact-upload"/);

console.log("PANTAVION UNIVERSAL ARTIFACT UPLOAD CONTRACT: PASSED");
console.log("- founder-only authorize/complete routes: yes");
console.log("- private current bucket bound 1 GB: yes");
console.log("- TUS resumable direct-storage pattern: yes");
console.log("- 6 MB chunks + retry/resume: yes");
console.log("- client service-role exposure: no");
console.log("- server stored-byte range verification: yes");
console.log("- <=16 MB full server SHA-256 path: yes");
console.log("- verified SHA-256 provenance recorded from stored bytes: yes");
console.log("- large-file full hash truth: worker_required");
console.log("- risky artifact quarantine path: yes");
console.log("- mismatch auto-deletion: no");
console.log("- any-file chooser accept filter: none");