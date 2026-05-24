import type { RepoFinding, RuntimeJobEnvelope, RuntimeJobResult } from '../runtime-types';

export interface RepoGuardianPayload {
  paths: string[];
}

export type RepoGuardianJob = RuntimeJobEnvelope<RepoGuardianPayload>;

const FORBIDDEN_PATTERNS = ['server/pantavion-kernel/', 'tmp/', 'backup/', '.old.'];

export function scanRepoPaths(job: RepoGuardianJob): RuntimeJobResult<RepoFinding[]> {
  const findings: RepoFinding[] = [];

  for (const filePath of job.payload.paths) {
    const normalized = filePath.replace(/\\/g, '/');

    if (FORBIDDEN_PATTERNS.some((pattern) => normalized.includes(pattern))) {
      findings.push({
        id: `finding:${normalized}:forbidden`,
        path: normalized,
        severity: 'high',
        category: 'forbidden',
        message: 'Forbidden or archived pattern detected in repository path.',
      });
    }

    if (normalized.includes('/page.tsx') && normalized.includes('/master-')) {
      findings.push({
        id: `finding:${normalized}:review`,
        path: normalized,
        severity: 'medium',
        category: 'drift',
        message: 'Path appears to contain a high-sensitivity master surface and should remain under review.',
      });
    }
  }

  return {
    jobId: job.id,
    status: findings.some((item) => item.severity === 'high' || item.severity === 'critical') ? 'blocked' : 'completed',
    summary: findings.length ? 'Repo guardian produced findings.' : 'Repo guardian found no blocking patterns.',
    result: findings,
    blockers: findings.filter((item) => item.severity === 'high' || item.severity === 'critical').map((item) => item.id),
    warnings: findings.filter((item) => item.severity === 'medium').map((item) => item.id),
  };
}