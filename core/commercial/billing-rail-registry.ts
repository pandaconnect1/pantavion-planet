// core/commercial/billing-rail-registry.ts

export type PantavionBillingRailKind =
  | 'web-checkout'
  | 'subscription'
  | 'platform-payout'
  | 'mobile-digital-goods'
  | 'enterprise-invoice';

export type PantavionBillingRailStatus =
  | 'active'
  | 'seeded'
  | 'planned';

export interface PantavionBillingRailRecord {
  railKey: string;
  title: string;
  kind: PantavionBillingRailKind;
  provider: string;
  status: PantavionBillingRailStatus;
  recurringCapable: boolean;
  payoutCapable: boolean;
  notes: string[];
}

export interface PantavionBillingRailRegistrySnapshot {
  generatedAt: string;
  railCount: number;
  activeCount: number;
  seededCount: number;
  plannedCount: number;
  recurringCapableCount: number;
  payoutCapableCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const BILLING_RAILS: PantavionBillingRailRecord[] = [
  {
    railKey: 'stripe-web-checkout',
    title: 'Stripe Web Checkout',
    kind: 'web-checkout',
    provider: 'stripe',
    status: 'active',
    recurringCapable: false,
    payoutCapable: false,
    notes: [
      'Fastest starting rail for web payments.',
      'Useful for one-time checkout and early monetization.',
    ],
  },
  {
    railKey: 'stripe-subscriptions',
    title: 'Stripe Subscriptions',
    kind: 'subscription',
    provider: 'stripe',
    status: 'active',
    recurringCapable: true,
    payoutCapable: false,
    notes: [
      'Primary recurring billing rail for Pantavion plans.',
      'Should support monthly and annual plans.',
    ],
  },
  {
    railKey: 'stripe-connect-payouts',
    title: 'Stripe Connect Payouts',
    kind: 'platform-payout',
    provider: 'stripe',
    status: 'seeded',
    recurringCapable: false,
    payoutCapable: true,
    notes: [
      'Future payout rail for creators, businesses and marketplace scenarios.',
      'Important for platform-level revenue distribution.',
    ],
  },
  {
    railKey: 'apple-mobile-digital-goods',
    title: 'Apple Mobile Digital Goods',
    kind: 'mobile-digital-goods',
    provider: 'apple-storekit',
    status: 'planned',
    recurringCapable: true,
    payoutCapable: false,
    notes: [
      'Planned rail for iOS-native digital subscriptions and in-app purchases.',
    ],
  },
  {
    railKey: 'enterprise-invoice-rail',
    title: 'Enterprise Invoice Rail',
    kind: 'enterprise-invoice',
    provider: 'pantavion-enterprise-billing',
    status: 'seeded',
    recurringCapable: true,
    payoutCapable: false,
    notes: [
      'Enterprise invoice and manual contract billing path.',
    ],
  },
];

export function listBillingRails(): PantavionBillingRailRecord[] {
  return BILLING_RAILS.map((item) => cloneValue(item));
}

export function getBillingRail(railKey: string): PantavionBillingRailRecord | null {
  const item = BILLING_RAILS.find((entry) => entry.railKey === railKey);
  return item ? cloneValue(item) : null;
}

export function getBillingRailRegistrySnapshot(): PantavionBillingRailRegistrySnapshot {
  const list = listBillingRails();

  return {
    generatedAt: nowIso(),
    railCount: list.length,
    activeCount: list.filter((item) => item.status === 'active').length,
    seededCount: list.filter((item) => item.status === 'seeded').length,
    plannedCount: list.filter((item) => item.status === 'planned').length,
    recurringCapableCount: list.filter((item) => item.recurringCapable).length,
    payoutCapableCount: list.filter((item) => item.payoutCapable).length,
  };
}

export default listBillingRails;
