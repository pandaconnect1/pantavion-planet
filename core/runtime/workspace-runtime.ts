export interface PantavionWorkspaceRuntimeContext {
  workspaceId: string;
  region?: string;
  features: string[];
  metadata: Record<string, unknown>;
}

export function createWorkspaceRuntimeContext(input: {
  workspaceId: string;
  region?: string;
  features?: string[];
  metadata?: Record<string, unknown>;
}): PantavionWorkspaceRuntimeContext {
  return {
    workspaceId: input.workspaceId,
    region: input.region,
    features: input.features ?? [],
    metadata: input.metadata ?? {},
  };
}