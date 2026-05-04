/**
 * Pantavion SOS Provider Dispatch Contract
 *
 * Defines the provider abstraction that will later connect SMS, email, push,
 * voice, translation, maps, storage, satellite-supported devices, and authority
 * partners through explicit legal, cost, privacy, and founder approval gates.
 */

export const pantavionSosProviderDispatchContractId =
  "pantavion_sos_provider_dispatch_contract_v1";

export const pantavionSosDispatchProviderTypes = [
  "browser_local",
  "tel_handler",
  "sms_handler",
  "native_share",
  "clipboard",
  "download_json",
  "maps_url",
  "internal_api_stub",
  "sms_provider_future",
  "email_provider_future",
  "push_provider_future",
  "speech_provider_future",
  "translation_provider_future",
  "satellite_supported_provider_future",
  "authority_partner_future",
] as const;

export const pantavionSosDispatchPayloadContract = [
  "packet_id",
  "created_at",
  "profile_consent",
  "user_language",
  "location_if_available",
  "emergency_contacts",
  "message",
  "offline_queued",
  "delivery_attempts",
  "provider_result",
  "failure_reason",
] as const;

export const pantavionSosDispatchProviderGates = [
  "Founder OK",
  "provider terms reviewed",
  "regional compliance reviewed",
  "cost ceiling configured",
  "abuse controls configured",
  "privacy notice ready",
  "event audit logging ready",
  "fallback path ready",
] as const;

export const pantavionSosDispatchNoFalseClaimRules = [
  "No official authority dispatch claim without signed institutional/provider contract.",
  "No satellite rescue claim without certified compatible device and certified provider.",
  "No guaranteed delivery claim across weak/offline/satellite/network failure states.",
  "No medical triage claim without approved medical escalation framework.",
] as const;

export function getPantavionSosProviderDispatchContract() {
  return {
    id: pantavionSosProviderDispatchContractId,
    providerTypes: pantavionSosDispatchProviderTypes,
    payloadContract: pantavionSosDispatchPayloadContract,
    gates: pantavionSosDispatchProviderGates,
    noFalseClaimRules: pantavionSosDispatchNoFalseClaimRules,
  };
}
