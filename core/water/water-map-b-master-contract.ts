export const WATER_MAP_B_MASTER_CONTRACT_VERSION = "2026-08-16.v1" as const;

export type WaterMapBSourceFormat = "dwg" | "dxf" | "gpkg" | "geojson";

export type WaterMapBLayerManifestEntry = {
  sourceLayerName: string;
  sourceLayerIndex: number;
  entityCount: number;
  sourceVisible: boolean | null;
  sourceLocked: boolean | null;
  sourceColor?: string | null;
  sourceLineType?: string | null;
  sourceMetadataHash?: string | null;
};

export type WaterMapBMasterManifest = {
  contractVersion: typeof WATER_MAP_B_MASTER_CONTRACT_VERSION;
  sourceFormat: WaterMapBSourceFormat;
  sourceFileName: string;
  sourceSha256: string;
  sourceByteSize: number;
  importedAt: string;
  importerName: string;
  importerVersion: string;
  sourceCrs: string | null;
  canonicalCrs: string | null;
  transformApplied: boolean;
  transformDescription: string | null;
  sourceLayerCount: number;
  sourceEntityCount: number;
  layers: WaterMapBLayerManifestEntry[];
  immutableMaster: true;
  geometryModified: false;
  sourceLayersDropped: false;
  sourceEntitiesDropped: false;
};

export type WaterMapBMasterValidation = {
  ok: boolean;
  errors: string[];
};

const SHA256_HEX = /^[a-f0-9]{64}$/i;

/**
 * Fail-closed validation for Map B ingestion.
 *
 * This does not prove semantic/geospatial correctness. It prevents a derived
 * import from being accepted as the authentic Map B master when the manifest
 * itself admits destructive modification, dropped layers/entities, or broken
 * provenance.
 */
export function validateWaterMapBMasterManifest(
  manifest: WaterMapBMasterManifest,
): WaterMapBMasterValidation {
  const errors: string[] = [];

  if (manifest.contractVersion !== WATER_MAP_B_MASTER_CONTRACT_VERSION) {
    errors.push("unsupported_contract_version");
  }

  if (!manifest.sourceFileName.trim()) errors.push("missing_source_filename");
  if (!SHA256_HEX.test(manifest.sourceSha256)) errors.push("invalid_source_sha256");
  if (!Number.isFinite(manifest.sourceByteSize) || manifest.sourceByteSize <= 0) {
    errors.push("invalid_source_byte_size");
  }

  if (!manifest.importerName.trim()) errors.push("missing_importer_name");
  if (!manifest.importerVersion.trim()) errors.push("missing_importer_version");

  if (manifest.immutableMaster !== true) errors.push("master_not_immutable");
  if (manifest.geometryModified !== false) errors.push("geometry_was_modified");
  if (manifest.sourceLayersDropped !== false) errors.push("source_layers_dropped");
  if (manifest.sourceEntitiesDropped !== false) errors.push("source_entities_dropped");

  if (!Number.isInteger(manifest.sourceLayerCount) || manifest.sourceLayerCount < 0) {
    errors.push("invalid_source_layer_count");
  }

  if (!Number.isInteger(manifest.sourceEntityCount) || manifest.sourceEntityCount < 0) {
    errors.push("invalid_source_entity_count");
  }

  if (manifest.layers.length !== manifest.sourceLayerCount) {
    errors.push("layer_manifest_count_mismatch");
  }

  const seenLayerIndexes = new Set<number>();
  let entityTotal = 0;

  for (const layer of manifest.layers) {
    if (!layer.sourceLayerName.trim()) errors.push("empty_source_layer_name");
    if (!Number.isInteger(layer.sourceLayerIndex) || layer.sourceLayerIndex < 0) {
      errors.push("invalid_source_layer_index");
    }
    if (seenLayerIndexes.has(layer.sourceLayerIndex)) {
      errors.push("duplicate_source_layer_index");
    }
    seenLayerIndexes.add(layer.sourceLayerIndex);

    if (!Number.isInteger(layer.entityCount) || layer.entityCount < 0) {
      errors.push("invalid_layer_entity_count");
    } else {
      entityTotal += layer.entityCount;
    }
  }

  if (entityTotal !== manifest.sourceEntityCount) {
    errors.push("entity_manifest_count_mismatch");
  }

  if (manifest.transformApplied && !manifest.transformDescription?.trim()) {
    errors.push("missing_transform_description");
  }

  if (manifest.canonicalCrs && !manifest.sourceCrs && !manifest.transformApplied) {
    errors.push("canonical_crs_without_source_crs_or_transform");
  }

  return { ok: errors.length === 0, errors };
}

export type WaterMapBFieldOverlayRecord = {
  id: string;
  createdAt: string;
  createdBy: string;
  status: "draft" | "submitted" | "approved" | "rejected";
  sourceMasterSha256: string;
  note?: string | null;
  geometry?: unknown;
  attributes?: Record<string, unknown>;
};

/**
 * Field edits are intentionally separate from the immutable authentic master.
 * An approved overlay may become canonical operational truth through a later
 * audited workflow, but this function never mutates the master manifest.
 */
export function isWaterMapBFieldOverlayBoundToMaster(
  overlay: WaterMapBFieldOverlayRecord,
  master: WaterMapBMasterManifest,
) {
  return overlay.sourceMasterSha256 === master.sourceSha256;
}
