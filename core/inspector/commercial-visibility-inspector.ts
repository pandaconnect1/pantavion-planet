// core/inspector/commercial-visibility-inspector.ts

import { listBillingRails } from '../commercial/billing-rail-registry';
import { listSubscriptionPlans } from '../commercial/subscription-registry';
import { listPaymentEvents } from '../commercial/payment-event-ledger';
import { listRevenueEntries } from '../commercial/revenue-ledger';
import { listPayoutReadiness } from '../commercial/payout-readiness-registry';

export interface PantavionCommercialVisibilitySnapshot {
  generatedAt: string;
  railCount: number;
  activeRailCount: number;
  recurringPlanCount: number;
  planCount: number;
  paymentEventCount: number;
  capturedCount: number;
  grossCapturedCents: number;
  revenueEntryCount: number;
  recognizedRevenueCents: number;
  deferredRevenueCents: number;
  payoutLaneCount: number;
  payoutReadyOrSeededCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function buildCommercialVisibilitySnapshot(): PantavionCommercialVisibilitySnapshot {
  const rails = listBillingRails();
  const plans = listSubscriptionPlans();
  const payments = listPaymentEvents();
  const revenues = listRevenueEntries();
  const payouts = listPayoutReadiness();

  return {
    generatedAt: nowIso(),
    railCount: rails.length,
    activeRailCount: rails.filter((item) => item.status === 'active').length,
    recurringPlanCount: plans.filter(
      (item) => item.interval === 'monthly' || item.interval === 'annual',
    ).length,
    planCount: plans.length,
    paymentEventCount: payments.length,
    capturedCount: payments.filter((item) => item.status === 'captured').length,
    grossCapturedCents: payments
      .filter((item) => item.status === 'captured')
      .reduce((sum, item) => sum + item.amountCents, 0),
    revenueEntryCount: revenues.length,
    recognizedRevenueCents: revenues
      .filter((item) => item.kind === 'recognized-revenue')
      .reduce((sum, item) => sum + item.amountCents, 0),
    deferredRevenueCents: revenues
      .filter((item) => item.kind === 'deferred-revenue')
      .reduce((sum, item) => sum + item.amountCents, 0),
    payoutLaneCount: payouts.length,
    payoutReadyOrSeededCount: payouts.filter(
      (item) => item.status === 'ready' || item.status === 'seeded',
    ).length,
  };
}

export default buildCommercialVisibilitySnapshot;
