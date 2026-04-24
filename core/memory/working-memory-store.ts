// core/memory/working-memory-store.ts

import { listThreads } from './thread-registry';
import { listCommitments } from './commitment-registry';
import { listReminders } from './reminder-scheduler';
import { listBackgroundPreparationJobs } from './background-preparation-queue';

export type PantavionWorkingMemoryItemType =
  | 'active-thread'
  | 'pending-commitment'
  | 'pending-reminder'
  | 'ready-preparation';

export type PantavionWorkingMemoryPriority =
  | 'low'
  | 'medium'
  | 'high';

export interface PantavionWorkingMemoryRecord {
  workingKey: string;
  userId: string;
  threadId?: string;
  itemType: PantavionWorkingMemoryItemType;
  title: string;
  priority: PantavionWorkingMemoryPriority;
  sourceTimestamp: string;
}

export interface PantavionWorkingMemorySnapshot {
  generatedAt: string;
  workingCount: number;
  activeThreadCount: number;
  pendingCommitmentCount: number;
  pendingReminderCount: number;
  readyPreparationCount: number;
  highPriorityCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function listWorkingMemories(): PantavionWorkingMemoryRecord[] {
  const threads = listThreads()
    .filter((item) => item.status === 'active')
    .map((item, index) => ({
      workingKey: `working_thread_${index + 1}_${item.threadId}`,
      userId: item.userId,
      threadId: item.threadId,
      itemType: 'active-thread' as const,
      title: item.title,
      priority: item.resolutionState === 'unresolved' ? 'high' as const : 'medium' as const,
      sourceTimestamp: item.updatedAt,
    }));

  const commitments = listCommitments()
    .filter((item) => item.status !== 'completed' && item.status !== 'cancelled')
    .map((item, index) => ({
      workingKey: `working_commitment_${index + 1}_${item.commitmentId}`,
      userId: item.userId,
      threadId: item.threadId,
      itemType: 'pending-commitment' as const,
      title: item.title,
      priority:
        item.priority === 'critical' || item.priority === 'high'
          ? 'high' as const
          : 'medium' as const,
      sourceTimestamp: item.updatedAt,
    }));

  const reminders = listReminders()
    .filter((item) => item.notificationStatus === 'pending' || item.notificationStatus === 'snoozed')
    .map((item, index) => ({
      workingKey: `working_reminder_${index + 1}_${item.reminderId}`,
      userId: item.userId,
      threadId: item.threadId,
      itemType: 'pending-reminder' as const,
      title: item.title,
      priority: 'medium' as const,
      sourceTimestamp: item.updatedAt,
    }));

  const jobs = listBackgroundPreparationJobs()
    .filter((item) => item.status === 'ready' || item.status === 'queued' || item.status === 'running')
    .map((item, index) => ({
      workingKey: `working_preparation_${index + 1}_${item.preparationJobId}`,
      userId: item.userId,
      threadId: item.threadId,
      itemType: 'ready-preparation' as const,
      title: item.title,
      priority: item.status === 'ready' ? 'high' as const : 'medium' as const,
      sourceTimestamp: item.queuedAt,
    }));

  return [...threads, ...commitments, ...reminders, ...jobs].sort((left, right) =>
    right.sourceTimestamp.localeCompare(left.sourceTimestamp),
  );
}

export function getWorkingMemorySnapshot(): PantavionWorkingMemorySnapshot {
  const list = listWorkingMemories();

  return {
    generatedAt: nowIso(),
    workingCount: list.length,
    activeThreadCount: list.filter((item) => item.itemType === 'active-thread').length,
    pendingCommitmentCount: list.filter((item) => item.itemType === 'pending-commitment').length,
    pendingReminderCount: list.filter((item) => item.itemType === 'pending-reminder').length,
    readyPreparationCount: list.filter((item) => item.itemType === 'ready-preparation').length,
    highPriorityCount: list.filter((item) => item.priority === 'high').length,
  };
}

export default listWorkingMemories;
