/**
 * Pantavion SOS Provider Readiness
 */

export const pantavionSosProviderReadinessId =
  "pantavion_sos_provider_readiness_v1";

export const pantavionSosProviderFamilies = [
  {
    id: "sms",
    status: "provider_pending",
    gates: ["Founder OK", "cost limits", "abuse controls", "regional compliance"],
  },
  {
    id: "email",
    status: "provider_pending",
    gates: ["Founder OK", "deliverability", "privacy", "unsubscribe/abuse controls"],
  },
  {
    id: "push",
    status: "provider_pending",
    gates: ["app install", "permission", "device token", "privacy"],
  },
  {
    id: "speech_translation",
    status: "provider_pending",
    gates: ["microphone consent", "provider terms", "language coverage", "latency", "cost"],
  },
  {
    id: "maps_location",
    status: "browser_and_provider_ready",
    gates: ["location permission", "accuracy limits", "privacy"],
  },
  {
    id: "satellite_supported",
    status: "future_certified_provider_only",
    gates: ["certified device/provider", "contracts", "jurisdiction", "no unsupported claims"],
  },
  {
    id: "authority_integration",
    status: "blocked_until_contracts",
    gates: ["legal agreement", "operational partner", "liability review", "audit trail"],
  },
] as const;

export const pantavionSosProviderActivationRules = [
  "Provider activation requires Founder OK.",
  "Paid provider features require cost ceilings and abuse controls.",
  "Provider failure must degrade to local queue, copy, share, phone handler, or clear unavailable state.",
  "Provider claims must match actual configured capability.",
  "Regional legal constraints must be checked before provider rollout.",
] as const;

export function getPantavionSosProviderReadiness() {
  return {
    id: pantavionSosProviderReadinessId,
    providerFamilies: pantavionSosProviderFamilies,
    activationRules: pantavionSosProviderActivationRules,
  };
}
