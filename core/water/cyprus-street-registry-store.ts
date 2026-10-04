import type { CyprusStreetRecord } from "./cyprus-street-registry";
import { normalizeStreetName } from "./cyprus-street-registry";

export interface CyprusStreetRegistryStore {
  list(input: {
    district?: string;
    municipalityOrCommunity?: string;
    areaOrParish?: string;
    query?: string;
    limit?: number;
  }): Promise<CyprusStreetRecord[]>;
}

class EmptyCyprusStreetRegistryStore implements CyprusStreetRegistryStore {
  async list() {
    return [];
  }
}

export const cyprusStreetRegistryStore: CyprusStreetRegistryStore =
  new EmptyCyprusStreetRegistryStore();

export function matchesStreetQuery(record: CyprusStreetRecord, query: string) {
  const needle = normalizeStreetName(query);
  if (!needle) return true;
  return [record.nameEl, record.nameEn, ...record.alternateNames, ...record.formerNames]
    .filter((value): value is string => Boolean(value))
    .some((value) => normalizeStreetName(value).includes(needle));
}
