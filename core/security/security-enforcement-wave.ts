// core/security/security-enforcement-wave.ts

import {
  evaluateAuthSession,
  getAuthSessionEnforcementSnapshot,
  type PantavionAuthSessionDecision,
} from './auth-session-enforcement';
import {
  evaluatePermissionGate,
  getPermissionGateSnapshot,
  type PantavionPermissionDecision,
  type PantavionPermissionRequest,
} from './permission-gate';
import {
  evaluateTenantAccess,
  getTenantAccessEnforcementSnapshot,
  type PantavionTenantAccessDecision,
} from './tenant-access-enforcer';
import {
  evaluateSecretBoundary,
  getSecretBoundarySnapshot,
  type PantavionSecretAccessDecision,
} from './secret-boundary-enforcer';
import {
  evaluatePromptToolExecution,
  getPromptToolExecutionSnapshot,
  type PantavionPromptToolExecutionDecision,
} from './prompt-tool-execution-guard';
import PantavionAuditAppendOnlyWriter from './audit-append-only-writer';
import {
  evaluateIncidentLockdown,
  getIncidentLockdownSnapshot,
  type PantavionIncidentLockdownDecision,
} from './incident-lockdown-hooks';
import { saveKernelState } from '../storage/kernel-state-store';

export interface PantavionSecurityEnforcementWaveOutput {
  generatedAt: string;
  authSnapshot: ReturnType<typeof getAuthSessionEnforcementSnapshot>;
  permissionSnapshot: ReturnType<typeof getPermissionGateSnapshot>;
  tenantSnapshot: ReturnType<typeof getTenantAccessEnforcementSnapshot>;
  secretSnapshot: ReturnType<typeof getSecretBoundarySnapshot>;
  promptToolSnapshot: ReturnType<typeof getPromptToolExecutionSnapshot>;
  auditSnapshot: ReturnType<PantavionAuditAppendOnlyWriter['getSnapshot']>;
  incidentSnapshot: ReturnType<typeof getIncidentLockdownSnapshot>;
  rendered: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function renderWave(input: {
  output: PantavionSecurityEnforcementWaveOutput;
  authDecisions: PantavionAuthSessionDecision[];
  permissionDecisions: PantavionPermissionDecision[];
  permissionRequests: PantavionPermissionRequest[];
  tenantDecisions: PantavionTenantAccessDecision[];
  secretDecisions: PantavionSecretAccessDecision[];
  promptToolDecisions: PantavionPromptToolExecutionDecision[];
  incidentDecisions: PantavionIncidentLockdownDecision[];
  auditRecords: ReturnType<PantavionAuditAppendOnlyWriter['list']>;
}): string {
  return [
    'PANTAVION SECURITY ENFORCEMENT WAVE',
    `generatedAt=${input.output.generatedAt}`,
    '',
    'AUTH SESSION ENFORCEMENT',
    `evaluatedCount=${input.output.authSnapshot.evaluatedCount}`,
    `allowedCount=${input.output.authSnapshot.allowedCount}`,
    `blockedCount=${input.output.authSnapshot.blockedCount}`,
    `stepUpCount=${input.output.authSnapshot.stepUpCount}`,
    '',
    ...input.authDecisions.flatMap((item) => [
      `${item.sessionId}`,
      `allowed=${item.allowed ? 'yes' : 'no'}`,
      `requiresStepUp=${item.requiresStepUp ? 'yes' : 'no'}`,
      `reason=${item.reason}`,
      '',
    ]),
    'PERMISSION GATE',
    `evaluatedCount=${input.output.permissionSnapshot.evaluatedCount}`,
    `allowedCount=${input.output.permissionSnapshot.allowedCount}`,
    `blockedCount=${input.output.permissionSnapshot.blockedCount}`,
    `founderScopedCount=${input.output.permissionSnapshot.founderScopedCount}`,
    '',
    ...input.permissionRequests.map((request, index) => [
      request.actionKey,
      `scope=${request.scope}`,
      `allowed=${input.permissionDecisions[index]?.allowed ? 'yes' : 'no'}`,
      `reason=${input.permissionDecisions[index]?.reason ?? 'unknown'}`,
      '',
    ]).flat(),
    'TENANT ACCESS ENFORCEMENT',
    `evaluatedCount=${input.output.tenantSnapshot.evaluatedCount}`,
    `isolatedAllowedCount=${input.output.tenantSnapshot.isolatedAllowedCount}`,
    `crossTenantBlockedCount=${input.output.tenantSnapshot.crossTenantBlockedCount}`,
    `founderOverrideCount=${input.output.tenantSnapshot.founderOverrideCount}`,
    '',
    ...input.tenantDecisions.flatMap((item) => [
      `${item.resourceType}`,
      `allowed=${item.allowed ? 'yes' : 'no'}`,
      `isolationStatus=${item.isolationStatus}`,
      `reason=${item.reason}`,
      '',
    ]),
    'SECRET BOUNDARY ENFORCEMENT',
    `evaluatedCount=${input.output.secretSnapshot.evaluatedCount}`,
    `allowedCount=${input.output.secretSnapshot.allowedCount}`,
    `blockedCount=${input.output.secretSnapshot.blockedCount}`,
    `requiresRotationCount=${input.output.secretSnapshot.requiresRotationCount}`,
    '',
    ...input.secretDecisions.flatMap((item) => [
      `${item.secretKey}`,
      `allowed=${item.allowed ? 'yes' : 'no'}`,
      `requiresRotation=${item.requiresRotation ? 'yes' : 'no'}`,
      `reason=${item.reason}`,
      '',
    ]),
    'PROMPT TOOL EXECUTION GUARD',
    `evaluatedCount=${input.output.promptToolSnapshot.evaluatedCount}`,
    `allowedCount=${input.output.promptToolSnapshot.allowedCount}`,
    `blockedCount=${input.output.promptToolSnapshot.blockedCount}`,
    `escalationBlockedCount=${input.output.promptToolSnapshot.escalationBlockedCount}`,
    '',
    ...input.promptToolDecisions.flatMap((item) => [
      `${item.requestedTool}`,
      `allowed=${item.allowed ? 'yes' : 'no'}`,
      `escalationBlocked=${item.escalationBlocked ? 'yes' : 'no'}`,
      `reason=${item.reason}`,
      '',
    ]),
    'AUDIT APPEND ONLY WRITER',
    `recordCount=${input.output.auditSnapshot.recordCount}`,
    `latestSequenceNumber=${input.output.auditSnapshot.latestSequenceNumber}`,
    `latestChecksum=${input.output.auditSnapshot.latestChecksum ?? 'none'}`,
    '',
    ...input.auditRecords.flatMap((item) => [
      `${item.eventId}`,
      `sequenceNumber=${item.sequenceNumber}`,
      `checksum=${item.checksum}`,
      '',
    ]),
    'INCIDENT LOCKDOWN HOOKS',
    `evaluatedCount=${input.output.incidentSnapshot.evaluatedCount}`,
    `lockdownTriggeredCount=${input.output.incidentSnapshot.lockdownTriggeredCount}`,
    `founderAlertRequiredCount=${input.output.incidentSnapshot.founderAlertRequiredCount}`,
    `sessionRevocationRequiredCount=${input.output.incidentSnapshot.sessionRevocationRequiredCount}`,
    `keyRotationRequiredCount=${input.output.incidentSnapshot.keyRotationRequiredCount}`,
    '',
    ...input.incidentDecisions.flatMap((item) => [
      `${item.signalKey}`,
      `lockdownTriggered=${item.lockdownTriggered ? 'yes' : 'no'}`,
      `founderAlertRequired=${item.founderAlertRequired ? 'yes' : 'no'}`,
      `reason=${item.reason}`,
      '',
    ]),
  ].join('\n');
}

export async function runSecurityEnforcementWave(): Promise<PantavionSecurityEnforcementWaveOutput> {
  const authDecisions = [
    evaluateAuthSession({
      sessionId: 'sess_user_ok',
      actorId: 'user_demo_primary',
      zone: 'end-user',
      mfaPresent: false,
      deviceTrusted: true,
      sessionAgeMinutes: 35,
      riskScore: 18,
    }),
    evaluateAuthSession({
      sessionId: 'sess_founder_risky',
      actorId: 'founder_primary',
      zone: 'founder-admin',
      mfaPresent: true,
      deviceTrusted: true,
      sessionAgeMinutes: 20,
      riskScore: 62,
    }),
    evaluateAuthSession({
      sessionId: 'sess_operator_blocked',
      actorId: 'operator_1',
      zone: 'operator-admin',
      mfaPresent: false,
      deviceTrusted: true,
      sessionAgeMinutes: 12,
      riskScore: 14,
    }),
  ];

  const permissionRequests: PantavionPermissionRequest[] = [
    {
      actorId: 'user_demo_primary',
      actorRole: 'user',
      scope: 'self',
      actionKey: 'read-own-memory',
      humanApprovalPresent: false,
    },
    {
      actorId: 'service_runtime',
      actorRole: 'service',
      scope: 'tenant',
      actionKey: 'write-tenant-memory-direct',
      humanApprovalPresent: false,
    },
    {
      actorId: 'founder_primary',
      actorRole: 'founder',
      scope: 'founder',
      actionKey: 'mutate-global-governance',
      humanApprovalPresent: true,
    },
  ];

  const permissionDecisions = permissionRequests.map((item) => evaluatePermissionGate(item));

  const tenantDecisions = [
    evaluateTenantAccess({
      actorTenantId: 'tenant_alpha',
      targetTenantId: 'tenant_alpha',
      resourceType: 'memory',
      founderOverride: false,
    }),
    evaluateTenantAccess({
      actorTenantId: 'tenant_alpha',
      targetTenantId: 'tenant_beta',
      resourceType: 'thread',
      founderOverride: false,
    }),
    evaluateTenantAccess({
      actorTenantId: 'tenant_founder',
      targetTenantId: 'tenant_beta',
      resourceType: 'governance',
      founderOverride: true,
    }),
  ];

  const secretDecisions = [
    evaluateSecretBoundary({
      secretKey: 'provider_api_key',
      environment: 'production',
      actorClass: 'server',
      rotationAgeDays: 28,
    }),
    evaluateSecretBoundary({
      secretKey: 'billing_webhook_secret',
      environment: 'production',
      actorClass: 'client',
      rotationAgeDays: 14,
    }),
    evaluateSecretBoundary({
      secretKey: 'breakglass_admin_secret',
      environment: 'production',
      actorClass: 'founder-breakglass',
      rotationAgeDays: 120,
    }),
  ];

  const promptToolDecisions = [
    evaluatePromptToolExecution({
      promptTrusted: true,
      requestedTool: 'timeline_reader',
      requestedWriteScope: 'none',
      crossThreadTarget: false,
    }),
    evaluatePromptToolExecution({
      promptTrusted: false,
      requestedTool: 'canonical_writer',
      requestedWriteScope: 'canonical',
      crossThreadTarget: false,
    }),
    evaluatePromptToolExecution({
      promptTrusted: false,
      requestedTool: 'thread_editor',
      requestedWriteScope: 'thread',
      crossThreadTarget: true,
    }),
  ];

  const auditWriter = new PantavionAuditAppendOnlyWriter();
  auditWriter.append({
    eventId: 'audit_evt_1',
    category: 'auth',
    actorId: 'user_demo_primary',
    action: 'session_allowed',
    createdAt: nowIso(),
  });
  auditWriter.append({
    eventId: 'audit_evt_2',
    category: 'security',
    actorId: 'system_guard',
    action: 'prompt_escalation_blocked',
    createdAt: nowIso(),
  });
  auditWriter.append({
    eventId: 'audit_evt_3',
    category: 'incident',
    actorId: 'system_guard',
    action: 'high_signal_lockdown',
    createdAt: nowIso(),
  });

  const incidentDecisions = [
    evaluateIncidentLockdown({
      signalKey: 'signal_medium_anomaly',
      severity: 'medium',
      source: 'abuse-detector',
    }),
    evaluateIncidentLockdown({
      signalKey: 'signal_high_session_attack',
      severity: 'high',
      source: 'auth-guard',
    }),
    evaluateIncidentLockdown({
      signalKey: 'signal_critical_key_exposure',
      severity: 'critical',
      source: 'secret-boundary',
    }),
  ];

  const output: PantavionSecurityEnforcementWaveOutput = {
    generatedAt: nowIso(),
    authSnapshot: getAuthSessionEnforcementSnapshot(authDecisions),
    permissionSnapshot: getPermissionGateSnapshot(permissionDecisions, permissionRequests),
    tenantSnapshot: getTenantAccessEnforcementSnapshot(tenantDecisions),
    secretSnapshot: getSecretBoundarySnapshot(secretDecisions),
    promptToolSnapshot: getPromptToolExecutionSnapshot(promptToolDecisions),
    auditSnapshot: auditWriter.getSnapshot(),
    incidentSnapshot: getIncidentLockdownSnapshot(incidentDecisions),
    rendered: '',
  };

  output.rendered = renderWave({
    output,
    authDecisions,
    permissionDecisions,
    permissionRequests,
    tenantDecisions,
    secretDecisions,
    promptToolDecisions,
    incidentDecisions,
    auditRecords: auditWriter.list(),
  });

  saveKernelState({
    key: 'security.enforcement.latest',
    kind: 'report',
    payload: {
      authSnapshot: output.authSnapshot,
      permissionSnapshot: output.permissionSnapshot,
      tenantSnapshot: output.tenantSnapshot,
      secretSnapshot: output.secretSnapshot,
      promptToolSnapshot: output.promptToolSnapshot,
      auditSnapshot: output.auditSnapshot,
      incidentSnapshot: output.incidentSnapshot,
    },
    tags: ['security', 'enforcement', 'latest'],
    metadata: {
      authAllowedCount: output.authSnapshot.allowedCount,
      permissionBlockedCount: output.permissionSnapshot.blockedCount,
      tenantBlockedCount: output.tenantSnapshot.crossTenantBlockedCount,
      secretBlockedCount: output.secretSnapshot.blockedCount,
      incidentLockdownCount: output.incidentSnapshot.lockdownTriggeredCount,
    },
  });

  return output;
}

export default runSecurityEnforcementWave;
