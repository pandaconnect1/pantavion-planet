// core/commercial/subscription-registry.ts

export type PantavionSubscriptionInterval =
  | 'monthly'
  | 'annual'
  | 'one-time'
  | 'custom';

export type PantavionSubscriptionPlanStatus =
  | 'active'
  | 'seeded'
  | 'planned';

export interface PantavionSubscriptionPlanRecord {
  planKey: string;
  title: string;
  audience: 'individual' | 'team' | 'enterprise' | 'creator-platform';
  interval: PantavionSubscriptionInterval;
  priceCents: number;
  currency: string;
  billingRailKey: string;
  status: PantavionSubscriptionPlanStatus;
  notes: string[];
}

export interface PantavionSubscriptionRegistrySnapshot {
  generatedAt: string;
  planCount: number;
  activeCount: number;
  seededCount: number;
  plannedCount: number;
  recurringCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const SUBSCRIPTION_PLANS: PantavionSubscriptionPlanRecord[] = [
  {
    planKey: 'pantavion-individual-monthly',
    title: 'Pantavion Individual Monthly',
    audience: 'individual',
    interval: 'monthly',
    priceCents: 2900,
    currency: 'USD',
    billingRailKey: 'stripe-subscriptions',
    status: 'active',
    notes: [
      'Base recurring plan for individual users.',
    ],
  },
  {
    planKey: 'pantavion-individual-annual',
    title: 'Pantavion Individual Annual',
    audience: 'individual',
    interval: 'annual',
    priceCents: 29000,
    currency: 'USD',
    billingRailKey: 'stripe-subscriptions',
    status: 'active',
    notes: [
      'Discounted annual recurring plan for individual users.',
    ],
  },
  {
    planKey: 'pantavion-team-monthly',
    title: 'Pantavion Team Monthly',
    audience: 'team',
    interval: 'monthly',
    priceCents: 9900,
    currency: 'USD',
    billingRailKey: 'stripe-subscriptions',
    status: 'seeded',
    notes: [
      'Recurring team plan for shared workspaces.',
    ],
  },
  {
    planKey: 'pantavion-enterprise-contract',
    title: 'Pantavion Enterprise Contract',
    audience: 'enterprise',
    interval: 'custom',
    priceCents: 0,
    currency: 'USD',
    billingRailKey: 'enterprise-invoice-rail',
    status: 'seeded',
    notes: [
      'Custom contract billing for enterprise deals.',
    ],
  },
  {
    planKey: 'pantavion-creator-platform',
    title: 'Pantavion Creator Platform',
    audience: 'creator-platform',
    interval: 'monthly',
    priceCents: 4900,
    currency: 'USD',
    billingRailKey: 'stripe-subscriptions',
    status: 'planned',
    notes: [
      'Future subscription for creators or provider-side operators.',
    ],
  },
];

export function listSubscriptionPlans(): PantavionSubscriptionPlanRecord[] {
  return SUBSCRIPTION_PLANS.map((item) => cloneValue(item));
}

export function getSubscriptionPlan(planKey: string): PantavionSubscriptionPlanRecord | null {
  const item = SUBSCRIPTION_PLANS.find((entry) => entry.planKey === planKey);
  return item ? cloneValue(item) : null;
}

export function getSubscriptionRegistrySnapshot(): PantavionSubscriptionRegistrySnapshot {
  const list = listSubscriptionPlans();

  return {
    generatedAt: nowIso(),
    planCount: list.length,
    activeCount: list.filter((item) => item.status === 'active').length,
    seededCount: list.filter((item) => item.status === 'seeded').length,
    plannedCount: list.filter((item) => item.status === 'planned').length,
    recurringCount: list.filter(
      (item) => item.interval === 'monthly' || item.interval === 'annual',
    ).length,
  };
}

export default listSubscriptionPlans;
