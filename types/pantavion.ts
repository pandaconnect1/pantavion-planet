export type PantavionTruthZone = 'deterministic' | 'verified' | 'generative';
export type PantavionSensitivity = 'public' | 'internal' | 'confidential' | 'restricted' | 'critical';
export type PantavionPriority = 'low' | 'normal' | 'high' | 'critical';
export type PantavionPrincipalType = 'human' | 'agent' | 'service' | 'system';
export type PantavionScope =
  | 'read'
  | 'write'
  | 'execute'
  | 'delegate'
  | 'approve'
  | 'admin'
  | 'memory'
  | 'policy'
  | 'identity'
  | 'ops'
  | 'protocol';

export type PantavionDomain =
  | 'kernel'
  | 'canonical'
  | 'capability'
  | 'security'
  | 'admin'
  | 'identity'
  | 'protocol'
  | 'runtime'
  | 'workspace'
  | 'voice'
  | 'memory'
  | 'research'
  | 'build'
  | 'general';

export interface PantavionActorRef {
  id: string;
  type?: PantavionPrincipalType;
  displayName?: string;
  roles?: string[];
  scopes?: PantavionScope[];
  region?: string;
  verified?: boolean;
}

export interface PantavionWorkspaceRef {
  id: string;
  region?: string;
  tier?: string;
  labels?: string[];
}

export interface PantavionIntakeAsset {
  id: string;
  type: 'text' | 'note' | 'image' | 'audio' | 'video' | 'pdf' | 'doc' | 'mixed';
  name?: string;
  mimeType?: string;
  uri?: string;
  sensitivity?: PantavionSensitivity;
  metadata?: Record<string, unknown>;
}

export interface PantavionIntake {
  id: string;
  title?: string;
  content: string;
  truthZone?: PantavionTruthZone;
  priority?: PantavionPriority;
  sensitivity?: PantavionSensitivity;
  domainHint?: PantavionDomain;
  intentHint?: string;
  sender?: PantavionActorRef;
  workspace?: PantavionWorkspaceRef;
  assets?: PantavionIntakeAsset[];
  metadata?: Record<string, unknown>;
}

export interface PantavionGap {
  id: string;
  category: 'capability' | 'policy' | 'identity' | 'canonical' | 'runtime' | 'protocol' | 'memory' | 'observability';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  actionable: boolean;
}

export interface PantavionBuildRecommendation {
  mode: 'runtime-config' | 'register-and-build' | 'build-new' | 'hold-for-review' | 'blocked';
  rationale: string;
  targetPath?: string;
  requiredChecks: string[];
  suggestedNextSteps: string[];
}

export interface PantavionAdminAlert {
  id: string;
  level: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  tags: string[];
  createdAt: string;
  metadata?: Record<string, unknown>;
}