import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { uploadSignedDwgPiece } from "../app/professional/infrastructure/water/authentic-source-vault/owner-dwg-transfer.ts";

const source = readFileSync(new URL("../app/professional/infrastructure/water/authentic-source-vault/owner-dwg-transfer.ts", import.meta.url), "utf8");
assert.doesNotMatch(source, /new tus\.Upload\(|\/storage\/v1\/upload\/resumable/);
assert.match(source, /object\/upload\/sign/);
assert.match(source, /xhr\.open\("PUT", target\.toString\(\)\)/);
assert.match(source, /xhr\.setRequestHeader\("x-upsert", "false"\)/);
assert.match(source, /payload\.append\("cacheControl", "0"\)/);

const req = "water-map-8f8a8523-3bf7-4ebd-9b63-e10c74c2ccee";
const path = `water-network-private/owner-intake/map-b/${req}/chunks/000.part`;
const blob = new Blob([new TextEncoder().encode("AC1032" + "test")], {
  type: "application/octet-stream",
});
const token = "secret-token-only-for-test"; // Never print real upload tokens.

let calls = 0;
class FakeXHR {
  upload = {};
  status = 200;
  responseText = "";
  open(method, url) {
    calls += 1;
    assert.equal(method, "PUT");
    const parsed = new URL(url);
    assert.equal(parsed.hostname, "cxhulvwkagzufbjsdwwu.supabase.co");
    assert.equal(parsed.pathname, `/storage/v1/object/upload/sign/personal-media/${path}`);
    assert.equal(parsed.searchParams.get("token"), token);
  }
  setRequestHeader(name, value) { assert.equal(name, "x-upsert"); assert.equal(value, "false"); }
  send(body) {
    assert.ok(body instanceof FormData);
    assert.equal(body.get("cacheControl"), "0");
    const chunk = body.get("");
    assert.ok(chunk);
    assert.equal(chunk.size, blob.size);
    this.upload.onprogress({ lengthComputable: true, loaded: blob.size, total: blob.size });
    this.onload();
  }
}
globalThis.XMLHttpRequest = FakeXHR;

const progress = [];
await uploadSignedDwgPiece(blob, req, 0, {
  bucket: "personal-media", path, token, expectedChunkSizeBytes: blob.size,
}, count => progress.push(count));
assert.equal(calls, 1);
assert.deepEqual(progress, [blob.size, blob.size]);

for (const malformed of [
  { bucket: "public-media", path, token, expectedChunkSizeBytes: blob.size },
  { bucket: "personal-media", path: path.replace("/map-b/", "/map-a/"), token, expectedChunkSizeBytes: blob.size },
  { bucket: "personal-media", path, token: "", expectedChunkSizeBytes: blob.size },
  { bucket: "personal-media", path, token, expectedChunkSizeBytes: blob.size + 1 },
]) {
  await assert.rejects(uploadSignedDwgPiece(blob, req, 0, malformed, () => {}), /authorization_mismatch/);
}
assert.equal(calls, 1, "invalid signed uploads were rejected before network access");

console.log("PASS: DWG signed 32MiB object PUT contract, progress and no-overwrite guards");
