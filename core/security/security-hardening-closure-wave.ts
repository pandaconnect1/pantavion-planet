// core/security/security-hardening-closure-wave.ts

import {
  listAuthIdentitySecurityRecords,
  getAuthIdentitySecuritySnapshot,
} from './auth-identity-security-registry';
import {
  listAuthorizationPolicyRecords,
  getAuthorizationPolicySnapshot,
} from './authorization-policy-registry';
import {
  listTenantIsolationPolicies,
  getTenantIsolationPolicySnapshot,
} from './tenant-isolation-policy';
import {
  listSecretsKeyManagementPolicies,
  getSecretsKeyManagementSnapshot,
} from './secrets-key-management-policy';
import {
  listPromptToolSecurityPolicies,
  getPromptToolSecuritySnapshot,
} from './prompt-tool-security-policy';
import {
  listRuntimeAbuseProtectionPolicies,
  getRuntimeAbuseProtectionSnapshot,
} from './runtime-abuse-protection-policy';
import {
  listAuditIntegrityPolicies,
  getAuditIntegritySnapshot,
} from './audit-integrity-policy';
import {
  listIncidentRecoveryPoliciesSummary,
  getIncidentRecoverySnapshot,
} from './incident-recovery-policy';
import { saveKernelState } from '../storage/kernel-state-store';

export interface PantavionSecurityHardeningClosureWaveOutput {
  generatedAt: string;
  authSnapshot: ReturnType<typeof getAuthIdentitySecuritySnapshot>;
  authorizationSnapshot: ReturnType<typeof getAuthorizationPolicySnapshot>;
  isolationSnapshot: ReturnType<typeof getTenantIsolationPolicySnapshot>;
  secretsSnapshot: ReturnType<typeof getSecretsKeyManagementSnapshot>;
  promptToolSnapshot: ReturnType<typeof getPromptToolSecuritySnapshot>;
  abuseSnapshot: ReturnType<typeof getRuntimeAbuseProtectionSnapshot>;
  auditSnapshot: ReturnType<typeof getAuditIntegritySnapshot>;
  incidentSnapshot: ReturnType<typeof getIncidentRecoverySnapshot>;
  rendered: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function renderWave(output: PantavionSecurityHardeningClosureWaveOutput): string {
  const auth = listAuthIdentitySecurityRecords();
  const authorization = listAuthorizationPolicyRecords();
  const isolation = listTenantIsolationPolicies();
  const secrets = listSecretsKeyManagementPolicies();
  const promptTool = listPromptToolSecurityPolicies();
  const abuse = listRuntimeAbuseProtectionPolicies();
  const audit = listAuditIntegrityPolicies();
  const incident = listIncidentRecoveryPoliciesSummary();

  return [
    'PANTAVION SECURITY HARDENING CLOSURE WAVE',
    `generatedAt=${output.generatedAt}`,
    '',
    'AUTH IDENTITY',
    `identityCount=${output.authSnapshot.identityCount}`,
    `mfaRequiredCount=${output.authSnapshot.mfaRequiredCount}`,
    `deviceTrustRequiredCount=${output.authSnapshot.deviceTrustRequiredCount}`,
    `sessionRevalidationRequiredCount=${output.authSnapshot.sessionRevalidationRequiredCount}`,
    `criticalStrengthCount=${output.authSnapshot.criticalStrengthCount}`,
    '',
    ...auth.flatMap((item) => [
      `${item.identityKey}`,
      `zone=${item.zone}`,
      `authStrength=${item.authStrength}`,
      `mfaRequired=${item.mfaRequired ? 'yes' : 'no'}`,
      '',
    ]),
    'AUTHORIZATION',
    `policyCount=${output.authorizationSnapshot.policyCount}`,
    `selfOnlyCount=${output.authorizationSnapshot.selfOnlyCount}`,
    `tenantBoundedCount=${output.authorizationSnapshot.tenantBoundedCount}`,
    `governorBoundedCount=${output.authorizationSnapshot.governorBoundedCount}`,
    `founderOnlyCount=${output.authorizationSnapshot.founderOnlyCount}`,
    '',
    ...authorization.flatMap((item) => [
      `${item.policyKey}`,
      `scope=${item.scope}`,
      `humanApprovalRequired=${item.humanApprovalRequired ? 'yes' : 'no'}`,
      '',
    ]),
    'TENANT ISOLATION',
    `isolationCount=${output.isolationSnapshot.isolationCount}`,
    `hardCount=${output.isolationSnapshot.hardCount}`,
    `criticalHardCount=${output.isolationSnapshot.criticalHardCount}`,
    `keyMaterialSeparatedCount=${output.isolationSnapshot.keyMaterialSeparatedCount}`,
    '',
    ...isolation.flatMap((item) => [
      `${item.isolationKey}`,
      `isolationStrength=${item.isolationStrength}`,
      `keyMaterialSeparated=${item.keyMaterialSeparated ? 'yes' : 'no'}`,
      '',
    ]),
    'SECRETS KEY MANAGEMENT',
    `controlCount=${output.secretsSnapshot.controlCount}`,
    `rotationRequiredCount=${output.secretsSnapshot.rotationRequiredCount}`,
    `environmentSeparatedCount=${output.secretsSnapshot.environmentSeparatedCount}`,
    `serverOnlyExposureCount=${output.secretsSnapshot.serverOnlyExposureCount}`,
    `breakglassRestrictedCount=${output.secretsSnapshot.breakglassRestrictedCount}`,
    '',
    ...secrets.flatMap((item) => [
      `${item.controlKey}`,
      `rotationRequired=${item.rotationRequired ? 'yes' : 'no'}`,
      `serverOnlyExposure=${item.serverOnlyExposure ? 'yes' : 'no'}`,
      '',
    ]),
    'PROMPT TOOL SECURITY',
    `policyCount=${output.promptToolSnapshot.policyCount}`,
    `toolAllowlistRequiredCount=${output.promptToolSnapshot.toolAllowlistRequiredCount}`,
    `crossThreadIsolationRequiredCount=${output.promptToolSnapshot.crossThreadIsolationRequiredCount}`,
    `memoryPoisoningDefenseRequiredCount=${output.promptToolSnapshot.memoryPoisoningDefenseRequiredCount}`,
    '',
    ...promptTool.flatMap((item) => [
      `${item.policyKey}`,
      `toolAllowlistRequired=${item.toolAllowlistRequired ? 'yes' : 'no'}`,
      `memoryPoisoningDefenseRequired=${item.memoryPoisoningDefenseRequired ? 'yes' : 'no'}`,
      '',
    ]),
    'RUNTIME ABUSE PROTECTION',
    `policyCount=${output.abuseSnapshot.policyCount}`,
    `rateLimitRequiredCount=${output.abuseSnapshot.rateLimitRequiredCount}`,
    `anomalyDetectionRequiredCount=${output.abuseSnapshot.anomalyDetectionRequiredCount}`,
    `bruteForceResistanceRequiredCount=${output.abuseSnapshot.bruteForceResistanceRequiredCount}`,
    `replayProtectionRequiredCount=${output.abuseSnapshot.replayProtectionRequiredCount}`,
    '',
    ...abuse.flatMap((item) => [
      `${item.policyKey}`,
      `rateLimitRequired=${item.rateLimitRequired ? 'yes' : 'no'}`,
      `replayProtectionRequired=${item.replayProtectionRequired ? 'yes' : 'no'}`,
      '',
    ]),
    'AUDIT INTEGRITY',
    `policyCount=${output.auditSnapshot.policyCount}`,
    `appendOnlyRequiredCount=${output.auditSnapshot.appendOnlyRequiredCount}`,
    `tamperEvidenceRequiredCount=${output.auditSnapshot.tamperEvidenceRequiredCount}`,
    `lineageRequiredCount=${output.auditSnapshot.lineageRequiredCount}`,
    `founderEmergencyLockSupportedCount=${output.auditSnapshot.founderEmergencyLockSupportedCount}`,
    '',
    ...audit.flatMap((item) => [
      `${item.policyKey}`,
      `appendOnlyRequired=${item.appendOnlyRequired ? 'yes' : 'no'}`,
      `founderEmergencyLockSupported=${item.founderEmergencyLockSupported ? 'yes' : 'no'}`,
      '',
    ]),
    'INCIDENT RECOVERY',
    `policyCount=${output.incidentSnapshot.policyCount}`,
    `keyRotationPlaybookRequiredCount=${output.incidentSnapshot.keyRotationPlaybookRequiredCount}`,
    `sessionRevocationRequiredCount=${output.incidentSnapshot.sessionRevocationRequiredCount}`,
    `backupRestoreValidationRequiredCount=${output.incidentSnapshot.backupRestoreValidationRequiredCount}`,
    `founderEmergencyModeSupportedCount=${output.incidentSnapshot.founderEmergencyModeSupportedCount}`,
    '',
    ...incident.flatMap((item) => [
      `${item.policyKey}`,
      `keyRotationPlaybookRequired=${item.keyRotationPlaybookRequired ? 'yes' : 'no'}`,
      `founderEmergencyModeSupported=${item.founderEmergencyModeSupported ? 'yes' : 'no'}`,
      '',
    ]),
  ].join('\n');
}

export async function runSecurityHardeningClosureWave(): Promise<PantavionSecurityHardeningClosureWaveOutput> {
  const output: PantavionSecurityHardeningClosureWaveOutput = {
    generatedAt: nowIso(),
    authSnapshot: getAuthIdentitySecuritySnapshot(),
    authorizationSnapshot: getAuthorizationPolicySnapshot(),
    isolationSnapshot: getTenantIsolationPolicySnapshot(),
    secretsSnapshot: getSecretsKeyManagementSnapshot(),
    promptToolSnapshot: getPromptToolSecuritySnapshot(),
    abuseSnapshot: getRuntimeAbuseProtectionSnapshot(),
    auditSnapshot: getAuditIntegritySnapshot(),
    incidentSnapshot: getIncidentRecoverySnapshot(),
    rendered: '',
  };

  output.rendered = renderWave(output);

  saveKernelState({
    key: 'security.hardening-closure.latest',
    kind: 'report',
    payload: {
      authSnapshot: output.authSnapshot,
      authorizationSnapshot: output.authorizationSnapshot,
      isolationSnapshot: output.isolationSnapshot,
      secretsSnapshot: output.secretsSnapshot,
      promptToolSnapshot: output.promptToolSnapshot,
      abuseSnapshot: output.abuseSnapshot,
      auditSnapshot: output.auditSnapshot,
      incidentSnapshot: output.incidentSnapshot,
      auth: listAuthIdentitySecurityRecords(),
      authorization: listAuthorizationPolicyRecords(),
      isolation: listTenantIsolationPolicies(),
      secrets: listSecretsKeyManagementPolicies(),
      promptTool: listPromptToolSecurityPolicies(),
      abuse: listRuntimeAbuseProtectionPolicies(),
      audit: listAuditIntegrityPolicies(),
      incident: listIncidentRecoveryPoliciesSummary(),
    },
    tags: ['security', 'hardening', 'closure', 'latest'],
    metadata: {
      identityCount: output.authSnapshot.identityCount,
      authorizationPolicyCount: output.authorizationSnapshot.policyCount,
      isolationCount: output.isolationSnapshot.isolationCount,
      secretsControlCount: output.secretsSnapshot.controlCount,
      abusePolicyCount: output.abuseSnapshot.policyCount,
    },
  });

  return output;
}

export default runSecurityHardeningClosureWave;
