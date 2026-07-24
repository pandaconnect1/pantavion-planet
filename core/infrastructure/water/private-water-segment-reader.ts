export type PrivateWaterIndexRecord = {
  featureIndex: number;
  offset: number;
  bytes: number;
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
};

export type PrivateWaterSelectedIndexRecord = {
  order: number;
  record: PrivateWaterIndexRecord;
};

export type PrivateWaterRangeBatch = {
  start: number;
  end: number;
  selected: PrivateWaterSelectedIndexRecord[];
};

export const PRIVATE_WATER_RANGE_WINDOW_BYTES = 8 * 1024 * 1024;

function readerError(code: string, message: string) {
  return new Error(`[${code}] ${message}`);
}

export function privateWaterRecordEnd(record: PrivateWaterIndexRecord) {
  return record.offset + record.bytes - 1;
}

export function assertPrivateWaterIndexRecordRange(
  record: PrivateWaterIndexRecord,
  sourceSize: number,
) {
  const end = privateWaterRecordEnd(record);

  if (
    !Number.isSafeInteger(sourceSize) ||
    sourceSize <= 0 ||
    !Number.isSafeInteger(record.offset) ||
    !Number.isSafeInteger(record.bytes) ||
    record.offset < 0 ||
    record.bytes <= 0 ||
    end < record.offset ||
    end >= sourceSize
  ) {
    throw readerError(
      "WATER_INDEX_RANGE",
      "Private water index requested bytes outside the NDJSON source.",
    );
  }
}

export function buildPrivateWaterRangeBatches(
  records: PrivateWaterIndexRecord[],
  sourceSize: number,
  rangeWindowBytes = PRIVATE_WATER_RANGE_WINDOW_BYTES,
): PrivateWaterRangeBatch[] {
  if (
    !Number.isSafeInteger(sourceSize) ||
    sourceSize <= 0 ||
    !Number.isSafeInteger(rangeWindowBytes) ||
    rangeWindowBytes <= 0
  ) {
    throw readerError(
      "WATER_BLOB_METADATA",
      "Private water NDJSON blob metadata is invalid.",
    );
  }

  const selected = records
    .map((record, order) => ({ order, record }))
    .sort((a, b) => a.record.offset - b.record.offset);
  const batches = new Map<number, PrivateWaterRangeBatch>();

  for (const item of selected) {
    assertPrivateWaterIndexRecordRange(item.record, sourceSize);

    const window = Math.floor(item.record.offset / rangeWindowBytes);
    const end = privateWaterRecordEnd(item.record);
    const existing = batches.get(window);

    if (existing) {
      existing.start = Math.min(existing.start, item.record.offset);
      existing.end = Math.max(existing.end, end);
      existing.selected.push(item);
      continue;
    }

    batches.set(window, {
      start: item.record.offset,
      end,
      selected: [item],
    });
  }

  return Array.from(batches.values()).sort((a, b) => a.start - b.start);
}

export async function extractPrivateWaterFeaturesFromStream(
  stream: ReadableStream<Uint8Array>,
  records: PrivateWaterIndexRecord[],
  sourceSize: number,
) {
  if (records.length === 0) return [];

  const selected = records
    .map((record, order) => {
      assertPrivateWaterIndexRecordRange(record, sourceSize);

      return {
        order,
        record,
        buffer: Buffer.alloc(record.bytes),
        filled: 0,
      };
    })
    .sort((a, b) => a.record.offset - b.record.offset);
  const output = new Array<unknown>(records.length).fill(undefined);
  const reader = stream.getReader();
  let absoluteOffset = 0;
  let selectedIndex = 0;

  try {
    while (selectedIndex < selected.length) {
      const next = await reader.read();

      if (next.done) break;

      const chunk = next.value;
      const chunkStart = absoluteOffset;
      const chunkEnd = chunkStart + chunk.byteLength;

      while (selectedIndex < selected.length) {
        const item = selected[selectedIndex];
        const recordStart = item.record.offset;
        const recordEndExclusive = item.record.offset + item.record.bytes;

        if (recordStart >= chunkEnd) break;

        if (recordEndExclusive <= chunkStart) {
          throw readerError(
            "WATER_STREAM_OFFSETS",
            "Private water stream passed an incomplete indexed feature.",
          );
        }

        const overlapStart = Math.max(recordStart, chunkStart);
        const overlapEnd = Math.min(recordEndExclusive, chunkEnd);

        if (overlapEnd > overlapStart) {
          const sourceStart = overlapStart - chunkStart;
          const sourceEnd = overlapEnd - chunkStart;
          const targetStart = overlapStart - recordStart;

          item.buffer.set(chunk.subarray(sourceStart, sourceEnd), targetStart);
          item.filled += overlapEnd - overlapStart;
        }

        if (overlapEnd < recordEndExclusive) break;

        if (item.filled !== item.record.bytes) {
          throw readerError(
            "WATER_STREAM_SIZE",
            "Private water stream returned an incomplete feature.",
          );
        }

        output[item.order] = JSON.parse(item.buffer.toString("utf8"));
        selectedIndex += 1;
      }

      absoluteOffset = chunkEnd;
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }

  if (output.some((feature) => feature === undefined)) {
    throw readerError(
      "WATER_STREAM_INCOMPLETE",
      "Private water stream ended before all selected features were read.",
    );
  }

  return output;
}
