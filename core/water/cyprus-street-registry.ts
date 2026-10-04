export type CyprusStreetSource =
  | "CYPRUS_POST"
  | "DLS_ROAD_NETWORK"
  | "DLS_ADMIN_BOUNDARIES"
  | "DLS_ADDRESSES"
  | "OPEN_DATA"
  | "FIELD_PROPOSAL";

export type CyprusStreetStatus =
  | "VERIFIED"
  | "NEW_CANDIDATE"
  | "RENAMED_CANDIDATE"
  | "CONFLICT"
  | "RETIRED_OR_HISTORICAL";

export type CyprusStreetRecord = {
  streetRegistryId: string;
  nameEl: string | null;
  nameEn: string | null;
  alternateNames: string[];
  formerNames: string[];
  district: string;
  municipalityOrCommunity: string;
  areaOrParish: string | null;
  zoneOrSection: string | null;
  postalCodes: string[];
  geometryIdentity?: string | null;
  sourceReferences: Array<{ source: CyprusStreetSource; sourceId: string; observedAt: string }>;
  status: CyprusStreetStatus;
};

export function normalizeStreetName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[΄’']/g, "")
    .toLocaleLowerCase("el")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function streetDeduplicationKey(street: Pick<CyprusStreetRecord, "streetRegistryId" | "district" | "municipalityOrCommunity" | "areaOrParish" | "zoneOrSection" | "postalCodes" | "geometryIdentity" | "nameEl" | "nameEn">) {
  const name = normalizeStreetName(street.nameEl || street.nameEn || "");
  return [
    normalizeStreetName(street.district),
    normalizeStreetName(street.municipalityOrCommunity),
    name,
  ].join("|");
}

export function mergeStreetEvidence(records: CyprusStreetRecord[]) {
  const byKey = new Map<string, CyprusStreetRecord[]>();
  for (const record of records) {
    const key = streetDeduplicationKey(record);
    if (normalizeStreetName(record.nameEl || record.nameEn || "")) byKey.set(key, [...(byKey.get(key) ?? []), record]);
  }

  return [...byKey.values()].map((group) => {
    const sourceCount = new Set(group.flatMap((item) => item.sourceReferences.map((ref) => ref.source))).size;
    const base = group[0];
    return {
      ...base,
      alternateNames: [...new Set(group.flatMap((item) => item.alternateNames))],
      formerNames: [...new Set(group.flatMap((item) => item.formerNames))],
      postalCodes: [...new Set(group.flatMap((item) => item.postalCodes))],
      sourceReferences: group.flatMap((item) => item.sourceReferences),
      status: (sourceCount >= 2 && group.every((item) => item.status !== "CONFLICT")
        ? "VERIFIED"
        : base.status) as CyprusStreetStatus,
    };
  });
}
