// core/memory/continuity-recall-policy.ts

import { listMemoryEventsByUser } from './memory-event-log';
import { listThreadsByUser } from './thread-registry';
import { listCanonicalFactsByUser } from './fact-registry';
import { listCommitmentsByUser } from './commitment-registry';
import { listRemindersByUser } from './reminder-scheduler';
import { listBackgroundPreparationJobsByUser } from './background-preparation-queue';

export interface PantavionContinuityRecallInput {
  userId: string;
  activeThreadId?: string;
  queryText?: string;
}

export interface PantavionContinuityRecallBundle {
  generatedAt: string;
  userId: string;
  activeThreadId?: string;
  recentEvents: ReturnType<typeof listMemoryEventsByUser>;
  activeThreads: ReturnType<typeof listThreadsByUser>;
  canonicalFacts: ReturnType<typeof listCanonicalFactsByUser>;
  pendingCommitments: ReturnType<typeof listCommitmentsByUser>;
  pendingReminders: ReturnType<typeof listRemindersByUser>;
  preparationJobs: ReturnType<typeof listBackgroundPreparationJobsByUser>;
  notes: string[];
  rendered: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function renderRecallBundle(
  bundle: PantavionContinuityRecallBundle,
): string {
  return [
    'PANTAVION CONTINUITY RECALL BUNDLE',
    `generatedAt=${bundle.generatedAt}`,
    `userId=${bundle.userId}`,
    `activeThreadId=${bundle.activeThreadId ?? ''}`,
    `recentEventCount=${bundle.recentEvents.length}`,
    `activeThreadCount=${bundle.activeThreads.length}`,
    `factCount=${bundle.canonicalFacts.length}`,
    `pendingCommitmentCount=${bundle.pendingCommitments.length}`,
    `pendingReminderCount=${bundle.pendingReminders.length}`,
    `preparationJobCount=${bundle.preparationJobs.length}`,
    '',
    'NOTES',
    ...bundle.notes.map((item) => `- ${item}`),
  ].join('\n');
}

export function buildContinuityRecallBundle(
  input: PantavionContinuityRecallInput,
): PantavionContinuityRecallBundle {
  const recentEvents = listMemoryEventsByUser(input.userId).slice(0, 12);
  const activeThreads = listThreadsByUser(input.userId).filter(
    (item) => item.status !== 'archived',
  );
  const canonicalFacts = listCanonicalFactsByUser(input.userId).slice(0, 12);
  const pendingCommitments = listCommitmentsByUser(input.userId).filter(
    (item) => item.status !== 'completed' && item.status !== 'cancelled',
  );
  const pendingReminders = listRemindersByUser(input.userId).filter(
    (item) => item.notificationStatus === 'pending' || item.notificationStatus === 'snoozed',
  );
  const preparationJobs = listBackgroundPreparationJobsByUser(input.userId).filter(
    (item) => item.status !== 'completed' && item.status !== 'cancelled',
  );

  const notes = [
    activeThreads.length > 0
      ? 'User has active threads that preserve continuity.'
      : 'No active threads found.',
    pendingCommitments.length > 0
      ? 'User has open commitments that require follow-up.'
      : 'No open commitments found.',
    pendingReminders.length > 0
      ? 'User has pending reminders in the scheduler.'
      : 'No pending reminders found.',
    preparationJobs.length > 0
      ? 'User has background preparation jobs queued or active.'
      : 'No background preparation jobs found.',
    input.queryText
      ? `Recall query: ${input.queryText}`
      : 'No explicit recall query provided.',
  ];

  const bundle: PantavionContinuityRecallBundle = {
    generatedAt: nowIso(),
    userId: input.userId,
    activeThreadId: input.activeThreadId,
    recentEvents,
    activeThreads,
    canonicalFacts,
    pendingCommitments,
    pendingReminders,
    preparationJobs,
    notes,
    rendered: '',
  };

  bundle.rendered = renderRecallBundle(bundle);
  return bundle;
}

export default buildContinuityRecallBundle;
