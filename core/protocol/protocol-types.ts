// core/protocol/protocol-types.ts

import {
  type PantavionActorType,
  type PantavionApprovalTier,
  type PantavionTrustTier,
} from '../identity/identity-model';

export type PantavionProtocolFamily =
  | 'internal'
  | 'mcp'
  | 'a2a'
  | 'http'
  | 'event'
  | 'bridge';

export type PantavionProtocolDirection =
  | 'inbound'
  | 'outbound'
  | 'bidirectional';

export type PantavionProtocolExecutionMode =
  | 'sync'
  | 'async'
  | 'stream'
  | 'durable';

export type PantavionProtocolTruthMode =
  | 'deterministic'
  | 'verified'
  | 'generative'
  | 'hybrid';

export type PantavionProtocolAuthMode =
  | 'none'
  | 'session'
  | 'service'
  | 'delegated'
  | 'signed';

export type PantavionProtocolAdapterStatus =
  | 'draft'
  | 'active'
  | 'degraded'
  | 'disabled';

export type PantavionProtocolCapabilityDisposition =
  | 'allow'
  | 'review'
  | 'deny';

export type PantavionProtocolTransportKind =
  | 'function'
  | 'http'
  | 'websocket'
  | 'queue'
  | 'event-bus'
  | 'stdio';

export interface PantavionProtocolMetadata {
  [key: string]: unknown;
}

export interface PantavionProtocolScopeRef {
  scopeId: string;
  scopeLabel?: string;
}

export interface PantavionProtocolIdentityEnvelope {
  actorId?: string;
  actorType: PantavionActorType;
  delegatedBy?: string;
  trustTier: PantavionTrustTier;
  approvalTier: PantavionApprovalTier;
  scopes: PantavionProtocolScopeRef[];
  roles: string[];
  entitlements: string[];
}

export interface PantavionProtocolEndpoint {
  adapterKey: string;
  family: PantavionProtocolFamily;
  transport: PantavionProtocolTransportKind;
  direction: PantavionProtocolDirection;
  address: string;
  method?: string;
  operationKey: string;
  truthMode: PantavionProtocolTruthMode;
  executionMode: PantavionProtocolExecutionMode;
  authMode: PantavionProtocolAuthMode;
  timeoutMs?: number;
  metadata?: PantavionProtocolMetadata;
}

export interface PantavionProtocolEnvelope<TPayload = unknown> {
  id: string;
  createdAt: string;
  traceId: string;
  requestId?: string;
  family: PantavionProtocolFamily;
  operationKey: string;
  truthMode: PantavionProtocolTruthMode;
  executionMode: PantavionProtocolExecutionMode;
  identity: PantavionProtocolIdentityEnvelope;
  payload: TPayload;
  metadata: PantavionProtocolMetadata;
}

export interface PantavionCapabilityRequest {
  capabilityKey: string;
  operationKey: string;
  input: unknown;
  requestedScopes: PantavionProtocolScopeRef[];
  requiredEntitlements: string[];
  preferredFamilies: PantavionProtocolFamily[];
  preferredExecutionMode?: PantavionProtocolExecutionMode;
  preferredTruthMode?: PantavionProtocolTruthMode;
  metadata: PantavionProtocolMetadata;
}

export interface PantavionCapabilityResult {
  capabilityKey: string;
  success: boolean;
  disposition: PantavionProtocolCapabilityDisposition;
  output?: unknown;
  errors: string[];
  warnings: string[];
  provenance: string[];
  metadata: PantavionProtocolMetadata;
}

export interface PantavionProtocolDispatchPlan {
  id: string;
  createdAt: string;
  adapterKey: string;
  family: PantavionProtocolFamily;
  transport: PantavionProtocolTransportKind;
  operationKey: string;
  routeReason: string[];
  requiresApproval: boolean;
  requiredApprovalTier?: PantavionApprovalTier;
  requiredEntitlements: string[];
  requiredScopes: PantavionProtocolScopeRef[];
  executionMode: PantavionProtocolExecutionMode;
  truthMode: PantavionProtocolTruthMode;
  timeoutMs?: number;
  metadata: PantavionProtocolMetadata;
}

export interface PantavionProtocolDispatchResult {
  dispatchId: string;
  success: boolean;
  status: 'queued' | 'dispatched' | 'completed' | 'failed' | 'blocked';
  adapterKey: string;
  family: PantavionProtocolFamily;
  operationKey: string;
  startedAt: string;
  completedAt?: string;
  output?: unknown;
  errors: string[];
  warnings: string[];
  metadata: PantavionProtocolMetadata;
}

export interface PantavionProtocolAdapterRecord {
  adapterKey: string;
  displayName: string;
  family: PantavionProtocolFamily;
  direction: PantavionProtocolDirection;
  transport: PantavionProtocolTransportKind;
  status: PantavionProtocolAdapterStatus;
  supportedOperations: string[];
  supportedCapabilities: string[];
  truthModes: PantavionProtocolTruthMode[];
  executionModes: PantavionProtocolExecutionMode[];
  authModes: PantavionProtocolAuthMode[];
  trustFloor: PantavionTrustTier;
  approvalTier: PantavionApprovalTier;
  defaultTimeoutMs?: number;
  endpoint?: PantavionProtocolEndpoint;
  metadata: PantavionProtocolMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface PantavionProtocolRouteDecision {
  allowed: boolean;
  disposition: PantavionProtocolCapabilityDisposition;
  reason: string[];
  adapter?: PantavionProtocolAdapterRecord;
  plan?: PantavionProtocolDispatchPlan;
}

export interface PantavionProtocolRegistrySnapshot {
  generatedAt: string;
  adapters: PantavionProtocolAdapterRecord[];
}

function nowIso(): string {
  return new Date().toISOString();
}

function safeText(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function uniqStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function createId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${random}`;
}

function normalizeApprovalTier(value: unknown): PantavionApprovalTier {
  switch (value) {
    case 'none':
    case 'review':
    case 'admin':
    case 'security':
    case 'executive':
      return value;
    default:
      return 'review';
  }
}

function normalizeTrustTier(value: unknown): PantavionTrustTier {
  switch (value) {
    case 'untrusted':
    case 'basic':
    case 'trusted':
    case 'high-trust':
    case 'system':
      return value;
    default:
      return 'basic';
  }
}

function normalizeActorType(value: unknown): PantavionActorType {
  return value === 'agent' || value === 'service' ? value : 'human';
}

function dedupeScopes(scopes: PantavionProtocolScopeRef[]): PantavionProtocolScopeRef[] {
  const seen = new Set<string>();
  const out: PantavionProtocolScopeRef[] = [];

  for (const scope of scopes) {
    const scopeId = safeText(scope.scopeId);
    if (!scopeId || seen.has(scopeId)) {
      continue;
    }

    seen.add(scopeId);
    out.push({
      scopeId,
      scopeLabel: safeText(scope.scopeLabel) || undefined,
    });
  }

  return out;
}

export function buildProtocolIdentityEnvelope(
  input: Partial<PantavionProtocolIdentityEnvelope> & {
    actorType?: PantavionActorType;
    trustTier?: PantavionTrustTier;
    approvalTier?: PantavionApprovalTier;
  } = {},
): PantavionProtocolIdentityEnvelope {
  return {
    actorId: safeText(input.actorId) || undefined,
    actorType: normalizeActorType(input.actorType),
    delegatedBy: safeText(input.delegatedBy) || undefined,
    trustTier: normalizeTrustTier(input.trustTier),
    approvalTier: normalizeApprovalTier(input.approvalTier),
    scopes: dedupeScopes(input.scopes ?? []),
    roles: uniqStrings((input.roles ?? []).map(String)),
    entitlements: uniqStrings((input.entitlements ?? []).map(String)),
  };
}

export function createProtocolEnvelope<TPayload = unknown>(input: {
  family?: PantavionProtocolFamily;
  operationKey: string;
  truthMode?: PantavionProtocolTruthMode;
  executionMode?: PantavionProtocolExecutionMode;
  identity?: Partial<PantavionProtocolIdentityEnvelope>;
  payload?: TPayload;
  metadata?: PantavionProtocolMetadata;
  traceId?: string;
  requestId?: string;
}): PantavionProtocolEnvelope<TPayload> {
  return {
    id: createId('penv'),
    createdAt: nowIso(),
    traceId: safeText(input.traceId, createId('trace')),
    requestId: safeText(input.requestId) || undefined,
    family: input.family ?? 'internal',
    operationKey: safeText(input.operationKey),
    truthMode: input.truthMode ?? 'deterministic',
    executionMode: input.executionMode ?? 'sync',
    identity: buildProtocolIdentityEnvelope(input.identity ?? {}),
    payload: (input.payload ?? null) as TPayload,
    metadata: asRecord(input.metadata),
  };
}

export function createCapabilityRequest(input: {
  capabilityKey: string;
  operationKey: string;
  input?: unknown;
  requestedScopes?: PantavionProtocolScopeRef[];
  requiredEntitlements?: string[];
  preferredFamilies?: PantavionProtocolFamily[];
  preferredExecutionMode?: PantavionProtocolExecutionMode;
  preferredTruthMode?: PantavionProtocolTruthMode;
  metadata?: PantavionProtocolMetadata;
}): PantavionCapabilityRequest {
  return {
    capabilityKey: safeText(input.capabilityKey),
    operationKey: safeText(input.operationKey),
    input: input.input ?? null,
    requestedScopes: dedupeScopes(input.requestedScopes ?? []),
    requiredEntitlements: uniqStrings((input.requiredEntitlements ?? []).map(String)),
    preferredFamilies: uniqStrings(
      (input.preferredFamilies ?? ['internal']).map(String),
    ) as PantavionProtocolFamily[],
    preferredExecutionMode: input.preferredExecutionMode,
    preferredTruthMode: input.preferredTruthMode,
    metadata: asRecord(input.metadata),
  };
}

export function createProtocolAdapterRecord(input: {
  adapterKey: string;
  displayName?: string;
  family?: PantavionProtocolFamily;
  direction?: PantavionProtocolDirection;
  transport?: PantavionProtocolTransportKind;
  status?: PantavionProtocolAdapterStatus;
  supportedOperations?: string[];
  supportedCapabilities?: string[];
  truthModes?: PantavionProtocolTruthMode[];
  executionModes?: PantavionProtocolExecutionMode[];
  authModes?: PantavionProtocolAuthMode[];
  trustFloor?: PantavionTrustTier;
  approvalTier?: PantavionApprovalTier;
  defaultTimeoutMs?: number;
  endpoint?: PantavionProtocolEndpoint;
  metadata?: PantavionProtocolMetadata;
}): PantavionProtocolAdapterRecord {
  const timestamp = nowIso();

  return {
    adapterKey: safeText(input.adapterKey),
    displayName: safeText(input.displayName, safeText(input.adapterKey)),
    family: input.family ?? 'internal',
    direction: input.direction ?? 'bidirectional',
    transport: input.transport ?? 'function',
    status: input.status ?? 'active',
    supportedOperations: uniqStrings((input.supportedOperations ?? []).map(String)),
    supportedCapabilities: uniqStrings((input.supportedCapabilities ?? []).map(String)),
    truthModes:
      ((input.truthModes ?? ['deterministic']) as PantavionProtocolTruthMode[]),
    executionModes:
      ((input.executionModes ?? ['sync']) as PantavionProtocolExecutionMode[]),
    authModes: ((input.authModes ?? ['session']) as PantavionProtocolAuthMode[]),
    trustFloor: normalizeTrustTier(input.trustFloor),
    approvalTier: normalizeApprovalTier(input.approvalTier),
    defaultTimeoutMs:
      typeof input.defaultTimeoutMs === 'number' ? input.defaultTimeoutMs : undefined,
    endpoint: input.endpoint,
    metadata: asRecord(input.metadata),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createDispatchPlan(input: {
  adapter: PantavionProtocolAdapterRecord;
  request: PantavionCapabilityRequest;
  requiresApproval?: boolean;
  requiredApprovalTier?: PantavionApprovalTier;
  routeReason?: string[];
  metadata?: PantavionProtocolMetadata;
}): PantavionProtocolDispatchPlan {
  return {
    id: createId('pdp'),
    createdAt: nowIso(),
    adapterKey: input.adapter.adapterKey,
    family: input.adapter.family,
    transport: input.adapter.transport,
    operationKey: input.request.operationKey,
    routeReason: uniqStrings((input.routeReason ?? []).map(String)),
    requiresApproval: input.requiresApproval ?? false,
    requiredApprovalTier:
      input.requiresApproval === true
        ? normalizeApprovalTier(
            input.requiredApprovalTier ?? input.adapter.approvalTier,
          )
        : undefined,
    requiredEntitlements: uniqStrings(input.request.requiredEntitlements),
    requiredScopes: dedupeScopes(input.request.requestedScopes),
    executionMode:
      input.request.preferredExecutionMode ??
      input.adapter.executionModes[0] ??
      'sync',
    truthMode:
      input.request.preferredTruthMode ??
      input.adapter.truthModes[0] ??
      'deterministic',
    timeoutMs: input.adapter.defaultTimeoutMs,
    metadata: asRecord(input.metadata),
  };
}

export function createDispatchResult(input: {
  adapterKey: string;
  family: PantavionProtocolFamily;
  operationKey: string;
  status?: 'queued' | 'dispatched' | 'completed' | 'failed' | 'blocked';
  success?: boolean;
  output?: unknown;
  errors?: string[];
  warnings?: string[];
  metadata?: PantavionProtocolMetadata;
}): PantavionProtocolDispatchResult {
  const startedAt = nowIso();
  const status = input.status ?? 'completed';

  return {
    dispatchId: createId('pdr'),
    success: input.success ?? (status === 'completed'),
    status,
    adapterKey: safeText(input.adapterKey),
    family: input.family,
    operationKey: safeText(input.operationKey),
    startedAt,
    completedAt:
      status === 'queued' || status === 'dispatched' ? undefined : nowIso(),
    output: input.output,
    errors: uniqStrings((input.errors ?? []).map(String)),
    warnings: uniqStrings((input.warnings ?? []).map(String)),
    metadata: asRecord(input.metadata),
  };
}

export function isProtocolAdapterRunnable(
  adapter: PantavionProtocolAdapterRecord,
): boolean {
  return adapter.status === 'active' || adapter.status === 'degraded';
}

export function routeRequiresApproval(
  adapter: PantavionProtocolAdapterRecord,
  request: PantavionCapabilityRequest,
): boolean {
  if (adapter.approvalTier !== 'none') {
    return true;
  }

  if (request.preferredExecutionMode === 'durable') {
    return true;
  }

  if (request.preferredTruthMode === 'hybrid') {
    return true;
  }

  return false;
}

export function summarizeProtocolDispatch(
  result: PantavionProtocolDispatchResult,
): string {
  return [
    `Dispatch ${result.dispatchId}`,
    `status=${result.status}`,
    `family=${result.family}`,
    `operation=${result.operationKey}`,
    `adapter=${result.adapterKey}`,
  ].join(' | ');
}

export function createProtocolRegistrySnapshot(
  adapters: PantavionProtocolAdapterRecord[],
): PantavionProtocolRegistrySnapshot {
  return {
    generatedAt: nowIso(),
    adapters: [...adapters],
  };
}
