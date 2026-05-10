import { promises as fs } from "fs";
import path from "path";

type Bbox = {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
};

type IndexRecord = {
  featureIndex: number;
  offset: number;
  bytes: number;
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
};

type WaterTruthReport = {
  marker: string;
  placemarks: number;
  lineStrings: number;
  coordinatePoints: number;
  badCoordinates: number;
  checks: {
    placemarksMatch: boolean;
    lineStringsMatch: boolean;
    coordinatePointsMatch: boolean;
    noBadCoordinates: boolean;
    looksLikeCyprusWgs84: boolean;
    sampleAsFinal: boolean;
    mobilePreviewAsProduction: boolean;
    publicGeodata: boolean;
  };
};

type WaterIndexManifest = {
  marker: string;
  fullMasterFeatureCount: number;
  indexedFeatureCount: number;
  indexRecordCount: number;
  sourcePlacemarkCount: number;
  sourceLineStringCount: number;
  sourceCoordinatePointCount: number;
  indexBuiltFromFullMaster: boolean;
  sampleAsFinal: boolean;
  previewAsProduction: boolean;
  browserFullNetworkAllowed: boolean;
  rawMasterPublicExposureAllowed: boolean;
};

const PRIVATE_ROOT = path.join(process.cwd(), "data", "water-network-private");

const PROCESSED_DIR = path.join(PRIVATE_ROOT, "processed");
const DERIVED_DIR = path.join(PRIVATE_ROOT, "derived");

const TRUTH_REPORT_PATH = path.join(PROCESSED_DIR, "water-source-truth-report.json");
const INDEX_PATH = path.join(DERIVED_DIR, "water-feature-bbox-index.json");
const NDJSON_PATH = path.join(DERIVED_DIR, "water-features.ndjson");
const MANIFEST_PATH = path.join(DERIVED_DIR, "water-segment-index-manifest.json");

const EXPECTED_PLACEMARKS = 122857;
const EXPECTED_LINE_STRINGS = 125398;
const EXPECTED_COORDINATE_POINTS = 528063;

const DEFAULT_MAX_FEATURES = 1200;
const HARD_MAX_FEATURES = 1800;
const MAX_BBOX_SPAN_DEGREES = 0.08;

let cachedIndex: IndexRecord[] | null = null;
let cachedVerified = false;

function parseNumber(value: string | null, label: string) {
  if (!value) throw new Error(`Missing ${label}`);

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) throw new Error(`Invalid ${label}`);

  return parsed;
}

async function readJsonFile<T>(filePath: string): Promise<T> {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

function assertTruthReport(report: WaterTruthReport) {
  if (report.placemarks !== EXPECTED_PLACEMARKS) {
    throw new Error(`Water truth mismatch: placemarks ${report.placemarks}`);
  }

  if (report.lineStrings !== EXPECTED_LINE_STRINGS) {
    throw new Error(`Water truth mismatch: lineStrings ${report.lineStrings}`);
  }

  if (report.coordinatePoints !== EXPECTED_COORDINATE_POINTS) {
    throw new Error(`Water truth mismatch: coordinatePoints ${report.coordinatePoints}`);
  }

  if (report.badCoordinates !== 0) {
    throw new Error(`Water truth mismatch: badCoordinates ${report.badCoordinates}`);
  }

  if (!report.checks.placemarksMatch) {
    throw new Error("Water truth gate failed: placemarksMatch false");
  }

  if (!report.checks.lineStringsMatch) {
    throw new Error("Water truth gate failed: lineStringsMatch false");
  }

  if (!report.checks.coordinatePointsMatch) {
    throw new Error("Water truth gate failed: coordinatePointsMatch false");
  }

  if (!report.checks.noBadCoordinates) {
    throw new Error("Water truth gate failed: noBadCoordinates false");
  }

  if (!report.checks.looksLikeCyprusWgs84) {
    throw new Error("Water truth gate failed: coordinates are not Cyprus WGS84");
  }

  if (report.checks.sampleAsFinal !== false) {
    throw new Error("Water truth gate failed: sampleAsFinal is not false");
  }

  if (report.checks.mobilePreviewAsProduction !== false) {
    throw new Error("Water truth gate failed: mobilePreviewAsProduction is not false");
  }

  if (report.checks.publicGeodata !== false) {
    throw new Error("Water truth gate failed: publicGeodata is not false");
  }
}

function assertIndexManifest(manifest: WaterIndexManifest) {
  if (!manifest.indexBuiltFromFullMaster) {
    throw new Error("Water index gate failed: index is not built from full master");
  }

  if (manifest.sourcePlacemarkCount !== EXPECTED_PLACEMARKS) {
    throw new Error(`Water index gate failed: sourcePlacemarkCount ${manifest.sourcePlacemarkCount}`);
  }

  if (manifest.sourceLineStringCount !== EXPECTED_LINE_STRINGS) {
    throw new Error(`Water index gate failed: sourceLineStringCount ${manifest.sourceLineStringCount}`);
  }

  if (manifest.sourceCoordinatePointCount !== EXPECTED_COORDINATE_POINTS) {
    throw new Error(
      `Water index gate failed: sourceCoordinatePointCount ${manifest.sourceCoordinatePointCount}`,
    );
  }

  if (manifest.fullMasterFeatureCount !== EXPECTED_PLACEMARKS) {
    throw new Error(`Water index gate failed: fullMasterFeatureCount ${manifest.fullMasterFeatureCount}`);
  }

  if (manifest.indexRecordCount !== EXPECTED_PLACEMARKS) {
    throw new Error(`Water index gate failed: indexRecordCount ${manifest.indexRecordCount}`);
  }

  if (manifest.sampleAsFinal !== false) {
    throw new Error("Water index gate failed: sampleAsFinal is not false");
  }

  if (manifest.previewAsProduction !== false) {
    throw new Error("Water index gate failed: previewAsProduction is not false");
  }

  if (manifest.browserFullNetworkAllowed !== false) {
    throw new Error("Water index gate failed: browserFullNetworkAllowed is not false");
  }

  if (manifest.rawMasterPublicExposureAllowed !== false) {
    throw new Error("Water index gate failed: rawMasterPublicExposureAllowed is not false");
  }
}

async function assertVerifiedPrivateSource() {
  if (cachedVerified) return;

  const [truthReport, indexManifest] = await Promise.all([
    readJsonFile<WaterTruthReport>(TRUTH_REPORT_PATH),
    readJsonFile<WaterIndexManifest>(MANIFEST_PATH),
  ]);

  assertTruthReport(truthReport);
  assertIndexManifest(indexManifest);

  cachedVerified = true;
}

export function parseWaterSegmentBbox(searchParams: URLSearchParams): Bbox {
  const bbox = {
    minLng: parseNumber(searchParams.get("minLng"), "minLng"),
    minLat: parseNumber(searchParams.get("minLat"), "minLat"),
    maxLng: parseNumber(searchParams.get("maxLng"), "maxLng"),
    maxLat: parseNumber(searchParams.get("maxLat"), "maxLat"),
  };

  if (bbox.minLng >= bbox.maxLng || bbox.minLat >= bbox.maxLat) {
    throw new Error("Invalid bbox order.");
  }

  const lngSpan = bbox.maxLng - bbox.minLng;
  const latSpan = bbox.maxLat - bbox.minLat;

  if (lngSpan > MAX_BBOX_SPAN_DEGREES || latSpan > MAX_BBOX_SPAN_DEGREES) {
    throw new Error("Η περιοχή είναι πολύ μεγάλη. Κάνε zoom ή διάλεξε πιο συγκεκριμένη περιοχή.");
  }

  return bbox;
}

export function parseWaterSegmentLimit(searchParams: URLSearchParams) {
  const raw = searchParams.get("maxFeatures");

  if (!raw) return DEFAULT_MAX_FEATURES;

  const parsed = Number(raw);

  if (!Number.isFinite(parsed)) return DEFAULT_MAX_FEATURES;

  return Math.max(1, Math.min(Math.floor(parsed), HARD_MAX_FEATURES));
}

function intersects(record: IndexRecord, bbox: Bbox) {
  return (
    record.minLng <= bbox.maxLng &&
    record.maxLng >= bbox.minLng &&
    record.minLat <= bbox.maxLat &&
    record.maxLat >= bbox.minLat
  );
}

async function readIndex() {
  if (cachedIndex) return cachedIndex;

  await assertVerifiedPrivateSource();

  const raw = await fs.readFile(INDEX_PATH, "utf8");
  const index = JSON.parse(raw) as IndexRecord[];

  if (index.length !== EXPECTED_PLACEMARKS) {
    throw new Error(`Water index gate failed: runtime index length ${index.length}`);
  }

  cachedIndex = index;

  return cachedIndex;
}

async function readFeatures(records: IndexRecord[]) {
  const handle = await fs.open(NDJSON_PATH, "r");

  try {
    const features = [];

    for (const record of records) {
      const buffer = Buffer.alloc(record.bytes);
      await handle.read(buffer, 0, record.bytes, record.offset);
      features.push(JSON.parse(buffer.toString("utf8")));
    }

    return features;
  } finally {
    await handle.close();
  }
}

export async function getControlledWaterSegmentFromPrivateIndex(
  bbox: Bbox,
  maxFeatures: number,
) {
  await assertVerifiedPrivateSource();

  const [index, manifest] = await Promise.all([
    readIndex(),
    readJsonFile<WaterIndexManifest>(MANIFEST_PATH),
  ]);

  assertIndexManifest(manifest);

  const matches = index.filter((record) => intersects(record, bbox));
  const selected = matches.slice(0, maxFeatures);
  const features = await readFeatures(selected);

  return {
    marker: "pantavion_verified_private_water_segment_v1",
    status: "controlled_segment_ready",
    bbox,
    sourceMode: "verified_private_index_from_authentic_kmz",
    sourceTruthLocked: true,
    sourcePlacemarkCount: EXPECTED_PLACEMARKS,
    sourceLineStringCount: EXPECTED_LINE_STRINGS,
    sourceCoordinatePointCount: EXPECTED_COORDINATE_POINTS,
    dataReturned: true,
    segmentReturned: true,
    completeNetworkReturned: false,
    rawMasterReturned: false,
    browserFullNetworkLoaded: false,
    indexBuiltFromFullMaster: true,
    sampleAsFinal: false,
    previewAsProduction: false,
    totalMasterFeatureCount: manifest.fullMasterFeatureCount,
    indexedFeatureCount: manifest.indexedFeatureCount,
    matchingFeatureCount: matches.length,
    segmentCount: features.length,
    segmentTruncated: matches.length > features.length,
    segment: {
      type: "FeatureCollection",
      features,
    },
  };
}
