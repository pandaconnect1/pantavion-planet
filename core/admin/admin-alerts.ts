import type { PantavionAdminAlert, PantavionBuildRecommendation, PantavionGap } from '../../types/pantavion';
import type { PolicyEvaluation } from '../security/security-policy';

export function generateAdminAlerts(input: {
  packetId: string;
  policy: PolicyEvaluation;
  gaps: PantavionGap[];
  recommendation: PantavionBuildRecommendation;
}): PantavionAdminAlert[] {
  const now = new Date().toISOString();
  const alerts: PantavionAdminAlert[] = [];

  if (!input.policy.allowed) {
    alerts.push({
      id: `${input.packetId}:policy-blocked`,
      level: 'critical',
      title: 'Kernel policy blocked direct action',
      message: `Direct action was blocked by policy: ${input.policy.blockers.join(', ') || 'unknown blocker'}.`,
      tags: ['policy', 'security', 'kernel'],
      createdAt: now,
    });
  }

  for (const gap of input.gaps) {
    alerts.push({
      id: `${input.packetId}:${gap.id}`,
      level: gap.severity === 'critical' ? 'critical' : gap.severity === 'high' ? 'warning' : 'info',
      title: `Kernel gap detected: ${gap.category}`,
      message: gap.message,
      tags: ['gap', gap.category, gap.severity],
      createdAt: now,
    });
  }

  if (input.recommendation.mode === 'register-and-build' || input.recommendation.mode === 'build-new') {
    alerts.push({
      id: `${input.packetId}:build-readiness`,
      level: 'warning',
      title: 'Kernel requests build preparation',
      message: input.recommendation.rationale,
      tags: ['build', 'readiness', 'kernel'],
      createdAt: now,
      metadata: {
        targetPath: input.recommendation.targetPath,
        checks: input.recommendation.requiredChecks,
      },
    });
  }

  return alerts;
}