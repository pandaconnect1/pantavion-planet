// core/runtime/resilience-runtime.ts

import { getProtocolGatewayStats } from '../protocol/protocol-gateway';
import type { PantavionResolvedIdentityPosture } from '../identity/identity-model';

export type PantavionResilienceMode =
  | 'normal'
  | 'degraded'
  | 'critical'
  | 'emergency'
  | 'offline-buffered';

export type PantavionServiceHealthStatus =
  | 'healthy'
  | 'degraded'
  | 'unavailable'
  | 'maintenance';

export type PantavionIncidentSeverity =
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

export type PantavionIncidentStatus =
  | 'open'
  | 'monitoring'
  | 'resolved';

export type PantavionFallbackActionType =
  | 'retry'
  | 'reroute'
  | 'queue'
  | 'read-only'
  | 'manual-review'
  | 'pause-voice'
  | 'pause-workspace'
  | 'provider-failover'
  | 'local-buffer';

export interface PantavionResilienceMetadata {
  [key: string]: unknown;
}

export interface PantavionServiceHealthRecord {
  serviceKey: string;
  family: string;
  status: PantavionServiceHealthStatus;
  observedAt: string;
  details?: string;
  metadata: PantavionResilienceMetadata;
}

export interface PantavionIncidentRecord {
  id: string;
  title: string;
  summary: string;
  severity: PantavionIncidentSeverity;
  status: PantavionIncidentStatus;
  affectedServices: string[];
  createdAt: string;
  resolvedAt?: string;
  recommendedActions: string[];
  metadata: PantavionResilienceMetadata;
}

export interface PantavionFallbackAction {
  type: PantavionFallbackActionType;
  reason: string;
  target?: string;
  metadata: PantavionResilienceMetadata;
}

export interface PantavionResilienceEvaluationInput {
  requestedServices?: string[];
  requiresRealtime?: boolean;
  requiresWorkspaceContinuity?: boolean;
  requiresVoiceContinuity?: boolean;
  identity?: PantavionResolvedIdentityPosture | null;
  metadata?: PantavionResilienceMetadata;
}

export interface PantavionResilienceEvaluation {
  mode: PantavionResilienceMode;
  canContinue: boolean;
  degradedServices: string[];
  unavailableServices: string[];
  openIncidents: PantavionIncidentRecord[];
  fallbackPlan: PantavionFallbackAction[];
  recommendedActions: string[];
  rationale: string[];
  gatewayStats: ReturnType<typeof getProtocolGatewayStats>;
  metadata: PantavionResilienceMetadata;
}

export interface PantavionResilienceSnapshot {
  mode: PantavionResilienceMode;
  services: PantavionServiceHealthRecord[];
  incidents: PantavionIncidentRecord[];
  gatewayStats: ReturnType<typeof getProtocolGatewayStats>;
  generatedAt: string;
}

export interface PantavionResilienceConfig {
  unavailableServiceCriticalThreshold: number;
  degradedServiceCriticalThreshold: number;
  criticalIncidentThreshold: number;
  enableOfflineBufferRecommendation: boolean;
}

const DEFAULT_RESILIENCE_CONFIG: PantavionResilienceConfig = {
  unavailableServiceCriticalThreshold: 2,
  degradedServiceCriticalThreshold: 3,
  criticalIncidentThreshold: 1,
  enableOfflineBufferRecommendation: true,
};

function nowIso(): string {
  return new Date().toISOString();
}

function safeText(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function uniqStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function createId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${random}`;
}

function normalizeIncidentSeverity(value: unknown): PantavionIncidentSeverity {
  switch (value) {
    case 'low':
    case 'medium':
    case 'high':
    case 'critical':
      return value;
    default:
      return 'medium';
  }
}

function normalizeServiceHealthStatus(value: unknown): PantavionServiceHealthStatus {
  switch (value) {
    case 'healthy':
    case 'degraded':
    case 'unavailable':
    case 'maintenance':
      return value;
    default:
      return 'healthy';
  }
}

function deriveMode(input: {
  unavailableCount: number;
  degradedCount: number;
  criticalIncidentCount: number;
  highIncidentCount: number;
  requiresRealtime: boolean;
  enableOfflineBufferRecommendation: boolean;
}): PantavionResilienceMode {
  if (
    input.criticalIncidentCount > 0 &&
    input.unavailableCount > 0 &&
    input.requiresRealtime
  ) {
    return 'emergency';
  }

  if (
    input.unavailableCount >= 2 ||
    input.criticalIncidentCount > 0 ||
    (input.requiresRealtime && input.unavailableCount >= 1)
  ) {
    return input.enableOfflineBufferRecommendation ? 'offline-buffered' : 'critical';
  }

  if (input.degradedCount >= 2 || input.highIncidentCount > 0 || input.unavailableCount === 1) {
    return 'degraded';
  }

  return 'normal';
}

export class PantavionResilienceRuntime {
  private readonly config: PantavionResilienceConfig;
  private readonly services = new Map<string, PantavionServiceHealthRecord>();
  private readonly incidents = new Map<string, PantavionIncidentRecord>();

  constructor(config: Partial<PantavionResilienceConfig> = {}) {
    this.config = {
      ...DEFAULT_RESILIENCE_CONFIG,
      ...config,
    };

    this.seedFoundationServices();
  }

  private seedFoundationServices(): void {
    const seedServices: Array<{ serviceKey: string; family: string }> = [
      { serviceKey: 'kernel', family: 'foundation' },
      { serviceKey: 'identity-model', family: 'identity' },
      { serviceKey: 'delegation-model', family: 'identity' },
      { serviceKey: 'protocol-gateway', family: 'protocol' },
      { serviceKey: 'durable-execution', family: 'runtime' },
      { serviceKey: 'workspace-runtime', family: 'runtime' },
      { serviceKey: 'voice-runtime', family: 'runtime' },
    ];

    for (const service of seedServices) {
      this.registerService({
        serviceKey: service.serviceKey,
        family: service.family,
        status: 'healthy',
        details: 'Foundation baseline initialized.',
      });
    }
  }

  registerService(input: {
    serviceKey: string;
    family: string;
    status?: PantavionServiceHealthStatus;
    details?: string;
    metadata?: PantavionResilienceMetadata;
  }): PantavionServiceHealthRecord {
    const record: PantavionServiceHealthRecord = {
      serviceKey: safeText(input.serviceKey),
      family: safeText(input.family, 'runtime'),
      status: normalizeServiceHealthStatus(input.status),
      observedAt: nowIso(),
      details: safeText(input.details) || undefined,
      metadata: input.metadata ?? {},
    };

    this.services.set(record.serviceKey, record);
    return record;
  }

  updateServiceHealth(input: {
    serviceKey: string;
    status: PantavionServiceHealthStatus;
    details?: string;
    metadata?: PantavionResilienceMetadata;
  }): PantavionServiceHealthRecord | null {
    const existing = this.services.get(input.serviceKey);
    if (!existing) {
      return null;
    }

    existing.status = normalizeServiceHealthStatus(input.status);
    existing.observedAt = nowIso();
    existing.details = safeText(input.details) || undefined;
    existing.metadata = {
      ...existing.metadata,
      ...(input.metadata ?? {}),
    };

    return existing;
  }

  getService(serviceKey: string): PantavionServiceHealthRecord | null {
    return this.services.get(serviceKey) ?? null;
  }

  listServices(): PantavionServiceHealthRecord[] {
    return [...this.services.values()];
  }

  reportIncident(input: {
    title: string;
    summary: string;
    severity?: PantavionIncidentSeverity;
    affectedServices?: string[];
    recommendedActions?: string[];
    metadata?: PantavionResilienceMetadata;
  }): PantavionIncidentRecord {
    const record: PantavionIncidentRecord = {
      id: createId('inc'),
      title: safeText(input.title, 'Incident'),
      summary: safeText(input.summary, 'No summary provided.'),
      severity: normalizeIncidentSeverity(input.severity),
      status: 'open',
      affectedServices: uniqStrings((input.affectedServices ?? []).map(String)),
      createdAt: nowIso(),
      recommendedActions: uniqStrings((input.recommendedActions ?? []).map(String)),
      metadata: input.metadata ?? {},
    };

    this.incidents.set(record.id, record);

    for (const serviceKey of record.affectedServices) {
      const service = this.services.get(serviceKey);
      if (service && service.status === 'healthy') {
        service.status = record.severity === 'critical' ? 'unavailable' : 'degraded';
        service.observedAt = nowIso();
        service.details = `Affected by incident ${record.id}.`;
      }
    }

    return record;
  }

  resolveIncident(input: {
    incidentId: string;
    resolutionSummary?: string;
    restoreServicesToHealthy?: boolean;
  }): PantavionIncidentRecord | null {
    const incident = this.incidents.get(input.incidentId);
    if (!incident) {
      return null;
    }

    incident.status = 'resolved';
    incident.resolvedAt = nowIso();

    if (safeText(input.resolutionSummary)) {
      incident.metadata = {
        ...incident.metadata,
        resolutionSummary: safeText(input.resolutionSummary),
      };
    }

    if (input.restoreServicesToHealthy) {
      for (const serviceKey of incident.affectedServices) {
        const service = this.services.get(serviceKey);
        if (!service) {
          continue;
        }

        service.status = 'healthy';
        service.observedAt = nowIso();
        service.details = `Recovered after incident ${incident.id}.`;
      }
    }

    return incident;
  }

  listIncidents(): PantavionIncidentRecord[] {
    return [...this.incidents.values()].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }

  evaluate(
    input: PantavionResilienceEvaluationInput = {},
  ): PantavionResilienceEvaluation {
    const requestedServices = uniqStrings((input.requestedServices ?? []).map(String));
    const allServices = this.listServices();

    const relevantServices =
      requestedServices.length > 0
        ? allServices.filter((service) => requestedServices.includes(service.serviceKey))
        : allServices;

    const degradedServices = relevantServices
      .filter((service) => service.status === 'degraded' || service.status === 'maintenance')
      .map((service) => service.serviceKey);

    const unavailableServices = relevantServices
      .filter((service) => service.status === 'unavailable')
      .map((service) => service.serviceKey);

    const openIncidents = this.listIncidents().filter(
      (incident) =>
        incident.status !== 'resolved' &&
        (
          requestedServices.length === 0 ||
          incident.affectedServices.some((serviceKey) =>
            requestedServices.includes(serviceKey),
          )
        ),
    );

    const criticalIncidentCount = openIncidents.filter(
      (incident) => incident.severity === 'critical',
    ).length;

    const highIncidentCount = openIncidents.filter(
      (incident) => incident.severity === 'high',
    ).length;

    const mode = deriveMode({
      unavailableCount: unavailableServices.length,
      degradedCount: degradedServices.length,
      criticalIncidentCount,
      highIncidentCount,
      requiresRealtime: Boolean(input.requiresRealtime),
      enableOfflineBufferRecommendation: this.config.enableOfflineBufferRecommendation,
    });

    const fallbackPlan = this.buildFallbackPlan({
      mode,
      requestedServices,
      requiresRealtime: Boolean(input.requiresRealtime),
      requiresWorkspaceContinuity: Boolean(input.requiresWorkspaceContinuity),
      requiresVoiceContinuity: Boolean(input.requiresVoiceContinuity),
      degradedServices,
      unavailableServices,
    });

    const recommendedActions = uniqStrings([
      ...fallbackPlan.map((item) => item.reason),
      ...openIncidents.flatMap((incident) => incident.recommendedActions),
      ...(mode === 'degraded'
        ? ['Operate with controlled degradation and monitor retry/review paths.']
        : []),
      ...(mode === 'critical' || mode === 'offline-buffered'
        ? ['Enable stronger fallback routing and queue non-critical work.']
        : []),
      ...(mode === 'emergency'
        ? ['Prioritize survival mode, pause non-essential surfaces, protect continuity.']
        : []),
    ]);

    const rationale = uniqStrings([
      `Mode resolved as ${mode}.`,
      ...(requestedServices.length > 0
        ? [`Requested services: ${requestedServices.join(', ')}.`]
        : ['Global resilience evaluation executed.']),
      ...(degradedServices.length > 0
        ? [`Degraded services: ${degradedServices.join(', ')}.`]
        : []),
      ...(unavailableServices.length > 0
        ? [`Unavailable services: ${unavailableServices.join(', ')}.`]
        : []),
      ...(input.identity?.actorId
        ? [`Identity-aware evaluation for actor ${input.identity.actorId}.`]
        : []),
    ]);

    return {
      mode,
      canContinue: mode === 'normal' || mode === 'degraded' || mode === 'offline-buffered',
      degradedServices,
      unavailableServices,
      openIncidents,
      fallbackPlan,
      recommendedActions,
      rationale,
      gatewayStats: getProtocolGatewayStats(),
      metadata: input.metadata ?? {},
    };
  }

  getSnapshot(): PantavionResilienceSnapshot {
    return {
      mode: this.evaluate().mode,
      services: this.listServices(),
      incidents: this.listIncidents(),
      gatewayStats: getProtocolGatewayStats(),
      generatedAt: nowIso(),
    };
  }

  private buildFallbackPlan(input: {
    mode: PantavionResilienceMode;
    requestedServices: string[];
    requiresRealtime: boolean;
    requiresWorkspaceContinuity: boolean;
    requiresVoiceContinuity: boolean;
    degradedServices: string[];
    unavailableServices: string[];
  }): PantavionFallbackAction[] {
    const plan: PantavionFallbackAction[] = [];

    if (input.degradedServices.length > 0) {
      plan.push({
        type: 'retry',
        reason: `Retry degraded services: ${input.degradedServices.join(', ')}.`,
        metadata: {},
      });
    }

    if (input.unavailableServices.length > 0) {
      plan.push({
        type: 'reroute',
        reason: `Reroute around unavailable services: ${input.unavailableServices.join(', ')}.`,
        metadata: {},
      });
    }

    if (input.requiresWorkspaceContinuity && input.mode !== 'normal') {
      plan.push({
        type: 'queue',
        reason: 'Queue non-critical workspace actions until services stabilize.',
        target: 'workspace-runtime',
        metadata: {},
      });
    }

    if (input.requiresVoiceContinuity && input.mode !== 'normal') {
      plan.push({
        type: input.requiresRealtime ? 'local-buffer' : 'pause-voice',
        reason: input.requiresRealtime
          ? 'Use local buffering / transcript continuity for realtime voice pressure.'
          : 'Pause voice-sensitive flows until runtime stabilizes.',
        target: 'voice-runtime',
        metadata: {},
      });
    }

    if (input.mode === 'critical' || input.mode === 'emergency') {
      plan.push({
        type: 'manual-review',
        reason: 'Escalate sensitive actions to human review under critical conditions.',
        metadata: {},
      });
    }

    if (input.mode === 'offline-buffered') {
      plan.push({
        type: 'local-buffer',
        reason: 'Enable store-and-forward / buffered continuity mode where possible.',
        metadata: {},
      });
    }

    if (input.mode === 'emergency') {
      plan.push({
        type: 'read-only',
        reason: 'Restrict non-essential mutations and preserve core continuity.',
        metadata: {},
      });
    }

    return plan;
  }
}

export function createResilienceRuntime(
  config: Partial<PantavionResilienceConfig> = {},
): PantavionResilienceRuntime {
  return new PantavionResilienceRuntime(config);
}

export const resilienceRuntime = createResilienceRuntime();

export function registerResilienceService(input: {
  serviceKey: string;
  family: string;
  status?: PantavionServiceHealthStatus;
  details?: string;
  metadata?: PantavionResilienceMetadata;
}): PantavionServiceHealthRecord {
  return resilienceRuntime.registerService(input);
}

export function updateResilienceServiceHealth(input: {
  serviceKey: string;
  status: PantavionServiceHealthStatus;
  details?: string;
  metadata?: PantavionResilienceMetadata;
}): PantavionServiceHealthRecord | null {
  return resilienceRuntime.updateServiceHealth(input);
}

export function reportResilienceIncident(input: {
  title: string;
  summary: string;
  severity?: PantavionIncidentSeverity;
  affectedServices?: string[];
  recommendedActions?: string[];
  metadata?: PantavionResilienceMetadata;
}): PantavionIncidentRecord {
  return resilienceRuntime.reportIncident(input);
}

export function resolveResilienceIncident(input: {
  incidentId: string;
  resolutionSummary?: string;
  restoreServicesToHealthy?: boolean;
}): PantavionIncidentRecord | null {
  return resilienceRuntime.resolveIncident(input);
}

export function evaluateResilience(
  input: PantavionResilienceEvaluationInput = {},
): PantavionResilienceEvaluation {
  return resilienceRuntime.evaluate(input);
}

export function getResilienceSnapshot(): PantavionResilienceSnapshot {
  return resilienceRuntime.getSnapshot();
}
