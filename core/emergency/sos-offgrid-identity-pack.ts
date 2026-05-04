/**
 * Pantavion Off-grid SOS Identity Pack
 */

export const pantavionOffgridSosIdentityPackId =
  "pantavion_offgrid_sos_identity_pack_v1";

export const pantavionOffgridConnectionStates = [
  "online",
  "weak_network",
  "offline",
  "satellite_supported_provider_pending",
  "device_local_only",
] as const;

export const pantavionOffgridIdentityFields = [
  "name",
  "primary_language",
  "country",
  "emergency_contacts",
  "allergies",
  "blood_type",
  "medical_notes_user_provided",
  "critical_phrases",
  "consent_flags",
  "last_updated_at",
] as const;

export const pantavionOffgridLocalTools = [
  "offline_identity_display",
  "QR_or_NFC_roadmap",
  "cached_emergency_phrases",
  "local_siren",
  "visual_beacon",
  "haptic_vibration",
  "SOS_packet_download",
  "local_event_queue",
  "queue_replay_when_connection_returns",
] as const;

export const pantavionOffgridBoundaries = [
  "Offline mode cannot promise remote delivery.",
  "Satellite-supported mode requires certified provider, compatible hardware, lawful terms, and explicit integration.",
  "Medical notes are user-provided emergency context, not diagnosis.",
  "Identity display must be opt-in and revocable where possible.",
] as const;

export function getPantavionOffgridSosIdentityPack() {
  return {
    id: pantavionOffgridSosIdentityPackId,
    connectionStates: pantavionOffgridConnectionStates,
    identityFields: pantavionOffgridIdentityFields,
    localTools: pantavionOffgridLocalTools,
    boundaries: pantavionOffgridBoundaries,
  };
}
