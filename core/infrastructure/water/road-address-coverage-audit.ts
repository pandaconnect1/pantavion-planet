/**
 * Licensed road/address coverage audit. No external scraping and no master-data writes.
 * A source's advertised coverage is not Pantavion's measured coverage.
 */
export type RoadReference = {
  source: string;
  sourceId: string;
  areaId: string;
  geometryKey: string;
  streetName?: string | null;
  buildingNumber?: string | null;
  licenseVerified: boolean;
  positionVerified: boolean;
};

export type RoadCoverageReport = {
  areaId: string;
  observedRoads: number;
  namedRoads: number;
  numberedAddresses: number;
  verifiedPositions: number;
  blockedUnlicensed: number;
  duplicateRecords: number;
  coveragePercent: null;
  coverageStatus: "reference_inventory_only";
};

export function auditRoadReferences(records: readonly RoadReference[]): RoadCoverageReport[] {
  const areas = new Map<string, RoadReference[]>();
  for (const record of records) {
    if (!record.areaId.trim() || !record.sourceId.trim() || !record.source.trim()) continue;
    areas.set(record.areaId, [...(areas.get(record.areaId) || []), record]);
  }
  return [...areas.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([areaId, rows]) => {
    const eligible = rows.filter((row) => row.licenseVerified);
    const unique = new Map<string, RoadReference>();
    for (const row of eligible) {
      const key = row.source + ":" + row.sourceId;
      if (!unique.has(key)) unique.set(key, row);
    }
    const values = [...unique.values()];
    return {
      areaId,
      observedRoads: new Set(values.filter((row) => row.geometryKey.trim()).map((row) => row.geometryKey)).size,
      namedRoads: new Set(values.filter((row) => row.streetName?.trim()).map((row) => row.geometryKey)).size,
      numberedAddresses: values.filter((row) => row.buildingNumber?.trim()).length,
      verifiedPositions: values.filter((row) => row.positionVerified).length,
      blockedUnlicensed: rows.length - eligible.length,
      duplicateRecords: eligible.length - unique.size,
      coveragePercent: null,
      coverageStatus: "reference_inventory_only" as const,
    };
  });
}
