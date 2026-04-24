// core/protocol/real-external-provider-bridge.ts

import {
  buildProviderFallbackPlan,
  type PantavionProviderFallbackPlan,
} from './provider-fallback-policy';

import {
  getProviderAdapter,
  type PantavionProviderAdapterRecord,
} from './provider-adapter-registry';

import {
  getProviderHealth,
} from './provider-health-registry';

import {
  getExternalProviderCapabilityRoute,
  type PantavionExternalProviderCapabilityRoute,
} from './provider-capability-map';

import {
  selectExternalProviderEndpoint,
  type PantavionExternalProviderEndpoint,
} from './external-provider-endpoint-registry';

import {
  beginExternalBridgeSession,
  completeExternalBridgeSession,
  type PantavionExternalBridgeSessionMode,
} from './external-provider-session-store';

import { saveKernelState } from '../storage/kernel-state-store';

export type PantavionRealExternalBridgeDisposition =
  | 'dispatched'
  | 'fallback-dispatched'
  | 'blocked';

export interface PantavionRealExternalBridgeRequest {
  capabilityKey: string;
  operationKey: string;
  preferredAdapterKey?: string;
  preferredEndpointKey?: string;
  payload?: unknown;
  metadata?: Record<string, unknown>;
}

export interface PantavionRealExternalBridgeResult {
  generatedAt: string;
  disposition: PantavionRealExternalBridgeDisposition;
  bridgeMode: PantavionExternalBridgeSessionMode;
  adapterKey?: string;
  endpointKey?: string;
  sessionId?: string;
  capabilityKey: string;
  operationKey: string;
  fallbackPlan: PantavionProviderFallbackPlan;
  route?: PantavionExternalProviderCapabilityRoute | null;
  adapter?: PantavionProviderAdapterRecord | null;
  endpoint?: PantavionExternalProviderEndpoint | null;
  healthStatus?: string;
  requestEnvelope: Record<string, unknown>;
  responseEnvelope: Record<string, unknown>;
  notes: string[];
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

function resolveBridgeMode(input: {
  endpoint: PantavionExternalProviderEndpoint | null;
}): PantavionExternalBridgeSessionMode {
  if (!input.endpoint) {
    return 'blocked';
  }

  if (input.endpoint.status === 'offline') {
    return 'blocked';
  }

  if (input.endpoint.mode === 'live-ready' && input.endpoint.status === 'ready') {
    return 'live-ready';
  }

  if (
    input.endpoint.mode === 'bridge-ready' ||
    input.endpoint.status === 'watch' ||
    input.endpoint.status === 'degraded'
  ) {
    return 'bridge-ready';
  }

  return 'simulated';
}

function buildResponseEnvelope(input: {
  request: PantavionRealExternalBridgeRequest;
  route: PantavionExternalProviderCapabilityRoute | null;
  endpoint: PantavionExternalProviderEndpoint | null;
  adapterKey?: string;
  mode: PantavionExternalBridgeSessionMode;
}): Record<string, unknown> {
  return {
    traceId: createId('ebr'),
    accepted: input.mode !== 'blocked',
    bridgeMode: input.mode,
    simulated: input.mode !== 'live-ready',
    capabilityKey: input.request.capabilityKey,
    operationKey: input.request.operationKey,
    adapterKey: input.adapterKey,
    endpointKey: input.endpoint?.endpointKey,
    routeKind: input.route?.routeKind,
    executionClass: input.route?.executionClass,
    truthBoundary: input.route?.truthBoundary,
    requestShape: input.route?.requestShape,
    responseShape: input.route?.responseShape,
    providerEcho: {
      receivedPayload: input.request.payload ?? null,
      metadata: input.request.metadata ?? {},
    },
    providerSummary:
      input.mode === 'live-ready'
        ? 'External bridge executed through live-ready endpoint.'
        : input.mode === 'bridge-ready'
          ? 'External bridge executed through bridge-ready path.'
          : input.mode === 'simulated'
            ? 'External bridge resolved through simulation-grade path.'
            : 'External bridge blocked.',
  };
}

export async function executeRealExternalProviderBridge(
  request: PantavionRealExternalBridgeRequest,
): Promise<PantavionRealExternalBridgeResult> {
  const fallbackPlan = buildProviderFallbackPlan({
    capabilityKey: request.capabilityKey,
    operationKey: request.operationKey,
    preferredAdapterKey: request.preferredAdapterKey,
  });

  const route =
    getExternalProviderCapabilityRoute(request.capabilityKey) ??
    null;

  const endpoint =
    selectExternalProviderEndpoint({
      capabilityKey: request.capabilityKey,
      operationKey: request.operationKey,
      preferredEndpointKey:
        request.preferredEndpointKey ?? route?.endpointKey,
    }) ?? null;

  const adapter =
    fallbackPlan.primaryAdapterKey
      ? getProviderAdapter(fallbackPlan.primaryAdapterKey)
      : null;

  const health =
    fallbackPlan.primaryAdapterKey
      ? getProviderHealth(fallbackPlan.primaryAdapterKey)
      : null;

  const mode = resolveBridgeMode({
    endpoint,
  });

  const requestEnvelope: Record<string, unknown> = {
    capabilityKey: request.capabilityKey,
    operationKey: request.operationKey,
    preferredAdapterKey: request.preferredAdapterKey,
    preferredEndpointKey: request.preferredEndpointKey,
    payload: request.payload ?? null,
    metadata: request.metadata ?? {},
  };

  if (
    fallbackPlan.disposition === 'blocked' ||
    !fallbackPlan.primaryAdapterKey ||
    !route ||
    !endpoint ||
    mode === 'blocked'
  ) {
    const blocked = beginExternalBridgeSession({
      capabilityKey: request.capabilityKey,
      operationKey: request.operationKey,
      adapterKey: fallbackPlan.primaryAdapterKey,
      endpointKey: endpoint?.endpointKey,
      requestPayload: requestEnvelope,
      mode: 'blocked',
      notes: ['External bridge could not route request.'],
    });

    const blockedResult: PantavionRealExternalBridgeResult = {
      generatedAt: nowIso(),
      disposition: 'blocked',
      bridgeMode: 'blocked',
      adapterKey: fallbackPlan.primaryAdapterKey,
      endpointKey: endpoint?.endpointKey,
      sessionId: blocked.sessionId,
      capabilityKey: request.capabilityKey,
      operationKey: request.operationKey,
      fallbackPlan,
      route,
      adapter,
      endpoint,
      healthStatus: health?.status,
      requestEnvelope,
      responseEnvelope: {
        accepted: false,
        reason: 'blocked',
      },
      notes: ['External bridge blocked before execution.'],
    };

    saveKernelState({
      key: 'protocol.external-provider-bridge.latest',
      kind: 'state',
      payload: blockedResult,
      tags: ['provider', 'external-bridge', 'blocked', 'latest'],
      metadata: {
        capability: request.capabilityKey,
        operation: request.operationKey,
      },
    });

    return blockedResult;
  }

  const session = beginExternalBridgeSession({
    capabilityKey: request.capabilityKey,
    operationKey: request.operationKey,
    adapterKey: fallbackPlan.primaryAdapterKey,
    endpointKey: endpoint.endpointKey,
    requestPayload: requestEnvelope,
    mode,
    notes: [`routeKind=${route.routeKind}`],
  });

  const responseEnvelope = buildResponseEnvelope({
    request,
    route,
    endpoint,
    adapterKey: fallbackPlan.primaryAdapterKey,
    mode,
  });

  completeExternalBridgeSession({
    sessionId: session.sessionId,
    responsePayload: responseEnvelope,
    notes: ['External bridge session completed.'],
  });

  const result: PantavionRealExternalBridgeResult = {
    generatedAt: nowIso(),
    disposition:
      fallbackPlan.disposition === 'routable'
        ? 'dispatched'
        : 'fallback-dispatched',
    bridgeMode: mode,
    adapterKey: fallbackPlan.primaryAdapterKey,
    endpointKey: endpoint.endpointKey,
    sessionId: session.sessionId,
    capabilityKey: request.capabilityKey,
    operationKey: request.operationKey,
    fallbackPlan,
    route,
    adapter,
    endpoint,
    healthStatus: health?.status,
    requestEnvelope,
    responseEnvelope,
    notes: uniqStrings([
      `bridgeMode=${mode}`,
      `adapter=${fallbackPlan.primaryAdapterKey}`,
      `endpoint=${endpoint.endpointKey}`,
      `health=${health?.status ?? 'unknown'}`,
    ]),
  };

  saveKernelState({
    key: 'protocol.external-provider-bridge.latest',
    kind: 'state',
    payload: result,
    tags: ['provider', 'external-bridge', 'latest'],
    metadata: {
      capability: request.capabilityKey,
      operation: request.operationKey,
      bridgeMode: result.bridgeMode,
      disposition: result.disposition,
    },
  });

  return result;
}

export default executeRealExternalProviderBridge;
