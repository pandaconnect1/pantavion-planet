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

const DERIVED_DIR = path.join(
  process.cwd(),
  "data",
  "water-network-private",
  "derived",
);

const INDEX_PATH = path.join(DERIVED_DIR, "water-feature-bbox-index.json");
const NDJSON_PATH = path.join(DERIVED_DIR, "water-features.ndjson");
const MANIFEST_PATH = path.join(DERIVED_DIR, "water-segment-index-manifest.json");

const DEFAULT_MAX_FEATURES = 1200;
const HARD_MAX_FEATURES = 2500;

let cachedIndex: IndexRecord[] | null = null;

function parseNumber(value: string | null, label: string) {
  if (!value) throw new Error(`Missing ${label}`);

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) throw new Error(`Invalid ${label}`);

  return parsed;
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

  if (lngSpan > 0.15 || latSpan > 0.15) {
    throw new Error("Η περιοχή είναι πολύ μεγάλη. Κάνε zoom ή διάλεξε συγκεκριμένη περιοχή.");
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

  const raw = await fs.readFile(INDEX_PATH, "utf8");
  cachedIndex = JSON.parse(raw) as IndexRecord[];

  return cachedIndex;
}

async function readFeatureAt(record: IndexRecord) {
  const handle = await fs.open(NDJSON_PATH, "r");

  try {
    const buffer = Buffer.alloc(record.bytes);
    await handle.read(buffer, 0, record.bytes, record.offset);
    return JSON.parse(buffer.toString("utf8"));
  } finally {
    await handle.close();
  }
}

export async function getControlledWaterSegmentFromPrivateIndex(
  bbox: Bbox,
  maxFeatures: number,
) {
  const [index, manifestRaw] = await Promise.all([
    readIndex(),
    fs.readFile(MANIFEST_PATH, "utf8"),
  ]);

  const manifest = JSON.parse(manifestRaw) as {
    fullMasterFeatureCount: number;
    indexedFeatureCount: number;
    indexBuiltFromFullMaster: boolean;
  };

  if (!manifest.indexBuiltFromFullMaster) {
    throw new Error("Index is not certified as full-master derived.");
  }

  const matches = index.filter((record) => intersects(record, bbox));
  const selected = matches.slice(0, maxFeatures);
  const features = await Promise.all(selected.map(readFeatureAt));

  return {
    marker: "pantavion_controlled_water_segment_private_index_authentic_source_v1",
    status: "controlled_segment_ready",
    bbox,
    sourceMode: "private_index_from_authentic_kmz",
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
