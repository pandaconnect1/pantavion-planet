import assert from "node:assert/strict";
import fs from "node:fs";

import {
  createPantavionArtifactIntakeRecord,
  getPantavionUniversalFormatRegistrySummary,
} from "../core/intake/pantavion-universal-artifact-intake.ts";

const registry = getPantavionUniversalFormatRegistrySummary();
assert.ok(registry.registeredFormatRules >= 31);
assert.ok(registry.registeredExtensions >= 263);
assert.ok(registry.registeredFamilies >= 21);

const dwg = createPantavionArtifactIntakeRecord({
  sourceKind: "device_upload",
  sourceId: "water-test:dwg",
  fileName: "network-master.dwg",
  sizeBytes: 1024,
  firstBytesBase64: Buffer.from("AC1032PantavionWaterDWG", "latin1").toString("base64"),
  domains: ["water"],
});
assert.equal(dwg.detection.formatId, "autocad_dwg");
assert.equal(dwg.detection.family, "cad_2d");
assert.equal(dwg.detection.supportState, "NATIVE");

const kml = createPantavionArtifactIntakeRecord({
  sourceKind: "device_upload",
  sourceId: "water-test:kml",
  fileName: "network.kml",
  sizeBytes: 512,
  firstBytesBase64: Buffer.from("<kml><Document></Document></kml>").toString("base64"),
  domains: ["water"],
});
assert.equal(kml.detection.formatId, "kml_kmz");
assert.equal(kml.detection.family, "gis_vector");
assert.equal(kml.detection.supportState, "CONVERT");

const future = createPantavionArtifactIntakeRecord({
  sourceKind: "device_upload",
  sourceId: "water-test:future",
  fileName: "future-network.pvmap2099",
  sizeBytes: 333,
  domains: ["water"],
});
assert.equal(future.detection.formatId, "unknown");
assert.equal(future.detection.supportState, "PRESERVE");
assert.equal(future.truth.acceptedIntoEcosystem, true);
assert.equal(future.truth.preservedEvenWhenUnsupported, true);
assert.equal(future.truth.parserReady, false);

const wrapper = fs.readFileSync("core/water/water-map-format-registry.ts", "utf8");
const authorize = fs.readFileSync(
  "app/api/professional/infrastructure/water/maps/intake/authorize/route.ts",
  "utf8",
);
const complete = fs.readFileSync(
  "app/api/professional/infrastructure/water/maps/intake/complete/route.ts",
  "utf8",
);
const client = fs.readFileSync(
  "app/professional/infrastructure/water/maps/intake/water-universal-map-uploader.tsx",
  "utf8",
);
const hub = fs.readFileSync(
  "app/professional/infrastructure/water/page.tsx",
  "utf8",
);

assert.match(wrapper, /pantavion-universal-artifact-intake/);
assert.match(wrapper, /acceptsUnknownFutureFormats: true/);
assert.match(wrapper, /rawPreservationBeforeConversion: true/);
assert.match(wrapper, /noFakeParsing: true/);
assert.match(wrapper, /canonicalMutationRequiresReview: true/);

for (const source of [authorize, complete]) {
  assert.match(source, /authorizeWaterMapIngestActor/);
  assert.match(source, /water-map-ingest-private/);
  assert.match(source, /Cache-Control/);
  assert.match(source, /private, no-store/);
  assert.doesNotMatch(source, /SUPABASE_SERVICE_ROLE_KEY[^\n]*NextResponse/);
  assert.doesNotMatch(source, /SUPABASE_SECRET_KEY[^\n]*NextResponse/);
}

assert.match(authorize, /createSignedUploadUrl/);
assert.match(authorize, /storage\.supabase\.co\/storage\/v1\/upload\/resumable/);
assert.match(authorize, /APPROVED_DEVICE_MAX_BYTES = 512 \* 1024 \* 1024/);
assert.match(authorize, /APPROVED_DEVICE_PENDING_LIMIT = 3/);
assert.match(authorize, /canonicalMutationAllowed: false/);

assert.match(complete, /Range:/);
assert.match(complete, /computeStoredSha256/);
assert.match(complete, /createPantavionArtifactWorkOrderCandidate/);
assert.match(complete, /persistPantavionFounderWorkOrder/);
assert.match(complete, /proposal-only durable work order/);
assert.match(complete, /preserved: true/);
assert.match(complete, /deleted: false/);
assert.doesNotMatch(complete, /\.remove\(/);

assert.match(client, /from "tus-js-client"/);
assert.match(client, /new tus\.Upload/);
assert.match(client, /findPreviousUploads/);
assert.match(client, /resumeFromPreviousUpload/);
assert.match(client, /"x-signature"/);
assert.match(client, /type="file"/);
assert.doesNotMatch(client, /accept=/);
assert.match(client, /Live Network \/ Βρες με/);

assert.match(hub, /Water Supply Operating System/);
assert.match(hub, /\/professional\/infrastructure\/water\/live/);
assert.match(hub, /\/professional\/infrastructure\/water\/maps\/intake/);
assert.match(hub, /\/professional\/infrastructure\/water\/warehouse/);
assert.match(hub, /\/professional\/infrastructure\/water\/accounting/);
assert.match(hub, /\/professional\/infrastructure\/water\/intelligence/);

console.log(
  JSON.stringify(
    {
      marker: "pantavion_water_universal_map_ingest_contract_v1",
      ok: true,
      registeredFormatRules: registry.registeredFormatRules,
      registeredExtensions: registry.registeredExtensions,
      registeredFamilies: registry.registeredFamilies,
      dwg: dwg.detection,
      kml: kml.detection,
      future: {
        formatId: future.detection.formatId,
        supportState: future.detection.supportState,
        preservedEvenWhenUnsupported: future.truth.preservedEvenWhenUnsupported,
      },
      rawPrivate: true,
      canonicalMutationAllowed: false,
      approvedDeviceMaxBytes: 512 * 1024 * 1024,
      adminMaxBytes: 1_610_612_736,
    },
    null,
    2,
  ),
);
