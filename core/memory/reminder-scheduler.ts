// core/memory/reminder-scheduler.ts

export type PantavionReminderRecurrence =
  | 'once'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'custom';

export type PantavionReminderTriggerType =
  | 'absolute-time'
  | 'commitment-due'
  | 'thread-reactivation'
  | 'event-follow-up';

export type PantavionReminderNotificationStatus =
  | 'pending'
  | 'sent'
  | 'snoozed'
  | 'cancelled';

export interface PantavionReminderRecord {
  reminderId: string;
  userId: string;
  threadId: string;
  linkedCommitmentId?: string;
  title: string;
  remindAt: string;
  recurrence: PantavionReminderRecurrence;
  timezone: string;
  triggerType: PantavionReminderTriggerType;
  createdAt: string;
  updatedAt: string;
  notificationStatus: PantavionReminderNotificationStatus;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface PantavionReminderInput {
  userId: string;
  threadId: string;
  linkedCommitmentId?: string;
  title: string;
  remindAt: string;
  recurrence?: PantavionReminderRecurrence;
  timezone?: string;
  triggerType?: PantavionReminderTriggerType;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface PantavionReminderSchedulerSnapshot {
  generatedAt: string;
  reminderCount: number;
  pendingCount: number;
  sentCount: number;
  snoozedCount: number;
  cancelledCount: number;
  latestReminderId?: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function createId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${random}`;
}

function uniqStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export class PantavionReminderScheduler {
  private readonly reminders = new Map<string, PantavionReminderRecord>();

  scheduleReminder(input: PantavionReminderInput): PantavionReminderRecord {
    const timestamp = nowIso();

    const record: PantavionReminderRecord = {
      reminderId: createId('rem'),
      userId: input.userId,
      threadId: input.threadId,
      linkedCommitmentId: input.linkedCommitmentId,
      title: input.title,
      remindAt: input.remindAt,
      recurrence: input.recurrence ?? 'once',
      timezone: input.timezone ?? 'UTC',
      triggerType: input.triggerType ?? 'absolute-time',
      createdAt: timestamp,
      updatedAt: timestamp,
      notificationStatus: 'pending',
      tags: uniqStrings(input.tags ?? []),
      metadata: cloneValue(input.metadata ?? {}),
    };

    this.reminders.set(record.reminderId, record);
    return cloneValue(record);
  }

  updateReminder(input: {
    reminderId: string;
    notificationStatus?: PantavionReminderNotificationStatus;
    remindAt?: string;
  }): PantavionReminderRecord | null {
    const existing = this.reminders.get(input.reminderId);
    if (!existing) {
      return null;
    }

    const updated: PantavionReminderRecord = {
      ...existing,
      updatedAt: nowIso(),
      notificationStatus: input.notificationStatus ?? existing.notificationStatus,
      remindAt: input.remindAt ?? existing.remindAt,
    };

    this.reminders.set(updated.reminderId, updated);
    return cloneValue(updated);
  }

  listReminders(): PantavionReminderRecord[] {
    return [...this.reminders.values()]
      .sort((left, right) => left.remindAt.localeCompare(right.remindAt))
      .map((item) => cloneValue(item));
  }

  listRemindersByUser(userId: string): PantavionReminderRecord[] {
    return this.listReminders().filter((item) => item.userId === userId);
  }

  listDueReminders(referenceTime = nowIso()): PantavionReminderRecord[] {
    return this.listReminders().filter(
      (item) =>
        item.notificationStatus === 'pending' &&
        item.remindAt.localeCompare(referenceTime) <= 0,
    );
  }

  getSnapshot(): PantavionReminderSchedulerSnapshot {
    const list = this.listReminders();

    return {
      generatedAt: nowIso(),
      reminderCount: list.length,
      pendingCount: list.filter((item) => item.notificationStatus === 'pending').length,
      sentCount: list.filter((item) => item.notificationStatus === 'sent').length,
      snoozedCount: list.filter((item) => item.notificationStatus === 'snoozed').length,
      cancelledCount: list.filter((item) => item.notificationStatus === 'cancelled').length,
      latestReminderId: list[list.length - 1]?.reminderId,
    };
  }

  clear(): void {
    this.reminders.clear();
  }
}

export function createReminderScheduler(): PantavionReminderScheduler {
  return new PantavionReminderScheduler();
}

export const reminderScheduler = createReminderScheduler();

export function scheduleReminder(
  input: PantavionReminderInput,
): PantavionReminderRecord {
  return reminderScheduler.scheduleReminder(input);
}

export function updateReminder(input: {
  reminderId: string;
  notificationStatus?: PantavionReminderNotificationStatus;
  remindAt?: string;
}): PantavionReminderRecord | null {
  return reminderScheduler.updateReminder(input);
}

export function listReminders(): PantavionReminderRecord[] {
  return reminderScheduler.listReminders();
}

export function listRemindersByUser(userId: string): PantavionReminderRecord[] {
  return reminderScheduler.listRemindersByUser(userId);
}

export function listDueReminders(referenceTime?: string): PantavionReminderRecord[] {
  return reminderScheduler.listDueReminders(referenceTime);
}

export function getReminderSchedulerSnapshot(): PantavionReminderSchedulerSnapshot {
  return reminderScheduler.getSnapshot();
}

export default reminderScheduler;
