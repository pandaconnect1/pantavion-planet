/**
 * Read-only cross-view reconciliation of water-map observations.
 * A/B/D observations are evidence, never automatic authority to mutate source truth.
 */
export type WaterMapObservation = {
  mapId: "A" | "B" | "D";
  assetId: string;
  geometryFingerprint: string;
  sourceKey: string;
  verifiedPosition: boolean;
  approved: boolean;
};

export type WaterMapDifference = {
  assetId: string;
  kind: "missing_in_view" | "conflicting_geometry" | "unverified_position";
  mapIds: Array<"A" | "B" | "D">;
  requiresHumanApproval: true;
};

const VIEWS = ["A", "B", "D"] as const;

export function compareWaterMapObservations(
  observations: readonly WaterMapObservation[],
): WaterMapDifference[] {
  const grouped = new Map<string, WaterMapObservation[]>();
  for (const observation of observations) {
    if (!observation.assetId.trim() || !observation.sourceKey.trim()) continue;
    const key = observation.assetId.trim();
    grouped.set(key, [...(grouped.get(key) || []), observation]);
  }

  const differences: WaterMapDifference[] = [];
  for (const [assetId, records] of grouped) {
    const seen = new Set(records.map((record) => record.mapId));
    const missing = VIEWS.filter((view) => !seen.has(view));
    if (missing.length) {
      differences.push({ assetId, kind: "missing_in_view", mapIds: [...missing], requiresHumanApproval: true });
    }
    // Fingerprints from different coordinate systems are not directly comparable.
    // Flag them for georeferencing rather than declaring a geometry conflict.
    const crs = new Set(records.map((record) => record.sourceKey));
    const geometry = new Set(records.map((record) => record.geometryFingerprint));
    if (crs.size === 1 && geometry.size > 1) {
      differences.push({ assetId, kind: "conflicting_geometry", mapIds: [...seen], requiresHumanApproval: true });
    }
    if (crs.size > 1 || records.some((record) => !record.verifiedPosition || !record.approved)) {
      differences.push({ assetId, kind: "unverified_position", mapIds: [...seen], requiresHumanApproval: true });
    }
  }
  return differences;
}
