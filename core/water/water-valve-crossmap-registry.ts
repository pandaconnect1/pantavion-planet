/** Read-only cross-map valve identity registry. Does not alter map geometry or rendering. */
export type WaterMapKey = "A" | "B" | "C" | "D" | "E";
export type WaterValveReference = {
  map: WaterMapKey;
  sourceFeatureId: string;
  sourceNumber: string | null;
  longitude: number | null;
  latitude: number | null;
  sourceRevision: string;
};
export type WaterValveRegistryEntry = {
  canonicalNumber: string;
  area: string | null;
  zone: string | null;
  street: string | null;
  address: string | null;
  references: Partial<Record<WaterMapKey, WaterValveReference>>;
  verification: "pending" | "verified" | "conflict";
  evidence: string[];
};
/** Never infer a match from proximity alone. Verified evidence is mandatory. */
export function resolveValveAcrossMaps(
  entries: readonly WaterValveRegistryEntry[],
  map: WaterMapKey,
  featureId: string,
  target: WaterMapKey,
): WaterValveReference | null {
  const matches = entries.filter(
    (entry) =>
      entry.verification === "verified" &&
      entry.evidence.length > 0 &&
      entry.references[map]?.sourceFeatureId === featureId,
  );
  if (matches.length !== 1) return null;
  const ref = matches[0].references[target];
  return ref?.sourceFeatureId ? ref : null;
}
export function validateValveRegistryEntry(entry: WaterValveRegistryEntry): string[] {
  const errors: string[] = [];
  if (!entry.canonicalNumber.trim()) errors.push("missing_number");
  if (!entry.references.A) errors.push("missing_map_a_reference");
  if (!(["B", "C", "D", "E"] as const).some((key) => entry.references[key]))
    errors.push("missing_numbered_source");
  for (const ref of Object.values(entry.references)) {
    if (!ref) continue;
    if (!ref.sourceFeatureId || !ref.sourceRevision) errors.push("missing_source_provenance");
    if (ref.sourceNumber && ref.sourceNumber !== entry.canonicalNumber)
      errors.push("conflicting_source_number");
  }
  if (entry.verification === "verified" && !entry.evidence.length)
    errors.push("missing_verification_evidence");
  return [...new Set(errors)];
}
