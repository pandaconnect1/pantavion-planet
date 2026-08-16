export const WATER_MAP_B_SOURCE_IDENTITY_VERSION = "2026-08-16.v1" as const;

/**
 * Expected identity of the new Map B DWG selected by the owner.
 *
 * Important: this is NOT the legacy GEORGE_MAP_MASTER_B_C_FINAL.dwg source.
 * The byte size remains intentionally unresolved until it is verified from the
 * protected source object itself; filename + SHA-256 are the current hard lock.
 */
export const WATER_MAP_B_EXPECTED_SOURCE = {
  identityVersion: WATER_MAP_B_SOURCE_IDENTITY_VERSION,
  fileName: "MASTER 2025_Μ_15.1.2026_ANDREASPAP-01-02-014.dwg",
  sha256: "6d05c02b350ed21ba8bb03632a3aa47f138fd8d7b5ff85c540ecd8b33c016f16",
  byteSize: null as number | null,
  format: "dwg" as const,
  role: "map-b-authentic-master" as const,
} as const;

const SHA256_HEX = /^[a-f0-9]{64}$/i;

export type WaterMapBSourceIdentityInput = {
  fileName: string;
  sha256: string;
  byteSize?: number | null;
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

  if (source.byteSize !== undefined && source.byteSize !== null) {
    if (!Number.isInteger(source.byteSize) || source.byteSize <= 0) {
      errors.push("invalid_map_b_source_byte_size");
    }

    const expectedSize = WATER_MAP_B_EXPECTED_SOURCE.byteSize;
    if (expectedSize !== null && source.byteSize !== expectedSize) {
      errors.push("unexpected_map_b_source_byte_size");
    }
  }

  return { ok: errors.length === 0, errors };
}
