import type { PantavionCommonServiceId } from "@/core/kernel/common/pantavion-common-services";
import type {
  PantavionKernelRisk,
  PantavionBenchmarkRegion
} from "@/core/kernel/autonomous-build/autonomous-kernel-types";

export type PantavionIntakeSourceKind =
  | "legacy_repo"
  | "current_repo_file"
  | "vercel_deployment"
  | "github_history"
  | "static_prototype"
  | "unfinished_route"
  | "unfinished_component"
  | "old_zip_or_export"
  | "founder_instruction"
  | "user_demand"
  | "external_benchmark";

export type PantavionIntakeStatus =
  | "discovered"
  | "classified"
  | "mapped_to_existing_capability"
  | "new_capability_candidate"
  | "needs_founder_review"
  | "ready_for_work_order"
  | "blocked";

export type PantavionIntakeAction =
  | "preserve"
  | "merge"
  | "convert_to_real_route"
  | "convert_to_kernel_candidate"
  | "extract_requirements"
  | "reject_as_duplicate"
  | "block_for_safety"
  | "request_founder_decision";

export type PantavionProjectIntakeRecord = {
  intakeId: string;
  title: string;
  sourceKind: PantavionIntakeSourceKind;
  sourceReference: string;
  status: PantavionIntakeStatus;
  proposedAction: PantavionIntakeAction;
  mappedCapabilityIds: string[];
  proposedCapabilityTitle?: string;
  proposedKernelId?: string;
  usefulSignals: string[];
  staticOrPrototypeSignals: string[];
  realImplementationRequirements: string[];
  requiredSharedServices: PantavionCommonServiceId[];
  benchmarkRegions: PantavionBenchmarkRegion[];
  risk: PantavionKernelRisk;
  founderReportRequired: boolean;
  notes: string[];
};

export type PantavionProjectIntakeReport = {
  totalRecords: number;
  legacyRepos: number;
  staticPrototypes: number;
  unfinishedRoutes: number;
  newCapabilityCandidates: number;
  founderReviewRequired: number;
  blocked: number;
};
