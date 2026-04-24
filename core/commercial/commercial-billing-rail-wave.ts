// core/commercial/commercial-billing-rail-wave.ts

import { listBillingRails, getBillingRailRegistrySnapshot } from './billing-rail-registry';
import { listSubscriptionPlans, getSubscriptionRegistrySnapshot } from './subscription-registry';
import { appendPaymentEvent, getPaymentEventLedgerSnapshot, listPaymentEvents } from './payment-event-ledger';
import { appendRevenueEntry, getRevenueLedgerSnapshot, listRevenueEntries } from './revenue-ledger';
import { listPayoutReadiness, getPayoutReadinessSnapshot } from './payout-readiness-registry';
import { saveKernelState } from '../storage/kernel-state-store';

export interface PantavionCommercialBillingRailWaveOutput {
  generatedAt: string;
  billingRailSnapshot: ReturnType<typeof getBillingRailRegistrySnapshot>;
  subscriptionSnapshot: ReturnType<typeof getSubscriptionRegistrySnapshot>;
  paymentEventSnapshot: ReturnType<typeof getPaymentEventLedgerSnapshot>;
  revenueSnapshot: ReturnType<typeof getRevenueLedgerSnapshot>;
  payoutReadinessSnapshot: ReturnType<typeof getPayoutReadinessSnapshot>;
  rendered: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function renderWave(output: PantavionCommercialBillingRailWaveOutput): string {
  const rails = listBillingRails();
  const plans = listSubscriptionPlans();
  const payments = listPaymentEvents();
  const revenues = listRevenueEntries();
  const payouts = listPayoutReadiness();

  return [
    'PANTAVION COMMERCIAL BILLING RAIL WAVE',
    `generatedAt=${output.generatedAt}`,
    '',
    'BILLING RAILS',
    `railCount=${output.billingRailSnapshot.railCount}`,
    `activeCount=${output.billingRailSnapshot.activeCount}`,
    `seededCount=${output.billingRailSnapshot.seededCount}`,
    `plannedCount=${output.billingRailSnapshot.plannedCount}`,
    `recurringCapableCount=${output.billingRailSnapshot.recurringCapableCount}`,
    `payoutCapableCount=${output.billingRailSnapshot.payoutCapableCount}`,
    '',
    ...rails.flatMap((item) => [
      `${item.railKey}`,
      `kind=${item.kind}`,
      `provider=${item.provider}`,
      `status=${item.status}`,
      '',
    ]),
    'SUBSCRIPTION PLANS',
    `planCount=${output.subscriptionSnapshot.planCount}`,
    `activeCount=${output.subscriptionSnapshot.activeCount}`,
    `seededCount=${output.subscriptionSnapshot.seededCount}`,
    `plannedCount=${output.subscriptionSnapshot.plannedCount}`,
    `recurringCount=${output.subscriptionSnapshot.recurringCount}`,
    '',
    ...plans.flatMap((item) => [
      `${item.planKey}`,
      `audience=${item.audience}`,
      `interval=${item.interval}`,
      `priceCents=${item.priceCents}`,
      `billingRailKey=${item.billingRailKey}`,
      `status=${item.status}`,
      '',
    ]),
    'PAYMENT EVENTS',
    `paymentEventCount=${output.paymentEventSnapshot.paymentEventCount}`,
    `capturedCount=${output.paymentEventSnapshot.capturedCount}`,
    `failedCount=${output.paymentEventSnapshot.failedCount}`,
    `grossCapturedCents=${output.paymentEventSnapshot.grossCapturedCents}`,
    '',
    ...payments.flatMap((item) => [
      `${item.paymentEventId}`,
      `planKey=${item.planKey}`,
      `status=${item.status}`,
      `amountCents=${item.amountCents}`,
      '',
    ]),
    'REVENUE LEDGER',
    `revenueEntryCount=${output.revenueSnapshot.revenueEntryCount}`,
    `recognizedRevenueCents=${output.revenueSnapshot.recognizedRevenueCents}`,
    `deferredRevenueCents=${output.revenueSnapshot.deferredRevenueCents}`,
    `refundAdjustmentCents=${output.revenueSnapshot.refundAdjustmentCents}`,
    '',
    ...revenues.flatMap((item) => [
      `${item.revenueEntryId}`,
      `kind=${item.kind}`,
      `amountCents=${item.amountCents}`,
      '',
    ]),
    'PAYOUT READINESS',
    `payoutLaneCount=${output.payoutReadinessSnapshot.payoutLaneCount}`,
    `readyCount=${output.payoutReadinessSnapshot.readyCount}`,
    `seededCount=${output.payoutReadinessSnapshot.seededCount}`,
    `notReadyCount=${output.payoutReadinessSnapshot.notReadyCount}`,
    '',
    ...payouts.flatMap((item) => [
      `${item.laneKey}`,
      `payoutRailKey=${item.payoutRailKey}`,
      `status=${item.status}`,
      '',
    ]),
  ].join('\n');
}

export async function runCommercialBillingRailWave(): Promise<PantavionCommercialBillingRailWaveOutput> {
  const captured = appendPaymentEvent({
    userId: 'user_demo_primary',
    planKey: 'pantavion-individual-monthly',
    billingRailKey: 'stripe-subscriptions',
    amountCents: 2900,
    currency: 'USD',
    status: 'captured',
    metadata: {
      scenario: 'demo-billing-success',
    },
  });

  appendPaymentEvent({
    userId: 'team_demo_primary',
    planKey: 'pantavion-team-monthly',
    billingRailKey: 'stripe-subscriptions',
    amountCents: 9900,
    currency: 'USD',
    status: 'initiated',
    metadata: {
      scenario: 'demo-team-started',
    },
  });

  appendRevenueEntry({
    sourcePaymentEventId: captured.paymentEventId,
    kind: 'recognized-revenue',
    amountCents: 2900,
    currency: 'USD',
    notes: ['Recognized monthly revenue from captured individual subscription.'],
  });

  appendRevenueEntry({
    kind: 'deferred-revenue',
    amountCents: 9900,
    currency: 'USD',
    notes: ['Deferred pending team subscription activation.'],
  });

  const output: PantavionCommercialBillingRailWaveOutput = {
    generatedAt: nowIso(),
    billingRailSnapshot: getBillingRailRegistrySnapshot(),
    subscriptionSnapshot: getSubscriptionRegistrySnapshot(),
    paymentEventSnapshot: getPaymentEventLedgerSnapshot(),
    revenueSnapshot: getRevenueLedgerSnapshot(),
    payoutReadinessSnapshot: getPayoutReadinessSnapshot(),
    rendered: '',
  };

  output.rendered = renderWave(output);

  saveKernelState({
    key: 'commercial.billing-rail.latest',
    kind: 'report',
    payload: {
      billingRailSnapshot: output.billingRailSnapshot,
      subscriptionSnapshot: output.subscriptionSnapshot,
      paymentEventSnapshot: output.paymentEventSnapshot,
      revenueSnapshot: output.revenueSnapshot,
      payoutReadinessSnapshot: output.payoutReadinessSnapshot,
      rails: listBillingRails(),
      plans: listSubscriptionPlans(),
      payments: listPaymentEvents(),
      revenues: listRevenueEntries(),
      payoutReadiness: listPayoutReadiness(),
    },
    tags: ['commercial', 'billing', 'revenue', 'latest'],
    metadata: {
      railCount: output.billingRailSnapshot.railCount,
      planCount: output.subscriptionSnapshot.planCount,
      capturedCount: output.paymentEventSnapshot.capturedCount,
      recognizedRevenueCents: output.revenueSnapshot.recognizedRevenueCents,
    },
  });

  return output;
}

export default runCommercialBillingRailWave;
