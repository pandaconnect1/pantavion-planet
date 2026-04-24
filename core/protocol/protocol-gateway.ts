// core/protocol/protocol-gateway.ts

import {
  createDispatchPlan,
  createDispatchResult,
  createProtocolAdapterRecord,
  createProtocolRegistrySnapshot,
  isProtocolAdapterRunnable,
  routeRequiresApproval,
  type PantavionCapabilityRequest,
  type PantavionCapabilityResult,
  type PantavionProtocolAdapterRecord,
  type PantavionProtocolCapabilityDisposition,
  type PantavionProtocolDispatchPlan,
  type PantavionProtocolDispatchResult,
  type PantavionProtocolFamily,
  type PantavionProtocolRegistrySnapshot,
  type PantavionProtocolTruthMode,
} from './protocol-types';

import {
  type PantavionApprovalTier,
  type PantavionResolvedIdentityPosture,
  type PantavionTrustTier,
} from '../identity/identity-model';

import {
  resolveDelegation,
  type PantavionDelegationResolution,
} from '../identity/delegation-model';

type UnknownRecord = Record<string, unknown>;
type GatewayHandler = (input: {
  adapter: PantavionProtocolAdapterRecord;
  request: PantavionCapabilityRequest;
  identity?: PantavionResolvedIdentityPosture | null;
  plan: PantavionProtocolDispatchPlan;
}) => Promise<unknown> | unknown;

export interface PantavionGatewayRouteInput {
  request: PantavionCapabilityRequest;
  identity?: PantavionResolvedIdentityPosture | null;
}

export interface PantavionGatewayRouteDecision {
  allowed: boolean;
  disposition: PantavionProtocolCapabilityDisposition;
  reason: string[];
  adapter?: PantavionProtocolAdapterRecord;
  plan?: PantavionProtocolDispatchPlan;
  delegation?: PantavionDelegationResolution;
}

export interface PantavionGatewayDispatchInput {
  request: PantavionCapabilityRequest;
  identity?: PantavionResolvedIdentityPosture | null;
}

export interface PantavionGatewayDispatchOutput {
  route: PantavionGatewayRouteDecision;
  dispatch: PantavionProtocolDispatchResult;
  capabilityResult: PantavionCapabilityResult;
}

export interface PantavionGatewayConfig {
  autoRegisterInternalKernelAdapter: boolean;
  degradedAdaptersRequireReview: boolean;
  durableExecutionRequiresReview: boolean;
  strictTrustFloorEnforcement: boolean;
  defaultTimeoutMs: number;
}

export interface PantavionGatewayStats {
  adapterCount: number;
  handlerCount: number;
  dispatchCount: number;
  blockedCount: number;
  lastDispatchAt?: string;
}

const DEFAULT_GATEWAY_CONFIG: PantavionGatewayConfig = {
  autoRegisterInternalKernelAdapter: true,
  degradedAdaptersRequireReview: true,
  durableExecutionRequiresReview: true,
  strictTrustFloorEnforcement: true,
  defaultTimeoutMs: 15000,
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

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === 'object' ? (value as UnknownRecord) : {};
}

function createId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${random}`;
}

function compareTrustTier(left: PantavionTrustTier, right: PantavionTrustTier): number {
  const order: PantavionTrustTier[] = [
    'untrusted',
    'basic',
    'trusted',
    'high-trust',
    'system',
  ];
  return order.indexOf(left) - order.indexOf(right);
}

function compareApprovalTier(
  left: PantavionApprovalTier,
  right: PantavionApprovalTier,
): number {
  const order: PantavionApprovalTier[] = [
    'none',
    'review',
    'admin',
    'security',
    'executive',
  ];
  return order.indexOf(left) - order.indexOf(right);
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

function deriveDispositionFromRoute(
  allowed: boolean,
  requiresApproval: boolean,
): PantavionProtocolCapabilityDisposition {
  if (!allowed) {
    return 'deny';
  }
  if (requiresApproval) {
    return 'review';
  }
  return 'allow';
}

function normalizeTruthMode(value: unknown): PantavionProtocolTruthMode {
  switch (value) {
    case 'deterministic':
    case 'verified':
    case 'generative':
    case 'hybrid':
      return value;
    default:
      return 'deterministic';
  }
}

function capabilityResultFromDispatch(input: {
  request: PantavionCapabilityRequest;
  dispatch: PantavionProtocolDispatchResult;
  disposition: PantavionProtocolCapabilityDisposition;
  routeReason: string[];
}): PantavionCapabilityResult {
  return {
    capabilityKey: input.request.capabilityKey,
    success: input.dispatch.success,
    disposition: input.disposition,
    output: input.dispatch.output,
    errors: [...input.dispatch.errors],
    warnings: [...input.dispatch.warnings],
    provenance: uniqStrings([
      `adapter:${input.dispatch.adapterKey}`,
      `family:${input.dispatch.family}`,
      `operation:${input.dispatch.operationKey}`,
      ...input.routeReason,
    ]),
    metadata: {},
  };
}

export class PantavionProtocolGateway {
  private readonly config: PantavionGatewayConfig;
  private readonly adapters = new Map<string, PantavionProtocolAdapterRecord>();
  private readonly handlers = new Map<string, GatewayHandler>();
  private readonly dispatchLog: PantavionProtocolDispatchResult[] = [];
  private readonly blockedLog: PantavionGatewayRouteDecision[] = [];

  constructor(config: Partial<PantavionGatewayConfig> = {}) {
    this.config = {
      ...DEFAULT_GATEWAY_CONFIG,
      ...config,
    };

    if (this.config.autoRegisterInternalKernelAdapter) {
      const kernelAdapter = createProtocolAdapterRecord({
        adapterKey: 'kernel-internal',
        displayName: 'Kernel Internal Gateway Adapter',
        family: 'internal',
        direction: 'bidirectional',
        transport: 'function',
        status: 'active',
        supportedOperations: [
          'kernel.process',
          'kernel.route',
          'kernel.explain',
          'identity.resolve',
          'protocol.dispatch',
        ],
        supportedCapabilities: [
          'capability-lookup',
          'policy-evaluation',
          'governed-routing',
          'decision-persistence',
          'explainability',
        ],
        truthModes: ['deterministic', 'verified', 'hybrid'],
        executionModes: ['sync', 'async', 'durable'],
        authModes: ['session', 'delegated', 'service'],
        trustFloor: 'basic',
        approvalTier: 'review',
        defaultTimeoutMs: this.config.defaultTimeoutMs,
        metadata: {
          foundation: true,
          canonical: true,
        },
      });

      this.registerAdapter(kernelAdapter);
      this.registerHandler(kernelAdapter.adapterKey, async ({ request }) => {
        return {
          accepted: true,
          capabilityKey: request.capabilityKey,
          operationKey: request.operationKey,
          handledBy: 'kernel-internal',
          mode: 'foundation-baseline',
        };
      });
    }
  }

  registerAdapter(adapter: PantavionProtocolAdapterRecord): PantavionProtocolAdapterRecord {
    this.adapters.set(adapter.adapterKey, adapter);
    return adapter;
  }

  registerHandler(adapterKey: string, handler: GatewayHandler): void {
    this.handlers.set(adapterKey, handler);
  }

  getAdapter(adapterKey: string): PantavionProtocolAdapterRecord | null {
    return this.adapters.get(adapterKey) ?? null;
  }

  listAdapters(): PantavionProtocolAdapterRecord[] {
    return [...this.adapters.values()];
  }

  getRegistrySnapshot(): PantavionProtocolRegistrySnapshot {
    return createProtocolRegistrySnapshot(this.listAdapters());
  }

  getDispatchHistory(): PantavionProtocolDispatchResult[] {
    return [...this.dispatchLog];
  }

  getBlockedHistory(): PantavionGatewayRouteDecision[] {
    return [...this.blockedLog];
  }

  getStats(): PantavionGatewayStats {
    return {
      adapterCount: this.adapters.size,
      handlerCount: this.handlers.size,
      dispatchCount: this.dispatchLog.length,
      blockedCount: this.blockedLog.length,
      lastDispatchAt: this.dispatchLog.length > 0 ? this.dispatchLog[0].startedAt : undefined,
    };
  }

  resolveRoute(input: PantavionGatewayRouteInput): PantavionGatewayRouteDecision {
    const request = input.request;
    const identity = input.identity ?? null;
    const adapters = this.rankAdaptersForRequest(request);
    const routeReason: string[] = [];

    if (adapters.length === 0) {
      const denied = {
        allowed: false,
        disposition: 'deny' as PantavionProtocolCapabilityDisposition,
        reason: ['No compatible protocol adapter found for request.'],
      };
      this.blockedLog.unshift(denied);
      return denied;
    }

    const adapter = adapters[0];
    routeReason.push(`Selected adapter ${adapter.adapterKey}.`);
    routeReason.push(`Family ${adapter.family}.`);
    routeReason.push(`Transport ${adapter.transport}.`);

    if (!isProtocolAdapterRunnable(adapter)) {
      const denied = {
        allowed: false,
        disposition: 'deny' as PantavionProtocolCapabilityDisposition,
        reason: [...routeReason, 'Adapter is not runnable in current status.'],
        adapter,
      };
      this.blockedLog.unshift(denied);
      return denied;
    }

    const delegation = resolveDelegation({
      principal: identity ?? undefined,
      delegate: identity ?? undefined,
      delegateId: identity?.actorId,
      scopeIds: request.requestedScopes.map((scope) => scope.scopeId),
      capabilityKeys: [request.capabilityKey],
      requestedApprovalTier: adapter.approvalTier,
    });

    let requiresApproval =
      routeRequiresApproval(adapter, request) ||
      (this.config.degradedAdaptersRequireReview && adapter.status === 'degraded') ||
      (this.config.durableExecutionRequiresReview &&
        request.preferredExecutionMode === 'durable');

    const deniedReasons: string[] = [];

    if (identity) {
      if (
        this.config.strictTrustFloorEnforcement &&
        compareTrustTier(identity.trustTier, adapter.trustFloor) < 0
      ) {
        deniedReasons.push(
          `Identity trust tier ${identity.trustTier} is below adapter trust floor ${adapter.trustFloor}.`,
        );
      }

      if (
        compareApprovalTier(identity.approvalTier, adapter.approvalTier) < 0 &&
        adapter.approvalTier !== 'none'
      ) {
        requiresApproval = true;
        routeReason.push(
          `Identity approval tier ${identity.approvalTier} is below adapter tier ${adapter.approvalTier}.`,
        );
      }

      if (request.requiredEntitlements.length > 0) {
        const missingEntitlements = request.requiredEntitlements.filter(
          (entitlement) => !identity.entitlements.includes(entitlement),
        );

        if (missingEntitlements.length > 0) {
          deniedReasons.push(
            `Missing entitlements: ${missingEntitlements.join(', ')}.`,
          );
        }
      }

      if (request.requestedScopes.length > 0) {
        const missingScopes = request.requestedScopes
          .map((scope) => scope.scopeId)
          .filter((scopeId) => !identity.effectiveScopes.includes(scopeId));

        if (missingScopes.length > 0) {
          deniedReasons.push(`Missing scopes: ${missingScopes.join(', ')}.`);
        }
      }
    }

    if (delegation.deniedReasons.length > 0 && identity?.delegatedBy) {
      deniedReasons.push(...delegation.deniedReasons);
    }

    if (delegation.requiredApprovals.length > 0) {
      requiresApproval = true;
      routeReason.push(
        ...delegation.requiredApprovals.map(
          (requirement) => `Delegation requires ${requirement.tier}: ${requirement.reason}`,
        ),
      );
    }

    if (deniedReasons.length > 0) {
      const denied = {
        allowed: false,
        disposition: 'deny' as PantavionProtocolCapabilityDisposition,
        reason: uniqStrings([...routeReason, ...deniedReasons]),
        adapter,
        delegation,
      };
      this.blockedLog.unshift(denied);
      return denied;
    }

    const plan = createDispatchPlan({
      adapter,
      request,
      requiresApproval,
      requiredApprovalTier: requiresApproval ? adapter.approvalTier : undefined,
      routeReason,
      metadata: {
        delegated: Boolean(identity?.delegatedBy),
      },
    });

    const disposition = deriveDispositionFromRoute(true, requiresApproval);

    const decision: PantavionGatewayRouteDecision = {
      allowed: true,
      disposition,
      reason: uniqStrings([
        ...routeReason,
        ...(requiresApproval ? ['Route requires approval before execution.'] : ['Route is executable.']),
      ]),
      adapter,
      plan,
      delegation,
    };

    return decision;
  }

  async dispatch(
    input: PantavionGatewayDispatchInput,
  ): Promise<PantavionGatewayDispatchOutput> {
    const route = this.resolveRoute({
      request: input.request,
      identity: input.identity,
    });

    if (!route.allowed || !route.adapter || !route.plan) {
      const blockedDispatch = createDispatchResult({
        adapterKey: route.adapter?.adapterKey ?? 'none',
        family: route.adapter?.family ?? 'internal',
        operationKey: input.request.operationKey,
        status: 'blocked',
        success: false,
        errors: route.reason,
      });

      this.dispatchLog.unshift(blockedDispatch);

      return {
        route,
        dispatch: blockedDispatch,
        capabilityResult: capabilityResultFromDispatch({
          request: input.request,
          dispatch: blockedDispatch,
          disposition: route.disposition,
          routeReason: route.reason,
        }),
      };
    }

    if (route.disposition === 'review') {
      const reviewDispatch = createDispatchResult({
        adapterKey: route.adapter.adapterKey,
        family: route.adapter.family,
        operationKey: input.request.operationKey,
        status: 'blocked',
        success: false,
        warnings: route.reason,
        errors: ['Approval required before dispatch.'],
      });

      this.dispatchLog.unshift(reviewDispatch);

      return {
        route,
        dispatch: reviewDispatch,
        capabilityResult: capabilityResultFromDispatch({
          request: input.request,
          dispatch: reviewDispatch,
          disposition: route.disposition,
          routeReason: route.reason,
        }),
      };
    }

    const handler = this.handlers.get(route.adapter.adapterKey);

    if (!handler) {
      const failedDispatch = createDispatchResult({
        adapterKey: route.adapter.adapterKey,
        family: route.adapter.family,
        operationKey: input.request.operationKey,
        status: 'failed',
        success: false,
        errors: ['No handler registered for selected adapter.'],
      });

      this.dispatchLog.unshift(failedDispatch);

      return {
        route,
        dispatch: failedDispatch,
        capabilityResult: capabilityResultFromDispatch({
          request: input.request,
          dispatch: failedDispatch,
          disposition: 'deny',
          routeReason: route.reason,
        }),
      };
    }

    try {
      const output = await Promise.resolve(
        handler({
          adapter: route.adapter,
          request: input.request,
          identity: input.identity,
          plan: route.plan,
        }),
      );

      const completedDispatch = createDispatchResult({
        adapterKey: route.adapter.adapterKey,
        family: route.adapter.family,
        operationKey: input.request.operationKey,
        status: 'completed',
        success: true,
        output,
      });

      this.dispatchLog.unshift(completedDispatch);

      return {
        route,
        dispatch: completedDispatch,
        capabilityResult: capabilityResultFromDispatch({
          request: input.request,
          dispatch: completedDispatch,
          disposition: 'allow',
          routeReason: route.reason,
        }),
      };
    } catch (error) {
      const failedDispatch = createDispatchResult({
        adapterKey: route.adapter.adapterKey,
        family: route.adapter.family,
        operationKey: input.request.operationKey,
        status: 'failed',
        success: false,
        errors: [safeText((error as Error)?.message, 'Unknown protocol dispatch error.')],
      });

      this.dispatchLog.unshift(failedDispatch);

      return {
        route,
        dispatch: failedDispatch,
        capabilityResult: capabilityResultFromDispatch({
          request: input.request,
          dispatch: failedDispatch,
          disposition: 'deny',
          routeReason: route.reason,
        }),
      };
    }
  }

  private rankAdaptersForRequest(
    request: PantavionCapabilityRequest,
  ): PantavionProtocolAdapterRecord[] {
    const preferredFamilies = request.preferredFamilies.length > 0
      ? request.preferredFamilies
      : ['internal'];

    const preferredTruthMode = normalizeTruthMode(
      request.preferredTruthMode ?? 'deterministic',
    );

    const ranked = [...this.adapters.values()]
      .filter((adapter) => {
        const supportsCapability =
          adapter.supportedCapabilities.includes(request.capabilityKey) ||
          adapter.supportedOperations.includes(request.operationKey);

        const familyAllowed =
          preferredFamilies.includes(adapter.family) ||
          preferredFamilies.length === 0;

        return supportsCapability && familyAllowed;
      })
      .map((adapter) => {
        let score = 0;

        if (preferredFamilies.includes(adapter.family)) {
          score += 5;
        }

        if (adapter.supportedCapabilities.includes(request.capabilityKey)) {
          score += 4;
        }

        if (adapter.supportedOperations.includes(request.operationKey)) {
          score += 3;
        }

        if (
          request.preferredExecutionMode &&
          adapter.executionModes.includes(request.preferredExecutionMode)
        ) {
          score += 2;
        }

        if (adapter.truthModes.includes(preferredTruthMode)) {
          score += 2;
        }

        if (adapter.status === 'active') {
          score += 2;
        } else if (adapter.status === 'degraded') {
          score += 1;
        }

        return { adapter, score };
      })
      .sort((left, right) => right.score - left.score)
      .map((item) => item.adapter);

    return ranked;
  }
}

export function createProtocolGateway(
  config: Partial<PantavionGatewayConfig> = {},
): PantavionProtocolGateway {
  return new PantavionProtocolGateway(config);
}

export const protocolGateway = createProtocolGateway();

export function registerProtocolAdapter(
  input: ConstructorParameters<typeof PantavionProtocolGateway>[0] extends never
    ? never
    : PantavionProtocolAdapterRecord,
): PantavionProtocolAdapterRecord {
  return protocolGateway.registerAdapter(input);
}

export function registerProtocolHandler(
  adapterKey: string,
  handler: GatewayHandler,
): void {
  protocolGateway.registerHandler(adapterKey, handler);
}

export function resolveProtocolRoute(
  input: PantavionGatewayRouteInput,
): PantavionGatewayRouteDecision {
  return protocolGateway.resolveRoute(input);
}

export async function dispatchProtocolRequest(
  input: PantavionGatewayDispatchInput,
): Promise<PantavionGatewayDispatchOutput> {
  return protocolGateway.dispatch(input);
}

export function getProtocolRegistrySnapshot(): PantavionProtocolRegistrySnapshot {
  return protocolGateway.getRegistrySnapshot();
}

export function getProtocolGatewayStats(): PantavionGatewayStats {
  return protocolGateway.getStats();
}

export function registerFoundationProtocolAdapter(input: {
  adapterKey: string;
  displayName?: string;
  family?: PantavionProtocolFamily;
  supportedOperations?: string[];
  supportedCapabilities?: string[];
  truthModes?: PantavionProtocolTruthMode[];
  metadata?: UnknownRecord;
}): PantavionProtocolAdapterRecord {
  const adapter = createProtocolAdapterRecord({
    adapterKey: input.adapterKey,
    displayName: input.displayName,
    family: input.family ?? 'internal',
    supportedOperations: input.supportedOperations ?? [],
    supportedCapabilities: input.supportedCapabilities ?? [],
    truthModes: input.truthModes ?? ['deterministic'],
    executionModes: ['sync', 'async'],
    authModes: ['session', 'delegated', 'service'],
    trustFloor: 'basic',
    approvalTier: 'review',
    metadata: asRecord(input.metadata),
  });

  return protocolGateway.registerAdapter(adapter);
}
