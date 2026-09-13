import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

const CORPUS_ROOT = path.join(
  process.cwd(),
  "data/recovery/imported-pr248/canonical-ledger/corpus",
);

const PAGE_SIZE = 50;
const TOTAL_RECORDS = 82_413;

type BatchManifest = {
  batchId: string;
  startOrdinal: number;
  endOrdinal: number;
  recordCount: number;
  moduleCounts?: Record<string, number>;
};

type CorpusManifest = {
  totalRecords: number;
  totalBatches: number;
  corpusFingerprint: string;
  sourceCounts: Record<string, number>;
  moduleCounts: Record<string, number>;
  reviewCounts: Record<string, number>;
  batches: BatchManifest[];
};

type CorpusRecord = {
  id: string;
  ordinal: number;
  text?: string | null;
  reviewStatus?: string | null;
  provenance?: {
    sourceFamily?: string | null;
    sourceFile?: string | null;
    sourceLine?: number | null;
    sourceRef?: string | null;
  };
  classification?: {
    module?: string | null;
    subsystem?: string | null;
    capability?: string | null;
    feature?: string | null;
    layer?: string | null;
    recoveryState?: string | null;
    decision?: string | null;
    liveState?: string | null;
    canonicalTarget?: string | null;
    nextAction?: string | null;
  };
};

type BatchFile = { records: CorpusRecord[] };

export type RecoveryClassificationRow = {
  id: string;
  ordinal: number;
  module: string;
  subsystem: string;
  capability: string;
  reviewStatus: string;
  decision: string;
  liveState: string;
  sourceFamily: string;
  sourceLocation: string;
  canonicalTarget: string;
  preview: string;
};

export type RecoveryClassificationPage = {
  corpusFingerprint: string;
  totalRecords: number;
  totalBatches: number;
  page: number;
  pageSize: number;
  totalPages: number;
  startOrdinal: number;
  endOrdinal: number;
  moduleCounts: Record<string, number>;
  sourceCounts: Record<string, number>;
  reviewCounts: Record<string, number>;
  moduleStartPages: Record<string, number>;
  rows: RecoveryClassificationRow[];
};

function safePage(value: string | null | undefined): number {
  const parsed = Number.parseInt(value ?? "1", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.min(parsed, Math.ceil(TOTAL_RECORDS / PAGE_SIZE));
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, "utf8")) as T;
}

function summarize(record: CorpusRecord): RecoveryClassificationRow {
  const classification = record.classification ?? {};
  const provenance = record.provenance ?? {};
  const sourceLocation = [
    provenance.sourceFile ?? "unknown-source",
    provenance.sourceLine ? `:${provenance.sourceLine}` : "",
  ].join("");

  return {
    id: record.id,
    ordinal: record.ordinal,
    module: classification.module ?? "UNCLASSIFIED",
    subsystem: classification.subsystem ?? "—",
    capability: classification.capability ?? "—",
    reviewStatus: record.reviewStatus ?? "UNKNOWN",
    decision: classification.decision ?? "UNKNOWN",
    liveState: classification.liveState ?? "UNVERIFIED",
    sourceFamily: provenance.sourceFamily ?? "unknown",
    sourceLocation,
    canonicalTarget: classification.canonicalTarget ?? "—",
    preview: (record.text ?? "").replace(/\s+/g, " ").trim().slice(0, 220),
  };
}

export async function loadRecoveryClassificationPage(
  requestedPage?: string | null,
): Promise<RecoveryClassificationPage> {
  const manifest = await readJson<CorpusManifest>(path.join(CORPUS_ROOT, "manifest.json"));
  if (manifest.totalRecords !== TOTAL_RECORDS) {
    throw new Error(`recovery_classification_count_mismatch:${manifest.totalRecords}`);
  }

  const page = safePage(requestedPage);
  const startOrdinal = (page - 1) * PAGE_SIZE + 1;
  const endOrdinal = Math.min(startOrdinal + PAGE_SIZE - 1, manifest.totalRecords);
  const relevantBatches = manifest.batches.filter(
    (batch) => batch.endOrdinal >= startOrdinal && batch.startOrdinal <= endOrdinal,
  );
  const records: CorpusRecord[] = [];

  for (const batch of relevantBatches) {
    const batchFile = await readJson<BatchFile>(
      path.join(CORPUS_ROOT, "batches", `${batch.batchId}.json`),
    );
    records.push(
      ...batchFile.records.filter(
        (record) => record.ordinal >= startOrdinal && record.ordinal <= endOrdinal,
      ),
    );
  }

  records.sort((left, right) => left.ordinal - right.ordinal);
  if (records.length !== endOrdinal - startOrdinal + 1) {
    throw new Error(`recovery_classification_page_gap:${records.length}`);
  }

  const moduleStartPages = Object.fromEntries(
    Object.keys(manifest.moduleCounts).map((module) => {
      const firstBatch = manifest.batches.find((batch) => (batch.moduleCounts?.[module] ?? 0) > 0);
      return [module, firstBatch ? Math.floor((firstBatch.startOrdinal - 1) / PAGE_SIZE) + 1 : 1];
    }),
  );

  return {
    corpusFingerprint: manifest.corpusFingerprint,
    totalRecords: manifest.totalRecords,
    totalBatches: manifest.totalBatches,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil(manifest.totalRecords / PAGE_SIZE),
    startOrdinal,
    endOrdinal,
    moduleCounts: manifest.moduleCounts,
    sourceCounts: manifest.sourceCounts,
    reviewCounts: manifest.reviewCounts,
    moduleStartPages,
    rows: records.map(summarize),
  };
}
