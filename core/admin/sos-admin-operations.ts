/**
 * Pantavion SOS Admin and Safety Operations
 */

export const pantavionSosAdminOperationsId =
  "pantavion_sos_admin_operations_v1";

export const pantavionSosAdminOperationsScope = {
  name: "SOS Admin and Safety Operations",
  purpose:
    "Prepare internal operations for SOS events, provider failures, abuse reports, false alarms, protected users, escalation notes, and compliance review.",
  currentReality:
    "Doctrine and readiness layer. Real admin operations require authentication, database, role-based access, event storage, provider logs, and legal review.",
} as const;

export const pantavionSosAdminEventTypes = [
  "sos_activated",
  "sos_queued_offline",
  "sos_replayed",
  "trusted_contact_changed",
  "provider_delivery_failed",
  "provider_delivery_succeeded",
  "protected_user_policy_event",
  "green_journal_access_request",
  "abuse_report",
  "false_alarm_review",
  "manual_admin_note",
] as const;

export const pantavionSosAdminRoles = [
  "founder",
  "safety_admin_future",
  "legal_review_future",
  "provider_ops_future",
  "support_future",
] as const;

export const pantavionSosAdminControls = [
  "role_based_access_required",
  "event_audit_log_required",
  "private_journal_access_blocked_by_default",
  "provider_keys_hidden",
  "destructive_actions_require_founder_ok",
  "protected_user_cases_require_extra_review",
  "authority_workflows_blocked_until_contracts",
] as const;

export function getPantavionSosAdminOperations() {
  return {
    id: pantavionSosAdminOperationsId,
    scope: pantavionSosAdminOperationsScope,
    eventTypes: pantavionSosAdminEventTypes,
    roles: pantavionSosAdminRoles,
    controls: pantavionSosAdminControls,
  };
}
