export const PANTAVION_WATER_SOVEREIGN_GIS_VERSION =
  "water-sovereign-gis-v1" as const;

export type PantavionWaterExecutionProvider =
  | "pantavion-self-hosted"
  | "cloudflare-r2"
  | "aws-s3"
  | "s3-compatible"
  | "maptiler-cloud"
  | "other-external";

export type PantavionWaterArtifactRole =
  | "raw-master"
  | "derived-gis"
  | "spatial-index"
  | "tile-archive"
  | "tile-service-manifest";

export type PantavionWaterReplicaState =
  | "planned"
  | "uploaded"
  | "verified"
  | "degraded"
  | "unavailable";

export interface PantavionWaterReplicaRecord {
  provider: PantavionWaterExecutionProvider;
  /** Provider-specific locator kept server-side. It must never become browser source truth. */
  locatorRef: string;
  state: PantavionWaterReplicaState;
  verifiedSha256?: string;
  verifiedByteSize?: number;
  lastVerifiedAtIso?: string;
}

export interface PantavionWaterDerivedLineage {
  sourceArtifactId: string;
  sourceSha256: string;
  pipelineId: string;
  pipelineVersion: string;
  parametersHash?: string;
}

export interface PantavionWaterCanonicalArtifactManifest {
  artifactId: string;
  mapId: string;
  role: PantavionWaterArtifactRole;
  sourceFormat: string;
  sha256: string;
  byteSize: number;
  immutable: boolean;
  canonicalAuthority: "pantavion";
  createdAtIso: string;
  lineage?: PantavionWaterDerivedLineage;
  replicas: readonly PantavionWaterReplicaRecord[];
}

export interface PantavionWaterSovereigntyReadinessInput {
  canonicalManifestStored: boolean;
  rawMasterHashVerified: boolean;
  rawMasterReplicaCount: number;
  derivedLineageRecorded: boolean;
  providerAdapterAbstracted: boolean;
  clientProviderNeutral: boolean;
  backupRestoreTested: boolean;
  selfHostedExitPathDefined: boolean;
  fullApplicationRecoveryPackStored: boolean;
  databaseSchemaRecoveryStored: boolean;
  gisRecoveryStored: boolean;
  secondaryRuntimeReady: boolean;
  automaticFailoverTested: boolean;
  providerOutageDrillPassed: boolean;
}

export function validatePantavionWaterCanonicalArtifactManifest(
  manifest: PantavionWaterCanonicalArtifactManifest,
) {
  if (!manifest.artifactId.trim()) throw new Error("water_artifact_id_required");
  if (!manifest.mapId.trim()) throw new Error("water_map_id_required");
  if (!/^[a-f0-9]{64}$/i.test(manifest.sha256)) {
    throw new Error("water_artifact_sha256_invalid");
  }
  if (!Number.isSafeInteger(manifest.byteSize) || manifest.byteSize <= 0) {
    throw new Error("water_artifact_byte_size_invalid");
  }
  if (manifest.canonicalAuthority !== "pantavion") {
    throw new Error("water_canonical_authority_must_be_pantavion");
  }
  if (manifest.role === "raw-master" && !manifest.immutable) {
    throw new Error("water_raw_master_must_be_immutable");
  }
  if (manifest.role !== "raw-master" && !manifest.lineage) {
    throw new Error("water_derived_artifact_lineage_required");
  }

  return manifest;
}

export function evaluatePantavionWaterSovereigntyReadiness(
  input: PantavionWaterSovereigntyReadinessInput,
) {
  const blockers: string[] = [];

  if (!input.canonicalManifestStored) {
    blockers.push("Pantavion canonical manifest is not stored.");
  }
  if (!input.rawMasterHashVerified) {
    blockers.push("Raw master SHA-256 has not been verified.");
  }
  if (input.rawMasterReplicaCount < 2) {
    blockers.push("At least two verified raw-master replicas are required.");
  }
  if (!input.derivedLineageRecorded) {
    blockers.push("Derived GIS lineage is not recorded.");
  }
  if (!input.providerAdapterAbstracted) {
    blockers.push("Provider implementation is not isolated behind a Pantavion adapter.");
  }
  if (!input.clientProviderNeutral) {
    blockers.push("Client still depends on provider-specific URLs or identifiers.");
  }
  if (!input.backupRestoreTested) {
    blockers.push("Backup restore has not been tested.");
  }
  if (!input.selfHostedExitPathDefined) {
    blockers.push("Self-hosted exit path is not defined.");
  }
  if (!input.fullApplicationRecoveryPackStored) {
    blockers.push("Full Pantavion application recovery pack is not stored.");
  }
  if (!input.databaseSchemaRecoveryStored) {
    blockers.push("Database schema/migration recovery set is not stored.");
  }
  if (!input.gisRecoveryStored) {
    blockers.push("GIS source/derived recovery set is not stored.");
  }
  if (!input.secondaryRuntimeReady) {
    blockers.push("Independent secondary runtime is not ready.");
  }
  if (!input.automaticFailoverTested) {
    blockers.push("Automatic failover has not been tested.");
  }
  if (!input.providerOutageDrillPassed) {
    blockers.push("Provider outage drill has not passed.");
  }

  return {
    version: PANTAVION_WATER_SOVEREIGN_GIS_VERSION,
    sovereignReady: blockers.length === 0,
    blockers,
    doctrine: {
      canonicalAuthority: "pantavion" as const,
      providersAreExecutionAdaptersOnly: true,
      rawMastersImmutable: true,
      rawMasterMinimumVerifiedReplicas: 2,
      derivedArtifactsMustRecordLineage: true,
      browserMayReceiveRawMaster: false,
      browserMayDependOnProviderSpecificObjectKeys: false,
      mapLibreTalksToPantavionBoundaryOnly: true,
      providerFailureMustNotEraseCanonicalIdentity: true,
      selfHostedReplacementMustRemainPossible: true,
      thirdPartyRemovalMustNotRequireViewerRewrite: true,
      noSingleProviderMayBecomeSourceTruth: true,
      fullApplicationRecoveryPackRequired: true,
      independentSecondaryRuntimeRequired: true,
      automaticFailoverTestRequired: true,
      providerOutageDrillRequired: true,
    },
  };
}

export function getPantavionWaterSovereignGisContract() {
  return {
    version: PANTAVION_WATER_SOVEREIGN_GIS_VERSION,
    authority: "pantavion" as const,
    ownership: {
      canonicalManifest: "pantavion" as const,
      sourceHashes: "pantavion" as const,
      accessPolicy: "pantavion" as const,
      conversionLineage: "pantavion" as const,
      mapRegistry: "pantavion" as const,
    },
    providerRole: "replaceable-execution-adapter" as const,
    storagePolicy: {
      rawMasterImmutable: true,
      minimumVerifiedRawMasterReplicas: 2,
      contentAddressedIdentityRequired: true,
      providerSpecificLocatorServerSideOnly: true,
      publicRawMasterAllowed: false,
      destructiveProviderCleanupMayNotDeleteCanonicalManifest: true,
    },
    servingPolicy: {
      frontendBoundary: "pantavion-api" as const,
      renderer: "maplibre" as const,
      rawMasterToBrowserAllowed: false,
      completeNetworkToBrowserAllowed: false,
      providerSpecificClientCredentialsAllowed: false,
      providerSpecificClientObjectKeysAllowed: false,
    },
    independencePolicy: {
      selfHostedObjectStorageSupported: true,
      selfHostedTileServingSupported: true,
      externalCdnOptional: true,
      externalConversionEngineOptional: true,
      providerMigrationWithoutMapIdentityChange: true,
      providerMigrationWithoutViewerRewrite: true,
    },
  };
}
