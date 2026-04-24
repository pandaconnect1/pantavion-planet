// core/app/app-auth-role-session-integration-wave.ts

import { listAppRoles, getAppRoleRegistrySnapshot } from './app-role-registry';
import { listAppSessions, getAppSessionRegistrySnapshot } from './app-session-registry';
import {
  evaluateAppRoute,
  getAppRouteGuardSnapshot,
  type PantavionAppRouteDecision,
  type PantavionAppRouteRequest,
} from './app-route-guard';
import { saveKernelState } from '../storage/kernel-state-store';

export interface PantavionAppAuthRoleSessionIntegrationWaveOutput {
  generatedAt: string;
  roleSnapshot: ReturnType<typeof getAppRoleRegistrySnapshot>;
  sessionSnapshot: ReturnType<typeof getAppSessionRegistrySnapshot>;
  routeGuardSnapshot: ReturnType<typeof getAppRouteGuardSnapshot>;
  decisions: PantavionAppRouteDecision[];
  rendered: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function renderWave(output: PantavionAppAuthRoleSessionIntegrationWaveOutput): string {
  const roles = listAppRoles();
  const sessions = listAppSessions();

  return [
    'PANTAVION APP AUTH ROLE SESSION INTEGRATION WAVE',
    `generatedAt=${output.generatedAt}`,
    '',
    'ROLES',
    `roleCount=${output.roleSnapshot.roleCount}`,
    `privilegedCount=${output.roleSnapshot.privilegedCount}`,
    `founderRoleCount=${output.roleSnapshot.founderRoleCount}`,
    `serviceRoleCount=${output.roleSnapshot.serviceRoleCount}`,
    '',
    ...roles.flatMap((item) => [
      `${item.roleKey}`,
      `sessionZone=${item.sessionZone}`,
      `privileged=${item.privileged ? 'yes' : 'no'}`,
      '',
    ]),
    'SESSIONS',
    `sessionCount=${output.sessionSnapshot.sessionCount}`,
    `trustedDeviceCount=${output.sessionSnapshot.trustedDeviceCount}`,
    `mfaPresentCount=${output.sessionSnapshot.mfaPresentCount}`,
    `privilegedSessionCount=${output.sessionSnapshot.privilegedSessionCount}`,
    `highRiskCount=${output.sessionSnapshot.highRiskCount}`,
    '',
    ...sessions.flatMap((item) => [
      `${item.sessionId}`,
      `actorId=${item.actorId}`,
      `roleKey=${item.roleKey}`,
      `tenantId=${item.tenantId}`,
      '',
    ]),
    'ROUTE GUARD',
    `evaluatedCount=${output.routeGuardSnapshot.evaluatedCount}`,
    `allowedCount=${output.routeGuardSnapshot.allowedCount}`,
    `blockedCount=${output.routeGuardSnapshot.blockedCount}`,
    `founderRouteCount=${output.routeGuardSnapshot.founderRouteCount}`,
    `operatorRouteCount=${output.routeGuardSnapshot.operatorRouteCount}`,
    '',
    ...output.decisions.flatMap((item) => [
      `${item.routeKey}`,
      `allowed=${item.allowed ? 'yes' : 'no'}`,
      `permissionReason=${item.permissionReason}`,
      `sessionReason=${item.sessionReason}`,
      '',
    ]),
  ].join('\n');
}

export async function runAppAuthRoleSessionIntegrationWave(): Promise<PantavionAppAuthRoleSessionIntegrationWaveOutput> {
  const routeRequests: PantavionAppRouteRequest[] = [
    {
      routeKey: 'route_public_home',
      actorId: 'guest',
      actorRole: 'guest',
      tenantId: 'tenant_public',
      scope: 'public',
      deviceTrusted: false,
      mfaPresent: false,
      riskScore: 10,
      sessionAgeMinutes: 0,
    },
    {
      routeKey: 'route_memory_dashboard',
      actorId: 'user_demo_primary',
      actorRole: 'user',
      tenantId: 'tenant_user_demo_primary',
      scope: 'self',
      deviceTrusted: true,
      mfaPresent: false,
      riskScore: 18,
      sessionAgeMinutes: 22,
    },
    {
      routeKey: 'route_operator_console',
      actorId: 'operator_alpha',
      actorRole: 'operator',
      tenantId: 'tenant_ops',
      scope: 'operator',
      deviceTrusted: true,
      mfaPresent: true,
      riskScore: 42,
      sessionAgeMinutes: 40,
    },
    {
      routeKey: 'route_founder_constitution',
      actorId: 'founder_primary',
      actorRole: 'founder',
      tenantId: 'tenant_founder',
      scope: 'founder',
      deviceTrusted: true,
      mfaPresent: true,
      riskScore: 15,
      sessionAgeMinutes: 18,
    },
    {
      routeKey: 'route_founder_constitution_blocked',
      actorId: 'operator_alpha',
      actorRole: 'operator',
      tenantId: 'tenant_ops',
      scope: 'founder',
      deviceTrusted: true,
      mfaPresent: true,
      riskScore: 20,
      sessionAgeMinutes: 15,
    },
  ];

  const decisions = routeRequests.map((item) => evaluateAppRoute(item));

  const output: PantavionAppAuthRoleSessionIntegrationWaveOutput = {
    generatedAt: nowIso(),
    roleSnapshot: getAppRoleRegistrySnapshot(),
    sessionSnapshot: getAppSessionRegistrySnapshot(),
    routeGuardSnapshot: getAppRouteGuardSnapshot(decisions, routeRequests),
    decisions,
    rendered: '',
  };

  output.rendered = renderWave(output);

  saveKernelState({
    key: 'app.auth-role-session.latest',
    kind: 'report',
    payload: {
      roleSnapshot: output.roleSnapshot,
      sessionSnapshot: output.sessionSnapshot,
      routeGuardSnapshot: output.routeGuardSnapshot,
      roles: listAppRoles(),
      sessions: listAppSessions(),
      decisions: output.decisions,
    },
    tags: ['app', 'auth', 'role', 'session', 'latest'],
    metadata: {
      roleCount: output.roleSnapshot.roleCount,
      sessionCount: output.sessionSnapshot.sessionCount,
      routeAllowedCount: output.routeGuardSnapshot.allowedCount,
      routeBlockedCount: output.routeGuardSnapshot.blockedCount,
    },
  });

  return output;
}

export default runAppAuthRoleSessionIntegrationWave;
