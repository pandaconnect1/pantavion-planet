import type { PantavionCountryAdaptiveRule } from "./adaptive-ecosystem-policy";

export const pantavionCountryAdaptivePolicyRegistry = [
  {
    countryCode: "NZ",
    status: "monitoring",
    enforcementEnabled: false,
    minimumSocialAge: 16,
    guardianConsentBelow: 16,
    requireAgeAssuranceForSocial: true,
    minorTargetedAdsProhibited: true,
    sourceRefs: ["public-policy-monitoring-2026-08-24"],
    notes: [
      "Tracked as a policy proposal/current legislative development, not enforced as law by Pantavion until legal verification and effective-date confirmation.",
      "If a social-age threshold becomes effective, restricted users remain inside Pantavion through education, learning, interpreter and age-appropriate protected experiences rather than being removed from the ecosystem.",
    ],
  },
] as const satisfies readonly PantavionCountryAdaptiveRule[];

export function getPantavionCountryAdaptiveRule(countryCode: string): PantavionCountryAdaptiveRule | null {
  const normalized = countryCode.trim().toUpperCase();
  return pantavionCountryAdaptivePolicyRegistry.find((entry) => entry.countryCode === normalized) ?? null;
}
