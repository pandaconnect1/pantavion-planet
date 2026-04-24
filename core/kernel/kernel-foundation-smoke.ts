// core/kernel/kernel-foundation-smoke.ts

import {
  bootPantavionFoundation,
  type PantavionFoundationSnapshot,
} from './kernel-bootstrap';

import type { KernelOutput } from './kernel';

import type { PantavionWorkspaceTaskRunOutput } from '../runtime/workspace-runtime';
import type { PantavionVoiceTurnProcessOutput } from '../runtime/voice-runtime';
import type { PantavionResilienceEvaluation } from '../runtime/resilience-runtime';

export interface PantavionFoundationSmokeResult {
  snapshot: PantavionFoundationSnapshot;
  kernel: {
    recommendationStatus: KernelOutput['recommendation']['status'];
    gapCount: number;
    alertCount: number;
  };
  workspace: {
    taskStatus: PantavionWorkspaceTaskRunOutput['task']['status'];
    executionStatus: PantavionWorkspaceTaskRunOutput['execution']['status'];
  };
  voice: {
    turnStatus: PantavionVoiceTurnProcessOutput['turn']['status'];
    intent: PantavionVoiceTurnProcessOutput['turn']['intent'];
  };
  resilience: {
    mode: PantavionResilienceEvaluation['mode'];
    canContinue: boolean;
  };
}

export async function runPantavionFoundationSmoke(): Promise<PantavionFoundationSmokeResult> {
  const foundation = bootPantavionFoundation();

  const adminIdentity = foundation.resolveIdentity({
    actorId: foundation.actors.adminRoot.id,
    actorType: 'human',
    role: 'admin-operator',
    scopes: ['global'],
    requestedOperation: 'kernel bootstrap smoke',
    requestedSensitivity: 'internal',
  });

  const kernelDecision = await foundation.process({
    title: 'Kernel foundation smoke',
    description: 'Bootstrap-integrated smoke request for Pantavion foundation.',
    inputText:
      'Run bootstrap-aware kernel intake with canonical placement, capability lookup and policy evaluation.',
    requestedOperation: 'build',
    requestedCapabilities: [
      'capability-lookup',
      'policy-evaluation',
      'admin-alert-generation',
    ],
    targetPath: 'core/kernel/kernel.ts',
    targetModule: 'kernel',
    truthPreference: 'deterministic',
    memoryClass: 'session',
    sensitivity: 'internal',
    actor: {
      actorId: adminIdentity.actorId,
      actorType: adminIdentity.actorType,
      role: adminIdentity.effectiveRoles[0],
      scopes: adminIdentity.effectiveScopes,
      trustTierHint: adminIdentity.trustTier,
    },
  });

  const workspace = foundation.workspaceRuntime.createWorkspace({
    workspaceKey: 'foundation-smoke-workspace',
    title: 'Foundation Smoke Workspace',
    description: 'Workspace for canonical smoke validation.',
    visibility: 'private',
    ownerActorId: foundation.actors.adminRoot.id,
    scopes: [{ scopeId: 'global', scopeLabel: 'Global' }],
    metadata: {
      smoke: true,
    },
  });

  const workspaceTask = foundation.workspaceRuntime.createTask({
    workspaceId: workspace.id,
    task: {
      taskKey: 'foundation-smoke-task',
      title: 'Foundation Workspace Task',
      capabilityKey: 'capability-lookup',
      operationKey: 'kernel.route',
      payload: {
        message: 'workspace smoke execution',
      },
      requestedScopes: [{ scopeId: 'global', scopeLabel: 'Global' }],
      requiredEntitlements: [],
      metadata: {
        smoke: true,
      },
    },
  });

  const workspaceResult = await foundation.workspaceRuntime.runTask({
    taskId: workspaceTask.id,
    identity: adminIdentity,
  });

  const voiceSession = foundation.voiceRuntime.createSession({
      locale: 'el-GR',
      mode: 'interpreter',
      metadata: {
        smoke: true,
        sessionKey: 'foundation-smoke-voice',
        title: 'Foundation Smoke Voice Session',
        actorId: foundation.actors.adminRoot.id,
        sourceLanguage: 'el',
        targetLanguage: 'en',
      },
    });

  const voiceResult = await foundation.voiceRuntime.processTurn({
    sessionId: voiceSession.sessionId,
    identity: adminIdentity,
    turn: {
        text: 'Καλημέρα Pantavion',
        intent: 'voice-smoke',
        metadata: {
          smoke: true,
          sourceLanguage: 'el',
          targetLanguage: 'en',
          requestedScopeId: 'global',
        },
      },
  });

  const resilience = foundation.evaluateResilience({
    requestedServices: ['kernel', 'protocol-gateway', 'workspace-runtime', 'voice-runtime'],
    requiresRealtime: true,
    requiresWorkspaceContinuity: true,
    requiresVoiceContinuity: true,
    identity: adminIdentity,
    metadata: {
      smoke: true,
    },
  });

  return {
    snapshot: foundation.getSnapshot(),
    kernel: {
      recommendationStatus: kernelDecision.recommendation.status,
      gapCount: kernelDecision.gaps.length,
      alertCount: kernelDecision.alerts.length,
    },
    workspace: {
      taskStatus: workspaceResult.task.status,
      executionStatus: workspaceResult.execution.status,
    },
    voice: {
      turnStatus: voiceResult.turn.status,
      intent: voiceResult.turn.intent,
    },
    resilience: {
      mode: resilience.mode,
      canContinue: resilience.canContinue,
    },
  };
}

export default runPantavionFoundationSmoke;



