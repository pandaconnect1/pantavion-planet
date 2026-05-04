/**
 * Pantavion SOS Admin Readiness Queue
 */

export const pantavionSosAdminReadinessQueueId =
  "pantavion_sos_admin_readiness_queue_v1";

export const pantavionSosAdminReadinessQueueItems = [
  {
    id: "admin_auth",
    status: "future_required",
    reason:
      "SOS admin views require authentication, role-based access, and protected user policy.",
  },
  {
    id: "event_database",
    status: "future_required",
    reason:
      "SOS event review requires durable storage, timestamps, provider result metadata, and audit logs.",
  },
  {
    id: "provider_console",
    status: "future_required",
    reason:
      "SMS/email/push/speech providers need keys, webhooks, cost controls, delivery logs, and abuse controls.",
  },
  {
    id: "protected_user_review",
    status: "future_required",
    reason:
      "Elder/minor/special-needs flows require guardian/consent/legal policy review.",
  },
  {
    id: "authority_contract_review",
    status: "blocked_until_contracts",
    reason:
      "Official emergency authority workflows require signed institutional agreements.",
  },
] as const;

export const pantavionSosAdminReadinessQueueRules = [
  "No admin access to private green journal history by default.",
  "No provider keys in client-side code.",
  "No authority workflow until contracts exist.",
  "No protected-user escalation without policy.",
  "No destructive admin action without Founder OK.",
] as const;

export function getPantavionSosAdminReadinessQueue() {
  return {
    id: pantavionSosAdminReadinessQueueId,
    items: pantavionSosAdminReadinessQueueItems,
    rules: pantavionSosAdminReadinessQueueRules,
  };
}
