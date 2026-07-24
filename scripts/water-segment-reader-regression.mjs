#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";

import {
  buildPrivateWaterRangeBatches,
  extractPrivateWaterFeaturesFromStream,
} from "../core/infrastructure/water/private-water-segment-reader.ts";

const PROVIDER_PATH =
  "core/infrastructure/water/controlled-water-segment-index-provider.ts";
const ROUTE_PATH =
  "app/api/professional/infrastructure/water/segment/bbox/route.ts";
const CLIENT_PATH =
  "app/professional/infrastructure/water/live/controlled-water-segment-client.tsx";

function pass(message) {
  console.log(`[PASS] ${message}`);
}

function makeRecord(featureIndex, offset, bytes) {
  return {
    featureIndex,
    offset,
    bytes,
    minLng: 33.0,
    minLat: 34.6,
    maxLng: 33.01,
    maxLat: 34.61,
  };
}

function buildSyntheticNdjson() {
  const features = [
    {
      type: "Feature",
      id: "pipe-0",
      properties: { label: "Λεμεσός α" },
      geometry: { type: "LineString", coordinates: [[33.01, 34.61], [33.02, 34.62]] },
    },
    {
      type: "Feature",
      id: "pipe-1",
      properties: { label: "αγωγός β" },
      geometry: { type: "LineString", coordinates: [[33.02, 34.62], [33.03, 34.63]] },
    },
    {
      type: "Feature",
      id: "pipe-2",
      properties: { label: "βαλβίδα γ" },
      geometry: { type: "Point", coordinates: [33.04, 34.64] },
    },
    {
      type: "Feature",
      id: "pipe-3",
      properties: { label: "γραμμή δ" },
      geometry: { type: "LineString", coordinates: [[33.04, 34.64], [33.05, 34.65]] },
    },
    {
      type: "Feature",
      id: "pipe-4",
      properties: { label: "ασφαλές τμήμα ε" },
      geometry: { type: "LineString", coordinates: [[33.05, 34.65], [33.06, 34.66]] },
    },
    {
      type: "Feature",
      id: "tail-not-requested",
      properties: { label: "δεν πρέπει να χρειαστεί ολόκληρο το αρχείο" },
      geometry: { type: "Point", coordinates: [33.07, 34.67] },
    },
  ];
  const buffers = features.map((feature) =>
    Buffer.from(`${JSON.stringify(feature)}\n`, "utf8"),
  );
  const records = [];
  let offset = 0;

  buffers.forEach((buffer, featureIndex) => {
    records.push(makeRecord(featureIndex, offset, buffer.byteLength - 1));
    offset += buffer.byteLength;
  });

  return {
    features,
    records,
    source: Buffer.concat(buffers),
  };
}

function streamBufferInAwkwardChunks(buffer, state, maxBytes = buffer.byteLength) {
  const chunkSizes = [1, 2, 5, 3, 11, 7, 19, 4, 13];
  let offset = 0;
  let chunkIndex = 0;

  return new ReadableStream({
    pull(controller) {
      if (offset >= maxBytes) {
        controller.close();
        return;
      }

      const size = chunkSizes[chunkIndex % chunkSizes.length];
      const end = Math.min(offset + size, maxBytes);

      controller.enqueue(buffer.subarray(offset, end));
      offset = end;
      chunkIndex += 1;
      state.bytesRead = offset;
    },
    cancel() {
      state.cancelled = true;
    },
  });
}

async function verifySelectiveStreamFallback() {
  const fixture = buildSyntheticNdjson();
  const state = { cancelled: false, bytesRead: 0 };
  const selectedRecords = [
    fixture.records[4],
    fixture.records[0],
    fixture.records[2],
  ];
  const stream = streamBufferInAwkwardChunks(fixture.source, state);
  const result = await extractPrivateWaterFeaturesFromStream(
    stream,
    selectedRecords,
    fixture.source.byteLength,
  );

  assert.deepEqual(
    result.map((feature) => feature.id),
    ["pipe-4", "pipe-0", "pipe-2"],
  );
  assert.equal(result[0].properties.label, "ασφαλές τμήμα ε");
  assert.equal(state.cancelled, true);
  assert.ok(
    state.bytesRead < fixture.source.byteLength,
    "selective fallback must stop before the unrequested tail",
  );

  pass("selective stream fallback preserves record order and Unicode bytes");
  pass("selective stream fallback stops before reading the complete private source");

  const truncatedAt =
    fixture.records[2].offset + fixture.records[2].bytes - 1;
  const incompleteStream = streamBufferInAwkwardChunks(
    fixture.source,
    { cancelled: false, bytesRead: 0 },
    truncatedAt,
  );

  await assert.rejects(
    () =>
      extractPrivateWaterFeaturesFromStream(
        incompleteStream,
        [fixture.records[2]],
        fixture.source.byteLength,
      ),
    /\[WATER_STREAM_INCOMPLETE\]/,
  );

  pass("truncated private stream fails closed with a stable diagnostic code");
}

function verifySingleRangeBatching() {
  const records = [
    makeRecord(0, 20, 4),
    makeRecord(1, 2, 5),
    makeRecord(2, 66, 3),
    makeRecord(3, 150, 4),
  ];
  const batches = buildPrivateWaterRangeBatches(records, 200, 64);

  assert.deepEqual(
    batches.map(({ start, end }) => ({ start, end })),
    [
      { start: 2, end: 23 },
      { start: 66, end: 68 },
      { start: 150, end: 153 },
    ],
  );
  assert.deepEqual(
    batches[0].selected.map(({ order }) => order),
    [1, 0],
  );
  assert.throws(
    () => buildPrivateWaterRangeBatches([makeRecord(9, 198, 5)], 200, 64),
    /\[WATER_INDEX_RANGE\]/,
  );

  pass("range batches use one bounded contiguous byte range per window");
  pass("out-of-source index offsets fail closed");
}

function verifyRuntimeWiring() {
  const provider = fs.readFileSync(PROVIDER_PATH, "utf8");
  const route = fs.readFileSync(ROUTE_PATH, "utf8");
  const client = fs.readFileSync(CLIENT_PATH, "utf8");

  assert.match(provider, /from "\.\/private-water-segment-reader"/);
  assert.match(
    provider,
    /return await readPrivateFeaturesByRange\(records\);[\s\S]*catch \(rangeError\)[\s\S]*return await readPrivateFeaturesByStream\(records\);/,
  );
  assert.match(provider, /Range: `bytes=\$\{batch\.start\}-\$\{batch\.end\}`/);
  assert.doesNotMatch(provider, /Range:[^\n]+,[^\n]+/);
  assert.match(provider, /"WATER_PRIVATE_READ_FAILED"/);

  assert.match(route, /authorizeWaterSegmentRequest/);
  assert.match(route, /status: 403/);
  assert.match(route, /error: "water_segment_unavailable"/);
  assert.match(route, /"X-Pantavion-Water-Diagnostic"/);
  assert.match(route, /completeNetworkReturned: false/);
  assert.match(route, /rawMasterReturned: false/);

  assert.match(client, /map\.on\("moveend zoomend", scheduleAutoLoad\)/);
  assert.match(client, /WATER_NO_VISIBLE_FEATURES/);
  assert.match(client, /WATER_CLIENT_LOAD/);
  assert.match(
    client,
    /\/api\/professional\/infrastructure\/water\/segment\/bbox/,
  );

  pass("production provider is wired range-first with selective stream fallback");
  pass("route remains authorization-gated and fails without exposing source data");
  pass("mobile client retains automatic loading and visible diagnostics");
}

async function main() {
  console.log("=== Pantavion Water Segment Reader Regression Gate ===");
  verifySingleRangeBatching();
  await verifySelectiveStreamFallback();
  verifyRuntimeWiring();
  console.log("Pantavion water segment reader regression gate PASSED.");
}

main().catch((error) => {
  console.error("[FAIL]", error);
  process.exit(1);
});
