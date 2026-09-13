import { randomUUID } from "node:crypto";

import type {
  AlertChannel,
  AlertMessage,
  IncidentInput,
  IncidentRecord,
} from "@/lib/incidents/types";

const SECRET_PATTERNS: RegExp[] = [
  /(authorization\s*[:=]\s*)([^\s,;]+)/gi,
  /(bearer\s+)([a-z0-9._~+/=-]+)/gi,
  /((?:api[_-]?key|token|secret|password|passwd|pwd)\s*[:=]\s*)([^\s,;]+)/gi,
  /([?&](?:key|token|secret|password)=)([^&\s]+)/gi,
];

const MAX_ALERT_LENGTH = 300;

export function redactSensitiveText(value: string): string {
  return SECRET_PATTERNS.reduce(
    (text, pattern) => text.replace(pattern, "$1[REDACTED]"),
    value,
  );
}

function compact(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return redactSensitiveText(value).replace(/\s+/g, " ").trim();
}

function buildIncidentId(now: Date): string {
  const date = now.toISOString().slice(0, 10).replaceAll("-", "");
  return `PT-${date}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export function createIncidentRecord(
  input: IncidentInput,
  now = new Date(),
): IncidentRecord {
  const createdAt = now.toISOString();

  return {
    ...input,
    summary: compact(input.summary) ?? "Unspecified incident",
    details: compact(input.details),
    fallbackState: compact(input.fallbackState),
    id: buildIncidentId(now),
    status: "open",
    createdAt,
    updatedAt: createdAt,
  };
}

export function formatAlertMessage(incident: IncidentRecord): AlertMessage {
  const fallback = incident.fallbackState
    ? ` Fallback: ${incident.fallbackState}.`
    : "";
  const action = incident.actionRequired
    ? " Human review required."
    : " Automatic handling active.";

  const text = [
    `Pantavion ALERT ${incident.severity}`,
    `— ${incident.module}: ${incident.summary}.`,
    `Incident ${incident.id}.`,
    fallback,
    action,
  ]
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_ALERT_LENGTH);

  return {
    incidentId: incident.id,
    severity: incident.severity,
    module: incident.module,
    text,
  };
}

export class ConsoleAlertChannel implements AlertChannel {
  readonly name = "console";

  async send(message: AlertMessage): Promise<void> {
    console.error(JSON.stringify({ type: "pantavion_incident", ...message }));
  }
}

export async function dispatchIncident(
  incident: IncidentRecord,
  channels: AlertChannel[] = [new ConsoleAlertChannel()],
): Promise<void> {
  const alert = formatAlertMessage(incident);
  await Promise.allSettled(channels.map((channel) => channel.send(alert)));
}
