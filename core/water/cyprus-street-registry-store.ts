import { createAdminClient } from "@/lib/supabase/admin";
import postalSource from "@/data/water/limassol-postal-source-2024.json";
import type { CyprusStreetRecord } from "./cyprus-street-registry";
import {
  filterCyprusStreetRecords,
  rowToCyprusStreetRecord,
  type CyprusStreetRegistryQuery,
  type CyprusStreetRegistryRow,
} from "./cyprus-street-registry-match";

export interface CyprusStreetRegistryStore {
  list(input: CyprusStreetRegistryQuery): Promise<CyprusStreetRecord[]>;
}

// Water-module coverage: the Limassol postal register, the same scope as the street directory.
const LIMASSOL_DISTRICT_NAMES = ["Lemesos", "Limassol", "Λεμεσός", "ΛΕΜΕΣΟΣ"];
const PAGE_SIZE = 1000;
const MAX_ROWS = 100000;
const CACHE_MS = 60000;

type AdminClient = ReturnType<typeof createAdminClient>;

async function readLimassolRows(admin: AdminClient): Promise<CyprusStreetRegistryRow[]> {
  const rows: CyprusStreetRegistryRow[] = [];
  for (let offset = 0; offset < MAX_ROWS; offset += PAGE_SIZE) {
    const result = await admin
      .from("pantavion_cyprus_streets")
      .select("id,name_el,name_lat,district_name,municipality_or_community,area_or_parish,zone_or_section,postal_codes,source,source_ref,status")
      .in("district_name", LIMASSOL_DISTRICT_NAMES)
      .order("id")
      .range(offset, offset + PAGE_SIZE - 1);
    if (result.error || !Array.isArray(result.data)) throw new Error("street_registry_read_failed");
    rows.push(...(result.data as CyprusStreetRegistryRow[]));
    if (result.data.length < PAGE_SIZE) return rows;
  }
  throw new Error("street_registry_exceeds_verified_limit");
}

let cached: { expiresAt: number; records: CyprusStreetRecord[] } | null = null;
let inFlight: Promise<CyprusStreetRecord[]> | null = null;

// Failures are never cached: the next request tries the registry again.
async function loadLimassolRecords(): Promise<CyprusStreetRecord[]> {
  if (cached && cached.expiresAt > Date.now()) return cached.records;
  if (!inFlight) {
    inFlight = (async () => {
      const rows = await readLimassolRows(createAdminClient());
      const observedAt = postalSource.publishedAt;
      const records = rows.flatMap((row) => {
        const record = rowToCyprusStreetRecord(row, observedAt);
        return record ? [record] : [];
      });
      cached = { expiresAt: Date.now() + CACHE_MS, records };
      return records;
    })().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}

export const cyprusStreetRegistryStore: CyprusStreetRegistryStore = {
  async list(input) {
    return filterCyprusStreetRecords(await loadLimassolRecords(), input);
  },
};
