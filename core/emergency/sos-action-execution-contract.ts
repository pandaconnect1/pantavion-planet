/**
 * Pantavion SOS Action Execution Contract
 *
 * Converts SOS doctrine into executable action categories while preserving
 * the rule that every visible action must be real, disabled, or clearly beta.
 */

export const pantavionSosActionExecutionContractId =
  "pantavion_sos_action_execution_contract_v1";

export const pantavionSosActionLanes = [
  {
    id: "red_immediate_sos",
    color: "red",
    userFacingGoal:
      "One dominant emergency action for users under stress.",
    executableActions: [
      "create_sos_packet",
      "save_emergency_profile",
      "capture_location_if_permitted",
      "trigger_visual_beacon",
      "trigger_haptic_vibration_if_supported",
      "trigger_sos_sound_if_supported",
      "queue_offline_packet",
      "call_tel_handler",
      "sms_first_contact_handler",
      "share_packet_handler",
      "copy_packet_handler",
      "download_packet_json",
      "post_dispatch_api_when_configured",
    ],
  },
  {
    id: "orange_translation_help",
    color: "orange",
    userFacingGoal:
      "Assist communication across languages with auto-detect target and manual helper backup.",
    executableActions: [
      "preserve_user_language",
      "preserve_translation_mode",
      "select_helper_language_backup",
      "open_interpreter_route",
      "future_microphone_consent",
      "future_speech_to_text_provider",
      "future_translation_provider",
      "future_text_to_speech_provider",
    ],
  },
  {
    id: "green_companion_journal",
    color: "green",
    userFacingGoal:
      "Private companion and journal continuity with no diagnosis and no silent caregiver access.",
    executableActions: [
      "save_local_journal_item",
      "show_local_history",
      "clear_or_export_with_consent_future",
      "detect_emergency_language_future",
      "recommend_red_sos_when_danger_future",
      "block_family_access_without_policy",
    ],
  },
  {
    id: "offgrid_local_survival",
    color: "blue",
    userFacingGoal:
      "Local emergency identity and queue support when connection is weak or unavailable.",
    executableActions: [
      "offline_identity_display",
      "cached_emergency_phrases",
      "local_queue",
      "queue_replay",
      "qr_nfc_roadmap",
      "satellite_supported_provider_pending",
    ],
  },
] as const;

export const pantavionSosActionResultStates = [
  "executed",
  "queued",
  "provider_pending",
  "permission_missing",
  "device_not_supported",
  "blocked_until_founder_ok",
  "blocked_until_contracts",
  "failed_with_reason",
] as const;

export const pantavionSosActionExecutionRules = [
  "A button must execute now or explain the exact blocker.",
  "Emergency red flow must stay simpler than admin/provider configuration.",
  "Provider pending actions must never be described as live dispatch.",
  "Every high-risk integration requires Founder OK.",
  "Every provider action must degrade to local queue, copy, share, call handler, or clear unavailable state.",
] as const;

export function getPantavionSosActionExecutionContract() {
  return {
    id: pantavionSosActionExecutionContractId,
    lanes: pantavionSosActionLanes,
    resultStates: pantavionSosActionResultStates,
    rules: pantavionSosActionExecutionRules,
  };
}
