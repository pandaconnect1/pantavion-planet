import { get, head, type HeadBlobResult } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";

import {
  assertPrivateWaterIndexRecordRange,
  buildPrivateWaterRangeBatches,
  extractPrivateWaterFeaturesFromStream,
  type PrivateWaterIndexRecord,
  type PrivateWaterRangeBatch,
} from "./private-water-segment-reader";

type Bbox = {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
};

type IndexRecord = PrivateWaterIndexRecord;

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

const BLOB_PATHS = {
  truthReport: "water/private/processed/water-source-truth-report.json",
  manifest: "water/private/derived/water-segment-index-manifest.json",
  index: "water/private/derived/water-feature-bbox-index.json",
  ndjson: "water/private/derived/water-features.ndjson",
} as const;

const EXPECTED_PLACEMARKS = 122857;
const EXPECTED_LINE_STRINGS = 125398;
const EXPECTED_COORDINATE_POINTS = 528063;

const DEFAULT_MAX_FEATURES = 1200;
const HARD_MAX_FEATURES = 1800;
const MAX_BBOX_SPAN_DEGREES = 0.08;
const RANGE_FETCH_CONCURRENCY = 4;
const FEATURE_CACHE_MAX_ENTRIES = 6000;
const RANGE_READ_TIMEOUT_MS = 8_000;
const STREAM_FALLBACK_TIMEOUT_MS = 45_000;

let cachedIndex: IndexRecord[] | null = null;
let cachedVerified = false;
let cachedManifest: WaterIndexManifest | null = null;
let cachedNdjsonMetadata: HeadBlobResult | null = null;
const cachedFeatures = new Map<string, unknown>();

function waterSegmentError(code: string, message: string) {
  return new Error(`[${code}] ${message}`);
}

export function getWaterSegmentDiagnosticCode(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || "");
  const explicitCode = message.match(/^\[([A-Z0-9_]+)\]/)?.[1];

  if (explicitCode) return explicitCode;
  if (message.includes("Water truth")) return "WATER_SOURCE_TRUTH";
  if (message.includes("Water index")) return "WATER_INDEX";
  if (message.includes("JSON") || message.includes("Unexpected token")) {
    return "WATER_FEATURE_PARSE";
  }
  if (message.includes("bbox") || message.includes("περιοχή")) return "WATER_BBOX";

  return "WATER_SEGMENT_UNKNOWN";
}

function shouldUseProductionBlobSource() {
  return process.env.VERCEL === "1" && Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function getPrivateBlobToken() {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();

  if (!token) {
    throw waterSegmentError(
      "WATER_BLOB_TOKEN",
      "Private water blob token is not configured.",
    );
  }

  return token;
}

function parseNumber(value: string | null, label: string) {
  if (!value) throw new Error(`Missing ${label}`);

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) throw new Error(`Invalid ${label}`);

  return parsed;
}

async function readPrivateBlobBuffer(pathname: string) {
  const result = await get(pathname, {
    access: "private",
    token: getPrivateBlobToken(),
  });

  if (!result || result.statusCode !== 200 || !result.stream) {
    throw new Error(`Private water blob read failed: ${pathname}`);
  }

  const reader = result.stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const next = await reader.read();

    if (next.done) break;

    chunks.push(next.value);
    total += next.value.byteLength;
  }

  const output = Buffer.alloc(total);
  let offset = 0;

  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return output;
}

async function readTextSource(localPath: string, blobPath: string) {
  if (shouldUseProductionBlobSource()) {
    return (await readPrivateBlobBuffer(blobPath)).toString("utf8");
  }

  return fs.readFile(localPath, "utf8");
}

async function readJsonSource<T>(localPath: string, blobPath: string): Promise<T> {
  const raw = await readTextSource(localPath, blobPath);
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

  if (manifest.indexRecordCount <= 0 || manifest.indexRecordCount > EXPECTED_PLACEMARKS) {
    throw new Error(`Water index gate failed: indexRecordCount ${manifest.indexRecordCount}`);
  }

  if (manifest.indexedFeatureCount !== manifest.indexRecordCount) {
    throw new Error(
      `Water index gate failed: indexedFeatureCount ${manifest.indexedFeatureCount} != indexRecordCount ${manifest.indexRecordCount}`,
    );
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
    readJsonSource<WaterTruthReport>(TRUTH_REPORT_PATH, BLOB_PATHS.truthReport),
    readJsonSource<WaterIndexManifest>(MANIFEST_PATH, BLOB_PATHS.manifest),
  ]);

  assertTruthReport(truthReport);
  assertIndexManifest(indexManifest);

  cachedManifest = indexManifest;
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

  const raw = await readTextSource(INDEX_PATH, BLOB_PATHS.index);
  const index = JSON.parse(raw) as IndexRecord[];

  if (index.length <= 0 || index.length > EXPECTED_PLACEMARKS) {
    throw new Error(`Water index gate failed: runtime index length ${index.length}`);
  }

  cachedIndex = index;

  return cachedIndex;
}

async function getNdjsonMetadata() {
  if (!cachedNdjsonMetadata) {
    cachedNdjsonMetadata = await head(BLOB_PATHS.ndjson, {
      token: getPrivateBlobToken(),
    });
  }

  if (
    cachedNdjsonMetadata.size <= 0 ||
    !cachedNdjsonMetadata.url.startsWith("https://")
  ) {
    throw waterSegmentError(
      "WATER_BLOB_METADATA",
      "Private water NDJSON blob metadata is invalid.",
    );
  }

  return cachedNdjsonMetadata;
}

function assertContentRange(
  contentRange: string | null,
  start: number,
  end: number,
  totalSize: number,
) {
  const match = contentRange?.match(/^bytes\s+(\d+)-(\d+)\/(\d+)$/i);

  if (
    !match ||
    Number(match[1]) !== start ||
    Number(match[2]) !== end ||
    Number(match[3]) !== totalSize
  ) {
    throw waterSegmentError(
      "WATER_RANGE_INVALID",
      "Private water blob returned an invalid byte range.",
    );
  }
}

async function streamToBuffer(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const next = await reader.read();

    if (next.done) break;

    chunks.push(next.value);
    total += next.value.byteLength;
  }

  const output = Buffer.alloc(total);
  let offset = 0;

  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return output;
}

function featureCacheKey(record: IndexRecord) {
  return `${record.offset}:${record.bytes}`;
}

function readCachedFeature(record: IndexRecord) {
  const key = featureCacheKey(record);
  const feature = cachedFeatures.get(key);

  if (feature === undefined) return undefined;

  cachedFeatures.delete(key);
  cachedFeatures.set(key, feature);

  return feature;
}

function cacheFeature(record: IndexRecord, feature: unknown) {
  const key = featureCacheKey(record);

  cachedFeatures.delete(key);
  cachedFeatures.set(key, feature);

  while (cachedFeatures.size > FEATURE_CACHE_MAX_ENTRIES) {
    const oldest = cachedFeatures.keys().next().value;

    if (typeof oldest !== "string") break;
    cachedFeatures.delete(oldest);
  }
}

async function fetchPrivateRange(
  batch: PrivateWaterRangeBatch,
  metadata: HeadBlobResult,
) {
  const result = await get(BLOB_PATHS.ndjson, {
    access: "private",
    token: getPrivateBlobToken(),
    headers: {
      Range: `bytes=${batch.start}-${batch.end}`,
    },
    abortSignal: AbortSignal.timeout(RANGE_READ_TIMEOUT_MS),
  });

  if (!result || result.statusCode !== 200 || !result.stream) {
    throw waterSegmentError(
      "WATER_RANGE_READ",
      "Private water blob range read failed.",
    );
  }

  assertContentRange(
    result.headers.get("content-range"),
    batch.start,
    batch.end,
    metadata.size,
  );

  const buffer = await streamToBuffer(result.stream);
  const expectedBytes = batch.end - batch.start + 1;

  if (buffer.byteLength !== expectedBytes) {
    throw waterSegmentError(
      "WATER_RANGE_SIZE",
      "Private water blob range returned an unexpected byte count.",
    );
  }

  return batch.selected.map(({ order, record }) => {
    const relativeStart = record.offset - batch.start;
    const relativeEnd = relativeStart + record.bytes;

    if (relativeStart < 0 || relativeEnd > buffer.byteLength) {
      throw waterSegmentError(
        "WATER_RANGE_OFFSETS",
        "Private water feature range is outside the fetched batch.",
      );
    }

    return {
      order,
      record,
      feature: JSON.parse(buffer.subarray(relativeStart, relativeEnd).toString("utf8")),
    };
  });
}

async function readPrivateFeaturesByRange(records: IndexRecord[]) {
  if (records.length === 0) return [];

  const metadata = await getNdjsonMetadata();
  const output = new Array<unknown>(records.length).fill(undefined);
  const missingRecords: IndexRecord[] = [];
  const missingOrders: number[] = [];

  records.forEach((record, order) => {
    assertPrivateWaterIndexRecordRange(record, metadata.size);

    const cached = readCachedFeature(record);

    if (cached !== undefined) {
      output[order] = cached;
      return;
    }

    missingRecords.push(record);
    missingOrders.push(order);
  });

  const batches = buildPrivateWaterRangeBatches(missingRecords, metadata.size);

  for (let index = 0; index < batches.length; index += RANGE_FETCH_CONCURRENCY) {
    const wave = batches.slice(index, index + RANGE_FETCH_CONCURRENCY);
    const entries = (await Promise.all(
      wave.map((batch) => fetchPrivateRange(batch, metadata)),
    )).flat();

    for (const entry of entries) {
      const originalOrder = missingOrders[entry.order];

      output[originalOrder] = entry.feature;
      cacheFeature(entry.record, entry.feature);
    }
  }

  if (output.some((feature) => feature === undefined)) {
    throw new Error("Private water feature range read was incomplete.");
  }

  return output;
}

async function readPrivateFeaturesByStream(records: IndexRecord[]) {
  const metadata = await getNdjsonMetadata();
  const output = new Array<unknown>(records.length).fill(undefined);
  const missingRecords: IndexRecord[] = [];
  const missingOrders: number[] = [];

  records.forEach((record, order) => {
    const cached = readCachedFeature(record);

    if (cached !== undefined) {
      output[order] = cached;
      return;
    }

    missingRecords.push(record);
    missingOrders.push(order);
  });

  if (missingRecords.length === 0) return output;

  const result = await get(BLOB_PATHS.ndjson, {
    access: "private",
    token: getPrivateBlobToken(),
    abortSignal: AbortSignal.timeout(STREAM_FALLBACK_TIMEOUT_MS),
  });

  if (!result || result.statusCode !== 200 || !result.stream) {
    throw waterSegmentError(
      "WATER_STREAM_READ",
      "Private water stream fallback could not open the NDJSON source.",
    );
  }

  const features = await extractPrivateWaterFeaturesFromStream(
    result.stream,
    missingRecords,
    metadata.size,
  );

  features.forEach((feature, order) => {
    output[missingOrders[order]] = feature;
    cacheFeature(missingRecords[order], feature);
  });

  return output;
}

async function readFeatures(records: IndexRecord[]) {
  if (shouldUseProductionBlobSource()) {
    try {
      return await readPrivateFeaturesByRange(records);
    } catch (rangeError) {
      try {
        return await readPrivateFeaturesByStream(records);
      } catch (streamError) {
        throw waterSegmentError(
          "WATER_PRIVATE_READ_FAILED",
          `Range=${getWaterSegmentDiagnosticCode(rangeError)}; Stream=${getWaterSegmentDiagnosticCode(streamError)}`,
        );
      }
    }
  }

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

  const index = await readIndex();
  const manifest =
    cachedManifest ||
    (await readJsonSource<WaterIndexManifest>(MANIFEST_PATH, BLOB_PATHS.manifest));

  assertIndexManifest(manifest);

  const matches = index.filter((record) => intersects(record, bbox));
  const selected = matches.slice(0, maxFeatures);
  const features = await readFeatures(selected);

  const sourceMode = shouldUseProductionBlobSource()
    ? "verified_private_blob_index_from_authentic_kmz"
    : "verified_private_index_from_authentic_kmz";

  return {
    marker: "pantavion_verified_private_water_segment_v1",
    status: "controlled_segment_ready",
    bbox,
    sourceMode,
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
