import type { PantavionIntake } from '../../types/pantavion';
import {
  evaluatePantavionGovernorGuard,
  executionInputFromPantavionIntake,
  type PantavionGovernorExecutionInput,
  type PantavionGovernorGuardResult,
} from '../../core/kernel/pantavion-execution-governor';
import { processKernelIntake, type KernelResult } from '../../core/kernel/kernel';
import type { RuntimeJobEnvelope, RuntimeJobResult } from '../runtime-types';

export interface KernelGovernorPayload {
  intake: PantavionIntake;
  execution?: PantavionGovernorExecutionInput;
}

export interface KernelGovernorResult {
  kernel: KernelResult;
  governor: PantavionGovernorGuardResult | null;
}

export type KernelGovernorJob = RuntimeJobEnvelope<KernelGovernorPayload>;

export function runKernelGovernorCycle(
  job: KernelGovernorJob,
): RuntimeJobResult<KernelGovernorResult> {
  const kernelResult = processKernelIntake(job.payload.intake);
  const executionInput =
    job.payload.execution ||
    executionInputFromPantavionIntake(job.payload.intake);
  const governor = executionInput
    ? evaluatePantavionGovernorGuard(executionInput)
    : null;

  const governorBlocked = governor?.decision === 'HARD_STOP';
  const blocked = !kernelResult.policy.allowed || governorBlocked;

  const blockers = [
    ...kernelResult.policy.blockers,
    ...(governor?.blockers || []),
  ];

  const warnings = [
    ...kernelResult.gaps.map((gap) => `${gap.id}:${gap.severity}`),
    ...(governor?.warnings || []),
  ];

  return {
    jobId: job.id,
    status: blocked ? 'blocked' : 'completed',
    summary: governorBlocked
      ? `Pantavion Governor HARD STOP: ${governor.blockers.join(', ')}`
      : governor
        ? `${kernelResult.buildRecommendation.rationale} Governor: ${governor.decision}.`
        : kernelResult.buildRecommendation.rationale,
    result: {
      kernel: kernelResult,
      governor,
    },
    blockers,
    warnings,
  };
}
