/**
 * Pantavion SOS Guardian Execution Bridge
 *
 * Connects SOS product implementation with the separated AI architecture:
 * Internal Guardian AI, Central AI Kernel Controller, and Public / Pure PantaAI.
 */

export const pantavionSosGuardianExecutionBridgeId =
  "pantavion_sos_guardian_execution_bridge_v1";

export const pantavionSosCentralAiBridgeAuditMarker =
  "CENTRAL_AI";

export const pantavionSosAiBridgeRoles = {
  internalGuardianAI:
    "Observes SOS requirements, audits routes, checks legal/provider gaps, prepares patches, and reports risks.",
  centralAIKernelController:
    "Routes SOS intent across kernels, providers, memory, safety, translation, emergency, and execution layers.",
  publicPurePantaAI:
    "User-facing AI layer for explanation, translation help, companion support, and guided workflows under safety limits.",
  founder:
    "Final approval authority for production, emergency, provider, legal, billing, identity, and destructive changes.",
} as const;

export const pantavionSosGuardianLoop = [
  "OBSERVE_SOS_ROUTES",
  "COMPARE_AGAINST_LEDGER",
  "DIAGNOSE_MISSING_ACTIONS",
  "RESEARCH_PROVIDER_OPTIONS",
  "PROPOSE_SAFE_PATCH",
  "FOUNDER_OK_FOR_HIGH_RISK",
  "PATCH",
  "BUILD",
  "AUDIT",
  "REPORT",
] as const;

export const pantavionSosGuardianMustWatch = [
  "dead_buttons",
  "fake_emergency_claims",
  "missing_elder_language_memory",
  "missing_orange_auto_detection_marker",
  "green_journal_privacy_risk",
  "trusted_contact_delivery_gap",
  "offline_queue_gap",
  "provider_cost_risk",
  "authority_contract_gap",
  "minors_and_protected_users_policy_gap",
] as const;

export const pantavionSosGuardianOutputContract = [
  "what_changed",
  "what_passed",
  "what_failed",
  "what_remains",
  "risk_notes",
  "provider_notes",
  "legal_notes",
  "cost_notes",
  "founder_decision_needed",
] as const;

export function getPantavionSosGuardianExecutionBridge() {
  return {
    id: pantavionSosGuardianExecutionBridgeId,
    roles: pantavionSosAiBridgeRoles,
    loop: pantavionSosGuardianLoop,
    mustWatch: pantavionSosGuardianMustWatch,
    outputContract: pantavionSosGuardianOutputContract,
  };
}
