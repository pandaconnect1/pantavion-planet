export type WaterUserRole =
  | "founder_admin"
  | "admin"
  | "chief_supervisor"
  | "supervisor"
  | "technician"
  | "field_worker"
  | "viewer";

export type WaterDeviceTrustState =
  | "unknown"
  | "pending_first_verification"
  | "trusted"
  | "restricted"
  | "revoked";

export type WaterSessionState =
  | "none"
  | "trusted_device"
  | "founder_admin_verified"
  | "expired"
  | "revoked";

export type WaterAccessScope =
  | "own_records"
  | "assigned_records"
  | "team_records"
  | "all_water_records"
  | "founder_admin_only";

export type WaterAccessDecision = {
  allowed: boolean;
  role: WaterUserRole | null;
  sessionState: WaterSessionState;
  deviceTrustState: WaterDeviceTrustState;
  scope: WaterAccessScope;
  reason: string;
  humanStepUpRequired: boolean;
  auditRequired: boolean;
};

export type WaterTrustedDeviceIdentity = {
  deviceId: string;
  userId: string;
  role: WaterUserRole;
  label?: string;
  trustState: WaterDeviceTrustState;
  approvedBy?: string;
  approvedAt?: string;
  lastSeenAt?: string;
  revokedAt?: string;
};

export const WATER_TRUSTED_DEVICE_DOCTRINE = {
  title: "Pantavion Water Trusted User Device Access",
  purpose:
    "Ο founder/admin και οι εγκεκριμένοι χρήστες δεν πρέπει να βάζουν συνέχεια code. Το Pantavion πρέπει να αναγνωρίζει χρήστη, ρόλο, συσκευή και session.",
  rules: [
    "Η πρώτη επιβεβαίωση χρειάζεται ασφαλές founder/admin verification.",
    "Μετά η γνωστή συσκευή μπορεί να ανοίγει session χωρίς νέο code.",
    "Κάθε χρήστης βλέπει μόνο όσα επιτρέπονται από ρόλο και ανάθεση.",
    "Αν χαθεί συσκευή, ο founder/admin την ανακαλεί.",
    "Οι ευαίσθητες ενέργειες μπορούν να ζητήσουν step-up verification.",
    "Κάθε πρόσβαση σε ιδιωτικές βλάβες γράφεται σε audit trail.",
  ],
} as const;

export const WATER_ROLE_DEFAULT_SCOPE: Record<WaterUserRole, WaterAccessScope> = {
  founder_admin: "founder_admin_only",
  admin: "all_water_records",
  chief_supervisor: "team_records",
  supervisor: "team_records",
  technician: "assigned_records",
  field_worker: "own_records",
  viewer: "own_records",
};

export function canRoleReadAdminFaults(role: WaterUserRole | null) {
  return role === "founder_admin" || role === "admin" || role === "chief_supervisor";
}

export function canTrustedDeviceOpenSession(device: WaterTrustedDeviceIdentity | null) {
  return Boolean(device && device.trustState === "trusted" && canRoleReadAdminFaults(device.role));
}

export function decideWaterTrustedDeviceAccess(input: {
  role: WaterUserRole | null;
  hasValidSessionCookie: boolean;
  trustedDevice: WaterTrustedDeviceIdentity | null;
  sensitiveAction?: boolean;
}): WaterAccessDecision {
  if (input.hasValidSessionCookie && canRoleReadAdminFaults(input.role)) {
    return {
      allowed: true,
      role: input.role,
      sessionState: "founder_admin_verified",
      deviceTrustState: input.trustedDevice?.trustState || "unknown",
      scope: WATER_ROLE_DEFAULT_SCOPE[input.role || "viewer"],
      reason: "Υπάρχει ενεργό founder/admin session.",
      humanStepUpRequired: Boolean(input.sensitiveAction),
      auditRequired: true,
    };
  }

  if (canTrustedDeviceOpenSession(input.trustedDevice)) {
    return {
      allowed: true,
      role: input.trustedDevice?.role || "viewer",
      sessionState: "trusted_device",
      deviceTrustState: "trusted",
      scope: WATER_ROLE_DEFAULT_SCOPE[input.trustedDevice?.role || "viewer"],
      reason: "Η συσκευή είναι εγκεκριμένη και ανοίγει admin session χωρίς νέο code.",
      humanStepUpRequired: Boolean(input.sensitiveAction),
      auditRequired: true,
    };
  }

  return {
    allowed: false,
    role: input.role,
    sessionState: "none",
    deviceTrustState: input.trustedDevice?.trustState || "unknown",
    scope: "own_records",
    reason: "Δεν υπάρχει ενεργό session ή trusted founder/admin device.",
    humanStepUpRequired: true,
    auditRequired: true,
  };
}