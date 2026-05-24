import type { ApprovalItem, RuntimeJobEnvelope, RuntimeJobResult } from '../runtime-types';

export interface ApprovalInboxPayload {
  items: ApprovalItem[];
}

export type ApprovalInboxJob = RuntimeJobEnvelope<ApprovalInboxPayload>;

export function queueApprovals(job: ApprovalInboxJob): RuntimeJobResult<ApprovalItem[]> {
  const requiredItems = job.payload.items.filter((item) => item.required);

  return {
    jobId: job.id,
    status: requiredItems.length ? 'blocked' : 'completed',
    summary: requiredItems.length
      ? 'Approval inbox has required blocking approvals.'
      : 'Approval inbox has no blocking approvals.',
    result: job.payload.items,
    blockers: requiredItems.map((item) => item.id),
    warnings: job.payload.items.filter((item) => !item.required).map((item) => item.id),
  };
}