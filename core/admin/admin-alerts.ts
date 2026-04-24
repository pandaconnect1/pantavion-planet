const alerts: unknown[] = [];

export async function publishAlert(alert: unknown): Promise<void> {
  alerts.push(alert);
}

export async function emitAlert(alert: unknown): Promise<void> {
  alerts.push(alert);
}

export function getPublishedAlerts(): unknown[] {
  return [...alerts];
}
