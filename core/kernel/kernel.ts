// core/kernel/kernel.ts

import * as PantavionTypes from '../../types/pantavion';
import * as CanonicalRegistryModule from '../canonical/canonical-registry';
import * as CapabilityRegistryModule from '../registry/capability-registry';
import * as SecurityPolicyModule from '../security/security-policy';
import * as AdminAlertsModule from '../admin/admin-alerts';

type UnknownRecord = Record<string, unknown>;
type AnyFn = (...args: unknown[]) => unknown;
type MaybePromise<T> = T | Promise<T>;

export type KernelTruthZone = 'deterministic' | 'verified' | 'generative';
export type KernelMemoryClass =
  | 'ephemeral'
  | 'session'
  | 'thread'
  | 'project'
  | 'workflow'
  | 'profile'
  | 'archive'
  | 'governed-long-term';

export type KernelSensitivity =
  | 'public'
  | 'internal'
  | 'confidential'
  | 'restricted';

export type KernelSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';
export type KernelPriority = 'p0' | 'p1' | 'p2' | 'p3' | 'p4';
export type KernelDisposition = 'allow' | 'review' | 'deny';

export type KernelRecommendationStatus =
  | 'ready-to-build'
  | 'ready-to-route'
  | 'approval-required'
  | 'gap-close-first'
  | 'blocked';

export type KernelActionMode =
  | 'answer'
  | 'build'
  | 'research'
  | 'routing'
  | 'automation'
  | 'admin';

export type KernelCategory =
  | 'kernel'
  | 'identity'
  | 'protocol'
  | 'security'
  | 'admin'
  | 'runtime'
  | 'workspace'
  | 'voice'
  | 'memory'
  | 'knowledge'
  | 'business'
  | 'crisis'
  | 'utility'
  | 'social'
  | 'people'
  | 'learning'
  | 'unknown';

export type KernelGapArea =
  | 'placement'
  | 'capability'
  | 'policy'
  | 'identity'
  | 'lifecycle'
  | 'operations'
  | 'runtime'
  | 'taxonomy'
  | 'memory'
  | 'upgrade'
  | 'expansion';

export type KernelGapSeverity = 'minor' | 'material' | 'critical';

export type KernelCapabilityStatus =
  | 'available'
  | 'degraded'
  | 'missing'
  | 'restricted'
  | 'review-required';

export type KernelCapabilitySource =
  | 'registry'
  | 'kernel-default'
  | 'inferred'
  | 'future-bridge';

export type KernelRiskPosture =
  | 'normal'
  | 'elevated'
  | 'high-stakes'
  | 'restricted'
  | 'admin-only';

export type KernelApprovalTier =
  | 'none'
  | 'review'
  | 'admin'
  | 'security'
  | 'executive';

export type KernelTrustTier =
  | 'untrusted'
  | 'basic'
  | 'trusted'
  | 'high-trust'
  | 'system';

export interface KernelActorContext {
  actorId?: string;
  actorType?: 'human' | 'agent' | 'service';
  role?: string;
  scopes?: string[];
  delegatedBy?: string;
  sessionId?: string;
  workspaceId?: string;
  orgId?: string;
  planKey?: string;
  trustTierHint?: KernelTrustTier;
}

export interface KernelInput {
  id?: string;
  title?: string;
  description?: string;
  inputText?: string;
  payload?: unknown;
  requestedOperation?: string;
  requestedCapabilities?: string[];
  targetPath?: string;
  targetModule?: string;
  tags?: string[];
  domainHints?: string[];
  truthPreference?: KernelTruthZone;
  memoryClass?: KernelMemoryClass;
  sensitivity?: KernelSensitivity;
  actor?: KernelActorContext;
  metadata?: UnknownRecord;
}

export interface KernelRequestEnvelope {
  id: string;
  acceptedAt: string;
  title: string;
  description: string;
  inputText: string;
  payload: unknown;
  requestedOperation: string;
  requestedCapabilities: string[];
  targetPath?: string;
  targetModule?: string;
  tags: string[];
  domainHints: string[];
  truthPreference?: KernelTruthZone;
  memoryClass: KernelMemoryClass;
  sensitivity: KernelSensitivity;
  actor: KernelActorContext;
  metadata: UnknownRecord;
}

export interface KernelClassification {
  category: KernelCategory;
  actionMode: KernelActionMode;
  truthZone: KernelTruthZone;
  severity: KernelSeverity;
  priority: KernelPriority;
  confidence: number;
  rationale: string[];
  extractedIntents: string[];
  requiresAdminReview: boolean;
  riskPosture: KernelRiskPosture;
}

export interface KernelPlacement {
  zone: string;
  family: string;
  productFamily: string;
  canonicalKey: string;
  targetPath?: string;
  targetModule?: string;
  owner: string;
  confidence: number;
  rationale: string[];
  isFallback: boolean;
}

export interface KernelIdentityPosture {
  resolved: boolean;
  provisional: boolean;
  actorId?: string;
  actorType: 'human' | 'agent' | 'service';
  effectiveRoles: string[];
  effectiveScopes: string[];
  trustTier: KernelTrustTier;
  approvalTier: KernelApprovalTier;
  entitlements: string[];
  deniedRestrictions: string[];
  delegatedBy?: string;
  rationale: string[];
}

export interface KernelCapabilityMatch {
  key: string;
  status: KernelCapabilityStatus;
  source: KernelCapabilitySource;
  owner: string;
  score: number;
  rationale: string[];
  runtimeFamily?: string;
  protocolFamily?: string;
}

export interface KernelCapabilityPlan {
  matchedCapabilities: KernelCapabilityMatch[];
  missingCapabilities: string[];
  degradedCapabilities: string[];
  restrictedCapabilities: string[];
  executionPosture:
    | 'deterministic'
    | 'verified'
    | 'generative'
    | 'hybrid'
    | 'blocked';
  requiredRuntimeFamilies: string[];
  requiredProtocolFamilies: string[];
  safeFallbackCandidates: string[];
  confidence: number;
  rationale: string[];
}

export interface KernelPolicyDecision {
  disposition: KernelDisposition;
  riskPosture: KernelRiskPosture;
  score: number;
  reasons: string[];
  appliedRules: string[];
  requiredApprovals: string[];
  allowedScopes: string[];
}

export interface KernelGap {
  key: string;
  severity: KernelGapSeverity;
  area: KernelGapArea;
  description: string;
  requiredAction: string;
}

export interface KernelBuildRecommendation {
  status: KernelRecommendationStatus;
  buildTarget?: string;
  recommendedOwner: string;
  recommendedSequence: string[];
  nextSteps: string[];
  notes: string[];
}

export interface KernelAdminAlert {
  id: string;
  severity: KernelSeverity;
  category:
    | 'incident'
    | 'risk'
    | 'capacity'
    | 'security'
    | 'maintenance'
    | 'governance'
    | 'future-readiness';
  title: string;
  summary: string;
  recommendedActions: string[];
  createdAt: string;
}

export interface KernelExplainability {
  classificationWhy: string[];
  placementWhy: string[];
  capabilityWhy: string[];
  policyWhy: string[];
  recommendationWhy: string[];
  unresolved: string[];
  lowConfidenceAreas: string[];
}

export interface KernelDecisionRecord {
  id: string;
  requestId: string;
  createdAt: string;
  request: KernelRequestEnvelope;
  classification: KernelClassification;
  placement: KernelPlacement;
  identity: KernelIdentityPosture;
  capabilityPlan: KernelCapabilityPlan;
  policy: KernelPolicyDecision;
  gaps: KernelGap[];
  recommendation: KernelBuildRecommendation;
  alerts: KernelAdminAlert[];
  explainability: KernelExplainability;
}

export interface KernelOutput {
  request: KernelRequestEnvelope;
  classification: KernelClassification;
  placement: KernelPlacement;
  identity: KernelIdentityPosture;
  capabilityPlan: KernelCapabilityPlan;
  policy: KernelPolicyDecision;
  gaps: KernelGap[];
  recommendation: KernelBuildRecommendation;
  alerts: KernelAdminAlert[];
  explainability: KernelExplainability;
  decision: KernelDecisionRecord;
}

export interface KernelConfig {
  capabilityScoreThreshold: number;
  placementConfidenceThreshold: number;
  explainabilityLowConfidenceThreshold: number;
  decisionLogLimit: number;
  enableDecisionPersistence: boolean;
  enableAdminAlertPublication: boolean;
}

export interface KernelLifecycleHookInput {
  request: KernelRequestEnvelope;
  classification: KernelClassification;
  placement: KernelPlacement;
  identity: KernelIdentityPosture;
  capabilityPlan: KernelCapabilityPlan;
  policy: KernelPolicyDecision;
  gaps: KernelGap[];
}

export interface KernelMaintenanceSignal {
  type:
    | 'health-anomaly'
    | 'dependency-degraded'
    | 'capacity-warning'
    | 'cost-drift'
    | 'maintenance-recommended';
  severity: KernelSeverity;
  summary: string;
  actions: string[];
}

export interface KernelUpgradeSignal {
  type:
    | 'outdated-component'
    | 'replacement-candidate'
    | 'upgrade-opportunity'
    | 'migration-recommended';
  severity: KernelSeverity;
  summary: string;
  actions: string[];
}

export interface KernelExpansionSignal {
  type:
    | 'blueprint-candidate'
    | 'module-extension'
    | 'workspace-candidate'
    | 'registry-expansion'
    | 'new-service-opportunity';
  severity: KernelSeverity;
  summary: string;
  actions: string[];
}

export interface KernelHooks {
  resolveIdentityPosture?: (
    request: KernelRequestEnvelope,
    classification: KernelClassification,
  ) => MaybePromise<KernelIdentityPosture | null>;
  memoryAwareness?: (
    input: KernelLifecycleHookInput,
  ) => MaybePromise<{ notes?: string[]; gaps?: KernelGap[] } | null>;
  selfMaintenance?: (
    input: KernelLifecycleHookInput,
  ) => MaybePromise<KernelMaintenanceSignal[] | null>;
  selfUpgrade?: (
    input: KernelLifecycleHookInput,
  ) => MaybePromise<KernelUpgradeSignal[] | null>;
  selfExpansion?: (
    input: KernelLifecycleHookInput,
  ) => MaybePromise<KernelExpansionSignal[] | null>;
}

export interface KernelDependencies {
  pantavionTypes: typeof PantavionTypes;
  canonicalRegistry: typeof CanonicalRegistryModule;
  capabilityRegistry: typeof CapabilityRegistryModule;
  securityPolicy: typeof SecurityPolicyModule;
  adminAlerts: typeof AdminAlertsModule;
  hooks: KernelHooks;
}

interface PlacementContext {
  request: KernelRequestEnvelope;
  classification: KernelClassification;
}

interface CapabilityQuery {
  request: KernelRequestEnvelope;
  classification: KernelClassification;
  placement: KernelPlacement;
  identity: KernelIdentityPosture;
  requestedCapabilities: string[];
}

interface SecurityEvaluationContext {
  request: KernelRequestEnvelope;
  classification: KernelClassification;
  placement: KernelPlacement;
  identity: KernelIdentityPosture;
  capabilityPlan: KernelCapabilityPlan;
}

interface CanonicalRegistryBridge {
  resolvePlacement(context: PlacementContext): Promise<KernelPlacement>;
  recordDecision?(decision: KernelDecisionRecord): Promise<void>;
}

interface CapabilityRegistryBridge {
  matchCapabilities(query: CapabilityQuery): Promise<KernelCapabilityMatch[]>;
}

interface SecurityPolicyBridge {
  evaluate(
    context: SecurityEvaluationContext,
  ): Promise<KernelPolicyDecision | null>;
}

interface AdminAlertsBridge {
  publish(alert: KernelAdminAlert): Promise<void>;
}

const DEFAULT_CONFIG: KernelConfig = {
  capabilityScoreThreshold: 0.64,
  placementConfidenceThreshold: 0.72,
  explainabilityLowConfidenceThreshold: 0.7,
  decisionLogLimit: 500,
  enableDecisionPersistence: true,
  enableAdminAlertPublication: true,
};

const DEFAULT_DEPENDENCIES: KernelDependencies = {
  pantavionTypes: PantavionTypes,
  canonicalRegistry: CanonicalRegistryModule,
  capabilityRegistry: CapabilityRegistryModule,
  securityPolicy: SecurityPolicyModule,
  adminAlerts: AdminAlertsModule,
  hooks: {},
};

export class PantavionKernel0Coordinator {
  private readonly deps: KernelDependencies;
  private readonly config: KernelConfig;
  private readonly canonicalBridge: CanonicalRegistryBridge;
  private readonly capabilityBridge: CapabilityRegistryBridge;
  private readonly securityBridge: SecurityPolicyBridge;
  private readonly adminBridge: AdminAlertsBridge;
  private readonly decisionLog: KernelDecisionRecord[] = [];
  private readonly canonicalBaseline = new Map<string, KernelDecisionRecord>();

  constructor(
    deps: Partial<KernelDependencies> = {},
    config: Partial<KernelConfig> = {},
  ) {
    this.deps = {
      ...DEFAULT_DEPENDENCIES,
      ...deps,
      hooks: {
        ...DEFAULT_DEPENDENCIES.hooks,
        ...(deps.hooks ?? {}),
      },
    };

    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };

    this.canonicalBridge = createCanonicalRegistryBridge(
      this.deps.canonicalRegistry as unknown as UnknownRecord,
    );
    this.capabilityBridge = createCapabilityRegistryBridge(
      this.deps.capabilityRegistry as unknown as UnknownRecord,
    );
    this.securityBridge = createSecurityPolicyBridge(
      this.deps.securityPolicy as unknown as UnknownRecord,
    );
    this.adminBridge = createAdminAlertsBridge(
      this.deps.adminAlerts as unknown as UnknownRecord,
    );
  }

  async process(input: KernelInput): Promise<KernelOutput> {
    const request = this.normalizeInput(input);
    const classification = this.classify(request);
    const identity = await this.resolveIdentityPosture(request, classification);
    const placement = await this.resolvePlacement(request, classification);
    const capabilityPlan = await this.planCapabilities(
      request,
      classification,
      placement,
      identity,
    );
    const policy = await this.evaluatePolicy(
      request,
      classification,
      placement,
      identity,
      capabilityPlan,
    );

    let gaps = this.detectGaps(
      request,
      classification,
      placement,
      identity,
      capabilityPlan,
      policy,
    );

    const hookInput: KernelLifecycleHookInput = {
      request,
      classification,
      placement,
      identity,
      capabilityPlan,
      policy,
      gaps,
    };

    const memoryHookResult = await this.runMemoryAwareness(hookInput);
    if (memoryHookResult?.gaps?.length) {
      gaps = dedupeGaps([...gaps, ...memoryHookResult.gaps]);
    }

    const recommendation = this.buildRecommendation(
      request,
      classification,
      placement,
      identity,
      capabilityPlan,
      policy,
      gaps,
      memoryHookResult?.notes ?? [],
    );

    const alerts = await this.generateAlerts(
      request,
      classification,
      placement,
      identity,
      capabilityPlan,
      policy,
      gaps,
      recommendation,
      hookInput,
    );

    const explainability = this.buildExplainability(
      classification,
      placement,
      capabilityPlan,
      policy,
      recommendation,
      gaps,
      identity,
    );

    const decision = this.buildDecisionRecord(
      request,
      classification,
      placement,
      identity,
      capabilityPlan,
      policy,
      gaps,
      recommendation,
      alerts,
      explainability,
    );

    await this.persistDecision(decision);

    return {
      request,
      classification,
      placement,
      identity,
      capabilityPlan,
      policy,
      gaps,
      recommendation,
      alerts,
      explainability,
      decision,
    };
  }

  getDecisionHistory(): KernelDecisionRecord[] {
    return [...this.decisionLog];
  }

  getCanonicalBaseline(): KernelDecisionRecord[] {
    return [...this.canonicalBaseline.values()];
  }

  explainDecision(decisionId: string): KernelDecisionRecord | null {
    return this.decisionLog.find((entry) => entry.id === decisionId) ?? null;
  }

  private normalizeInput(input: KernelInput): KernelRequestEnvelope {
    const title = safeText(input.title, 'Untitled kernel request');
    const description = safeText(input.description);
    const inputText = safeText(input.inputText, description || title);

    const requestedOperation = safeText(
      input.requestedOperation,
      inferRequestedOperation(title, description, inputText),
    );

    const requestedCapabilities = uniqStrings([
      ...ensureStringArray(input.requestedCapabilities),
      ...deriveRequestedCapabilities(inputText, requestedOperation),
    ]);

    return {
      id: safeText(input.id, createId('krq')),
      acceptedAt: nowIso(),
      title,
      description,
      inputText,
      payload: input.payload ?? null,
      requestedOperation,
      requestedCapabilities,
      targetPath: safeTextOrUndefined(input.targetPath),
      targetModule: safeTextOrUndefined(input.targetModule),
      tags: uniqStrings(ensureStringArray(input.tags).map(normalizeTag)),
      domainHints: uniqStrings(ensureStringArray(input.domainHints).map(normalizeTag)),
      truthPreference: input.truthPreference,
      memoryClass: input.memoryClass ?? inferMemoryClass(input),
      sensitivity: input.sensitivity ?? inferSensitivity(input),
      actor: {
        actorId: safeTextOrUndefined(input.actor?.actorId),
        actorType: input.actor?.actorType ?? 'human',
        role: safeTextOrUndefined(input.actor?.role),
        scopes: uniqStrings(ensureStringArray(input.actor?.scopes)),
        delegatedBy: safeTextOrUndefined(input.actor?.delegatedBy),
        sessionId: safeTextOrUndefined(input.actor?.sessionId),
        workspaceId: safeTextOrUndefined(input.actor?.workspaceId),
        orgId: safeTextOrUndefined(input.actor?.orgId),
        planKey: safeTextOrUndefined(input.actor?.planKey),
        trustTierHint: input.actor?.trustTierHint,
      },
      metadata: asRecord(input.metadata),
    };
  }

  private classify(request: KernelRequestEnvelope): KernelClassification {
    const text = buildRequestSearchText(request);
    const category = inferCategory(text, request);
    const actionMode = inferActionMode(text, request);
    const truthZone = request.truthPreference ?? inferTruthZone(text, category, actionMode);
    const severity = inferSeverity(text, request, category, actionMode);
    const priority = severityToPriority(severity);
    const extractedIntents = extractIntents(text);
    const requiresAdminReview =
      severity === 'critical' ||
      request.sensitivity === 'restricted' ||
      hasAny(text, ['approval', 'review', 'restricted', 'admin-only', 'executive']) ||
      request.tags.includes('admin-approval');
    const riskPosture = inferRiskPosture(
      text,
      request.sensitivity,
      category,
      requiresAdminReview,
    );
    const confidence = computeClassificationConfidence(
      category,
      actionMode,
      truthZone,
      request,
    );

    const rationale = [
      `Category resolved as "${category}".`,
      `Action mode resolved as "${actionMode}".`,
      `Truth zone resolved as "${truthZone}".`,
      `Severity resolved as "${severity}".`,
      `Risk posture resolved as "${riskPosture}".`,
      ...(request.targetPath ? [`Explicit target path detected: ${request.targetPath}.`] : []),
      ...(request.targetModule
        ? [`Explicit target module detected: ${request.targetModule}.`]
        : []),
      ...(request.requestedCapabilities.length > 0
        ? [`Requested capabilities: ${request.requestedCapabilities.join(', ')}.`]
        : []),
    ];

    return {
      category,
      actionMode,
      truthZone,
      severity,
      priority,
      confidence,
      rationale,
      extractedIntents,
      requiresAdminReview,
      riskPosture,
    };
  }

  private async resolveIdentityPosture(
    request: KernelRequestEnvelope,
    classification: KernelClassification,
  ): Promise<KernelIdentityPosture> {
    const hook = this.deps.hooks.resolveIdentityPosture;
    if (hook) {
      const fromHook = await Promise.resolve(hook(request, classification));
      if (fromHook) {
        return sanitizeIdentityPosture(fromHook, request);
      }
    }

    return buildFallbackIdentityPosture(request, classification);
  }

  private async resolvePlacement(
    request: KernelRequestEnvelope,
    classification: KernelClassification,
  ): Promise<KernelPlacement> {
    const placement = await this.canonicalBridge.resolvePlacement({
      request,
      classification,
    });

    return sanitizePlacement(placement, request, classification);
  }

  private async planCapabilities(
    request: KernelRequestEnvelope,
    classification: KernelClassification,
    placement: KernelPlacement,
    identity: KernelIdentityPosture,
  ): Promise<KernelCapabilityPlan> {
    const kernelBaseCapabilities = [
      'intake-normalization',
      'canonical-classification',
      'canonical-placement',
      'truth-zone-resolution',
      'capability-lookup',
      'policy-evaluation',
      'gap-detection',
      'build-recommendation',
      'admin-alert-generation',
      'decision-persistence',
      'explainability',
    ];

    const requestedCapabilities = uniqStrings([
      ...kernelBaseCapabilities,
      ...request.requestedCapabilities,
      ...deriveCategoryCapabilities(classification.category),
      ...deriveActionCapabilities(classification.actionMode),
      ...deriveRiskCapabilities(classification.riskPosture),
    ]);

    const registryMatches = await this.capabilityBridge.matchCapabilities({
      request,
      classification,
      placement,
      identity,
      requestedCapabilities,
    });

    const fallbackMatches = buildFallbackCapabilityMatches(
      requestedCapabilities,
      placement.owner,
      this.config.capabilityScoreThreshold,
    );

    const mergedMatches = mergeCapabilityMatches(registryMatches, fallbackMatches);

    const missingCapabilities = mergedMatches
      .filter((item) => item.status === 'missing')
      .map((item) => item.key);

    const degradedCapabilities = mergedMatches
      .filter((item) => item.status === 'degraded')
      .map((item) => item.key);

    const restrictedCapabilities = mergedMatches
      .filter((item) => item.status === 'restricted' || item.status === 'review-required')
      .map((item) => item.key);

    const requiredRuntimeFamilies = uniqStrings(
      mergedMatches.map((item) => safeText(item.runtimeFamily)).filter(Boolean),
    );

    const requiredProtocolFamilies = uniqStrings(
      mergedMatches.map((item) => safeText(item.protocolFamily)).filter(Boolean),
    );

    const executionPosture = deriveExecutionPosture(
      classification.truthZone,
      mergedMatches,
      restrictedCapabilities,
    );

    const safeFallbackCandidates = buildSafeFallbackCandidates(
      classification,
      mergedMatches,
      placement,
    );

    const confidence = computeCapabilityPlanConfidence(mergedMatches);

    const rationale = [
      `Capability plan built for ${mergedMatches.length} candidate capabilities.`,
      `Execution posture resolved as "${executionPosture}".`,
      ...(requiredRuntimeFamilies.length > 0
        ? [`Required runtime families: ${requiredRuntimeFamilies.join(', ')}.`]
        : []),
      ...(requiredProtocolFamilies.length > 0
        ? [`Required protocol families: ${requiredProtocolFamilies.join(', ')}.`]
        : []),
      ...(safeFallbackCandidates.length > 0
        ? [`Fallback candidates: ${safeFallbackCandidates.join(', ')}.`]
        : []),
    ];

    return {
      matchedCapabilities: mergedMatches,
      missingCapabilities,
      degradedCapabilities,
      restrictedCapabilities,
      executionPosture,
      requiredRuntimeFamilies,
      requiredProtocolFamilies,
      safeFallbackCandidates,
      confidence,
      rationale,
    };
  }

  private async evaluatePolicy(
    request: KernelRequestEnvelope,
    classification: KernelClassification,
    placement: KernelPlacement,
    identity: KernelIdentityPosture,
    capabilityPlan: KernelCapabilityPlan,
  ): Promise<KernelPolicyDecision> {
    const fromBridge = await this.securityBridge.evaluate({
      request,
      classification,
      placement,
      identity,
      capabilityPlan,
    });

    if (fromBridge) {
      return sanitizePolicyDecision(fromBridge, request, classification);
    }

    return buildFallbackPolicyDecision(
      request,
      classification,
      placement,
      identity,
      capabilityPlan,
    );
  }

  private detectGaps(
    request: KernelRequestEnvelope,
    classification: KernelClassification,
    placement: KernelPlacement,
    identity: KernelIdentityPosture,
    capabilityPlan: KernelCapabilityPlan,
    policy: KernelPolicyDecision,
  ): KernelGap[] {
    const gaps: KernelGap[] = [];

    if (placement.isFallback || placement.confidence < this.config.placementConfidenceThreshold) {
      gaps.push({
        key: 'taxonomy-placement-low-confidence',
        severity: 'material',
        area: 'taxonomy',
        description:
          'Η canonical τοποθέτηση δεν είναι ακόμη αρκετά σταθερή ή βασίζεται σε fallback logic.',
        requiredAction:
          'Ενίσχυσε canonical taxonomy / registry rules ή πρόσθεσε σαφέστερο target path.',
      });
    }

    if (!identity.resolved) {
      gaps.push({
        key: 'identity-unresolved',
        severity: 'critical',
        area: 'identity',
        description:
          'Το actor posture δεν έχει λυθεί deterministic enough για σοβαρό governed execution.',
        requiredAction:
          'Σύνδεσε identity-model / delegation-model ή ζήτησε ισχυρότερο actor context.',
      });
    }

    if (identity.provisional) {
      gaps.push({
        key: 'identity-provisional',
        severity: 'material',
        area: 'identity',
        description:
          'Η identity/trust posture προήλθε από provisional fallback και όχι από canonical identity model.',
        requiredAction:
          'Κλείσε το bridge με core/identity/identity-model.ts.',
      });
    }

    for (const capability of capabilityPlan.matchedCapabilities) {
      if (capability.status === 'missing') {
        gaps.push({
          key: `missing-capability:${capability.key}`,
          severity: request.requestedCapabilities.includes(capability.key)
            ? 'critical'
            : 'material',
          area: 'capability',
          description: `Λείπει η capability "${capability.key}".`,
          requiredAction:
            'Καταχώρισε τη capability στο registry ή υλοποίησε το σχετικό runtime/protocol binding.',
        });
      }

      if (capability.status === 'degraded') {
        gaps.push({
          key: `degraded-capability:${capability.key}`,
          severity: 'material',
          area: 'runtime',
          description: `Η capability "${capability.key}" είναι degraded.`,
          requiredAction:
            'Έλεγξε runtime health, fallback readiness και dependency posture.',
        });
      }

      if (capability.status === 'restricted' || capability.status === 'review-required') {
        gaps.push({
          key: `restricted-capability:${capability.key}`,
          severity: 'material',
          area: 'policy',
          description:
            `Η capability "${capability.key}" απαιτεί review/restricted flow πριν από execution.`,
          requiredAction:
            'Οδήγησέ την σε approval path ή admin-only path ανάλογα με το policy matrix.',
        });
      }
    }

    if (policy.disposition === 'review') {
      gaps.push({
        key: 'policy-review-required',
        severity: 'critical',
        area: 'policy',
        description: 'Το request απαιτεί policy/security review πριν από execution.',
        requiredAction:
          'Ζήτησε approval packet, επιβεβαίωσε scope, rights, truth boundaries και safe path.',
      });
    }

    if (policy.disposition === 'deny') {
      gaps.push({
        key: 'policy-hard-block',
        severity: 'critical',
        area: 'policy',
        description: 'Το request μπλοκάρεται από hard policy / safety / trust rules.',
        requiredAction:
          'Αναθεώρησε operation, scope, category ή route πριν επιχειρηθεί ξανά dispatch.',
      });
    }

    if (
      classification.riskPosture === 'high-stakes' ||
      classification.riskPosture === 'restricted' ||
      classification.riskPosture === 'admin-only'
    ) {
      gaps.push({
        key: 'high-stakes-matrix-needed',
        severity: 'material',
        area: 'policy',
        description:
          'Το request ανήκει σε υψηλού ρίσκου οικογένεια και χρειάζεται stronger protocol matrix coverage.',
        requiredAction:
          'Κλείσε το High-Stakes Protocol Matrix v1 για deterministic boundary enforcement.',
      });
    }

    if (request.memoryClass === 'governed-long-term' && classification.truthZone === 'generative') {
      gaps.push({
        key: 'long-term-memory-generative-risk',
        severity: 'material',
        area: 'memory',
        description:
          'Generative result συνδέεται με governed long-term memory class και θέλει stronger promotion rules.',
        requiredAction:
          'Δέσε memory promotion με verified/deterministic gates και explanation metadata.',
      });
    }

    return dedupeGaps(gaps);
  }

  private buildRecommendation(
    request: KernelRequestEnvelope,
    classification: KernelClassification,
    placement: KernelPlacement,
    identity: KernelIdentityPosture,
    capabilityPlan: KernelCapabilityPlan,
    policy: KernelPolicyDecision,
    gaps: KernelGap[],
    memoryNotes: string[],
  ): KernelBuildRecommendation {
    const criticalGaps = gaps.filter((gap) => gap.severity === 'critical');
    const materialGaps = gaps.filter((gap) => gap.severity === 'material');
    const buildTarget = placement.targetPath ?? request.targetPath;
    const recommendedOwner = placement.owner;

    if (policy.disposition === 'deny') {
      return {
        status: 'blocked',
        buildTarget,
        recommendedOwner,
        recommendedSequence: [],
        nextSteps: [
          'Σταμάτησε execution/build path.',
          'Αναθεώρησε legal/safety/identity boundaries.',
        ],
        notes: ['Hard policy block triggered.'],
      };
    }

    if (policy.disposition === 'review') {
      return {
        status: 'approval-required',
        buildTarget,
        recommendedOwner,
        recommendedSequence: buildSequenceForCategory(
          classification.category,
          buildTarget,
        ),
        nextSteps: uniqStrings([
          'Παρήγαγε approval packet.',
          'Επιβεβαίωσε actor, delegation, scope και allowed truth zone.',
          ...policy.requiredApprovals,
        ]),
        notes: ['Execution admissible only after explicit review/approval.'],
      };
    }

    if (criticalGaps.length > 0) {
      return {
        status: 'gap-close-first',
        buildTarget,
        recommendedOwner,
        recommendedSequence: buildSequenceForCategory(
          classification.category,
          buildTarget,
        ),
        nextSteps: uniqStrings(criticalGaps.map((gap) => gap.requiredAction)),
        notes: ['Critical gaps must close before trustworthy execution/build.'],
      };
    }

    if (
      classification.actionMode === 'routing' ||
      classification.actionMode === 'automation'
    ) {
      return {
        status: 'ready-to-route',
        buildTarget,
        recommendedOwner,
        recommendedSequence: buildSequenceForCategory(
          classification.category,
          buildTarget,
        ),
        nextSteps: uniqStrings([
          'Προχώρησε σε governed routing path.',
          'Κατέγραψε provenance και decision continuity.',
          ...(materialGaps.length > 0
            ? ['Παρακολούθησε material gaps παράλληλα με τη controlled execution.']
            : []),
        ]),
        notes: memoryNotes,
      };
    }

    return {
      status: 'ready-to-build',
      buildTarget,
      recommendedOwner,
      recommendedSequence: buildSequenceForCategory(
        classification.category,
        buildTarget,
      ),
      nextSteps: uniqStrings([
        'Προχώρησε με canonical implementation sequence.',
        'Κατέγραψε το decision record στο baseline.',
        ...(materialGaps.length > 0
          ? ['Κλείσε τα material gaps πριν το production hardening.']
          : []),
      ]),
      notes: uniqStrings([
        ...memoryNotes,
        ...(identity.provisional
          ? ['Identity posture is provisional; full hardening follows identity-model integration.']
          : []),
      ]),
    };
  }

  private async generateAlerts(
    request: KernelRequestEnvelope,
    classification: KernelClassification,
    placement: KernelPlacement,
    identity: KernelIdentityPosture,
    capabilityPlan: KernelCapabilityPlan,
    policy: KernelPolicyDecision,
    gaps: KernelGap[],
    recommendation: KernelBuildRecommendation,
    hookInput: KernelLifecycleHookInput,
  ): Promise<KernelAdminAlert[]> {
    const alerts: KernelAdminAlert[] = [];

    if (classification.severity === 'high' || classification.severity === 'critical') {
      alerts.push({
        id: createId('alt'),
        severity: classification.severity,
        category: 'risk',
        title: 'High-severity kernel intake',
        summary: `Ο Kernel 0 έλαβε high-severity request για "${placement.canonicalKey}".`,
        recommendedActions: [
          'Δώσε visibility στο operations plane.',
          'Παρακολούθησε risk, capacity και dependency posture.',
        ],
        createdAt: nowIso(),
      });
    }

    if (policy.disposition !== 'allow') {
      alerts.push({
        id: createId('alt'),
        severity: policy.disposition === 'deny' ? 'critical' : 'high',
        category: 'security',
        title: `Policy disposition: ${policy.disposition}`,
        summary:
          `Το request "${request.requestedOperation}" έλαβε disposition "${policy.disposition}".`,
        recommendedActions:
          policy.requiredApprovals.length > 0
            ? policy.requiredApprovals
            : ['Επανέλεγξε identity, scope, policy and safe path.'],
        createdAt: nowIso(),
      });
    }

    const criticalGaps = gaps.filter((gap) => gap.severity === 'critical');
    if (criticalGaps.length > 0) {
      alerts.push({
        id: createId('alt'),
        severity: 'critical',
        category: 'governance',
        title: 'Critical kernel gaps detected',
        summary: `Εντοπίστηκαν ${criticalGaps.length} critical gaps πριν από execution/build.`,
        recommendedActions: criticalGaps.map((gap) => gap.requiredAction),
        createdAt: nowIso(),
      });
    }

    if (identity.provisional) {
      alerts.push({
        id: createId('alt'),
        severity: 'medium',
        category: 'governance',
        title: 'Provisional identity posture in kernel decision',
        summary:
          'Η identity/trust posture λύθηκε με fallback logic και όχι με canonical identity model.',
        recommendedActions: [
          'Ολοκλήρωσε identity-model integration.',
          'Μην θεωρήσεις final production-hardening complete χωρίς deterministic identity bridge.',
        ],
        createdAt: nowIso(),
      });
    }

    const maintenanceSignals = await this.runSelfMaintenance(hookInput);
    for (const signal of maintenanceSignals) {
      alerts.push({
        id: createId('alt'),
        severity: signal.severity,
        category: 'maintenance',
        title: `Maintenance signal: ${signal.type}`,
        summary: signal.summary,
        recommendedActions: signal.actions,
        createdAt: nowIso(),
      });
    }

    const upgradeSignals = await this.runSelfUpgrade(hookInput);
    for (const signal of upgradeSignals) {
      alerts.push({
        id: createId('alt'),
        severity: signal.severity,
        category: 'future-readiness',
        title: `Upgrade signal: ${signal.type}`,
        summary: signal.summary,
        recommendedActions: signal.actions,
        createdAt: nowIso(),
      });
    }

    const expansionSignals = await this.runSelfExpansion(hookInput);
    for (const signal of expansionSignals) {
      alerts.push({
        id: createId('alt'),
        severity: signal.severity,
        category: 'future-readiness',
        title: `Expansion signal: ${signal.type}`,
        summary: signal.summary,
        recommendedActions: signal.actions,
        createdAt: nowIso(),
      });
    }

    if (
      recommendation.status === 'ready-to-build' &&
      placement.targetPath === 'core/kernel/kernel.ts'
    ) {
      alerts.push({
        id: createId('alt'),
        severity: 'medium',
        category: 'future-readiness',
        title: 'Kernel foundation build step ready',
        summary:
          'Το request ευθυγραμμίζεται με το foundation step του Kernel 0 coordinator.',
        recommendedActions: [
          'Κλείδωσε baseline μετά το paste.',
          'Συνέχισε αμέσως με identity / delegation / protocol sequence.',
        ],
        createdAt: nowIso(),
      });
    }

    const deduped = dedupeAlerts(alerts);

    if (this.config.enableAdminAlertPublication) {
      for (const alert of deduped) {
        await this.adminBridge.publish(alert);
      }
    }

    return deduped;
  }

  private buildExplainability(
    classification: KernelClassification,
    placement: KernelPlacement,
    capabilityPlan: KernelCapabilityPlan,
    policy: KernelPolicyDecision,
    recommendation: KernelBuildRecommendation,
    gaps: KernelGap[],
    identity: KernelIdentityPosture,
  ): KernelExplainability {
    const unresolved = gaps.map((gap) => gap.description);
    const lowConfidenceAreas: string[] = [];

    if (classification.confidence < this.config.explainabilityLowConfidenceThreshold) {
      lowConfidenceAreas.push('classification');
    }
    if (placement.confidence < this.config.explainabilityLowConfidenceThreshold) {
      lowConfidenceAreas.push('placement');
    }
    if (capabilityPlan.confidence < this.config.explainabilityLowConfidenceThreshold) {
      lowConfidenceAreas.push('capability-plan');
    }
    if (identity.provisional) {
      lowConfidenceAreas.push('identity-posture');
    }

    return {
      classificationWhy: [...classification.rationale],
      placementWhy: [...placement.rationale],
      capabilityWhy: [...capabilityPlan.rationale],
      policyWhy: [
        ...policy.reasons,
        ...(policy.appliedRules.length > 0
          ? [`Applied rules: ${policy.appliedRules.join(', ')}.`]
          : []),
      ],
      recommendationWhy: [
        `Recommendation status resolved as "${recommendation.status}".`,
        ...(recommendation.notes.length > 0
          ? [`Notes: ${recommendation.notes.join(' | ')}.`]
          : []),
      ],
      unresolved,
      lowConfidenceAreas: uniqStrings(lowConfidenceAreas),
    };
  }

  private buildDecisionRecord(
    request: KernelRequestEnvelope,
    classification: KernelClassification,
    placement: KernelPlacement,
    identity: KernelIdentityPosture,
    capabilityPlan: KernelCapabilityPlan,
    policy: KernelPolicyDecision,
    gaps: KernelGap[],
    recommendation: KernelBuildRecommendation,
    alerts: KernelAdminAlert[],
    explainability: KernelExplainability,
  ): KernelDecisionRecord {
    return {
      id: createId('kdr'),
      requestId: request.id,
      createdAt: nowIso(),
      request,
      classification,
      placement,
      identity,
      capabilityPlan,
      policy,
      gaps,
      recommendation,
      alerts,
      explainability,
    };
  }

  private async persistDecision(decision: KernelDecisionRecord): Promise<void> {
    this.decisionLog.unshift(decision);
    if (this.decisionLog.length > this.config.decisionLogLimit) {
      this.decisionLog.length = this.config.decisionLogLimit;
    }

    this.canonicalBaseline.set(decision.requestId, decision);

    if (this.config.enableDecisionPersistence && this.canonicalBridge.recordDecision) {
      await this.canonicalBridge.recordDecision(decision);
    }
  }

  private async runMemoryAwareness(
    input: KernelLifecycleHookInput,
  ): Promise<{ notes?: string[]; gaps?: KernelGap[] } | null> {
    const hook = this.deps.hooks.memoryAwareness;
    if (!hook) {
      return null;
    }
    return Promise.resolve(hook(input));
  }

  private async runSelfMaintenance(
    input: KernelLifecycleHookInput,
  ): Promise<KernelMaintenanceSignal[]> {
    const hook = this.deps.hooks.selfMaintenance;
    if (!hook) {
      return [];
    }
    return (await Promise.resolve(hook(input))) ?? [];
  }

  private async runSelfUpgrade(
    input: KernelLifecycleHookInput,
  ): Promise<KernelUpgradeSignal[]> {
    const hook = this.deps.hooks.selfUpgrade;
    if (!hook) {
      return [];
    }
    return (await Promise.resolve(hook(input))) ?? [];
  }

  private async runSelfExpansion(
    input: KernelLifecycleHookInput,
  ): Promise<KernelExpansionSignal[]> {
    const hook = this.deps.hooks.selfExpansion;
    if (!hook) {
      return [];
    }
    return (await Promise.resolve(hook(input))) ?? [];
  }
}

export function createKernel0Coordinator(
  deps: Partial<KernelDependencies> = {},
  config: Partial<KernelConfig> = {},
): PantavionKernel0Coordinator {
  return new PantavionKernel0Coordinator(deps, config);
}

export const kernel0 = createKernel0Coordinator();

export default kernel0;

function createCanonicalRegistryBridge(
  moduleLike: UnknownRecord,
): CanonicalRegistryBridge {
  const resolvePlacementFn = pickFunction(moduleLike, [
    'resolvePlacement',
    'resolveCanonicalPlacement',
    'placeCanonical',
    'getCanonicalPlacement',
    'classifyPlacement',
  ]);

  const recordDecisionFn = pickFunction(moduleLike, [
    'recordDecision',
    'registerDecision',
    'saveDecision',
    'upsertDecision',
  ]);

  return {
    async resolvePlacement(context: PlacementContext): Promise<KernelPlacement> {
      if (resolvePlacementFn) {
        const result = await Promise.resolve(resolvePlacementFn(context));
        return sanitizePlacement(result, context.request, context.classification);
      }
      return buildFallbackPlacement(context.request, context.classification);
    },

    async recordDecision(decision: KernelDecisionRecord): Promise<void> {
      if (!recordDecisionFn) {
        return;
      }
      await Promise.resolve(recordDecisionFn(decision));
    },
  };
}

function createCapabilityRegistryBridge(
  moduleLike: UnknownRecord,
): CapabilityRegistryBridge {
  const matchFn = pickFunction(moduleLike, [
    'findCapabilities',
    'lookupCapabilities',
    'resolveCapabilities',
    'searchCapabilities',
    'matchCapabilities',
  ]);

  return {
    async matchCapabilities(
      query: CapabilityQuery,
    ): Promise<KernelCapabilityMatch[]> {
      if (!matchFn) {
        return [];
      }
      const result = await Promise.resolve(matchFn(query));
      return sanitizeCapabilityMatches(result);
    },
  };
}

function createSecurityPolicyBridge(
  moduleLike: UnknownRecord,
): SecurityPolicyBridge {
  const evaluateFn = pickFunction(moduleLike, [
    'evaluateSecurity',
    'evaluatePolicy',
    'authorize',
    'checkPolicy',
    'review',
  ]);

  return {
    async evaluate(
      context: SecurityEvaluationContext,
    ): Promise<KernelPolicyDecision | null> {
      if (!evaluateFn) {
        return null;
      }
      const result = await Promise.resolve(evaluateFn(context));
      if (!result) {
        return null;
      }
      return sanitizePolicyDecision(result, context.request, context.classification);
    },
  };
}

function createAdminAlertsBridge(
  moduleLike: UnknownRecord,
): AdminAlertsBridge {
  const publishFn = pickFunction(moduleLike, [
    'publishAlert',
    'emitAlert',
    'notifyAdmin',
    'createAlert',
    'sendAlert',
  ]);

  return {
    async publish(alert: KernelAdminAlert): Promise<void> {
      if (!publishFn) {
        return;
      }
      await Promise.resolve(publishFn(alert));
    },
  };
}

function buildFallbackPlacement(
  request: KernelRequestEnvelope,
  classification: KernelClassification,
): KernelPlacement {
  const category = classification.category;
  const targetPath = safeTextOrUndefined(request.targetPath) ?? pathForCategory(category);
  const targetModule =
    safeTextOrUndefined(request.targetModule) ?? moduleForCategory(category);

  return {
    zone: category,
    family: familyForCategory(category),
    productFamily: productFamilyForCategory(category),
    canonicalKey: canonicalKeyForCategory(category),
    targetPath,
    targetModule,
    owner: ownerForCategory(category),
    confidence: request.targetPath || request.targetModule ? 0.9 : defaultPlacementConfidence(category),
    rationale: [
      request.targetPath || request.targetModule
        ? 'Explicit target path/module provided by request.'
        : 'Fallback placement derived from canonical category mapping.',
    ],
    isFallback: !Boolean(request.targetPath || request.targetModule),
  };
}

function buildFallbackIdentityPosture(
  request: KernelRequestEnvelope,
  classification: KernelClassification,
): KernelIdentityPosture {
  const actorType = request.actor.actorType ?? 'human';
  const trustTier = request.actor.trustTierHint ?? inferTrustTierFromRequest(request);
  const approvalTier = classification.requiresAdminReview
    ? 'admin'
    : request.sensitivity === 'restricted'
      ? 'security'
      : 'review';

  const scopes = uniqStrings([
    ...ensureStringArray(request.actor.scopes),
    ...(request.actor.workspaceId ? [request.actor.workspaceId] : []),
    ...(request.actor.orgId ? [request.actor.orgId] : []),
    'global',
  ]);

  return {
    resolved: Boolean(request.actor.actorId),
    provisional: true,
    actorId: request.actor.actorId,
    actorType,
    effectiveRoles: uniqStrings([
      safeText(request.actor.role, actorType === 'service' ? 'service-runtime' : 'human-user'),
    ]),
    effectiveScopes: scopes,
    trustTier,
    approvalTier,
    entitlements: deriveFallbackEntitlements(actorType, classification),
    deniedRestrictions: deriveFallbackRestrictions(classification),
    delegatedBy: request.actor.delegatedBy,
    rationale: [
      'Identity posture resolved through provisional fallback logic.',
      'Full deterministic identity/delegation bridge will be provided by future identity foundation files.',
    ],
  };
}

function buildFallbackPolicyDecision(
  request: KernelRequestEnvelope,
  classification: KernelClassification,
  placement: KernelPlacement,
  identity: KernelIdentityPosture,
  capabilityPlan: KernelCapabilityPlan,
): KernelPolicyDecision {
  let disposition: KernelDisposition = 'allow';
  let riskPosture = classification.riskPosture;
  const reasons: string[] = [];
  const appliedRules: string[] = [];
  const requiredApprovals: string[] = [];
  const allowedScopes = [...identity.effectiveScopes];

  if (request.sensitivity === 'restricted') {
    disposition = 'review';
    riskPosture = bumpRiskPosture(riskPosture, 'restricted');
    reasons.push('Restricted sensitivity requires stronger review posture.');
    appliedRules.push('privacy / memory sovereignty rules');
    requiredApprovals.push('Security approval required.');
  }

  if (classification.requiresAdminReview) {
    disposition = 'review';
    riskPosture = bumpRiskPosture(riskPosture, 'elevated');
    reasons.push('Classification requires admin review or governed visibility.');
    appliedRules.push('identity / role / entitlement constraints');
    requiredApprovals.push('Admin review required.');
  }

  if (hasAny(buildRequestSearchText(request), ['delete', 'destructive', 'global permission shift'])) {
    disposition = 'deny';
    riskPosture = 'restricted';
    reasons.push('Potentially destructive or globally sensitive operation detected.');
    appliedRules.push('legal / safety hard rules');
    requiredApprovals.push('Blocked pending explicit safeguarded protocol.');
  }

  if (capabilityPlan.restrictedCapabilities.length > 0 && disposition !== 'deny') {
    disposition = 'review';
    reasons.push('Restricted capabilities present in execution plan.');
    appliedRules.push('capability availability / trust / health');
    requiredApprovals.push('Restricted capability review required.');
  }

  if (capabilityPlan.missingCapabilities.length > 0 && disposition === 'allow') {
    disposition = 'review';
    reasons.push('Missing capabilities reduce confidence for safe execution.');
    appliedRules.push('capability availability / trust / health');
  }

  if (identity.provisional) {
    reasons.push('Identity posture is provisional and reduces confidence.');
    appliedRules.push('identity / role / entitlement constraints');
  }

  if (reasons.length === 0) {
    reasons.push('No blocking policy conflict detected in fallback evaluation.');
    appliedRules.push('truth / provenance requirements');
  }

  const score = clampNumber(
    computePolicyScore(
      disposition,
      request.sensitivity,
      identity.provisional,
      capabilityPlan,
    ),
    0.8,
    0,
    1,
  );

  return {
    disposition,
    riskPosture,
    score,
    reasons,
    appliedRules: uniqStrings(appliedRules),
    requiredApprovals: uniqStrings(requiredApprovals),
    allowedScopes: uniqStrings([...allowedScopes, placement.canonicalKey]),
  };
}

function sanitizePlacement(
  raw: unknown,
  request: KernelRequestEnvelope,
  classification: KernelClassification,
): KernelPlacement {
  const fallback = buildFallbackPlacement(request, classification);
  const record = asRecord(raw);

  return {
    zone: safeText(record.zone, fallback.zone),
    family: safeText(record.family, fallback.family),
    productFamily: safeText(record.productFamily, fallback.productFamily),
    canonicalKey: safeText(record.canonicalKey, fallback.canonicalKey),
    targetPath: safeTextOrUndefined(record.targetPath) ?? fallback.targetPath,
    targetModule: safeTextOrUndefined(record.targetModule) ?? fallback.targetModule,
    owner: safeText(record.owner, fallback.owner),
    confidence: clampNumber(record.confidence, fallback.confidence, 0, 1),
    rationale: ensureStringArray(record.rationale).length > 0
      ? ensureStringArray(record.rationale)
      : fallback.rationale,
    isFallback:
      typeof record.isFallback === 'boolean' ? record.isFallback : fallback.isFallback,
  };
}

function sanitizeIdentityPosture(
  raw: KernelIdentityPosture,
  request: KernelRequestEnvelope,
): KernelIdentityPosture {
  return {
    resolved: Boolean(raw.resolved),
    provisional: Boolean(raw.provisional),
    actorId: safeTextOrUndefined(raw.actorId) ?? request.actor.actorId,
    actorType: raw.actorType ?? request.actor.actorType ?? 'human',
    effectiveRoles: uniqStrings(raw.effectiveRoles ?? []),
    effectiveScopes: uniqStrings(raw.effectiveScopes ?? request.actor.scopes ?? []),
    trustTier: raw.trustTier ?? inferTrustTierFromRequest(request),
    approvalTier: raw.approvalTier ?? 'review',
    entitlements: uniqStrings(raw.entitlements ?? []),
    deniedRestrictions: uniqStrings(raw.deniedRestrictions ?? []),
    delegatedBy: safeTextOrUndefined(raw.delegatedBy) ?? request.actor.delegatedBy,
    rationale: uniqStrings(raw.rationale ?? []),
  };
}

function sanitizeCapabilityMatches(raw: unknown): KernelCapabilityMatch[] {
  const items = Array.isArray(raw) ? raw : [];

  return items
    .map((item) => asRecord(item))
    .map((record) => ({
      key: safeText(record.key),
      status: normalizeCapabilityStatus(record.status),
      source: normalizeCapabilitySource(record.source),
      owner: safeText(record.owner, 'registry'),
      score: clampNumber(record.score, 0.75, 0, 1),
      rationale: uniqStrings(ensureStringArray(record.rationale)),
      runtimeFamily: safeTextOrUndefined(record.runtimeFamily),
      protocolFamily: safeTextOrUndefined(record.protocolFamily),
    }))
    .filter((item) => item.key.length > 0);
}

function sanitizePolicyDecision(
  raw: unknown,
  request: KernelRequestEnvelope,
  classification: KernelClassification,
): KernelPolicyDecision {
  const record = asRecord(raw);

  return {
    disposition: normalizeDisposition(record.disposition),
    riskPosture:
      normalizeRiskPosture(record.riskPosture) ?? classification.riskPosture,
    score: clampNumber(record.score, 0.8, 0, 1),
    reasons: uniqStrings(ensureStringArray(record.reasons)),
    appliedRules: uniqStrings(ensureStringArray(record.appliedRules)),
    requiredApprovals: uniqStrings(ensureStringArray(record.requiredApprovals)),
    allowedScopes: uniqStrings([
      ...ensureStringArray(record.allowedScopes),
      ...ensureStringArray(request.actor.scopes),
    ]),
  };
}

function buildFallbackCapabilityMatches(
  requestedCapabilities: string[],
  owner: string,
  threshold: number,
): KernelCapabilityMatch[] {
  const builtIns = new Set<string>([
    'intake-normalization',
    'canonical-classification',
    'canonical-placement',
    'truth-zone-resolution',
    'capability-lookup',
    'policy-evaluation',
    'gap-detection',
    'build-recommendation',
    'admin-alert-generation',
    'decision-persistence',
    'explainability',
  ]);

  return uniqStrings(requestedCapabilities).map((key) => {
    const available = builtIns.has(key);

    return {
      key,
      status: available ? 'available' : 'missing',
      source: available ? 'kernel-default' : 'inferred',
      owner,
      score: available ? Math.max(threshold, 0.88) : 0.22,
      rationale: available
        ? ['Served by Kernel 0 internal fallback capability surface.']
        : ['No registry-backed capability found in current foundation state.'],
      runtimeFamily: available ? 'kernel-core' : undefined,
      protocolFamily: undefined,
    };
  });
}

function mergeCapabilityMatches(
  registryMatches: KernelCapabilityMatch[],
  fallbackMatches: KernelCapabilityMatch[],
): KernelCapabilityMatch[] {
  const map = new Map<string, KernelCapabilityMatch>();

  for (const match of fallbackMatches) {
    map.set(match.key, match);
  }

  for (const match of registryMatches) {
    const existing = map.get(match.key);
    if (!existing || match.score >= existing.score) {
      map.set(match.key, match);
    }
  }

  return [...map.values()].sort((left, right) => right.score - left.score);
}

function deriveExecutionPosture(
  truthZone: KernelTruthZone,
  matches: KernelCapabilityMatch[],
  restrictedCapabilities: string[],
): 'deterministic' | 'verified' | 'generative' | 'hybrid' | 'blocked' {
  if (restrictedCapabilities.length > 0) {
    return 'blocked';
  }

  const hasGenerativeOnly = matches.some(
    (item) => item.key.includes('generation') || item.key.includes('creative'),
  );

  if (truthZone === 'deterministic') {
    return hasGenerativeOnly ? 'hybrid' : 'deterministic';
  }

  if (truthZone === 'verified') {
    return hasGenerativeOnly ? 'hybrid' : 'verified';
  }

  return 'generative';
}

function buildSafeFallbackCandidates(
  classification: KernelClassification,
  matches: KernelCapabilityMatch[],
  placement: KernelPlacement,
): string[] {
  const candidates: string[] = [];

  if (classification.truthZone !== 'generative') {
    candidates.push('deterministic-kernel-fallback');
  }

  if (matches.some((item) => item.status === 'degraded')) {
    candidates.push('degraded-runtime-fallback');
  }

  if (placement.isFallback) {
    candidates.push('manual-canonical-review');
  }

  return uniqStrings(candidates);
}

function computeCapabilityPlanConfidence(
  matches: KernelCapabilityMatch[],
): number {
  if (matches.length === 0) {
    return 0.25;
  }

  const total = matches.reduce((sum, item) => sum + item.score, 0);
  return clampNumber(total / matches.length, 0.5, 0, 1);
}

function buildSequenceForCategory(
  category: KernelCategory,
  buildTarget?: string,
): string[] {
  const base = [
    'intake normalization',
    'canonical classification',
    'canonical placement',
    'identity/trust posture',
    'capability plan',
    'policy evaluation',
  ];

  switch (category) {
    case 'kernel':
      base.push('kernel coordination', 'decision persistence', 'admin visibility');
      break;
    case 'identity':
      base.push('identity model alignment', 'delegation alignment', 'audit validation');
      break;
    case 'protocol':
      base.push('protocol typing', 'gateway binding', 'routing validation');
      break;
    case 'runtime':
    case 'workspace':
    case 'voice':
      base.push('runtime binding', 'resilience hardening', 'health validation');
      break;
    case 'security':
      base.push('policy hardening', 'approval envelope', 'restricted-flow gating');
      break;
    case 'business':
      base.push('commercial rules', 'plan/entitlement checks', 'usage visibility');
      break;
    case 'crisis':
      base.push('high-stakes gating', 'delivery assurance', 'review path');
      break;
    case 'utility':
      base.push('geospatial alignment', 'incident/state logic', 'ops visibility');
      break;
    default:
      base.push('canonical integration', 'continuity capture');
      break;
  }

  if (buildTarget) {
    base.push(`target: ${buildTarget}`);
  }

  return base;
}

function inferRequestedOperation(
  title: string,
  description: string,
  inputText: string,
): string {
  const text = `${title} ${description} ${inputText}`.toLowerCase();

  if (hasAny(text, ['build', 'implement', 'paste', 'file', 'code'])) {
    return 'build';
  }
  if (hasAny(text, ['route', 'dispatch', 'orchestrate'])) {
    return 'route';
  }
  if (hasAny(text, ['review', 'approve', 'approval'])) {
    return 'review';
  }
  if (hasAny(text, ['research', 'verify', 'compare'])) {
    return 'research';
  }

  return 'answer';
}

function inferMemoryClass(input: KernelInput): KernelMemoryClass {
  const metadata = asRecord(input.metadata);
  if ((metadata as { persist?: boolean }).persist === true) {
    return 'governed-long-term';
  }
  if ((metadata as { thread?: boolean }).thread === true) {
    return 'thread';
  }
  if (input.actor?.workspaceId) {
    return 'project';
  }
  return 'session';
}

function inferSensitivity(input: KernelInput): KernelSensitivity {
  const text = `${safeText(input.title)} ${safeText(input.description)} ${safeText(input.inputText)}`.toLowerCase();

  if (hasAny(text, ['restricted', 'regulated', 'sensitive', 'admin-only'])) {
    return 'restricted';
  }
  if (hasAny(text, ['confidential', 'private', 'internal-only'])) {
    return 'confidential';
  }
  if (hasAny(text, ['public'])) {
    return 'public';
  }

  return 'internal';
}

function inferCategory(
  text: string,
  request: KernelRequestEnvelope,
): KernelCategory {
  if (
    request.targetPath?.includes('core/kernel') ||
    hasAny(text, ['kernel', 'canonical placement', 'gap detection'])
  ) {
    return 'kernel';
  }
  if (hasAny(text, ['identity', 'delegation', 'entitlement', 'principal', 'scope'])) {
    return 'identity';
  }
  if (hasAny(text, ['protocol', 'gateway', 'mcp', 'a2a', 'adapter'])) {
    return 'protocol';
  }
  if (hasAny(text, ['policy', 'security', 'trust', 'safety', 'authorization'])) {
    return 'security';
  }
  if (hasAny(text, ['admin', 'ops', 'operations', 'control room', 'alert'])) {
    return 'admin';
  }
  if (hasAny(text, ['runtime', 'durable execution', 'resilience'])) {
    return 'runtime';
  }
  if (hasAny(text, ['workspace', 'builder workspace', 'app builder'])) {
    return 'workspace';
  }
  if (hasAny(text, ['voice', 'speech', 'interpreter', 'audio bridge'])) {
    return 'voice';
  }
  if (hasAny(text, ['memory', 'continuity', 'graph', 'recall'])) {
    return 'memory';
  }
  if (hasAny(text, ['learn', 'mastery', 'pantalearn', 'guided study'])) {
    return 'learning';
  }
  if (hasAny(text, ['business', 'commerce', 'plan', 'billing', 'offer', 'lead'])) {
    return 'business';
  }
  if (hasAny(text, ['sos', 'crisis', 'emergency', 'humanitarian'])) {
    return 'crisis';
  }
  if (hasAny(text, ['utility', 'map', 'geospatial', 'infrastructure', 'poi'])) {
    return 'utility';
  }
  if (hasAny(text, ['people', 'profile', 'relationship', 'contact'])) {
    return 'people';
  }
  if (hasAny(text, ['social', 'post', 'reply', 'community'])) {
    return 'social';
  }
  if (hasAny(text, ['knowledge', 'research', 'evidence', 'verified'])) {
    return 'knowledge';
  }

  return 'unknown';
}

function inferActionMode(
  text: string,
  request: KernelRequestEnvelope,
): KernelActionMode {
  if (
    request.targetPath ||
    hasAny(text, ['build', 'implement', 'file', 'paste', 'code'])
  ) {
    return 'build';
  }
  if (hasAny(text, ['route', 'dispatch', 'orchestrate'])) {
    return 'routing';
  }
  if (hasAny(text, ['automation', 'trigger', 'schedule'])) {
    return 'automation';
  }
  if (hasAny(text, ['approve', 'review', 'admin'])) {
    return 'admin';
  }
  if (hasAny(text, ['research', 'verify', 'investigate', 'deep search'])) {
    return 'research';
  }

  return 'answer';
}

function inferTruthZone(
  text: string,
  category: KernelCategory,
  actionMode: KernelActionMode,
): KernelTruthZone {
  if (hasAny(text, ['creative', 'draft', 'brainstorm', 'generate']) && actionMode === 'answer') {
    return 'generative';
  }
  if (
    actionMode === 'research' ||
    category === 'knowledge' ||
    hasAny(text, ['verify', 'verified', 'source', 'evidence'])
  ) {
    return 'verified';
  }

  return 'deterministic';
}

function inferSeverity(
  text: string,
  request: KernelRequestEnvelope,
  category: KernelCategory,
  actionMode: KernelActionMode,
): KernelSeverity {
  if (request.sensitivity === 'restricted') {
    return 'critical';
  }

  if (
    category === 'security' ||
    category === 'crisis' ||
    hasAny(text, ['incident', 'breach', 'outage', 'emergency', 'critical'])
  ) {
    return 'high';
  }

  if (
    actionMode === 'build' ||
    category === 'kernel' ||
    category === 'identity' ||
    category === 'protocol' ||
    category === 'runtime'
  ) {
    return 'medium';
  }

  return 'low';
}

function inferRiskPosture(
  text: string,
  sensitivity: KernelSensitivity,
  category: KernelCategory,
  requiresAdminReview: boolean,
): KernelRiskPosture {
  if (hasAny(text, ['admin-only', 'super-admin', 'public safety console'])) {
    return 'admin-only';
  }
  if (
    sensitivity === 'restricted' ||
    category === 'crisis' ||
    category === 'security'
  ) {
    return 'restricted';
  }
  if (requiresAdminReview) {
    return 'high-stakes';
  }
  if (hasAny(text, ['billing', 'minors', 'legal', 'verification'])) {
    return 'elevated';
  }
  return 'normal';
}

function inferTrustTierFromRequest(
  request: KernelRequestEnvelope,
): KernelTrustTier {
  if (request.actor.trustTierHint) {
    return request.actor.trustTierHint;
  }
  if (request.actor.actorType === 'service') {
    return 'system';
  }
  if (request.actor.actorType === 'agent') {
    return 'trusted';
  }
  return 'basic';
}

function deriveRequestedCapabilities(
  inputText: string,
  requestedOperation: string,
): string[] {
  const source = `${inputText} ${requestedOperation}`.toLowerCase();
  const out: string[] = [];

  if (source.includes('intake')) out.push('intake-normalization');
  if (source.includes('classif')) out.push('canonical-classification');
  if (source.includes('placement') || source.includes('canonical')) {
    out.push('canonical-placement');
  }
  if (source.includes('truth')) out.push('truth-zone-resolution');
  if (source.includes('capability')) out.push('capability-lookup');
  if (source.includes('policy') || source.includes('security')) {
    out.push('policy-evaluation');
  }
  if (source.includes('gap')) out.push('gap-detection');
  if (source.includes('build') || source.includes('implement') || source.includes('paste')) {
    out.push('build-recommendation');
  }
  if (source.includes('alert') || source.includes('admin')) {
    out.push('admin-alert-generation');
  }
  if (source.includes('explain')) out.push('explainability');

  return out;
}

function deriveCategoryCapabilities(category: KernelCategory): string[] {
  switch (category) {
    case 'identity':
      return ['identity-resolution', 'delegation-awareness'];
    case 'protocol':
      return ['protocol-routing', 'adapter-resolution'];
    case 'security':
      return ['scope-enforcement', 'risk-evaluation'];
    case 'admin':
      return ['admin-visibility', 'ops-alerting'];
    case 'runtime':
      return ['runtime-coordination', 'resilience-awareness'];
    case 'workspace':
      return ['workspace-runtime-awareness'];
    case 'voice':
      return ['voice-runtime-awareness'];
    case 'memory':
      return ['memory-awareness'];
    case 'crisis':
      return ['high-stakes-routing', 'crisis-governance'];
    case 'utility':
      return ['geospatial-coordination'];
    default:
      return [];
  }
}

function deriveActionCapabilities(actionMode: KernelActionMode): string[] {
  switch (actionMode) {
    case 'build':
      return ['build-recommendation', 'decision-persistence'];
    case 'routing':
      return ['governed-routing'];
    case 'automation':
      return ['automation-orchestration', 'governed-routing'];
    case 'research':
      return ['verified-research'];
    case 'admin':
      return ['admin-alert-generation'];
    default:
      return [];
  }
}

function deriveRiskCapabilities(riskPosture: KernelRiskPosture): string[] {
  switch (riskPosture) {
    case 'elevated':
      return ['enhanced-review-awareness'];
    case 'high-stakes':
      return ['approval-path-awareness', 'high-stakes-guardrails'];
    case 'restricted':
      return ['restricted-flow-awareness', 'approval-path-awareness'];
    case 'admin-only':
      return ['admin-only-gating', 'restricted-flow-awareness'];
    default:
      return [];
  }
}

function deriveFallbackEntitlements(
  actorType: 'human' | 'agent' | 'service',
  classification: KernelClassification,
): string[] {
  const base = ['kernel:request', 'classification:read'];

  if (actorType === 'service') {
    base.push('runtime:execute', 'audit:write');
  } else if (actorType === 'agent') {
    base.push('task:execute', 'tool:request');
  } else {
    base.push('workspace:enter', 'session:participate');
  }

  if (classification.actionMode === 'build') {
    base.push('build:propose');
  }

  return uniqStrings(base);
}

function deriveFallbackRestrictions(
  classification: KernelClassification,
): string[] {
  const restrictions: string[] = [];

  if (classification.riskPosture === 'restricted' || classification.riskPosture === 'admin-only') {
    restrictions.push('unapproved:restricted-execution');
  }

  if (classification.category === 'security') {
    restrictions.push('blind-security-mutation');
  }

  return uniqStrings(restrictions);
}

function extractIntents(text: string): string[] {
  const intents: string[] = [];
  if (hasAny(text, ['intake'])) intents.push('intake');
  if (hasAny(text, ['classify', 'classification'])) intents.push('classification');
  if (hasAny(text, ['placement', 'canonical'])) intents.push('placement');
  if (hasAny(text, ['capability'])) intents.push('capability');
  if (hasAny(text, ['policy', 'security'])) intents.push('policy');
  if (hasAny(text, ['build', 'implement'])) intents.push('build');
  if (hasAny(text, ['alert', 'admin', 'ops'])) intents.push('alerting');
  if (hasAny(text, ['memory', 'continuity'])) intents.push('continuity');
  return uniqStrings(intents);
}

function computeClassificationConfidence(
  category: KernelCategory,
  actionMode: KernelActionMode,
  truthZone: KernelTruthZone,
  request: KernelRequestEnvelope,
): number {
  let score = 0.62;
  if (category !== 'unknown') score += 0.12;
  if (actionMode !== 'answer') score += 0.08;
  if (truthZone !== 'generative') score += 0.04;
  if (request.targetPath || request.targetModule) score += 0.08;
  if (request.domainHints.length > 0 || request.tags.length > 0) score += 0.04;
  return clampNumber(score, 0.62, 0, 0.98);
}

function computePolicyScore(
  disposition: KernelDisposition,
  sensitivity: KernelSensitivity,
  identityProvisional: boolean,
  capabilityPlan: KernelCapabilityPlan,
): number {
  let score = 0.92;
  if (sensitivity === 'confidential') score -= 0.08;
  if (sensitivity === 'restricted') score -= 0.16;
  if (identityProvisional) score -= 0.08;
  if (capabilityPlan.degradedCapabilities.length > 0) score -= 0.08;
  if (capabilityPlan.missingCapabilities.length > 0) score -= 0.12;
  if (disposition === 'review') score -= 0.12;
  if (disposition === 'deny') score = 0.1;
  return score;
}

function bumpRiskPosture(
  current: KernelRiskPosture,
  target: KernelRiskPosture,
): KernelRiskPosture {
  const order: KernelRiskPosture[] = [
    'normal',
    'elevated',
    'high-stakes',
    'restricted',
    'admin-only',
  ];
  return order.indexOf(target) > order.indexOf(current) ? target : current;
}

function familyForCategory(category: KernelCategory): string {
  switch (category) {
    case 'kernel':
      return 'foundation';
    case 'identity':
      return 'identity';
    case 'protocol':
      return 'protocol';
    case 'security':
      return 'security';
    case 'admin':
      return 'operations';
    case 'runtime':
    case 'workspace':
    case 'voice':
      return 'runtime';
    case 'memory':
      return 'memory';
    case 'business':
      return 'commercial';
    case 'crisis':
      return 'crisis';
    case 'utility':
      return 'geospatial';
    case 'learning':
      return 'learning';
    case 'people':
    case 'social':
      return 'human-core';
    default:
      return 'canonical';
  }
}

function productFamilyForCategory(category: KernelCategory): string {
  switch (category) {
    case 'people':
    case 'social':
    case 'voice':
      return 'human-core';
    case 'memory':
    case 'knowledge':
    case 'learning':
      return 'guidance-knowledge-cognition';
    case 'utility':
      return 'discovery-place-infrastructure';
    case 'crisis':
      return 'crisis-humanitarian-safety';
    case 'business':
      return 'professional-commercial';
    case 'workspace':
    case 'runtime':
      return 'universal-workspaces';
    case 'kernel':
    case 'identity':
    case 'protocol':
    case 'security':
    case 'admin':
      return 'shared-core-governance';
    default:
      return 'shared-core-governance';
  }
}

function canonicalKeyForCategory(category: KernelCategory): string {
  switch (category) {
    case 'kernel':
      return 'kernel.0.coordinator.v1';
    case 'identity':
      return 'identity.foundation.v1';
    case 'protocol':
      return 'protocol.gateway.v1';
    case 'security':
      return 'security.policy.v1';
    case 'admin':
      return 'admin.alerting.v1';
    case 'runtime':
      return 'runtime.durable-execution.v1';
    case 'workspace':
      return 'runtime.workspace.v1';
    case 'voice':
      return 'runtime.voice.v1';
    case 'memory':
      return 'memory.continuity.v1';
    case 'learning':
      return 'learning.mastery.v1';
    case 'business':
      return 'business.operations.v1';
    case 'crisis':
      return 'crisis.sos.v1';
    case 'utility':
      return 'geospatial.utility.v1';
    case 'people':
      return 'people.graph.v1';
    case 'social':
      return 'social.community.v1';
    case 'knowledge':
      return 'knowledge.verified.v1';
    default:
      return 'canonical.unresolved.v1';
  }
}

function pathForCategory(category: KernelCategory): string {
  switch (category) {
    case 'kernel':
      return 'core/kernel/kernel.ts';
    case 'identity':
      return 'core/identity/identity-model.ts';
    case 'protocol':
      return 'core/protocol/protocol-gateway.ts';
    case 'security':
      return 'core/security/security-policy.ts';
    case 'admin':
      return 'core/admin/admin-alerts.ts';
    case 'runtime':
      return 'core/runtime/durable-execution.ts';
    case 'workspace':
      return 'core/runtime/workspace-runtime.ts';
    case 'voice':
      return 'core/runtime/voice-runtime.ts';
    case 'memory':
      return 'types/pantavion.ts';
    case 'learning':
      return 'types/pantavion.ts';
    case 'business':
      return 'types/pantavion.ts';
    case 'crisis':
      return 'types/pantavion.ts';
    case 'utility':
      return 'types/pantavion.ts';
    case 'people':
      return 'types/pantavion.ts';
    case 'social':
      return 'types/pantavion.ts';
    default:
      return 'types/pantavion.ts';
  }
}

function moduleForCategory(category: KernelCategory): string {
  switch (category) {
    case 'kernel':
      return 'kernel';
    case 'identity':
      return 'identity';
    case 'protocol':
      return 'protocol';
    case 'security':
      return 'security';
    case 'admin':
      return 'admin';
    case 'runtime':
    case 'workspace':
    case 'voice':
      return 'runtime';
    case 'memory':
      return 'memory';
    case 'learning':
      return 'learning';
    case 'business':
      return 'business';
    case 'crisis':
      return 'crisis';
    case 'utility':
      return 'utility';
    case 'people':
      return 'people';
    case 'social':
      return 'social';
    default:
      return 'canonical';
  }
}

function ownerForCategory(category: KernelCategory): string {
  switch (category) {
    case 'kernel':
      return 'kernel-governor';
    case 'identity':
      return 'identity-governor';
    case 'protocol':
      return 'protocol-governor';
    case 'security':
      return 'security-governor';
    case 'admin':
      return 'ops-governor';
    case 'runtime':
    case 'workspace':
    case 'voice':
      return 'runtime-governor';
    case 'business':
      return 'commercial-governor';
    case 'crisis':
      return 'safety-governor';
    case 'utility':
      return 'infrastructure-governor';
    case 'memory':
      return 'continuity-governor';
    default:
      return 'canonical-governor';
  }
}

function defaultPlacementConfidence(category: KernelCategory): number {
  return category === 'unknown' ? 0.56 : 0.82;
}

function severityToPriority(severity: KernelSeverity): KernelPriority {
  switch (severity) {
    case 'critical':
      return 'p0';
    case 'high':
      return 'p1';
    case 'medium':
      return 'p2';
    case 'low':
      return 'p3';
    default:
      return 'p4';
  }
}

function buildRequestSearchText(request: KernelRequestEnvelope): string {
  return [
    request.title,
    request.description,
    request.inputText,
    request.requestedOperation,
    request.targetPath,
    request.targetModule,
    ...request.tags,
    ...request.domainHints,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function dedupeGaps(gaps: KernelGap[]): KernelGap[] {
  const map = new Map<string, KernelGap>();
  for (const gap of gaps) {
    if (!map.has(gap.key)) {
      map.set(gap.key, gap);
    }
  }
  return [...map.values()];
}

function dedupeAlerts(alerts: KernelAdminAlert[]): KernelAdminAlert[] {
  const seen = new Set<string>();
  return alerts.filter((alert) => {
    const key = `${alert.category}:${alert.title}:${alert.summary}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function pickFunction(source: UnknownRecord, keys: string[]): AnyFn | undefined {
  for (const key of keys) {
    const candidate = source[key];
    if (typeof candidate === 'function') {
      return candidate as AnyFn;
    }
  }

  for (const value of Object.values(source)) {
    if (!value || typeof value !== 'object') {
      continue;
    }

    const nested = value as UnknownRecord;
    for (const key of keys) {
      const candidate = nested[key];
      if (typeof candidate === 'function') {
        return candidate as AnyFn;
      }
    }
  }

  return undefined;
}

function normalizeCapabilityStatus(value: unknown): KernelCapabilityStatus {
  if (
    value === 'available' ||
    value === 'degraded' ||
    value === 'missing' ||
    value === 'restricted' ||
    value === 'review-required'
  ) {
    return value;
  }
  return 'available';
}

function normalizeCapabilitySource(value: unknown): KernelCapabilitySource {
  if (
    value === 'registry' ||
    value === 'kernel-default' ||
    value === 'inferred' ||
    value === 'future-bridge'
  ) {
    return value;
  }
  return 'registry';
}

function normalizeDisposition(value: unknown): KernelDisposition {
  if (value === 'allow' || value === 'review' || value === 'deny') {
    return value;
  }
  return 'review';
}

function normalizeRiskPosture(value: unknown): KernelRiskPosture | null {
  if (
    value === 'normal' ||
    value === 'elevated' ||
    value === 'high-stakes' ||
    value === 'restricted' ||
    value === 'admin-only'
  ) {
    return value;
  }
  return null;
}

function safeText(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : fallback;
}

function safeTextOrUndefined(value: unknown): string | undefined {
  const normalized = safeText(value);
  return normalized || undefined;
}

function ensureStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean);
  }
  if (value === undefined || value === null) {
    return [];
  }
  return [String(value)];
}

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === 'object' ? (value as UnknownRecord) : {};
}

function uniqStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function normalizeTag(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '-');
}

function clampNumber(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
): number {
  const numeric =
    typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  return Math.min(max, Math.max(min, numeric));
}

function hasAny(text: string, fragments: string[]): boolean {
  return fragments.some((fragment) => text.includes(fragment));
}

function createId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${random}`;
}

function nowIso(): string {
  return new Date().toISOString();
}
