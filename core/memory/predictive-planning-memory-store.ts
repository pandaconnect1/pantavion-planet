// core/memory/predictive-planning-memory-store.ts

import { listCommitments } from './commitment-registry';
import { listReminders } from './reminder-scheduler';
import { listBackgroundPreparationJobs } from './background-preparation-queue';
import { listThreads } from './thread-registry';

export type PantavionPredictiveSignalType =
  | 'follow-up-risk'
  | 'continuity-opportunity'
  | 'preparation-needed'
  | 'thread-reactivation';

export interface PantavionPredictivePlanningMemoryRecord {
  predictionKey: string;
  signalType: PantavionPredictiveSignalType;
  userId: string;
  threadId?: string;
  recommendation: string;
  confidence: number;
  anchorTime: string;
}

export interface PantavionPredictivePlanningMemorySnapshot {
  generatedAt: string;
  predictiveCount: number;
  followUpRiskCount: number;
  continuityOpportunityCount: number;
  preparationNeededCount: number;
  threadReactivationCount: number;
  highConfidenceCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function listPredictivePlanningMemories(): PantavionPredictivePlanningMemoryRecord[] {
  const commitments = listCommitments()
    .filter((item) => item.status === 'scheduled' || item.status === 'open' || item.status === 'ready')
    .map((item, index) => ({
      predictionKey: `predictive_commitment_${index + 1}_${item.commitmentId}`,
      signalType: 'follow-up-risk' as const,
      userId: item.userId,
      threadId: item.threadId,
      recommendation: `Prepare or follow up on commitment "${item.title}" before it becomes stale.`,
      confidence: 0.9,
      anchorTime: item.dueAt ?? item.updatedAt,
    }));

  const reminders = listReminders()
    .filter((item) => item.notificationStatus === 'pending')
    .map((item, index) => ({
      predictionKey: `predictive_reminder_${index + 1}_${item.reminderId}`,
      signalType: 'continuity-opportunity' as const,
      userId: item.userId,
      threadId: item.threadId,
      recommendation: `Use reminder "${item.title}" to reactivate continuity at the right time.`,
      confidence: 0.82,
      anchorTime: item.remindAt,
    }));

  const jobs = listBackgroundPreparationJobs()
    .filter((item) => item.status === 'queued' || item.status === 'ready')
    .map((item, index) => ({
      predictionKey: `predictive_job_${index + 1}_${item.preparationJobId}`,
      signalType: 'preparation-needed' as const,
      userId: item.userId,
      threadId: item.threadId,
      recommendation: `Advance preparation job "${item.title}" before the linked thread needs it.`,
      confidence: 0.86,
      anchorTime: item.plannedFor ?? item.queuedAt,
    }));

  const threads = listThreads()
    .filter((item) => item.status === 'paused' || item.resolutionState === 'unresolved')
    .map((item, index) => ({
      predictionKey: `predictive_thread_${index + 1}_${item.threadId}`,
      signalType: 'thread-reactivation' as const,
      userId: item.userId,
      threadId: item.threadId,
      recommendation: `Revisit thread "${item.title}" to prevent continuity degradation.`,
      confidence: 0.78,
      anchorTime: item.updatedAt,
    }));

  return [...commitments, ...reminders, ...jobs, ...threads].sort((left, right) =>
    right.anchorTime.localeCompare(left.anchorTime),
  );
}

export function getPredictivePlanningMemorySnapshot(): PantavionPredictivePlanningMemorySnapshot {
  const list = listPredictivePlanningMemories();

  return {
    generatedAt: nowIso(),
    predictiveCount: list.length,
    followUpRiskCount: list.filter((item) => item.signalType === 'follow-up-risk').length,
    continuityOpportunityCount: list.filter((item) => item.signalType === 'continuity-opportunity').length,
    preparationNeededCount: list.filter((item) => item.signalType === 'preparation-needed').length,
    threadReactivationCount: list.filter((item) => item.signalType === 'thread-reactivation').length,
    highConfidenceCount: list.filter((item) => item.confidence >= 0.85).length,
  };
}

export default listPredictivePlanningMemories;
