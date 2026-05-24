export interface PantavionWorkspaceRuntimeContext {
  workspaceId: string;
  region?: string;
  features: string[];
  metadata: Record<string, unknown>;
}

export interface PantavionWorkspaceRuntime {
  createWorkspaceRuntimeContext: (input: {
    workspaceId: string;
    region?: string;
    features?: string[];
    metadata?: Record<string, unknown>;
  }) => PantavionWorkspaceRuntimeContext;
  getRuntimeSnapshot: () => {
    status: 'ok';
    generatedAt: string;
  };
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

export const workspaceRuntime: PantavionWorkspaceRuntime = {
  createWorkspaceRuntimeContext,
  getRuntimeSnapshot() {
    return {
      status: 'ok',
      generatedAt: new Date().toISOString(),
    };
  },
};