import type {
  PolicyContext,
  PolicyDecision,
  SocialCapability,
  VerificationLevel,
} from "./contracts";

const ADULT_ONLY_CAPABILITIES = new Set<SocialCapability>([
  "dating.discover",
  "dating.match",
]);

const IDENTITY_REQUIRED_CAPABILITIES = new Set<SocialCapability>([
  "circles.secure.create",
  "marketplace.sell",
]);

const AGE_VERIFICATION_REQUIRED_CAPABILITIES = new Set<SocialCapability>([
  "dating.discover",
  "dating.match",
]);

function hasVerification(
  verification: readonly VerificationLevel[],
  required: VerificationLevel,
): boolean {
  return verification.includes(required);
}

export function evaluateSocialPolicy(context: PolicyContext): PolicyDecision {
  const { actor, capability, targetAgeBand, featureFlags } = context;

  if (featureFlags?.[capability] === false) {
    return {
      allowed: false,
      code: "feature-disabled",
      reason: "This capability is disabled by active policy.",
    };
  }

  if (ADULT_ONLY_CAPABILITIES.has(capability) && actor.ageBand !== "adult") {
    return {
      allowed: false,
      code: "adult-only",
      reason: "This capability is available only to adults.",
    };
  }

  if (
    AGE_VERIFICATION_REQUIRED_CAPABILITIES.has(capability) &&
    !hasVerification(actor.verification, "age") &&
    !hasVerification(actor.verification, "identity")
  ) {
    return {
      allowed: false,
      code: "age-verification-required",
      reason: "Age verification is required.",
      requiredVerification: "age",
    };
  }

  if (
    IDENTITY_REQUIRED_CAPABILITIES.has(capability) &&
    !hasVerification(actor.verification, "identity") &&
    !hasVerification(actor.verification, "organization")
  ) {
    return {
      allowed: false,
      code: "identity-verification-required",
      reason: "Verified identity or organization status is required.",
      requiredVerification: "identity",
    };
  }

  if (
    actor.ageBand === "child" &&
    capability === "relationships.connect" &&
    !actor.guardianConsent
  ) {
    return {
      allowed: false,
      code: "guardian-consent-required",
      reason: "Guardian consent is required for new child connections.",
    };
  }

  if (
    targetAgeBand &&
    actor.ageBand === "adult" &&
    targetAgeBand === "child" &&
    (capability === "messaging.direct" || capability === "relationships.connect")
  ) {
    return {
      allowed: false,
      code: "cross-age-contact-restricted",
      reason: "Direct adult-to-child contact is restricted.",
    };
  }

  return {
    allowed: true,
    code: "allowed",
    reason: "Capability allowed by the active Pantavion policy.",
  };
}
