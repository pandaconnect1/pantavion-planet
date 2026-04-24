// core/commercial/payout-readiness-registry.ts

export type PantavionPayoutReadinessStatus =
  | 'not-ready'
  | 'seeded'
  | 'ready';

export interface PantavionPayoutReadinessRecord {
  laneKey: string;
  title: string;
  payoutRailKey: string;
  status: PantavionPayoutReadinessStatus;
  notes: string[];
}

export interface PantavionPayoutReadinessSnapshot {
  generatedAt: string;
  payoutLaneCount: number;
  readyCount: number;
  seededCount: number;
  notReadyCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const PAYOUT_READINESS: PantavionPayoutReadinessRecord[] = [
  {
    laneKey: 'creator-platform-payouts',
    title: 'Creator Platform Payouts',
    payoutRailKey: 'stripe-connect-payouts',
    status: 'seeded',
    notes: [
      'Seeded for future creator payouts.',
    ],
  },
  {
    laneKey: 'business-provider-payouts',
    title: 'Business Provider Payouts',
    payoutRailKey: 'stripe-connect-payouts',
    status: 'seeded',
    notes: [
      'Seeded for business provider and marketplace payouts.',
    ],
  },
  {
    laneKey: 'ai-provider-revenue-share',
    title: 'AI Provider Revenue Share',
    payoutRailKey: 'stripe-connect-payouts',
    status: 'not-ready',
    notes: [
      'Requires future provider economics and metering rules.',
    ],
  },
];

export function listPayoutReadiness(): PantavionPayoutReadinessRecord[] {
  return PAYOUT_READINESS.map((item) => cloneValue(item));
}

export function getPayoutReadinessSnapshot(): PantavionPayoutReadinessSnapshot {
  const list = listPayoutReadiness();

  return {
    generatedAt: nowIso(),
    payoutLaneCount: list.length,
    readyCount: list.filter((item) => item.status === 'ready').length,
    seededCount: list.filter((item) => item.status === 'seeded').length,
    notReadyCount: list.filter((item) => item.status === 'not-ready').length,
  };
}

export default listPayoutReadiness;
