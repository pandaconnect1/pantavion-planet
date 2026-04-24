// core/memory/memory-thread-kernel.ts

import { appendMemoryEvent, getMemoryEventLogSnapshot } from './memory-event-log';
import { createThread, touchThread, getThreadRegistrySnapshot } from './thread-registry';
import { upsertCanonicalFact, getFactRegistrySnapshot } from './fact-registry';
import { createCommitment, updateCommitment, getCommitmentRegistrySnapshot } from './commitment-registry';
import { scheduleReminder, getReminderSchedulerSnapshot } from './reminder-scheduler';
import { queueBackgroundPreparation, updateBackgroundPreparation, getBackgroundPreparationSnapshot } from './background-preparation-queue';
import { buildContinuityRecallBundle } from './continuity-recall-policy';
import { saveKernelState } from '../storage/kernel-state-store';

export interface PantavionMemoryThreadKernelWaveOutput {
  generatedAt: string;
  userId: string;
  sessionId: string;
  threadId: string;
  eventSnapshot: ReturnType<typeof getMemoryEventLogSnapshot>;
  threadSnapshot: ReturnType<typeof getThreadRegistrySnapshot>;
  factSnapshot: ReturnType<typeof getFactRegistrySnapshot>;
  commitmentSnapshot: ReturnType<typeof getCommitmentRegistrySnapshot>;
  reminderSnapshot: ReturnType<typeof getReminderSchedulerSnapshot>;
  preparationSnapshot: ReturnType<typeof getBackgroundPreparationSnapshot>;
  recallBundle: ReturnType<typeof buildContinuityRecallBundle>;
  rendered: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function createId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${random}`;
}

function addDays(base: Date, days: number): string {
  const copy = new Date(base.getTime());
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy.toISOString();
}

function renderWave(output: PantavionMemoryThreadKernelWaveOutput): string {
  return [
    'PANTAVION MEMORY THREAD KERNEL WAVE',
    `generatedAt=${output.generatedAt}`,
    `userId=${output.userId}`,
    `sessionId=${output.sessionId}`,
    `threadId=${output.threadId}`,
    '',
    'SNAPSHOTS',
    `eventCount=${output.eventSnapshot.eventCount}`,
    `threadCount=${output.threadSnapshot.threadCount}`,
    `factCount=${output.factSnapshot.factCount}`,
    `commitmentCount=${output.commitmentSnapshot.commitmentCount}`,
    `reminderCount=${output.reminderSnapshot.reminderCount}`,
    `preparationJobCount=${output.preparationSnapshot.jobCount}`,
    '',
    output.recallBundle.rendered,
  ].join('\n');
}

export async function runMemoryThreadKernelWave(): Promise<PantavionMemoryThreadKernelWaveOutput> {
  const userId = 'user_demo_primary';
  const sessionId = createId('ses');
  const now = new Date();

  const thread = createThread({
    userId,
    title: 'Pantavion Memory / Thread Kernel Foundation',
    tags: ['memory', 'thread', 'continuity', 'journal'],
    metadata: {
      journalStyle: true,
      origin: 'memory-thread-kernel-wave',
    },
  });

  appendMemoryEvent({
    userId,
    threadId: thread.threadId,
    sessionId,
    actorRole: 'user',
    eventClass: 'user-message',
    timezone: 'UTC',
    title: 'User vision statement',
    content:
      'Θέλω ο κάθε χρήστης να έχει δικό του AI με μνήμη, ημερομηνία, ώρα, νήματα, υπενθυμίσεις και background συνέχεια.',
    summary: 'User requested personal AI diary, memory, thread continuity and reminders.',
    tags: ['vision', 'memory', 'threads'],
    metadata: {
      pageType: 'journal-entry',
    },
  });

  appendMemoryEvent({
    userId,
    threadId: thread.threadId,
    sessionId,
    actorRole: 'ai',
    eventClass: 'ai-message',
    timezone: 'UTC',
    title: 'Kernel plan response',
    content:
      'Το Pantavion θα αποκτήσει memory event log, thread registry, fact registry, commitments, reminders και background preparation queue.',
    summary: 'AI proposed the memory and thread kernel structure.',
    tags: ['plan', 'kernel', 'memory'],
    metadata: {
      pageType: 'assistant-response',
    },
  });

  const fact = upsertCanonicalFact({
    factKey: 'vision.personal-ai-diary',
    userId,
    threadId: thread.threadId,
    factType: 'goal',
    value: {
      personalMemory: true,
      threads: true,
      reminders: true,
      backgroundPreparation: true,
      timestamps: true,
    },
    confidence: 0.98,
    sourceSummary: 'User wants a personal AI diary with continuity and reminders.',
    tags: ['vision', 'diary', 'continuity'],
    metadata: {
      sourceEventClass: 'user-message',
    },
  });

  appendMemoryEvent({
    userId,
    threadId: thread.threadId,
    sessionId,
    actorRole: 'system',
    eventClass: 'fact-record',
    timezone: 'UTC',
    title: 'Canonical fact recorded',
    content:
      'Recorded canonical fact: user wants a personal AI diary with continuity, reminders and timestamped memory.',
    summary: 'System recorded a canonical fact from the thread.',
    tags: ['fact', 'canonical', 'memory'],
    metadata: {
      factId: fact.factId,
      factKey: fact.factKey,
    },
  });

  const dueAt = addDays(now, 7);

  const commitment = createCommitment({
    userId,
    threadId: thread.threadId,
    requestedBy: 'user',
    title: 'Prepare next-stage memory kernel continuation',
    expectedOutcome:
      'Next week the system should be ready to continue with deeper memory/thread kernel expansion.',
    dueAt,
    priority: 'high',
    tags: ['follow-up', 'memory-kernel', 'next-week'],
    metadata: {
      commitmentClass: 'user-requested-follow-up',
    },
  });

  appendMemoryEvent({
    userId,
    threadId: thread.threadId,
    sessionId,
    actorRole: 'system',
    eventClass: 'commitment-record',
    timezone: 'UTC',
    title: 'Commitment created',
    content:
      'Created a follow-up commitment so this thread does not get lost and can return next week.',
    summary: 'System created a scheduled commitment linked to the thread.',
    tags: ['commitment', 'follow-up'],
    metadata: {
      commitmentId: commitment.commitmentId,
      dueAt: commitment.dueAt,
    },
  });

  const reminder = scheduleReminder({
    userId,
    threadId: thread.threadId,
    linkedCommitmentId: commitment.commitmentId,
    title: 'Reminder for memory kernel continuation',
    remindAt: dueAt,
    recurrence: 'once',
    timezone: 'UTC',
    triggerType: 'commitment-due',
    tags: ['reminder', 'continuity'],
    metadata: {
      reminderReason: 'Do not forget next-stage memory work.',
    },
  });

  const job = queueBackgroundPreparation({
    userId,
    threadId: thread.threadId,
    linkedCommitmentId: commitment.commitmentId,
    plannedFor: dueAt,
    preparationType: 'follow-up-plan',
    title: 'Prepare background continuation pack',
    description:
      'Prepare the next-step continuation context so the user can resume without losing the thread.',
    tags: ['background', 'preparation', 'continuity'],
    metadata: {
      reminderId: reminder.reminderId,
    },
  });

  updateCommitment({
    commitmentId: commitment.commitmentId,
    status: 'scheduled',
  });

  updateBackgroundPreparation({
    preparationJobId: job.preparationJobId,
    status: 'ready',
  });

  touchThread({
    threadId: thread.threadId,
    status: 'active',
    resolutionState: 'in-progress',
    markRecalled: true,
  });

  const recallBundle = buildContinuityRecallBundle({
    userId,
    activeThreadId: thread.threadId,
    queryText: 'Show the active continuity state for this user diary thread.',
  });

  const output: PantavionMemoryThreadKernelWaveOutput = {
    generatedAt: nowIso(),
    userId,
    sessionId,
    threadId: thread.threadId,
    eventSnapshot: getMemoryEventLogSnapshot(),
    threadSnapshot: getThreadRegistrySnapshot(),
    factSnapshot: getFactRegistrySnapshot(),
    commitmentSnapshot: getCommitmentRegistrySnapshot(),
    reminderSnapshot: getReminderSchedulerSnapshot(),
    preparationSnapshot: getBackgroundPreparationSnapshot(),
    recallBundle,
    rendered: '',
  };

  output.rendered = renderWave(output);

  saveKernelState({
    key: 'memory.thread-kernel.latest',
    kind: 'report',
    payload: {
      userId: output.userId,
      sessionId: output.sessionId,
      threadId: output.threadId,
      eventSnapshot: output.eventSnapshot,
      threadSnapshot: output.threadSnapshot,
      factSnapshot: output.factSnapshot,
      commitmentSnapshot: output.commitmentSnapshot,
      reminderSnapshot: output.reminderSnapshot,
      preparationSnapshot: output.preparationSnapshot,
      recallBundle: output.recallBundle,
    },
    tags: ['memory', 'thread', 'kernel', 'latest'],
    metadata: {
      userId: output.userId,
      threadId: output.threadId,
      eventCount: output.eventSnapshot.eventCount,
      reminderCount: output.reminderSnapshot.reminderCount,
      preparationJobCount: output.preparationSnapshot.jobCount,
    },
  });

  return output;
}

export default runMemoryThreadKernelWave;
