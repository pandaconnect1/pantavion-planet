export type PantavionProtectedStateCategory =
  | "approved_users"
  | "access_requests"
  | "approved_devices"
  | "founder_admin_access"
  | "env_config_manifest"
  | "private_source_vault_metadata"
  | "water_records"
  | "legal_privacy_records"
  | "billing_compliance_records";

export type PantavionRecoveryAction =
  | "snapshot"
  | "verify_checksum"
  | "restore_drill"
  | "rollback"
  | "overwrite"
  | "delete"
  | "migrate";

export interface PantavionProtectedStateSnapshot {
  readonly snapshotId: string;
  readonly createdAtIso: string;
  readonly categories: readonly PantavionProtectedStateCategory[];
  readonly storageMode:
    | "local_private"
    | "private_blob_versioned"
    | "database_backup"
    | "offline_archive";
  readonly checksumManifestRequired: boolean;
  readonly immutableCopyRequired: boolean;
  readonly restoreTestRequired: boolean;
  readonly founderApprovalRequired: boolean;
  readonly notes: string;
}

export interface PantavionRecoveryDecision {
  readonly allowed: boolean;
  readonly reason: string;
  readonly backupRequired: boolean;
  readonly founderApprovalRequired: boolean;
}

export function evaluateProtectedStateAction(
  action: PantavionRecoveryAction,
  categories: readonly PantavionProtectedStateCategory[],
  hasVerifiedBackup: boolean,
  hasFounderApproval: boolean,
): PantavionRecoveryDecision {
  const sensitive = categories.length > 0;

  if (!sensitive) {
    return {
      allowed: true,
      reason: "No protected state category was declared.",
      backupRequired: false,
      founderApprovalRequired: false,
    };
  }

  if (action === "snapshot" || action === "verify_checksum" || action === "restore_drill") {
    return {
      allowed: true,
      reason: "Read-only or backup verification action is allowed.",
      backupRequired: false,
      founderApprovalRequired: false,
    };
  }

  if (!hasVerifiedBackup) {
    return {
      allowed: false,
      reason: "Protected state action requires verified backup before change.",
      backupRequired: true,
      founderApprovalRequired: true,
    };
  }

  if (!hasFounderApproval) {
    return {
      allowed: false,
      reason: "Protected state action requires explicit founder approval.",
      backupRequired: true,
      founderApprovalRequired: true,
    };
  }

  return {
    allowed: true,
    reason: "Protected state action is allowed with backup and founder approval.",
    backupRequired: true,
    founderApprovalRequired: true,
  };
}

export const PANTAVION_PROTECTED_STATE_BASELINE: PantavionProtectedStateSnapshot = {
  snapshotId: "protected-state-baseline-contract",
  createdAtIso: "contract",
  categories: [
    "approved_users",
    "access_requests",
    "approved_devices",
    "founder_admin_access",
    "env_config_manifest",
    "private_source_vault_metadata",
    "water_records",
  ],
  storageMode: "private_blob_versioned",
  checksumManifestRequired: true,
  immutableCopyRequired: true,
  restoreTestRequired: true,
  founderApprovalRequired: true,
  notes:
    "No patch may delete, reset, overwrite or migrate protected Pantavion state without verified backup, checksum manifest, restore path and founder approval.",
};
