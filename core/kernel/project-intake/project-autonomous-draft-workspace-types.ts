export type PantavionAutonomousDraftWorkspaceMode =
  | "isolated_autonomous_draft"
  | "kernel_supervised_draft";

export type PantavionAutonomousDraftWorkspaceStatus =
  | "ready_for_patch_writer"
  | "waiting_for_kernel_supervision"
  | "blocked";

export type PantavionAutonomousDraftWorkspaceItem = {
  workspaceId: string;
  dispatchId: string;
  workOrderId: string;
  title: string;
  mode: PantavionAutonomousDraftWorkspaceMode;
  status: PantavionAutonomousDraftWorkspaceStatus;
  route?: string;
  priority: string;
  kind: string;
  risk: string;
  mappedCapabilityIds: string[];
  allowedToCreatePatchDraft: boolean;
  allowedToWriteSourceDirectly: false;
  allowedToRunBuild: boolean;
  allowedToRunTypecheck: boolean;
  allowedToPrepareCommit: false;
  allowedToDeployProduction: false;
  requiredArtifacts: string[];
  blockedRules: string[];
  founderReportRequired: boolean;
};

export type PantavionAutonomousDraftWorkspaceReport = {
  generatedAt: string;
  sourceGeneratedAt: string;
  totalWorkspaceItems: number;
  readyForPatchWriter: number;
  waitingForKernelSupervision: number;
  blocked: number;
  workspaceItems: PantavionAutonomousDraftWorkspaceItem[];
};
