// core/commercial/revenue-ledger.ts

export type PantavionRevenueEntryKind =
  | 'recognized-revenue'
  | 'deferred-revenue'
  | 'refund-adjustment';

export interface PantavionRevenueLedgerEntry {
  revenueEntryId: string;
  sourcePaymentEventId?: string;
  kind: PantavionRevenueEntryKind;
  amountCents: number;
  currency: string;
  createdAt: string;
  notes: string[];
}

export interface PantavionRevenueLedgerInput {
  sourcePaymentEventId?: string;
  kind: PantavionRevenueEntryKind;
  amountCents: number;
  currency: string;
  notes?: string[];
}

export interface PantavionRevenueLedgerSnapshot {
  generatedAt: string;
  revenueEntryCount: number;
  recognizedRevenueCents: number;
  deferredRevenueCents: number;
  refundAdjustmentCents: number;
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

export class PantavionRevenueLedger {
  private readonly entries: PantavionRevenueLedgerEntry[] = [];

  appendEntry(input: PantavionRevenueLedgerInput): PantavionRevenueLedgerEntry {
    const record: PantavionRevenueLedgerEntry = {
      revenueEntryId: createId('rev'),
      sourcePaymentEventId: input.sourcePaymentEventId,
      kind: input.kind,
      amountCents: input.amountCents,
      currency: input.currency,
      createdAt: nowIso(),
      notes: cloneValue(input.notes ?? []),
    };

    this.entries.unshift(record);
    return cloneValue(record);
  }

  listEntries(): PantavionRevenueLedgerEntry[] {
    return this.entries.map((item) => cloneValue(item));
  }

  getSnapshot(): PantavionRevenueLedgerSnapshot {
    const entries = this.listEntries();

    return {
      generatedAt: nowIso(),
      revenueEntryCount: entries.length,
      recognizedRevenueCents: entries
        .filter((item) => item.kind === 'recognized-revenue')
        .reduce((sum, item) => sum + item.amountCents, 0),
      deferredRevenueCents: entries
        .filter((item) => item.kind === 'deferred-revenue')
        .reduce((sum, item) => sum + item.amountCents, 0),
      refundAdjustmentCents: entries
        .filter((item) => item.kind === 'refund-adjustment')
        .reduce((sum, item) => sum + item.amountCents, 0),
    };
  }

  clear(): void {
    this.entries.length = 0;
  }
}

export function createRevenueLedger(): PantavionRevenueLedger {
  return new PantavionRevenueLedger();
}

export const revenueLedger = createRevenueLedger();

export function appendRevenueEntry(
  input: PantavionRevenueLedgerInput,
): PantavionRevenueLedgerEntry {
  return revenueLedger.appendEntry(input);
}

export function listRevenueEntries(): PantavionRevenueLedgerEntry[] {
  return revenueLedger.listEntries();
}

export function getRevenueLedgerSnapshot(): PantavionRevenueLedgerSnapshot {
  return revenueLedger.getSnapshot();
}

export default revenueLedger;
