import assert from "node:assert/strict";

import {
  createPantavionArtifactIntakeRecord,
  createPantavionArtifactWorkOrderCandidate,
  getPantavionUniversalFormatRegistrySummary,
} from "../core/intake/pantavion-universal-artifact-intake.ts";

const registry = getPantavionUniversalFormatRegistrySummary();
assert.equal(registry.marker, "pantavion_universal_format_registry_summary_v1");
assert.ok(registry.registeredFormatRules >= 25);
assert.ok(registry.registeredExtensions >= 120);
assert.ok(registry.registeredFamilies >= 15);
assert.ok(registry.formatIds.includes("autocad_dwg"));
assert.ok(registry.formatIds.includes("kml_kmz"));
assert.ok(registry.formatIds.includes("executable_binary"));

const dwgHeader = Buffer.from("AC1032PantavionDWG", "latin1").toString("base64");
const dwg = createPantavionArtifactIntakeRecord({
  sourceKind: "storage_reference",
  sourceId: "water:map-b-original",
  fileName: "MASTER-2025.dwg",
  sizeBytes: 205565159,
  mimeType: "application/acad",
  sha256: "6d05c02b350ed21ba8bb03632a3aa47f138fd8d7b5ff85c540ecd8b33c016f16",
  firstBytesBase64: dwgHeader,
  storageReference: "personal-media/water-network-private/source-masters/map-b-original/MASTER-2025.dwg",
  domains: ["water"],
});
assert.equal(dwg.marker, "pantavion_universal_artifact_intake_v1");
assert.equal(dwg.detection.formatId, "autocad_dwg");
assert.equal(dwg.detection.family, "cad_2d");
assert.equal(dwg.detection.supportState, "NATIVE");
assert.equal(dwg.detection.adapter, "pantavion_cad_mlightcad");
assert.equal(dwg.detection.confidence, "signature");
assert.equal(dwg.security.directExecutionAllowed, false);
assert.equal(dwg.truth.verifiedLive, false);
assert.equal(dwg.file.sha256VerifiedFromBytes, false);
assert.ok(dwg.processingPlan.includes("preserve_units_layers_blocks_coordinates"));
const dwgCandidate = createPantavionArtifactWorkOrderCandidate(dwg);
assert.equal(dwgCandidate.submission.target, "water_infrastructure");
assert.equal(dwgCandidate.submission.approvalScope, "proposal_only");

const pdf = createPantavionArtifactIntakeRecord({
  sourceKind: "conversation_attachment",
  sourceId: "thread:pdf-1",
  fileName: "report.bin",
  sizeBytes: 4096,
  mimeType: "application/octet-stream",
  firstBytesBase64: Buffer.from("%PDF-1.7\n", "latin1").toString("base64"),
  domains: ["personal_ai"],
});
assert.equal(pdf.detection.formatId, "pdf");
assert.equal(pdf.detection.confidence, "signature");
assert.equal(pdf.detection.supportState, "NATIVE");
assert.equal(createPantavionArtifactWorkOrderCandidate(pdf).submission.target, "pantaai_center");

const verifiedStoredPdf = createPantavionArtifactIntakeRecord({
  sourceKind: "storage_reference",
  sourceId: "storage:verified-pdf-1",
  fileName: "verified.pdf",
  sizeBytes: 4096,
  mimeType: "application/pdf",
  sha256: "f".repeat(64),
  sha256VerifiedFromBytes: true,
  firstBytesBase64: Buffer.from("%PDF-1.7\n", "latin1").toString("base64"),
  storageReference: "personal-media/artifact-vault/verified.pdf",
  domains: ["personal_ai"],
});
assert.equal(verifiedStoredPdf.file.sha256VerifiedFromBytes, true);
assert.match(
  createPantavionArtifactWorkOrderCandidate(verifiedStoredPdf).submission.founderIntent,
  /SHA-256 verified from stored bytes: yes/,
);

const kml = createPantavionArtifactIntakeRecord({
  sourceKind: "device_upload",
  sourceId: "device:map-1",
  fileName: "network.kml",
  sizeBytes: 12345,
  mimeType: "application/vnd.google-earth.kml+xml",
  firstBytesBase64: Buffer.from("<?xml version=\"1.0\"?><kml><Document>", "utf8").toString("base64"),
  domains: ["water"],
});
assert.equal(kml.detection.formatId, "kml_kmz");
assert.equal(kml.detection.family, "gis_vector");
assert.equal(kml.detection.supportState, "CONVERT");
assert.equal(kml.detection.adapter, "pantavion_kml_geojson_converter");
assert.ok(kml.processingPlan.includes("preserve_crs_projection_metadata"));

const executable = createPantavionArtifactIntakeRecord({
  sourceKind: "legacy_media",
  sourceId: "legacy:installer",
  fileName: "old-system.exe",
  sizeBytes: 1024,
  firstBytesBase64: Buffer.from([0x4d, 0x5a, 0x90, 0x00]).toString("base64"),
  domains: ["recovery"],
});
assert.equal(executable.detection.formatId, "executable_binary");
assert.equal(executable.detection.risk, "CRITICAL");
assert.equal(executable.detection.supportState, "SANDBOX_REQUIRED");
assert.equal(executable.security.quarantineRequired, true);
assert.equal(executable.security.directExecutionAllowed, false);
assert.ok(executable.processingPlan.includes("never_execute_untrusted_payload"));

const archive = createPantavionArtifactIntakeRecord({
  sourceKind: "archive_import",
  sourceId: "archive:recovery-1",
  fileName: "old-backup.zip",
  sizeBytes: 10_000,
  firstBytesBase64: Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00]).toString("base64"),
  domains: ["recovery"],
});
assert.equal(archive.detection.family, "archive");
assert.equal(archive.security.archiveExpansionRestricted, true);
assert.ok(archive.processingPlan.includes("block_path_traversal"));
assert.ok(archive.processingPlan.includes("limit_expansion_ratio"));
assert.ok(archive.processingPlan.includes("hash_each_extracted_member"));

const unknown = createPantavionArtifactIntakeRecord({
  sourceKind: "legacy_media",
  sourceId: "legacy:unknown-1",
  fileName: "mystery.zzz1991",
  sizeBytes: 88,
  domains: ["recovery"],
});
assert.equal(unknown.detection.formatId, "unknown");
assert.equal(unknown.detection.supportState, "PRESERVE");
assert.equal(unknown.truth.acceptedIntoEcosystem, true);
assert.equal(unknown.truth.preservedEvenWhenUnsupported, true);
assert.equal(unknown.truth.parserReady, false);
assert.ok(unknown.processingPlan.includes("hold_for_adapter_or_manual_classification"));

assert.throws(
  () => createPantavionArtifactIntakeRecord({
    sourceKind: "device_upload",
    sourceId: "../escape",
    fileName: "x.txt",
    sizeBytes: 1,
  }),
  /artifact_source_id_invalid/,
);

assert.throws(
  () => createPantavionArtifactIntakeRecord({
    sourceKind: "device_upload",
    sourceId: "device:bad-size",
    fileName: "x.txt",
    sizeBytes: -1,
  }),
  /artifact_size_invalid/,
);

assert.throws(
  () => createPantavionArtifactIntakeRecord({
    sourceKind: "storage_reference",
    sourceId: "storage:false-verification",
    fileName: "x.txt",
    sizeBytes: 1,
    sha256VerifiedFromBytes: true,
  }),
  /artifact_sha256_verification_without_digest/,
);

console.log("PANTAVION UNIVERSAL ARTIFACT INTAKE CONTRACT: PASSED");
console.log(`- registered format rules: ${registry.registeredFormatRules}`);
console.log(`- registered extensions: ${registry.registeredExtensions}`);
console.log(`- registered families: ${registry.registeredFamilies}`);
console.log("- DWG signature routing: yes");
console.log("- KML/GIS conversion routing: yes");
console.log("- executable quarantine: yes");
console.log("- unknown-format lossless preservation: yes");
console.log("- SHA-256 byte-verification provenance: fail-closed");
console.log("- direct untrusted execution authority: no");