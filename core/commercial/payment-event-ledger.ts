// core/commercial/payment-event-ledger.ts

export type PantavionPaymentEventStatus =
  | 'initiated'
  | 'authorized'
  | 'captured'
  | 'failed'
  | 'refunded';

export interface PantavionPaymentEventRecord {
  paymentEventId: string;
  userId: string;
  planKey: string;
  billingRailKey: string;
  amountCents: number;
  currency: string;
  status: PantavionPaymentEventStatus;
  createdAt: string;
  metadata: Record<string, unknown>;
}

export interface PantavionPaymentEventInput {
  userId: string;
  planKey: string;
  billingRailKey: string;
  amountCents: number;
  currency: string;
  status: PantavionPaymentEventStatus;
  metadata?: Record<string, unknown>;
}

export interface PantavionPaymentEventLedgerSnapshot {
  generatedAt: string;
  paymentEventCount: number;
  capturedCount: number;
  failedCount: number;
  refundedCount: number;
  grossCapturedCents: number;
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

export class PantavionPaymentEventLedger {
  private readonly events: PantavionPaymentEventRecord[] = [];

  appendEvent(input: PantavionPaymentEventInput): PantavionPaymentEventRecord {
    const record: PantavionPaymentEventRecord = {
      paymentEventId: createId('pay'),
      userId: input.userId,
      planKey: input.planKey,
      billingRailKey: input.billingRailKey,
      amountCents: input.amountCents,
      currency: input.currency,
      status: input.status,
      createdAt: nowIso(),
      metadata: cloneValue(input.metadata ?? {}),
    };

    this.events.unshift(record);
    return cloneValue(record);
  }

  listEvents(): PantavionPaymentEventRecord[] {
    return this.events.map((item) => cloneValue(item));
  }

  getSnapshot(): PantavionPaymentEventLedgerSnapshot {
    const events = this.listEvents();
    const grossCapturedCents = events
      .filter((item) => item.status === 'captured')
      .reduce((sum, item) => sum + item.amountCents, 0);

    return {
      generatedAt: nowIso(),
      paymentEventCount: events.length,
      capturedCount: events.filter((item) => item.status === 'captured').length,
      failedCount: events.filter((item) => item.status === 'failed').length,
      refundedCount: events.filter((item) => item.status === 'refunded').length,
      grossCapturedCents,
    };
  }

  clear(): void {
    this.events.length = 0;
  }
}

export function createPaymentEventLedger(): PantavionPaymentEventLedger {
  return new PantavionPaymentEventLedger();
}

export const paymentEventLedger = createPaymentEventLedger();

export function appendPaymentEvent(
  input: PantavionPaymentEventInput,
): PantavionPaymentEventRecord {
  return paymentEventLedger.appendEvent(input);
}

export function listPaymentEvents(): PantavionPaymentEventRecord[] {
  return paymentEventLedger.listEvents();
}

export function getPaymentEventLedgerSnapshot(): PantavionPaymentEventLedgerSnapshot {
  return paymentEventLedger.getSnapshot();
}

export default paymentEventLedger;
