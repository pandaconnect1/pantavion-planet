import type {
  CyprusStreetRecord,
  CyprusStreetSource,
  CyprusStreetStatus,
} from "./cyprus-street-registry";
import { roadNameRoots } from "./street-name-roots.ts";

// One row of public.pantavion_cyprus_streets, as selected by the registry store.
export type CyprusStreetRegistryRow = {
  id: string | number;
  name_el: string | null;
  name_lat: string | null;
  district_name: string | null;
  municipality_or_community: string | null;
  area_or_parish: string | null;
  zone_or_section: string | null;
  postal_codes: unknown;
  source: string | null;
  source_ref: string | null;
  status: string | null;
};

export type CyprusStreetRegistryQuery = {
  district?: string;
  municipalityOrCommunity?: string;
  areaOrParish?: string;
  query?: string;
  limit?: number;
};

const SOURCES: readonly CyprusStreetSource[] = [
  "CYPRUS_POST",
  "DLS_ROAD_NETWORK",
  "DLS_ADMIN_BOUNDARIES",
  "DLS_ADDRESSES",
  "OPEN_DATA",
  "FIELD_PROPOSAL",
];

const STATUSES: readonly CyprusStreetStatus[] = [
  "VERIFIED",
  "NEW_CANDIDATE",
  "RENAMED_CANDIDATE",
  "CONFLICT",
  "RETIRED_OR_HISTORICAL",
];

// Place words say where a street is, not which street, so they never become search roots.
const LOCATION_WORDS = new Set([
  "ΛΕΜΕΣΟΣ", "ΛΕΜΕΣΟΥ", "ΛΕΜΕΣΟ", "LIMASSOL", "LEMESOS", "LEMESOU",
  "ΚΥΠΡΟΣ", "ΚΥΠΡΟΥ", "ΚΥΠΡΟ", "CYPRUS", "KYPROS", "KIPROS",
]);

function cleanText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const clean = value.replace(/\s+/g, " ").trim();
  return clean || null;
}

// Accent-free upper-case form shared by every matcher here. Final sigma folds to Σ.
function foldUpper(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLocaleUpperCase("el-CY")
    .replace(/\s+/g, " ")
    .trim();
}

function words(value: string) {
  return value.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
}

export function rowToCyprusStreetRecord(
  row: CyprusStreetRegistryRow,
  observedAt: string,
): CyprusStreetRecord | null {
  const nameEl = cleanText(row.name_el);
  const nameEn = cleanText(row.name_lat);
  if (!nameEl && !nameEn) return null;

  const id = String(row.id);
  const source = (SOURCES as readonly string[]).includes(row.source ?? "")
    ? (row.source as CyprusStreetSource)
    : "CYPRUS_POST";
  const status = (STATUSES as readonly string[]).includes(row.status ?? "")
    ? (row.status as CyprusStreetStatus)
    : "NEW_CANDIDATE";
  const rawPostalCodes: unknown[] = Array.isArray(row.postal_codes)
    ? row.postal_codes
    : [row.postal_codes];
  const postalCodes = rawPostalCodes
    .map((code) => (typeof code === "string" || typeof code === "number" ? String(code).trim() : ""))
    .filter(Boolean);

  return {
    streetRegistryId: id,
    nameEl,
    nameEn,
    alternateNames: [],
    formerNames: [],
    district: cleanText(row.district_name) ?? "",
    municipalityOrCommunity: cleanText(row.municipality_or_community) ?? "",
    areaOrParish: cleanText(row.area_or_parish),
    zoneOrSection: cleanText(row.zone_or_section),
    postalCodes,
    sourceReferences: [{ source, sourceId: cleanText(row.source_ref) ?? id, observedAt }],
    status,
  };
}

function nameKeys(record: CyprusStreetRecord) {
  return [record.nameEl, record.nameEn, ...record.alternateNames, ...record.formerNames]
    .filter((value): value is string => Boolean(value))
    .map(foldUpper);
}

// Roots come from the query's road-name tokens. Numbers, place words and generic road
// words are removed first, so house numbers and "Λεμεσός" never narrow the search.
function searchRoots(query: string) {
  const tokens = words(foldUpper(query)).filter((token) => !LOCATION_WORDS.has(token));
  return roadNameRoots(tokens.join(" "));
}

function localityKeys(record: CyprusStreetRecord) {
  return [record.municipalityOrCommunity, record.areaOrParish]
    .filter((value): value is string => Boolean(value))
    .map(foldUpper);
}

function startsAnyWord(root: string, values: string[]) {
  return values.some((word) => word.startsWith(root));
}

// A street matches when every root starts a word of its name or its locality, and at
// least one root is in the name itself. Roots drop Greek and Latin endings, so genitive,
// nominative and reversed word order all match.
export function matchesCyprusStreetQuery(record: CyprusStreetRecord, query: string) {
  const roots = searchRoots(query);
  if (roots.length === 0) return false;
  const streetWords = nameKeys(record).flatMap(words);
  const localityWords = localityKeys(record).flatMap(words);
  const inName = roots.filter((root) => startsAnyWord(root, streetWords));
  return (
    inName.length > 0 &&
    roots.every((root) => inName.includes(root) || startsAnyWord(root, localityWords))
  );
}

// A locality-only query ("Ύψωνας") lists that locality. The filter uses it only when no
// street name matches, so a street name never gives way to its locality.
function matchesLocalityQuery(record: CyprusStreetRecord, query: string) {
  const roots = searchRoots(query);
  if (roots.length === 0) return false;
  const localityWords = localityKeys(record).flatMap(words);
  return roots.every((root) => startsAnyWord(root, localityWords));
}

function containsFolded(value: string | null | undefined, needle: string | undefined) {
  if (!needle) return true;
  return foldUpper(value ?? "").includes(foldUpper(needle));
}

function displayName(record: CyprusStreetRecord) {
  return record.nameEl ?? record.nameEn ?? "";
}

export function filterCyprusStreetRecords(
  records: readonly CyprusStreetRecord[],
  input: CyprusStreetRegistryQuery,
) {
  const requested = Number.isFinite(input.limit) ? Math.trunc(input.limit as number) : 100;
  const limit = Math.max(1, Math.min(requested, 500));
  const query = input.query?.trim() ?? "";
  const scoped = records.filter(
    (record) =>
      containsFolded(record.district, input.district) &&
      containsFolded(record.municipalityOrCommunity, input.municipalityOrCommunity) &&
      containsFolded(record.areaOrParish, input.areaOrParish),
  );
  const streetMatches = query
    ? scoped.filter((record) => matchesCyprusStreetQuery(record, query))
    : scoped;
  const matches =
    query && streetMatches.length === 0
      ? scoped.filter((record) => matchesLocalityQuery(record, query))
      : streetMatches;
  return matches
    .sort((a, b) => displayName(a).localeCompare(displayName(b), "el"))
    .slice(0, limit);
}
