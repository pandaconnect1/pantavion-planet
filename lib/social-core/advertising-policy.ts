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
  onlyDedicatedAdsDirectoryAllowed: true,
  allowedServingSurface: "ads_directory",
} as const;

export type PantavionAdvertiserTrack = "standard" | "enterprise";

export type PantavionAdDecisionInput = {
  soldByPantavion: boolean;
  paymentStatus: "pending" | "paid" | "refunded" | "cancelled";
  moderationStatus: "draft" | "pending" | "approved" | "rejected" | "suspended";
  advertiserVerified: boolean;
  servingSurface: string;
  audienceAgeBand?: "child" | "teen" | "adult";
};

export type PantavionAdDecision = {
  allowed: boolean;
  reason:
    | "allowed"
    | "external-ad-network-prohibited"
    | "outside-ads-directory-prohibited"
    | "payment-required"
    | "approval-required"
    | "advertiser-verification-required"
    | "child-targeting-prohibited";
};

export function canServePantavionAd(input: PantavionAdDecisionInput): PantavionAdDecision {
  if (!input.soldByPantavion) {
    return { allowed: false, reason: "external-ad-network-prohibited" };
  }

  if (input.servingSurface !== PANTAVION_ADVERTISING_POLICY.allowedServingSurface) {
    return { allowed: false, reason: "outside-ads-directory-prohibited" };
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

export const PANTAVION_ADVERTISER_TRACKS = {
  standard: {
    id: "standard",
    label: "Standard Advertiser",
    pricing: "published_rate_or_custom_quote",
    contractFlow: ["advertising_terms", "acceptable_use", "privacy_data_rules", "insertion_order"],
    legalReview: "template_first",
  },
  enterprise: {
    id: "enterprise",
    label: "Enterprise / Strategic Partner",
    pricing: "negotiated_custom_quote",
    contractFlow: ["advertising_terms", "insertion_order", "master_services_agreement", "data_processing_addendum", "custom_addendum_if_needed"],
    legalReview: "required_for_non_standard_terms",
  },
} as const;
