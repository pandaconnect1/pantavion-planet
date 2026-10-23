import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";

let allowed = false;
let writes = 0;
let listInput;
let inserted;
globalThis.__drawingApi = {
  NextResponse: { json: (body, options = {}) => ({ body, status: options.status || 200 }) },
  authorizeWaterMapRequest: async () => allowed ? { ok: true, actorRef: "worker-1", mode: "approved-device" } : { ok: false, error: "denied" },
  insertWaterSpatialPatchViaBridge: async (record) => { writes++; inserted = record; return { ok: true, patch: { ...record, patch_id: "p1" } }; },
  listWaterSpatialPatchesViaBridge: async (input) => { listInput = input; return { ok: true, patches: ["local_only", "pending_review", "approved_overlay", "rejected"].map((status) => ({ status })) }; },
};
const contract = readFileSync("core/infrastructure/water/water-spatial-change-patch-contract.ts", "utf8").replaceAll("export ", "");
let source = readFileSync("app/api/professional/infrastructure/water/changes/patches/route.ts", "utf8")
  .replace('import "server-only";', "")
  .replace('import { NextResponse } from "next/server";', "const { NextResponse } = globalThis.__drawingApi;")
  .replace(/import \{ authorizeWaterMapRequest \}[^;]+;/, "const { authorizeWaterMapRequest } = globalThis.__drawingApi;")
  .replace(/import \{\n  assertPantavionWaterPatchGeometry,[\s\S]*?water-spatial-change-patch-contract";/, contract)
  .replace(/import \{\n  insertWaterSpatialPatchViaBridge,[\s\S]*?water-db-bridge";/, "const { insertWaterSpatialPatchViaBridge, listWaterSpatialPatchesViaBridge } = globalThis.__drawingApi;");
const { POST, GET } = await import("data:text/javascript;base64," + Buffer.from(stripTypeScriptTypes(source)).toString("base64"));
const request = (body) => new Request("https://example.test/", { method: "POST", body: JSON.stringify(body) });
assert.equal((await POST(request({}))).status, 403);
assert.equal(writes, 0);
assert.equal((await GET(new Request("https://example.test/?shared=1"))).status, 403);
assert.equal(listInput, undefined);
allowed = true;
const body = { clientMutationId: "m1", mapId: "D", sourceKey: "canonical-2026-andreaspap", assetType: "valve", operation: "create", geometry: { type: "Point", coordinates: [5000, 6000], crs: { authority: "LOCAL", code: "canonical-2026-andreaspap" } }, location: { source: "manual_map", accuracyState: "estimated" }, attributes: { drawing: { tool: "symbol" } } };
assert.equal((await POST(request(body))).status, 201);
assert.equal(inserted.status, "pending_review");
assert.equal(inserted.created_by, "worker-1");
assert.equal((await POST(request({ ...body, mapId: "A" }))).status, 400, "CAD coordinates cannot be filed under geographic Map A");
assert.equal((await POST(request({ ...body, sourceKey: "legacy-george-85m" }))).status, 400);
assert.equal(writes, 1);
const shared = await GET(new Request("https://example.test/?shared=1"));
assert.deepEqual(shared.body.patches.map((p) => p.status), ["pending_review", "approved_overlay"]);
assert.equal(listInput.admin, true, "Explicit approved-user shared overlay uses the server bridge");
await GET(new Request("https://example.test/?mine=1&shared=1"));
assert.equal(listInput.admin, false, "Private own-work path remains scoped to actor");
console.log("Water drawing API: authorization, pending persistence, CAD scope, shared visibility passed");
