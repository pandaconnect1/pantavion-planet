/**
 * Pantavion SOS Protected Users Policy
 */

export const pantavionSosProtectedUsersPolicyId =
  "pantavion_sos_protected_users_policy_v1";

export const pantavionSosProtectedUserGroups = [
  "elders",
  "minors",
  "disabled_users",
  "special_needs_users",
  "abuse_or_bullying_risk_users",
  "users_with_low_vision",
  "users_with_limited_mobility",
  "users_under_language_barrier",
  "users_in_low_connectivity_or_high_risk_context",
] as const;

export const pantavionSosProtectedUxRules = [
  "Use simple high-contrast screens.",
  "Keep red SOS as one dominant clear action.",
  "Use large tap targets and short language.",
  "Preserve user language memory.",
  "Make orange translation default to automatic speech language detection when provider-ready.",
  "Keep manual helper language as backup.",
  "Keep green companion private by default.",
  "Explain limitations without frightening the user.",
] as const;

export const pantavionSosGuardianAndFamilyRules = [
  "Guardian or family access must be consent-based, policy-controlled, age-aware, jurisdiction-aware, and auditable.",
  "No automatic access to private companion history.",
  "Minors require stronger guardian, safety, and regional consent policy.",
  "Elders require protection against coercion, manipulation, financial abuse, and forced data sharing.",
  "Abuse-risk users require safe exit, evidence protection roadmap, and privacy-preserving support.",
] as const;

export function getPantavionSosProtectedUsersPolicy() {
  return {
    id: pantavionSosProtectedUsersPolicyId,
    groups: pantavionSosProtectedUserGroups,
    uxRules: pantavionSosProtectedUxRules,
    guardianAndFamilyRules: pantavionSosGuardianAndFamilyRules,
  };
}
