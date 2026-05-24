import type {
  ApprovalItem,
  BuildHealthReport,
  ControlRoomSnapshot,
  RepoFinding,
} from '../runtime-types';

export function createControlRoomSnapshot(input: {
  approvals: ApprovalItem[];
  findings: RepoFinding[];
  build: BuildHealthReport;
}): ControlRoomSnapshot {
  const criticalFindings = input.findings.filter((item) => item.severity === 'critical').length;
  const blockingBuilds = input.build.buildPassed && input.build.typecheckPassed && input.build.blockers.length === 0 ? 0 : 1;

  return {
    generatedAt: new Date().toISOString(),
    openApprovals: input.approvals.filter((item) => item.required).length,
    criticalFindings,
    blockingBuilds,
    summary: blockingBuilds || criticalFindings
      ? 'Control room reports blocking conditions.'
      : 'Control room reports stable baseline.',
  };
}