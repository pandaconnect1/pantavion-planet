/**
 * Pantavion SOS Product Completion Roadmap
 */

export const pantavionSosProductCompletionRoadmapId =
  "pantavion_sos_product_completion_roadmap_v1";

export const pantavionSosProductCompletionPhases = [
  {
    id: "phase_1_browser_pwa_sos",
    status: "active_foundation",
    includes: [
      "profile",
      "contacts",
      "location",
      "local_queue",
      "call_sms_share_copy_download",
      "beacon_sound_vibration",
      "readiness_ledgers",
    ],
  },
  {
    id: "phase_2_protected_users_elder",
    status: "active_foundation",
    includes: [
      "elder_safe_mode",
      "large_ui",
      "red_orange_green_model",
      "language_memory",
      "orange_translation_mode",
      "green_journal_privacy",
    ],
  },
  {
    id: "phase_3_provider_delivery",
    status: "provider_pending",
    includes: [
      "sms_provider",
      "email_provider",
      "push_provider",
      "delivery_receipts",
      "cost_limits",
      "abuse_controls",
    ],
  },
  {
    id: "phase_4_live_speech_translation",
    status: "provider_pending",
    includes: [
      "microphone_consent",
      "speech_to_text",
      "translation",
      "text_to_speech",
      "latency_controls",
      "privacy_controls",
    ],
  },
  {
    id: "phase_5_admin_safety_ops",
    status: "infrastructure_pending",
    includes: [
      "auth",
      "database",
      "role_based_access",
      "event_log",
      "provider_logs",
      "protected_user_review",
      "legal_review",
    ],
  },
  {
    id: "phase_6_certified_integrations",
    status: "contracts_required",
    includes: [
      "authority_partners",
      "medical_escalation_partners",
      "satellite_supported_device_providers",
      "maritime_or_remote_area_provider_roadmap",
    ],
  },
] as const;

export const pantavionSosRoadmapExecutionRule =
  "Each phase must pass audit, build, legal/provider review where needed, and Founder OK before high-risk production rollout.";

export function getPantavionSosProductCompletionRoadmap() {
  return {
    id: pantavionSosProductCompletionRoadmapId,
    phases: pantavionSosProductCompletionPhases,
    executionRule: pantavionSosRoadmapExecutionRule,
  };
}
