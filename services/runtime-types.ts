export type RuntimeJobType =
  | 'kernel_cycle'
  | 'repo_scan'
  | 'build_verify'
  | 'approval_review'
  | 'market_scan';

export type RuntimeJobPriority = 'low' | 'normal' | 'high' | 'critical';
export type RuntimeJobStatus = 'queued' | 'running' | 'blocked' | 'completed' | 'failed';

export interface RuntimeJobEnvelope<TPayload = Record<string, unknown>> {
  id: string;
  type: RuntimeJobType;
  priority: RuntimeJobPriority;
  createdAt: string;
  payload: TPayload;
  metadata?: Record<string, unknown>;
}

export interface RuntimeJobResult<TResult = Record<string, unknown>> {
  jobId: string;
  status: RuntimeJobStatus;
  summary: string;
  result?: TResult;
  blockers?: string[];
  warnings?: string[];
}

export interface RepoFinding {
  id: string;
  path: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'missing' | 'drift' | 'forbidden' | 'dead-route' | 'duplicate' | 'unknown';
  message: string;
}

export interface BuildHealthReport {
  buildPassed: boolean;
  typecheckPassed: boolean;
  warnings: string[];
  blockers: string[];
}

export const PantavionApprovalTier = {
  STANDARD: 'STANDARD',
  ELEVATED: 'ELEVATED',
  CRITICAL: 'CRITICAL',
} as const;

export type PantavionApprovalTier = typeof PantavionApprovalTier[keyof typeof PantavionApprovalTier];

export const PantavionTrustTier = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;

export type PantavionTrustTier = typeof PantavionTrustTier[keyof typeof PantavionTrustTier];

export interface ApprovalItem {
  id: string;
  kind: 'founder' | 'admin' | 'security' | 'identity' | 'legal';
  title: string;
  summary: string;
  required: boolean;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface ControlRoomSnapshot {
  generatedAt: string;
  openApprovals: number;
  criticalFindings: number;
  blockingBuilds: number;
  summary: string;
}