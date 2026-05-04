/**
 * Pantavion Emergency Circle Contract
 */

export const pantavionEmergencyCircleContractId =
  "pantavion_emergency_circle_contract_v1";

export const pantavionEmergencyCirclePurpose = {
  name: "Emergency Circle",
  role:
    "User-controlled trusted contact layer for SOS, protected users, elder support, family coordination, and offline/weak-network fallback.",
  minimum:
    "Encourage at least two or three trusted contacts where possible, without forcing unsafe or unavailable contacts.",
} as const;

export const pantavionEmergencyCircleContactModel = [
  "name",
  "phone",
  "email",
  "relation",
  "language",
  "country",
  "preferred_channel",
  "consent_status",
  "last_verified_at",
  "emergency_role",
] as const;

export const pantavionEmergencyCircleNotificationChannels = [
  "local_device",
  "sms_provider_pending",
  "email_provider_pending",
  "push_provider_pending",
  "share_sheet",
  "phone_call_handler",
  "future_whatsapp_or_messaging_provider",
] as const;

export const pantavionEmergencyCircleSafetyRules = [
  "Trusted contacts do not automatically receive green private journal history.",
  "A contact can receive SOS alert data only under user action, consent, emergency policy, or lawful guardian rules.",
  "Provider delivery must report success, failure, queued, or unavailable state.",
  "No unlimited provider messaging promise without cost and abuse controls.",
  "Every emergency circle action must have audit trail readiness.",
] as const;

export function getPantavionEmergencyCircleContract() {
  return {
    id: pantavionEmergencyCircleContractId,
    purpose: pantavionEmergencyCirclePurpose,
    contactModel: pantavionEmergencyCircleContactModel,
    channels: pantavionEmergencyCircleNotificationChannels,
    safetyRules: pantavionEmergencyCircleSafetyRules,
  };
}
