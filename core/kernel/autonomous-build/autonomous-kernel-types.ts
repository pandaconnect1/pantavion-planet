import type {
  PantavionCapabilityDomain,
  PantavionCapabilityStatus,
  PantavionUniversalLifeCapability
} from "@/core/product/pantavion-universal-life-capabilities";
import type { PantavionCommonServiceId } from "@/core/kernel/common/pantavion-common-services";

export type PantavionKernelClass =
  | "master"
  | "common"
  | "section"
  | "builder"
  | "audit"
  | "maintenance"
  | "intake"
  | "provider"
  | "demand";

export type PantavionAutonomyLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type PantavionKernelRisk =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type PantavionKernelMode =
  | "observe_only"
  | "plan_only"
  | "draft_only"
  | "isolated_autonomous"
  | "founder_approval_required"
  | "blocked";

export type PantavionBenchmarkRegion =
  | "global"
  | "china"
  | "usa"
  | "europe"
  | "japan"
  | "korea"
  | "russia"
  | "india"
  | "southeast_asia"
  | "africa"
  | "latin_america"
  | "oceania";

export type PantavionKernelLifecycle =
  | "candidate"
  | "planned"
  | "foundation"
  | "beta"
  | "live"
  | "maintenance"
  | "deprecated"
  | "blocked";

export type PantavionKernelScope = {
  allowedPaths: string[];
  readOnlySharedPaths: string[];
  forbiddenPaths: string[];
  criticalPaths: string[];
};

export type PantavionKernelPermissions = {
  canDiscover: boolean;
  canPlan: boolean;
  canDraftCode: boolean;
  canWriteOwnScope: boolean;
  canRunTests: boolean;
  canDiagnoseErrors: boolean;
  canRepairOwnScope: boolean;
  canPrepareCommit: boolean;
  canPushWithoutFounder: boolean;
  canDeployWithoutFounder: boolean;
  requiresFounderApprovalForProduction: boolean;
};

export type PantavionKernelDependency = {
  kernelId: string;
  reason: string;
  critical: boolean;
};

export type PantavionKernelRealnessGate = {
  hasRealRoute: boolean;
  hasRealComponent: boolean;
  hasStateModel: boolean;
  hasDataModel: boolean;
  hasApiWhenNeeded: boolean;
  hasProviderWhenNeeded: boolean;
  hasPermissionModel: boolean;
  hasLoadingState: boolean;
  hasEmptyState: boolean;
  hasErrorState: boolean;
  hasTests: boolean;
  passesBuild: boolean;
  passesTypeScript: boolean;
  hasNoFakeButtons: boolean;
};

export type PantavionKernelHealthScore = {
  total: number;
  build: number;
  typeScript: number;
  route: number;
  ui: number;
  data: number;
  provider: number;
  legal: number;
  security: number;
  seo: number;
  userValue: number;
  globalBenchmark: number;
};

export type PantavionKernelFounderReport = {
  summary: string;
  whatExists: string[];
  whatIsMissing: string[];
  staticSurfaces: string[];
  liveSurfaces: string[];
  errors: string[];
  risks: string[];
  proposedRepairs: string[];
  approvalRequired: boolean;
};

export type PantavionKernelManifest = {
  kernelId: string;
  title: string;
  kernelClass: PantavionKernelClass;
  capabilityId: string;
  capabilityTitle: string;
  domain: PantavionCapabilityDomain;
  sourceCapabilityStatus: PantavionCapabilityStatus;
  lifecycle: PantavionKernelLifecycle;
  mode: PantavionKernelMode;
  autonomyLevel: PantavionAutonomyLevel;
  risk: PantavionKernelRisk;
  sharedServices: PantavionCommonServiceId[];
  scope: PantavionKernelScope;
  dependencies: PantavionKernelDependency[];
  permissions: PantavionKernelPermissions;
  realnessGate: PantavionKernelRealnessGate;
  healthScore: PantavionKernelHealthScore;
  benchmarkRegions: PantavionBenchmarkRegion[];
  legalAdaptationRules: string[];
  gapFillingTargets: string[];
  requiredInfrastructure: string[];
  requiredChecks: string[];
  founderReport: PantavionKernelFounderReport;
};

export type PantavionMissingCapabilityRequest = {
  requestId: string;
  userNeed: string;
  requestedBy: "user" | "founder" | "kernel" | "system";
  matchedExistingCapabilityIds: string[];
  proposedCapabilityTitle: string;
  proposedKernelId: string;
  requiredSharedServices: PantavionCommonServiceId[];
  requiredProviders: string[];
  legalSafetyNotes: string[];
  founderReviewRequired: boolean;
};

export type PantavionKernelWorkOrder = {
  workOrderId: string;
  kernelManifest: PantavionKernelManifest;
  capability: PantavionUniversalLifeCapability;
  action: "discover" | "plan" | "draft" | "build" | "test" | "repair" | "promote";
  buildInstructions: string[];
  acceptanceCriteria: string[];
  founderVisible: boolean;
};

export type PantavionMasterKernelSystemReport = {
  totalKernels: number;
  isolatedAutonomous: number;
  founderApprovalRequired: number;
  critical: number;
  plannedOrCandidate: number;
  betaOrLive: number;
  commonServices: number;
};
