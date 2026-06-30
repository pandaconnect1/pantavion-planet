import { promises as fs } from "fs";
import path from "path";
import type {
  PantavionDeviceGeoStatusAssessment,
  PantavionDeviceGeoStatusInput
} from "./device-geo-status";

export type PantavionDeviceGeoStatusAuditEvent = {
  event:
    | "device.geo.status.policy.read"
    | "device.geo.status.assessed";
  actor: string;
  createdAt: string;
  request?: Partial<PantavionDeviceGeoStatusInput>;
  assessment?: PantavionDeviceGeoStatusAssessment;
};

const auditDir = path.join(process.cwd(), "data", "kernel");
const auditFile = path.join(auditDir, "device-geo-status-audit.jsonl");

function sanitizeRequest(
  request?: PantavionDeviceGeoStatusInput
): Partial<PantavionDeviceGeoStatusInput> | undefined {
  if (!request) {
    return undefined;
  }

  return {
    latitude:
      typeof request.latitude === "number" ? Number(request.latitude.toFixed(5)) : undefined,
    longitude:
      typeof request.longitude === "number" ? Number(request.longitude.toFixed(5)) : undefined,
    accuracyMeters: request.accuracyMeters,
    source: request.source,
    requestedSurface: request.requestedSurface,
    consentGranted: request.consentGranted,
    ephemeralOnly: request.ephemeralOnly,
    actor: request.actor,
    reason: request.reason
  };
}

export async function appendPantavionDeviceGeoStatusAudit(
  event: PantavionDeviceGeoStatusAuditEvent
): Promise<void> {
  await fs.mkdir(auditDir, { recursive: true });

  const sanitizedEvent: PantavionDeviceGeoStatusAuditEvent = {
    ...event,
    request: sanitizeRequest(event.request)
  };

  await fs.appendFile(auditFile, `${JSON.stringify(sanitizedEvent)}\n`, "utf8");
}

export function getPantavionDeviceGeoStatusAuditPath(): string {
  return auditFile;
}
