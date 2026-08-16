export const WATER_MAP_B_SOURCE_IDENTITY_VERSION = "2026-08-16.v2" as const;

/**
 * Expected identity of the new Map B DWG selected by the owner.
 *
 * Important: this is NOT the legacy GEORGE_MAP_MASTER_B_C_FINAL.dwg source.
 * Filename, SHA-256 and exact byte size are verified against the protected
 * source bytes. CRS remains intentionally unknown until parser/control-point
 * verification proves the drawing's real coordinate reference system.
 */
export const WATER_MAP_B_EXPECTED_SOURCE = {
  identityVersion: WATER_MAP_B_SOURCE_IDENTITY_VERSION,
  fileName: "MASTER 2025_Μ_15.1.2026_ANDREASPAP-01-02-014.dwg",
  sha256: "6d05c02b350ed21ba8bb03632a3aa47f138fd8d7b5ff85c540ecd8b33c016f16",
  byteSize: 205565159,
  format: "dwg" as const,
  dwgHeader: "AC1032" as const,
  role: "map-b-authentic-master" as const,
  sourceCrs: null as string | null,
  alignmentState: "unverified" as const,
} as const;

const SHA256_HEX = /^[a-f0-9]{64}$/i;

export type WaterMapBSourceIdentityInput = {
  fileName: string;
  sha256: string;
  byteSize?: number | null;
  dwgHeader?: string | null;
};

export type WaterMapBSourceIdentityCheck = {
  ok: boolean;
  errors: string[];
};

export function validateWaterMapBExpectedSourceIdentity(
  source: WaterMapBSourceIdentityInput,
): WaterMapBSourceIdentityCheck {
  const errors: string[] = [];

  if (source.fileName !== WATER_MAP_B_EXPECTED_SOURCE.fileName) {
    errors.push("unexpected_map_b_source_filename");
  }

  if (!SHA256_HEX.test(source.sha256)) {
    errors.push("invalid_map_b_source_sha256");
  } else if (source.sha256.toLowerCase() !== WATER_MAP_B_EXPECTED_SOURCE.sha256) {
    errors.push("unexpected_map_b_source_sha256");
  }

  if (source.byteSize === undefined || source.byteSize === null) {
    errors.push("missing_map_b_source_byte_size");
  } else if (!Number.isInteger(source.byteSize) || source.byteSize <= 0) {
    errors.push("invalid_map_b_source_byte_size");
  } else if (source.byteSize !== WATER_MAP_B_EXPECTED_SOURCE.byteSize) {
    errors.push("unexpected_map_b_source_byte_size");
  }

  if (source.dwgHeader !== undefined && source.dwgHeader !== null) {
    if (source.dwgHeader !== WATER_MAP_B_EXPECTED_SOURCE.dwgHeader) {
      errors.push("unexpected_map_b_dwg_header");
    }
  }

  return { ok: errors.length === 0, errors };
}
