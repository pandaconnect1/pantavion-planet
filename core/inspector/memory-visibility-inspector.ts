// core/inspector/memory-visibility-inspector.ts

import { listMemoryEvents } from '../memory/memory-event-log';
import { listThreads } from '../memory/thread-registry';
import { listCanonicalFacts } from '../memory/fact-registry';
import { listCommitments } from '../memory/commitment-registry';
import { listReminders } from '../memory/reminder-scheduler';
import { listBackgroundPreparationJobs } from '../memory/background-preparation-queue';

export interface PantavionMemoryVisibilitySnapshot {
  generatedAt: string;
  eventCount: number;
  threadCount: number;
  factCount: number;
  commitmentCount: number;
  reminderCount: number;
  preparationJobCount: number;
  unresolvedThreadCount: number;
  pendingCommitmentCount: number;
  pendingReminderCount: number;
  readyPreparationCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function buildMemoryVisibilitySnapshot(): PantavionMemoryVisibilitySnapshot {
  const events = listMemoryEvents();
  const threads = listThreads();
  const facts = listCanonicalFacts();
  const commitments = listCommitments();
  const reminders = listReminders();
  const jobs = listBackgroundPreparationJobs();

  return {
    generatedAt: nowIso(),
    eventCount: events.length,
    threadCount: threads.length,
    factCount: facts.length,
    commitmentCount: commitments.length,
    reminderCount: reminders.length,
    preparationJobCount: jobs.length,
    unresolvedThreadCount: threads.filter((item) => item.resolutionState !== 'resolved').length,
    pendingCommitmentCount: commitments.filter(
      (item) => item.status !== 'completed' && item.status !== 'cancelled',
    ).length,
    pendingReminderCount: reminders.filter(
      (item) => item.notificationStatus === 'pending' || item.notificationStatus === 'snoozed',
    ).length,
    readyPreparationCount: jobs.filter(
      (item) => item.status === 'ready' || item.status === 'queued' || item.status === 'running',
    ).length,
  };
}

export default buildMemoryVisibilitySnapshot;
