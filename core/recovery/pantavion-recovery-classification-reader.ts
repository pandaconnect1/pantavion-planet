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
  selectedModule: string | null;
  selectedStatus: string | null;
  query: string;
  filteredRecords: number;
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
  requestedModule?: string | null,
  requestedStatus?: string | null,
  requestedQuery?: string | null,
): Promise<RecoveryClassificationPage> {
  const manifest = await readJson<CorpusManifest>(path.join(CORPUS_ROOT, "manifest.json"));
  if (manifest.totalRecords !== TOTAL_RECORDS) {
    throw new Error(`recovery_classification_count_mismatch:${manifest.totalRecords}`);
  }

  const selectedModule = requestedModule && manifest.moduleCounts[requestedModule]
    ? requestedModule
    : null;
  const selectedStatus = requestedStatus && manifest.reviewCounts[requestedStatus]
    ? requestedStatus
    : null;
  const query = (requestedQuery ?? "").trim().slice(0, 120);
  const normalizedQuery = query.toLocaleLowerCase("el-GR");
  const records: CorpusRecord[] = [];

  for (const batch of manifest.batches) {
    if (selectedModule && !(batch.moduleCounts?.[selectedModule] ?? 0)) continue;
    const batchFile = await readJson<BatchFile>(
      path.join(CORPUS_ROOT, "batches", `${batch.batchId}.json`),
    );
    records.push(...batchFile.records.filter((record) => {
      if (selectedModule && record.classification?.module !== selectedModule) return false;
      if (selectedStatus && record.reviewStatus !== selectedStatus) return false;
      if (!normalizedQuery) return true;
      const searchable = [record.id, record.text, record.reviewStatus,
        record.classification?.module, record.classification?.subsystem,
        record.classification?.capability, record.classification?.canonicalTarget,
        record.provenance?.sourceFile].filter(Boolean).join(" ").toLocaleLowerCase("el-GR");
      return searchable.includes(normalizedQuery);
    }));
  }

  records.sort((left, right) => left.ordinal - right.ordinal);
  const filteredRecords = records.length;
  const totalPages = Math.max(1, Math.ceil(filteredRecords / PAGE_SIZE));
  const parsedPage = safePage(requestedPage);
  const page = Math.min(parsedPage, totalPages);
  const offset = (page - 1) * PAGE_SIZE;
  const pageRecords = records.slice(offset, offset + PAGE_SIZE);
  const startOrdinal = filteredRecords ? offset + 1 : 0;
  const endOrdinal = offset + pageRecords.length;
  if (pageRecords.length !== Math.min(PAGE_SIZE, Math.max(0, filteredRecords - offset))) {
    throw new Error(`recovery_classification_page_gap:${pageRecords.length}`);
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
    totalPages,
    startOrdinal,
    endOrdinal,
    moduleCounts: manifest.moduleCounts,
    sourceCounts: manifest.sourceCounts,
    reviewCounts: manifest.reviewCounts,
    moduleStartPages,
    rows: pageRecords.map(summarize),
    selectedModule,
    selectedStatus,
    query,
    filteredRecords,
  };
}
