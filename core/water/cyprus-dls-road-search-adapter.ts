import type { UnifiedPlaceResult } from "./water-unified-place-search-contract";

export type CyprusDlsRoadSearchConfig = {
  baseUrl?: string;
  timeoutMs?: number;
};

type DlsGeoJsonFeature = {
  id?: string | number;
  properties?: {
    OBJECTID?: string | number | null;
    ROADNAMEGR?: string | null;
    ROADNAMERMN?: string | null;
    ROUTENUMBER?: string | null;
    DIST_CODE?: string | number | null;
    VIL_CODE?: string | number | null;
    QRTR_CODE?: string | number | null;
    STREET_CODE?: string | number | null;
  };
  geometry?: {
    type?: string;
    coordinates?: unknown;
  } | null;
};

type DlsGeoJsonResponse = {
  type?: string;
  features?: DlsGeoJsonFeature[];
  error?: { message?: string; details?: string[] };
};

const DEFAULT_DLS_ROAD_LAYER =
  "https://eservices.dls.moi.gov.cy/arcgis/rest/services/National/General_Search/MapServer/13/query";

function stripDiacritics(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").normalize("NFC");
}

function escapeArcGisSqlLiteral(value: string) {
  return value.replace(/'/g, "''").replace(/[%_]/g, "");
}

function containsGreek(value: string) {
  return /[\u0370-\u03ff\u1f00-\u1fff]/u.test(value);
}

function searchVariants(query: string) {
  const clean = query.replace(/\s+/g, " ").trim();
  const firstCommaPart = clean.split(",")[0]?.trim() ?? clean;
  const withoutHouseNumbers = firstCommaPart
    .replace(/\b\d+[a-zα-ω]?\b/giu, " ")
    .replace(/\s+/g, " ")
    .trim();
  const withoutCommonLocationSuffix = withoutHouseNumbers
    .replace(/\b(?:cyprus|kypros|kipros|limassol|lemesos|lemesou|λεμεσος|λεμεσός|κυπρος|κύπρος)\b/giu, " ")
    .replace(/\s+/g, " ")
    .trim();

  return Array.from(
    new Set(
      [clean, firstCommaPart, withoutHouseNumbers, withoutCommonLocationSuffix]
        .map((value) => value.trim())
        .filter((value) => value.length >= 2),
    ),
  ).slice(0, 4);
}

function linePoint(coordinates: unknown): { lat: number; lng: number } | null {
  if (!Array.isArray(coordinates) || coordinates.length === 0) return null;

  const pairs: Array<[number, number]> = [];

  const visit = (value: unknown) => {
    if (
      Array.isArray(value) &&
      value.length >= 2 &&
      Number.isFinite(Number(value[0])) &&
      Number.isFinite(Number(value[1]))
    ) {
      pairs.push([Number(value[0]), Number(value[1])]);
      return;
    }
    if (Array.isArray(value)) value.forEach(visit);
  };

  visit(coordinates);
  if (pairs.length === 0) return null;

  // Use a stable middle coordinate so the field map lands on the road itself,
  // not on an arbitrary administrative centroid.
  const [lng, lat] = pairs[Math.floor(pairs.length / 2)];
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

function buildWhere(value: string) {
  const raw = value.toLocaleUpperCase("el-CY");
  const stripped = stripDiacritics(raw);
  const variants = Array.from(new Set([raw, stripped]))
    .map(escapeArcGisSqlLiteral)
    .filter(Boolean);

  const clauses: string[] = [];
  for (const variant of variants) {
    clauses.push(`ROADNAMEGR LIKE '%${variant}%'`);
    clauses.push(`ROADNAMERMN LIKE '%${variant}%'`);
    clauses.push(`ROUTENUMBER LIKE '%${variant}%'`);
  }
  return clauses.length ? `(${clauses.join(" OR ")})` : "1=0";
}

export class CyprusDlsRoadSearchAdapter {
  constructor(private readonly config: CyprusDlsRoadSearchConfig = {}) {}

  async search(query: string): Promise<UnifiedPlaceResult[]> {
    const variants = searchVariants(query);
    if (variants.length === 0) return [];

    const baseUrl = this.config.baseUrl ?? DEFAULT_DLS_ROAD_LAYER;
    const timeoutMs = this.config.timeoutMs ?? 8000;

    for (const variant of variants) {
      const url = new URL(baseUrl);
      url.searchParams.set("where", buildWhere(variant));
      url.searchParams.set(
        "outFields",
        "OBJECTID,ROADNAMEGR,ROADNAMERMN,ROUTENUMBER,DIST_CODE,VIL_CODE,QRTR_CODE,STREET_CODE",
      );
      url.searchParams.set("returnGeometry", "true");
      url.searchParams.set("outSR", "4326");
      url.searchParams.set("resultRecordCount", "25");
      url.searchParams.set("f", "geojson");

      const response = await fetch(url, {
        cache: "no-store",
        signal: AbortSignal.timeout(timeoutMs),
        headers: {
          Accept: "application/geo+json, application/json",
          "User-Agent": "PantavionWater/1.0 (pantavion.com)",
        },
      });

      if (!response.ok) {
        throw new Error(`cyprus_dls_road_search_${response.status}`);
      }

      const body = (await response.json()) as DlsGeoJsonResponse;
      if (body.error) {
        throw new Error(body.error.message || "cyprus_dls_road_search_error");
      }

      const results = (body.features ?? []).flatMap((feature, index) => {
        const point = linePoint(feature.geometry?.coordinates);
        if (!point) return [];

        const properties = feature.properties ?? {};
        const greekName = properties.ROADNAMEGR?.trim() || "";
        const romanizedName = properties.ROADNAMERMN?.trim() || "";
        const routeNumber = properties.ROUTENUMBER?.trim() || "";
        const preferGreek = containsGreek(query);
        const displayName =
          (preferGreek ? greekName : romanizedName) ||
          greekName ||
          romanizedName ||
          routeNumber ||
          variant;

        const secondaryParts = [
          preferGreek ? romanizedName : greekName,
          routeNumber,
          properties.STREET_CODE != null ? `street ${properties.STREET_CODE}` : "",
        ].filter((item): item is string => Boolean(item));

        const objectId = properties.OBJECTID ?? feature.id ?? index;

        return [{
          resultId: `cyprus-dls-road:${objectId}`,
          kind: "STREET",
          displayName,
          secondaryLabel:
            secondaryParts.length > 0
              ? `${secondaryParts.join(" · ")} · Τμήμα Κτηματολογίου και Χωρομετρίας`
              : "Τμήμα Κτηματολογίου και Χωρομετρίας",
          coordinates: point,
          source: "CYPRUS_OFFICIAL",
          sourceResultId: String(objectId),
          confidence: 0.98,
          // Keep official search results session-only until the final DLS
          // production-access/licensing arrangement is formally recorded.
          persistence: "SESSION_ONLY",
        } satisfies UnifiedPlaceResult];
      });

      if (results.length > 0) {
        const unique = new Map<string, UnifiedPlaceResult>();
        for (const result of results) {
          const key = `${result.displayName.toLocaleLowerCase()}:${result.coordinates?.lat.toFixed(5)}:${result.coordinates?.lng.toFixed(5)}`;
          if (!unique.has(key)) unique.set(key, result);
        }
        return [...unique.values()];
      }
    }

    return [];
  }
}
