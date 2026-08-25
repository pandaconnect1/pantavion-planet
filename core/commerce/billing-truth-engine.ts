export type PantavionBillingPeriod = "one_time" | "monthly" | "yearly";

export type PantavionBillingTruthInput = {
  planKey: string;
  planName: string;
  currency: string;
  amountMinor: number;
  billingPeriod: PantavionBillingPeriod;
  autoRenew: boolean;
  nextRenewalAt?: string | null;
  cancellationCutoffAt?: string | null;
  taxIncluded: boolean;
  taxDisclosure?: string | null;
};

export type PantavionBillingTruth = PantavionBillingTruthInput & {
  amountMajor: string;
  commitmentMinor: number;
  truthVersion: "billing-truth-v1";
  disclosures: string[];
};

function assertIsoDate(value: string, field: string): void {
  if (Number.isNaN(new Date(value).getTime())) throw new Error(`${field} must be a valid date`);
}

export function buildPantavionBillingTruth(input: PantavionBillingTruthInput): PantavionBillingTruth {
  if (!Number.isSafeInteger(input.amountMinor) || input.amountMinor < 0) {
    throw new Error("amountMinor must be a non-negative integer");
  }
  if (!/^[A-Z]{3}$/.test(input.currency)) throw new Error("currency must be an ISO-style 3-letter uppercase code");
  if (input.billingPeriod === "one_time" && input.autoRenew) throw new Error("one-time billing cannot auto-renew");
  if (input.autoRenew && !input.nextRenewalAt) throw new Error("auto-renewing billing requires nextRenewalAt");
  if (input.nextRenewalAt) assertIsoDate(input.nextRenewalAt, "nextRenewalAt");
  if (input.cancellationCutoffAt) assertIsoDate(input.cancellationCutoffAt, "cancellationCutoffAt");

  const disclosures = [
    `charge:${input.currency}:${input.amountMinor}`,
    `period:${input.billingPeriod}`,
    `auto-renew:${input.autoRenew ? "yes" : "no"}`,
    `tax:${input.taxIncluded ? "included" : "not-included-or-variable"}`,
  ];
  if (input.nextRenewalAt) disclosures.push(`next-renewal:${input.nextRenewalAt}`);
  if (input.cancellationCutoffAt) disclosures.push(`cancel-by:${input.cancellationCutoffAt}`);
  if (input.taxDisclosure) disclosures.push(`tax-disclosure:${input.taxDisclosure}`);

  return {
    ...input,
    amountMajor: (input.amountMinor / 100).toFixed(2),
    commitmentMinor: input.amountMinor,
    truthVersion: "billing-truth-v1",
    disclosures,
  };
}
