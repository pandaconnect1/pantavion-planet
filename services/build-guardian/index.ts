import type { BuildHealthReport, RuntimeJobEnvelope, RuntimeJobResult } from '../runtime-types';

export interface BuildGuardianPayload {
  buildPassed: boolean;
  typecheckPassed: boolean;
  warnings?: string[];
  blockers?: string[];
}

export type BuildGuardianJob = RuntimeJobEnvelope<BuildGuardianPayload>;

export function summarizeBuildHealth(job: BuildGuardianJob): RuntimeJobResult<BuildHealthReport> {
  const report: BuildHealthReport = {
    buildPassed: job.payload.buildPassed,
    typecheckPassed: job.payload.typecheckPassed,
    warnings: job.payload.warnings ?? [],
    blockers: job.payload.blockers ?? [],
  };

  const healthy = report.buildPassed && report.typecheckPassed && report.blockers.length === 0;

  return {
    jobId: job.id,
    status: healthy ? 'completed' : 'blocked',
    summary: healthy ? 'Build guardian reports healthy repository state.' : 'Build guardian detected blocking repository state.',
    result: report,
    blockers: report.blockers,
    warnings: report.warnings,
  };
}