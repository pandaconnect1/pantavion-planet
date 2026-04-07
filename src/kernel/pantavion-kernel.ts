export type UUID = string;
export type ISODateString = string;

export type PantavionEnvironment = "dev" | "staging" | "prod";
export type PantavionRegion = "global" | "eu" | "us" | "mena" | "africa" | "apac" | "latam";
export type PantavionScopeType = "personal" | "social" | "business" | "institutional" | "authority" | "restricted_admin";
export type PantavionRole = "guest" | "user" | "creator" | "moderator" | "business_owner" | "institution_manager" | "verified_authority" | "support_agent" | "admin" | "super_admin" | "system";
export type PantavionTrustTier = "anonymous" | "basic" | "verified" | "enhanced_verified" | "authority_verified" | "internal_system";
export type PantavionAccountState = "active" | "suspended" | "limited" | "pending_verification" | "deleted" | "quarantined";
export type PantavionSessionState = "active" | "expired" | "revoked" | "challenged";
export type PantavionMemoryClass = "ephemeral" | "session" | "user_profile" | "project" | "relational" | "compliance" | "safety" | "restricted";
export type PantavionMemorySensitivity = "low" | "moderate" | "high" | "critical";
export type PantavionMemoryState = "active" | "archived" | "quarantined" | "pending_deletion" | "deleted" | "legal_hold";
export type PantavionTruthZone = "deterministic_only" | "ai_assisted_verified" | "generative_exploratory";
export type PantavionEvidenceType = "user_input" | "system_record" | "verified_source" | "internal_policy" | "connector_source" | "model_output" | "human_review";
export type PantavionAnswerState = "draft" | "verified" | "degraded" | "blocked" | "requires_review" | "final";
export type PantavionCapabilityKind = "model" | "tool" | "workspace" | "adapter" | "connector" | "pipeline" | "service";
export type PantavionCapabilityStatus = "candidate" | "admitted" | "degraded" | "disabled" | "retired" | "quarantined";
export type PantavionSafetyClass = "general" | "sensitive" | "high_risk" | "restricted";
export type PantavionCostClass = "tiny" | "small" | "medium" | "large" | "critical";
export type PantavionAuditSeverity = "info" | "notice" | "warning" | "high" | "critical";
export type PantavionDegradationLevel = "none" | "minor" | "moderate" | "severe" | "critical";
export type PantavionSurfaceId = "kernel" | "people" | "chat" | "voice" | "pulse" | "audio" | "compass" | "mind" | "create" | "ads_center" | "admin" | "safety";
export type PantavionPermission =
  | "identity.read"
  | "identity.write"
  | "scope.switch"
  | "scope.manage"
  | "memory.read"
  | "memory.write"
  | "memory.delete"
  | "memory.export"
  | "answer.execute"
  | "answer.verify"
  | "capability.use"
  | "capability.admit"
  | "capability.disable"
  | "connector.use"
  | "audit.read"
  | "audit.write"
  | "governance.override"
  | "safety.escalate"
  | "admin.access"
  | "restricted.ops";

const nowIso = (): ISODateString => new Date().toISOString();
const createId = (prefix: string = "ptv"): UUID =>
  prefix + "_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export interface PantavionPolicyRef {
  id: UUID;
  key: string;
  title: string;
  version: string;
}

export interface PantavionAccount {
  id: UUID;
  email?: string;
  displayName: string;
  state: PantavionAccountState;
  trustTier: PantavionTrustTier;
  roles: PantavionRole[];
  defaultScopeId?: UUID;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  countryCode?: string;
  region: PantavionRegion;
  ageBand?: "unknown" | "child" | "teen" | "adult" | "senior";
  flags: string[];
}

export interface PantavionScope {
  id: UUID;
  accountId: UUID;
  type: PantavionScopeType;
  label: string;
  roleBindings: PantavionRole[];
  permissions: PantavionPermission[];
  visibility: "private" | "trusted" | "public" | "restricted";
  trustTier: PantavionTrustTier;
  verified: boolean;
  metadata: Record<string, unknown>;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface PantavionSession {
  id: UUID;
  accountId: UUID;
  scopeId: UUID;
  state: PantavionSessionState;
  createdAt: ISODateString;
  expiresAt: ISODateString;
  lastSeenAt: ISODateString;
  riskScore: number;
  challenged: boolean;
}

export interface PantavionRetentionPolicy {
  retentionDays: number;
  autoArchiveDays?: number;
  autoDeleteDays?: number;
  allowExport: boolean;
  allowUserDelete: boolean;
  legalHoldAllowed: boolean;
}

export interface PantavionMemoryObject {
  id: UUID;
  ownerAccountId: UUID;
  scopeId: UUID;
  class: PantavionMemoryClass;
  sensitivity: PantavionMemorySensitivity;
  state: PantavionMemoryState;
  title: string;
  content: unknown;
  tags: string[];
  source: PantavionEvidenceType;
  provenance: string[];
  retention: PantavionRetentionPolicy;
  consentRefs: UUID[];
  createdAt: ISODateString;
  updatedAt: ISODateString;
  encrypted: boolean;
}

export interface PantavionEvidence {
  id: UUID;
  type: PantavionEvidenceType;
  label: string;
  ref?: string;
  verified: boolean;
  createdAt: ISODateString;
}

export interface PantavionAnswerObject {
  id: UUID;
  requestId: UUID;
  scopeId: UUID;
  surfaceId: PantavionSurfaceId;
  truthZone: PantavionTruthZone;
  state: PantavionAnswerState;
  content: unknown;
  summary: string;
  evidence: PantavionEvidence[];
  confidence: number;
  verifier?: string;
  fallbackReasonCodes: string[];
  requiresHumanReview: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface PantavionCapabilityAdmission {
  admittedBy: UUID | "system";
  admittedAt: ISODateString;
  reason: string;
  policies: PantavionPolicyRef[];
}

export interface PantavionCapability {
  id: UUID;
  key: string;
  label: string;
  kind: PantavionCapabilityKind;
  provider: string;
  version: string;
  status: PantavionCapabilityStatus;
  safetyClass: PantavionSafetyClass;
  costClass: PantavionCostClass;
  supportedSurfaces: PantavionSurfaceId[];
  truthZones: PantavionTruthZone[];
  permissionsRequired: PantavionPermission[];
  healthScore: number;
  admission?: PantavionCapabilityAdmission;
  metadata: Record<string, unknown>;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface PantavionAuditEvent {
  id: UUID;
  severity: PantavionAuditSeverity;
  code: string;
  actorAccountId?: UUID;
  actorScopeId?: UUID;
  targetType: string;
  targetId?: UUID;
  message: string;
  createdAt: ISODateString;
  surfaceId: PantavionSurfaceId;
  metadata?: Record<string, unknown>;
}

export interface PantavionServiceHealth {
  id: string;
  label: string;
  healthy: boolean;
  latencyMs: number;
  errorRate: number;
  degradationLevel: PantavionDegradationLevel;
  updatedAt: ISODateString;
}

export interface PantavionKernelFlags {
  allowGenerativeMode: boolean;
  requireTruthZoneLabel: boolean;
  requireEvidenceForVerified: boolean;
  allowRestrictedOperations: boolean;
  allowCrossScopeMemoryRead: boolean;
  safeDegradedReadOnlyMode: boolean;
}

export interface PantavionKernelConfig {
  environment: PantavionEnvironment;
  region: PantavionRegion;
  systemName: string;
  version: string;
  flags: PantavionKernelFlags;
  defaultPolicies: PantavionPolicyRef[];
}

export interface PantavionKernelState {
  config: PantavionKernelConfig;
  accounts: Record<UUID, PantavionAccount>;
  scopes: Record<UUID, PantavionScope>;
  sessions: Record<UUID, PantavionSession>;
  memory: Record<UUID, PantavionMemoryObject>;
  answers: Record<UUID, PantavionAnswerObject>;
  capabilities: Record<UUID, PantavionCapability>;
  audits: PantavionAuditEvent[];
  services: Record<string, PantavionServiceHealth>;
  degradation: PantavionDegradationLevel;
  launchedAt: ISODateString;
  updatedAt: ISODateString;
}

export const ROLE_PERMISSIONS: Record<PantavionRole, PantavionPermission[]> = {
  guest: ["answer.execute"],
  user: ["identity.read", "scope.switch", "memory.read", "memory.write", "memory.delete", "memory.export", "answer.execute", "capability.use", "connector.use"],
  creator: ["identity.read", "scope.switch", "memory.read", "memory.write", "memory.delete", "memory.export", "answer.execute", "capability.use", "connector.use"],
  moderator: ["identity.read", "scope.switch", "memory.read", "answer.execute", "answer.verify", "audit.read", "safety.escalate"],
  business_owner: ["identity.read", "identity.write", "scope.switch", "scope.manage", "memory.read", "memory.write", "memory.delete", "memory.export", "answer.execute", "capability.use", "connector.use"],
  institution_manager: ["identity.read", "identity.write", "scope.switch", "scope.manage", "memory.read", "memory.write", "memory.export", "answer.execute", "answer.verify", "capability.use", "connector.use", "audit.read"],
  verified_authority: ["identity.read", "scope.switch", "memory.read", "answer.execute", "answer.verify", "audit.read", "safety.escalate", "restricted.ops"],
  support_agent: ["identity.read", "scope.switch", "memory.read", "answer.execute", "audit.read"],
  admin: ["identity.read", "identity.write", "scope.switch", "scope.manage", "memory.read", "memory.write", "memory.delete", "memory.export", "answer.execute", "answer.verify", "capability.use", "capability.admit", "capability.disable", "connector.use", "audit.read", "audit.write", "governance.override", "admin.access"],
  super_admin: ["identity.read", "identity.write", "scope.switch", "scope.manage", "memory.read", "memory.write", "memory.delete", "memory.export", "answer.execute", "answer.verify", "capability.use", "capability.admit", "capability.disable", "connector.use", "audit.read", "audit.write", "governance.override", "admin.access", "restricted.ops"],
  system: ["identity.read", "identity.write", "scope.switch", "scope.manage", "memory.read", "memory.write", "memory.delete", "memory.export", "answer.execute", "answer.verify", "capability.use", "capability.admit", "capability.disable", "connector.use", "audit.read", "audit.write", "governance.override", "admin.access", "restricted.ops"]
};

export const DEFAULT_MEMORY_RETENTION: Record<PantavionMemoryClass, PantavionRetentionPolicy> = {
  ephemeral: { retentionDays: 1, autoDeleteDays: 1, allowExport: false, allowUserDelete: true, legalHoldAllowed: false },
  session: { retentionDays: 7, autoDeleteDays: 7, allowExport: false, allowUserDelete: true, legalHoldAllowed: false },
  user_profile: { retentionDays: 3650, allowExport: true, allowUserDelete: true, legalHoldAllowed: true },
  project: { retentionDays: 3650, autoArchiveDays: 365, allowExport: true, allowUserDelete: true, legalHoldAllowed: true },
  relational: { retentionDays: 3650, allowExport: true, allowUserDelete: true, legalHoldAllowed: true },
  compliance: { retentionDays: 3650, allowExport: true, allowUserDelete: false, legalHoldAllowed: true },
  safety: { retentionDays: 3650, allowExport: false, allowUserDelete: false, legalHoldAllowed: true },
  restricted: { retentionDays: 3650, allowExport: false, allowUserDelete: false, legalHoldAllowed: true }
};

export const DEFAULT_KERNEL_CONFIG: PantavionKernelConfig = {
  environment: "dev",
  region: "eu",
  systemName: "Pantavion Kernel",
  version: "1.0.0",
  flags: {
    allowGenerativeMode: true,
    requireTruthZoneLabel: true,
    requireEvidenceForVerified: true,
    allowRestrictedOperations: false,
    allowCrossScopeMemoryRead: false,
    safeDegradedReadOnlyMode: true
  },
  defaultPolicies: [
    { id: createId("policy"), key: "kernel.constitution", title: "Pantavion Constitution", version: "v1" },
    { id: createId("policy"), key: "memory.sovereignty", title: "Memory Sovereignty Matrix", version: "v1" },
    { id: createId("policy"), key: "truth.answer.matrix", title: "Truth and Answer Governance Matrix", version: "v1" }
  ]
};

export class PantavionKernel {
  private state: PantavionKernelState;

  constructor(config?: Partial<PantavionKernelConfig>) {
    this.state = {
      config: {
        ...DEFAULT_KERNEL_CONFIG,
        ...config,
        flags: {
          ...DEFAULT_KERNEL_CONFIG.flags,
          ...(config?.flags ?? {})
        }
      },
      accounts: {},
      scopes: {},
      sessions: {},
      memory: {},
      answers: {},
      capabilities: {},
      audits: [],
      services: {},
      degradation: "none",
      launchedAt: nowIso(),
      updatedAt: nowIso()
    };
  }

  snapshot(): PantavionKernelState {
    return clone(this.state);
  }

  diagnostics() {
    return {
      kernel: {
        systemName: this.state.config.systemName,
        version: this.state.config.version,
        environment: this.state.config.environment,
        region: this.state.config.region,
        launchedAt: this.state.launchedAt,
        updatedAt: this.state.updatedAt,
        degradation: this.state.degradation
      },
      counts: {
        accounts: Object.keys(this.state.accounts).length,
        scopes: Object.keys(this.state.scopes).length,
        sessions: Object.keys(this.state.sessions).length,
        memory: Object.keys(this.state.memory).length,
        answers: Object.keys(this.state.answers).length,
        capabilities: Object.keys(this.state.capabilities).length,
        audits: this.state.audits.length,
        services: Object.keys(this.state.services).length
      }
    };
  }

  bootstrapSystemAdmin(email: string) {
    const accountId = createId("acct");
    const account: PantavionAccount = {
      id: accountId,
      email,
      displayName: "Pantavion Root",
      state: "active",
      trustTier: "internal_system",
      roles: ["super_admin"],
      createdAt: nowIso(),
      updatedAt: nowIso(),
      region: this.state.config.region,
      ageBand: "adult",
      flags: []
    };

    this.state.accounts[account.id] = account;

    const scope = this.createScope({
      accountId: account.id,
      type: "restricted_admin",
      label: "Kernel Admin",
      roleBindings: ["super_admin"],
      visibility: "restricted"
    });

    account.defaultScopeId = scope.id;
    scope.verified = true;
    scope.trustTier = "internal_system";

    this.audit({
      severity: "notice",
      code: "BOOTSTRAP_ADMIN",
      actorAccountId: account.id,
      actorScopeId: scope.id,
      targetType: "account",
      targetId: account.id,
      message: "System admin bootstrapped.",
      surfaceId: "kernel"
    });

    this.touch();
    return { account: clone(account), scope: clone(scope) };
  }

  createAccount(input: { displayName: string; email?: string; region?: PantavionRegion }) {
    assert(input.displayName.trim().length > 0, "displayName is required");

    const account: PantavionAccount = {
      id: createId("acct"),
      email: input.email,
      displayName: input.displayName.trim(),
      state: "active",
      trustTier: input.email ? "basic" : "anonymous",
      roles: ["user"],
      createdAt: nowIso(),
      updatedAt: nowIso(),
      region: input.region ?? this.state.config.region,
      ageBand: "adult",
      flags: []
    };

    this.state.accounts[account.id] = account;

    const scope = this.createScope({
      accountId: account.id,
      type: "personal",
      label: "Personal",
      roleBindings: ["user"],
      visibility: "private"
    });

    account.defaultScopeId = scope.id;

    this.audit({
      severity: "notice",
      code: "ACCOUNT_CREATED",
      actorAccountId: account.id,
      actorScopeId: scope.id,
      targetType: "account",
      targetId: account.id,
      message: "Account created.",
      surfaceId: "kernel"
    });

    this.touch();
    return { account: clone(account), scope: clone(scope) };
  }

  createSession(input: { accountId: UUID; scopeId: UUID; expiresInMinutes?: number }) {
    const account = this.mustAccount(input.accountId);
    const scope = this.mustScope(input.scopeId);
    assert(scope.accountId === account.id, "scope does not belong to account");

    const expiresInMinutes = input.expiresInMinutes ?? 1440;
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + expiresInMinutes * 60000);

    const session: PantavionSession = {
      id: createId("sess"),
      accountId: account.id,
      scopeId: scope.id,
      state: "active",
      createdAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      lastSeenAt: createdAt.toISOString(),
      riskScore: 0,
      challenged: false
    };

    this.state.sessions[session.id] = session;
    this.touch();
    return clone(session);
  }

  writeMemory(input: {
    actorScopeId: UUID;
    ownerAccountId: UUID;
    scopeId: UUID;
    class: PantavionMemoryClass;
    sensitivity: PantavionMemorySensitivity;
    title: string;
    content: unknown;
    tags?: string[];
  }) {
    const actorScope = this.mustScope(input.actorScopeId);
    assert(actorScope.permissions.includes("memory.write"), "permission denied: memory.write");
    assert(actorScope.accountId === input.ownerAccountId || actorScope.permissions.includes("governance.override"), "scope mismatch");

    const memory: PantavionMemoryObject = {
      id: createId("mem"),
      ownerAccountId: input.ownerAccountId,
      scopeId: input.scopeId,
      class: input.class,
      sensitivity: input.sensitivity,
      state: "active",
      title: input.title.trim(),
      content: input.content,
      tags: unique(input.tags ?? []),
      source: "user_input",
      provenance: ["kernel.writeMemory"],
      retention: clone(DEFAULT_MEMORY_RETENTION[input.class]),
      consentRefs: [],
      createdAt: nowIso(),
      updatedAt: nowIso(),
      encrypted: true
    };

    this.state.memory[memory.id] = memory;

    this.audit({
      severity: "info",
      code: "MEMORY_WRITTEN",
      actorAccountId: actorScope.accountId,
      actorScopeId: actorScope.id,
      targetType: "memory",
      targetId: memory.id,
      message: "Memory written.",
      surfaceId: "kernel"
    });

    this.touch();
    return clone(memory);
  }

  createAnswer(input: {
    scopeId: UUID;
    surfaceId: PantavionSurfaceId;
    truthZone: PantavionTruthZone;
    summary: string;
    content: unknown;
    evidence?: PantavionEvidence[];
  }) {
    const scope = this.mustScope(input.scopeId);
    assert(scope.permissions.includes("answer.execute"), "permission denied: answer.execute");

    const evidence = input.evidence ?? [];
    const hasVerifiedEvidence = evidence.some((item) => item.verified);

    const answer: PantavionAnswerObject = {
      id: createId("ans"),
      requestId: createId("req"),
      scopeId: input.scopeId,
      surfaceId: input.surfaceId,
      truthZone: input.truthZone,
      state: input.truthZone === "ai_assisted_verified" && !hasVerifiedEvidence ? "requires_review" : "final",
      content: input.content,
      summary: input.summary.trim(),
      evidence,
      confidence: input.truthZone === "deterministic_only" ? 0.98 : 0.75,
      verifier: hasVerifiedEvidence ? "evidence-backed" : undefined,
      fallbackReasonCodes: input.truthZone === "ai_assisted_verified" && !hasVerifiedEvidence ? ["HUMAN_REVIEW_REQUIRED"] : [],
      requiresHumanReview: input.truthZone === "ai_assisted_verified" && !hasVerifiedEvidence,
      createdAt: nowIso(),
      updatedAt: nowIso()
    };

    this.state.answers[answer.id] = answer;

    this.audit({
      severity: answer.requiresHumanReview ? "warning" : "info",
      code: "ANSWER_CREATED",
      actorAccountId: scope.accountId,
      actorScopeId: scope.id,
      targetType: "answer",
      targetId: answer.id,
      message: "Answer created.",
      surfaceId: input.surfaceId
    });

    this.touch();
    return clone(answer);
  }

  admitCapability(input: {
    actorScopeId: UUID;
    key: string;
    label: string;
    kind: PantavionCapabilityKind;
    provider: string;
    version: string;
    safetyClass: PantavionSafetyClass;
    costClass: PantavionCostClass;
    supportedSurfaces: PantavionSurfaceId[];
    truthZones: PantavionTruthZone[];
  }) {
    const actorScope = this.mustScope(input.actorScopeId);
    assert(actorScope.permissions.includes("capability.admit"), "permission denied: capability.admit");

    const capability: PantavionCapability = {
      id: createId("cap"),
      key: input.key.trim(),
      label: input.label.trim(),
      kind: input.kind,
      provider: input.provider.trim(),
      version: input.version.trim(),
      status: "admitted",
      safetyClass: input.safetyClass,
      costClass: input.costClass,
      supportedSurfaces: unique(input.supportedSurfaces),
      truthZones: unique(input.truthZones),
      permissionsRequired: ["capability.use"],
      healthScore: 1,
      admission: {
        admittedBy: actorScope.accountId,
        admittedAt: nowIso(),
        reason: "Kernel admission",
        policies: clone(this.state.config.defaultPolicies)
      },
      metadata: {},
      createdAt: nowIso(),
      updatedAt: nowIso()
    };

    this.state.capabilities[capability.id] = capability;

    this.audit({
      severity: "notice",
      code: "CAPABILITY_ADMITTED",
      actorAccountId: actorScope.accountId,
      actorScopeId: actorScope.id,
      targetType: "capability",
      targetId: capability.id,
      message: "Capability admitted.",
      surfaceId: "kernel"
    });

    this.touch();
    return clone(capability);
  }

  seedDefaultCapabilities(actorScopeId: UUID) {
    const defaults = [
      {
        key: "kernel.answer.router",
        label: "Kernel Answer Router",
        kind: "service" as const,
        provider: "pantavion",
        version: "1.0.0",
        safetyClass: "general" as const,
        costClass: "small" as const,
        supportedSurfaces: ["kernel", "people", "chat", "voice", "pulse", "compass", "mind", "create"] as PantavionSurfaceId[],
        truthZones: ["deterministic_only", "ai_assisted_verified", "generative_exploratory"] as PantavionTruthZone[]
      },
      {
        key: "kernel.memory.registry",
        label: "Kernel Memory Registry",
        kind: "service" as const,
        provider: "pantavion",
        version: "1.0.0",
        safetyClass: "sensitive" as const,
        costClass: "small" as const,
        supportedSurfaces: ["kernel", "people", "chat", "mind", "create"] as PantavionSurfaceId[],
        truthZones: ["deterministic_only", "ai_assisted_verified"] as PantavionTruthZone[]
      }
    ];

    return defaults.map((item) => this.admitCapability({ actorScopeId, ...item }));
  }

  private createScope(input: {
    accountId: UUID;
    type: PantavionScopeType;
    label: string;
    roleBindings: PantavionRole[];
    visibility: PantavionScope["visibility"];
  }) {
    const permissions = unique(input.roleBindings.flatMap((role) => ROLE_PERMISSIONS[role] ?? []));
    const scope: PantavionScope = {
      id: createId("scp"),
      accountId: input.accountId,
      type: input.type,
      label: input.label.trim(),
      roleBindings: unique(input.roleBindings),
      permissions,
      visibility: input.visibility,
      trustTier: input.roleBindings.includes("super_admin") ? "internal_system" : "basic",
      verified: false,
      metadata: {},
      createdAt: nowIso(),
      updatedAt: nowIso()
    };

    this.state.scopes[scope.id] = scope;
    return scope;
  }

  private audit(input: Omit<PantavionAuditEvent, "id" | "createdAt">) {
    this.state.audits.push({
      id: createId("audit"),
      createdAt: nowIso(),
      ...input
    });
  }

  private mustAccount(accountId: UUID) {
    const account = this.state.accounts[accountId];
    assert(account, "Account not found: " + accountId);
    return account;
  }

  private mustScope(scopeId: UUID) {
    const scope = this.state.scopes[scopeId];
    assert(scope, "Scope not found: " + scopeId);
    return scope;
  }

  private touch() {
    this.state.updatedAt = nowIso();
  }
}

export function createPantavionKernel(config?: Partial<PantavionKernelConfig>) {
  return new PantavionKernel(config);
}
