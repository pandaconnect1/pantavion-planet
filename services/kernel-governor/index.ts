import type { PantavionIntake } from '../../types/pantavion';
import { processKernelIntake, type KernelResult } from '../../core/kernel/kernel';
import type { RuntimeJobEnvelope, RuntimeJobResult } from '../runtime-types';

export interface KernelGovernorPayload {
  intake: PantavionIntake;
}

export type KernelGovernorJob = RuntimeJobEnvelope<KernelGovernorPayload>;

export function runKernelGovernorCycle(job: KernelGovernorJob): RuntimeJobResult<KernelResult> {
  const kernelResult = processKernelIntake(job.payload.intake);

  return {
    jobId: job.id,
    status: kernelResult.policy.allowed ? 'completed' : 'blocked',
    summary: kernelResult.buildRecommendation.rationale,
    result: kernelResult,
    blockers: kernelResult.policy.blockers,
    warnings: kernelResult.gaps.map((gap) => `${gap.id}:${gap.severity}`),
  };
}