import type {
  PantavionWaterAuthorizedPerson,
} from "./water-serving-contract";

export const PANTAVION_WATER_AUTHORIZED_PERSON_STORE_VERSION =
  "water-authorized-person-store-v1" as const;

export type PantavionWaterAuthorizedPersonStoreProvider =
  | "none"
  | "database"
  | "encrypted-file"
  | "managed-auth-store"
  | "admin-console";

export interface PantavionWaterAuthorizedPersonStoreReadinessInput {
  storeSchemaReady: boolean;
  durableStorageAvailable: boolean;
  encryptedAtRestRequired: boolean;
  changeAuditRequired: boolean;
  founderAdminSeedAvailable: boolean;
  rawNetworkDataNotStored: boolean;
  completeNetworkDataNotStored: boolean;
  productionWriteApprovalRequired: boolean;
  storageProvider: PantavionWaterAuthorizedPersonStoreProvider;
}

export interface PantavionWaterAuthorizedPersonStoreReadinessResult {
  version: typeof PANTAVION_WATER_AUTHORIZED_PERSON_STORE_VERSION;
  authorizedPersonStoreReady: boolean;
  productionStoreAllowed: boolean;
  blockers: string[];
  warnings: string[];
  storageProvider: PantavionWaterAuthorizedPersonStoreProvider;
  mayStoreRawNetworkData: false;
  mayStoreCompleteNetworkData: false;
}

export interface PantavionWaterAuthorizedPersonStoreRecord
  extends PantavionWaterAuthorizedPerson {
  recordVersion: typeof PANTAVION_WATER_AUTHORIZED_PERSON_STORE_VERSION;
}

export function evaluateWaterAuthorizedPersonStoreReadiness(
  input: PantavionWaterAuthorizedPersonStoreReadinessInput,
): PantavionWaterAuthorizedPersonStoreReadinessResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!input.storeSchemaReady) {
    blockers.push("Authorized person store schema is required before production access.");
  }

  if (!input.durableStorageAvailable) {
    blockers.push("Durable authorized person storage is required before production access.");
  }

  if (!input.encryptedAtRestRequired) {
    blockers.push("Authorized person store must require encryption at rest.");
  }

  if (!input.changeAuditRequired) {
    blockers.push("Authorized person store changes must be audit logged.");
  }

  if (!input.founderAdminSeedAvailable) {
    blockers.push("Founder/admin seed access record is required before access testing.");
  }

  if (!input.rawNetworkDataNotStored) {
    blockers.push("Authorized person store must not store raw water network data.");
  }

  if (!input.completeNetworkDataNotStored) {
    blockers.push("Authorized person store must not store complete water network payloads.");
  }

  if (!input.productionWriteApprovalRequired) {
    blockers.push("Founder/admin approval is required before production store writes.");
  }

  if (input.storageProvider === "none") {
    blockers.push("Authorized person store provider is not selected.");
  }

  if (input.storeSchemaReady && !input.durableStorageAvailable) {
    warnings.push(
      "Authorized person schema is ready, but production access remains blocked until durable storage is selected.",
    );
  }

  return {
    version: PANTAVION_WATER_AUTHORIZED_PERSON_STORE_VERSION,
    authorizedPersonStoreReady: blockers.length === 0,
    productionStoreAllowed: blockers.length === 0,
    blockers,
    warnings,
    storageProvider: input.storageProvider,
    mayStoreRawNetworkData: false,
    mayStoreCompleteNetworkData: false,
  };
}

export const PANTAVION_WATER_DIAGNOSTIC_FOUNDER_ADMIN_RECORD:
  PantavionWaterAuthorizedPersonStoreRecord = {
    recordVersion: PANTAVION_WATER_AUTHORIZED_PERSON_STORE_VERSION,
    firstName: "Pantavion",
    lastName: "Kernel",
    title: "Founder/admin diagnostic access record",
    accessLevel: "founder-admin-diagnostic",
    status: "active",
  };

export const PANTAVION_WATER_BLOCKED_AUTHORIZED_PERSON_STORE_READINESS =
  evaluateWaterAuthorizedPersonStoreReadiness({
    storeSchemaReady: true,
    durableStorageAvailable: false,
    encryptedAtRestRequired: true,
    changeAuditRequired: true,
    founderAdminSeedAvailable: true,
    rawNetworkDataNotStored: true,
    completeNetworkDataNotStored: true,
    productionWriteApprovalRequired: true,
    storageProvider: "none",
  });
