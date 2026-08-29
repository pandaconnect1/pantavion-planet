import assert from "node:assert/strict";

import { createPantavionArtifactIntakeRecord } from "../core/intake/pantavion-universal-artifact-intake.ts";
import {
  createPantavionArtifactEditingCapabilities,
  PANTAVION_ARTIFACT_EDITING_CAPABILITY_MARKER,
} from "../core/intake/pantavion-artifact-editing-capabilities.ts";
import {
  PANTAVION_ARTIFACT_UPLOAD_MAX_BYTES,
  isPantavionArtifactUploadSizeAllowed,
  requiresPantavionArtifactHashWorker,
} from "../core/intake/pantavion-artifact-storage-policy.ts";

assert.equal(PANTAVION_ARTIFACT_UPLOAD_MAX_BYTES, 1_610_612_736);
assert.equal(isPantavionArtifactUploadSizeAllowed(1_610_612_736), true);
assert.equal(isPantavionArtifactUploadSizeAllowed(1_610_612_737), false);
assert.equal(requiresPantavionArtifactHashWorker(16 * 1024 * 1024), false);
assert.equal(requiresPantavionArtifactHashWorker(16 * 1024 * 1024 + 1), true);

function capabilitiesFor(fileName, mimeType = "application/octet-stream") {
  const artifact = createPantavionArtifactIntakeRecord({
    sourceKind: "device_upload",
    sourceId: `contract:${fileName.replace(/[^a-z0-9.:-]/gi, "-")}`,
    fileName,
    sizeBytes: 1024,
    mimeType,
  });
  const capabilities = createPantavionArtifactEditingCapabilities(artifact.detection);
  assert.equal(capabilities.marker, PANTAVION_ARTIFACT_EDITING_CAPABILITY_MARKER);
  assert.equal(capabilities.originalImmutable, true);
  assert.equal(capabilities.derivativeRequiredForByteChanges, true);
  return capabilities;
}

const dwg = capabilitiesFor("network.dwg", "image/vnd.dwg");
assert.equal(dwg.operations.find((item) => item.operation === "VIEW")?.state, "READY");
assert.equal(dwg.operations.find((item) => item.operation === "MEASURE")?.state, "READY");
assert.equal(dwg.operations.find((item) => item.operation === "GEOMETRY_EDIT")?.state, "ADAPTER_REQUIRED");

const image = capabilitiesFor("photo.jpg", "image/jpeg");
assert.equal(image.operations.find((item) => item.operation === "VIEW")?.state, "READY");
assert.equal(image.operations.find((item) => item.operation === "EDIT_CONTENT")?.state, "ADAPTER_REQUIRED");

const audio = capabilitiesFor("music.flac", "audio/flac");
assert.equal(audio.operations.find((item) => item.operation === "EXTRACT")?.state, "READY");
assert.equal(audio.operations.find((item) => item.operation === "TRANSCODE")?.state, "ADAPTER_REQUIRED");

const executable = capabilitiesFor("legacy.exe", "application/octet-stream");
assert.equal(executable.operations.find((item) => item.operation === "EDIT_CONTENT")?.state, "SANDBOX_ONLY");

const unknown = capabilitiesFor("ancient.unknownfmt");
assert.equal(unknown.operations.find((item) => item.operation === "EDIT_CONTENT")?.state, "PRESERVE_ONLY");

console.log("PANTAVION ARTIFACT EDITING CAPABILITY CONTRACT: PASSED");
console.log("- upload ceiling: 1.5 GiB");
console.log("- original immutable: yes");
console.log("- byte-changing edits require derivatives: yes");
console.log("- capabilities expose READY / worker / adapter / sandbox / preserve truth: yes");
