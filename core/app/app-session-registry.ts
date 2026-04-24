// core/app/app-session-registry.ts

import type { PantavionAppRole } from './app-role-registry';
import { getAppRole } from './app-role-registry';

export interface PantavionAppSessionRecord {
  sessionId: string;
  actorId: string;
  roleKey: PantavionAppRole;
  tenantId: string;
  deviceTrusted: boolean;
  mfaPresent: boolean;
  createdAt: string;
  lastValidatedAt: string;
  riskScore: number;
}

export interface PantavionAppSessionRegistrySnapshot {
  generatedAt: string;
  sessionCount: number;
  trustedDeviceCount: number;
  mfaPresentCount: number;
  privilegedSessionCount: number;
  highRiskCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

function createSessionId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${random}`;
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const APP_SESSIONS: PantavionAppSessionRecord[] = [
  {
    sessionId: createSessionId('sess_user'),
    actorId: 'user_demo_primary',
    roleKey: 'user',
    tenantId: 'tenant_user_demo_primary',
    deviceTrusted: true,
    mfaPresent: false,
    createdAt: nowIso(),
    lastValidatedAt: nowIso(),
    riskScore: 18,
  },
  {
    sessionId: createSessionId('sess_operator'),
    actorId: 'operator_alpha',
    roleKey: 'operator',
    tenantId: 'tenant_ops',
    deviceTrusted: true,
    mfaPresent: true,
    createdAt: nowIso(),
    lastValidatedAt: nowIso(),
    riskScore: 42,
  },
  {
    sessionId: createSessionId('sess_founder'),
    actorId: 'founder_primary',
    roleKey: 'founder',
    tenantId: 'tenant_founder',
    deviceTrusted: true,
    mfaPresent: true,
    createdAt: nowIso(),
    lastValidatedAt: nowIso(),
    riskScore: 15,
  },
  {
    sessionId: createSessionId('sess_service'),
    actorId: 'service_memory_worker',
    roleKey: 'service',
    tenantId: 'tenant_runtime',
    deviceTrusted: true,
    mfaPresent: false,
    createdAt: nowIso(),
    lastValidatedAt: nowIso(),
    riskScore: 12,
  },
];

export function listAppSessions(): PantavionAppSessionRecord[] {
  return APP_SESSIONS.map((item) => cloneValue(item));
}

export function getAppSession(sessionId: string): PantavionAppSessionRecord | null {
  const item = APP_SESSIONS.find((entry) => entry.sessionId === sessionId);
  return item ? cloneValue(item) : null;
}

export function getAppSessionRegistrySnapshot(): PantavionAppSessionRegistrySnapshot {
  const list = listAppSessions();

  return {
    generatedAt: nowIso(),
    sessionCount: list.length,
    trustedDeviceCount: list.filter((item) => item.deviceTrusted).length,
    mfaPresentCount: list.filter((item) => item.mfaPresent).length,
    privilegedSessionCount: list.filter((item) => getAppRole(item.roleKey)?.privileged).length,
    highRiskCount: list.filter((item) => item.riskScore >= 50).length,
  };
}

export default listAppSessions;
