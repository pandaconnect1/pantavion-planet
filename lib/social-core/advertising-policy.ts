export const PANTAVION_ADVERTISING_POLICY = {
  externalAdNetworksAllowed: false,
  thirdPartyAdSdkAllowed: false,
  thirdPartyTrackingPixelsAllowed: false,
  directPantavionSalesOnly: true,
  paymentRequiredBeforeServing: true,
  approvalRequiredBeforeServing: true,
  clearSponsoredLabelRequired: true,
  targetedAdsToChildrenAllowed: false,
  advertiserVerificationRequired: true,
} as const;

export type PantavionAdDecisionInput = {
  soldByPantavion: boolean;
  paymentStatus: "pending" | "paid" | "refunded" | "cancelled";
  moderationStatus: "draft" | "pending" | "approved" | "rejected" | "suspended";
  advertiserVerified: boolean;
  audienceAgeBand?: "child" | "teen" | "adult";
};

export type PantavionAdDecision = {
  allowed: boolean;
  reason:
    | "allowed"
    | "external-ad-network-prohibited"
    | "payment-required"
    | "approval-required"
    | "advertiser-verification-required"
    | "child-targeting-prohibited";
};

export function canServePantavionAd(input: PantavionAdDecisionInput): PantavionAdDecision {
  if (!input.soldByPantavion) {
    return { allowed: false, reason: "external-ad-network-prohibited" };
  }

  if (!input.advertiserVerified) {
    return { allowed: false, reason: "advertiser-verification-required" };
  }

  if (input.paymentStatus !== "paid") {
    return { allowed: false, reason: "payment-required" };
  }

  if (input.moderationStatus !== "approved") {
    return { allowed: false, reason: "approval-required" };
  }

  if (input.audienceAgeBand === "child") {
    return { allowed: false, reason: "child-targeting-prohibited" };
  }

  return { allowed: true, reason: "allowed" };
}
