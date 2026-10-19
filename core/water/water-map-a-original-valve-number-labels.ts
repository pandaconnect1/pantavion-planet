/** Only verified, uniquely matched original CAD numbers may label Map A. */
import { validateValveRegistryEntry, type WaterValveRegistryEntry } from "./water-valve-crossmap-registry";

export type MapAValveNumberLabel = {
  mapAFeatureId: string;
  originalCadNumber: string;
  cadSourceFeatureId: string;
  cadSourceRevision: string;
  evidence: string[];
};
export type MapAValveNumberResult = {
  labels: MapAValveNumberLabel[];
  rejected: { mapAFeatureId: string; reason: string }[];
};
/** Read-only: the viewer may consume labels without editing network geometry. */
export function deriveMapAOriginalValveNumbers(
  entries: readonly WaterValveRegistryEntry[],
): MapAValveNumberResult {
  const labels: MapAValveNumberLabel[] = [];
  const rejected: MapAValveNumberResult["rejected"] = [];
  const counts = new Map<string,number>();
  const numbers = new Map<string,number>();
  for (const entry of entries) {
    const id = entry.references.A?.sourceFeatureId;
    if (id) counts.set(id,(counts.get(id) ?? 0)+1);
    const number = entry.canonicalNumber.trim();
    if (number) numbers.set(number,(numbers.get(number) ?? 0)+1);
  }
  for (const entry of entries) {
    const mapA = entry.references.A;
    const id = mapA?.sourceFeatureId ?? "";
    const source = (["B","C","D","E"] as const)
      .map(map=>entry.references[map])
      .find(ref=>ref?.sourceNumber === entry.canonicalNumber && ref.sourceFeatureId && ref.sourceRevision);
    let reason: string | null = null;
    if (entry.verification !== "verified") reason = "identity_not_verified";
    else if (validateValveRegistryEntry(entry).length) reason = "invalid_registry_entry";
    else if (!id || counts.get(id) !== 1) reason = "ambiguous_map_a_feature";
    else if (numbers.get(entry.canonicalNumber.trim()) !== 1) reason = "duplicate_original_number";
    else if (!source) reason = "original_cad_number_source_missing";
    else if (!entry.evidence.length) reason = "evidence_missing";
    if (reason) {
      rejected.push({mapAFeatureId:id,reason});
      continue;
    }
    labels.push({
      mapAFeatureId:id,
      originalCadNumber:entry.canonicalNumber,
      cadSourceFeatureId:source!.sourceFeatureId,
      cadSourceRevision:source!.sourceRevision,
      evidence:[...entry.evidence],
    });
  }
  return {labels,rejected};
}
