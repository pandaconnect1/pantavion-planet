// core/storage/kernel-report-store.ts

import {
  runKernelFoundationReport,
  type PantavionKernelFoundationReport,
} from '../kernel/kernel-foundation-report';

import {
  runKernelFinalClosureReport,
  type PantavionKernelFinalClosureReport,
} from '../kernel/kernel-final-closure-report';

export type PantavionKernelStoredReportKind = 'foundation' | 'closure';

export interface PantavionKernelReportStoreRecord {
  reportId: string;
  savedAt: string;
  kind: PantavionKernelStoredReportKind;
  report: PantavionKernelFoundationReport | PantavionKernelFinalClosureReport;
}

export interface PantavionKernelReportStoreSnapshot {
  generatedAt: string;
  entryCount: number;
  foundationCount: number;
  closureCount: number;
  latestReportId?: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function createId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${random}`;
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export class PantavionKernelReportStore {
  private readonly records: PantavionKernelReportStoreRecord[] = [];

  saveFoundationReport(
    report: PantavionKernelFoundationReport,
  ): PantavionKernelReportStoreRecord {
    const record: PantavionKernelReportStoreRecord = {
      reportId: createId('kfr'),
      savedAt: nowIso(),
      kind: 'foundation',
      report: cloneValue(report),
    };

    this.records.unshift(record);
    return cloneValue(record);
  }

  saveClosureReport(
    report: PantavionKernelFinalClosureReport,
  ): PantavionKernelReportStoreRecord {
    const record: PantavionKernelReportStoreRecord = {
      reportId: createId('kcr'),
      savedAt: nowIso(),
      kind: 'closure',
      report: cloneValue(report),
    };

    this.records.unshift(record);
    return cloneValue(record);
  }

  async generateAndSaveFoundationReport(): Promise<PantavionKernelReportStoreRecord> {
    const report = await runKernelFoundationReport();
    return this.saveFoundationReport(report);
  }

  async generateAndSaveClosureReport(): Promise<PantavionKernelReportStoreRecord> {
    const report = await runKernelFinalClosureReport();
    return this.saveClosureReport(report);
  }

  listRecords(): PantavionKernelReportStoreRecord[] {
    return this.records.map((record) => cloneValue(record));
  }

  getSnapshot(): PantavionKernelReportStoreSnapshot {
    const foundationCount = this.records.filter((record) => record.kind === 'foundation').length;
    const closureCount = this.records.filter((record) => record.kind === 'closure').length;

    return {
      generatedAt: nowIso(),
      entryCount: this.records.length,
      foundationCount,
      closureCount,
      latestReportId: this.records[0]?.reportId,
    };
  }

  clear(): void {
    this.records.length = 0;
  }
}

export function createKernelReportStore(): PantavionKernelReportStore {
  return new PantavionKernelReportStore();
}

export const kernelReportStore = createKernelReportStore();

export function getKernelReportStoreSnapshot(): PantavionKernelReportStoreSnapshot {
  return kernelReportStore.getSnapshot();
}

export function listKernelReports(): PantavionKernelReportStoreRecord[] {
  return kernelReportStore.listRecords();
}

export async function generateAndStoreFoundationReport(): Promise<PantavionKernelReportStoreRecord> {
  return kernelReportStore.generateAndSaveFoundationReport();
}

export async function generateAndStoreClosureReport(): Promise<PantavionKernelReportStoreRecord> {
  return kernelReportStore.generateAndSaveClosureReport();
}

export default kernelReportStore;
