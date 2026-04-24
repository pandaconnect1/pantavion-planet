// core/app/app-role-registry.ts

export type PantavionAppRole =
  | 'guest'
  | 'user'
  | 'operator'
  | 'founder'
  | 'service';

export interface PantavionAppRoleRecord {
  roleKey: PantavionAppRole;
  title: string;
  privileges: string[];
  privileged: boolean;
  sessionZone: 'end-user' | 'operator-admin' | 'founder-admin' | 'service-runtime';
  notes: string[];
}

export interface PantavionAppRoleRegistrySnapshot {
  generatedAt: string;
  roleCount: number;
  privilegedCount: number;
  founderRoleCount: number;
  serviceRoleCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const APP_ROLES: PantavionAppRoleRecord[] = [
  {
    roleKey: 'guest',
    title: 'Guest',
    privileges: ['read-public-surface'],
    privileged: false,
    sessionZone: 'end-user',
    notes: ['Unauthenticated access is minimal and read-only.'],
  },
  {
    roleKey: 'user',
    title: 'User',
    privileges: ['read-own-memory', 'write-own-thread', 'read-own-reminders'],
    privileged: false,
    sessionZone: 'end-user',
    notes: ['Users are strictly self-bounded.'],
  },
  {
    roleKey: 'operator',
    title: 'Operator',
    privileges: ['read-ops-surface', 'review-governor-actions', 'monitor-runtime'],
    privileged: true,
    sessionZone: 'operator-admin',
    notes: ['Operators are privileged but not founder-sovereign.'],
  },
  {
    roleKey: 'founder',
    title: 'Founder',
    privileges: ['founder-global-governance', 'founder-final-authority', 'founder-breakglass'],
    privileged: true,
    sessionZone: 'founder-admin',
    notes: ['Founder retains final authority in strategic and constitutional domains.'],
  },
  {
    roleKey: 'service',
    title: 'Service',
    privileges: ['service-runtime-execution', 'background-job-processing'],
    privileged: true,
    sessionZone: 'service-runtime',
    notes: ['Service identities are non-human and tightly scoped.'],
  },
];

export function listAppRoles(): PantavionAppRoleRecord[] {
  return APP_ROLES.map((item) => cloneValue(item));
}

export function getAppRole(roleKey: PantavionAppRole): PantavionAppRoleRecord | null {
  const item = APP_ROLES.find((entry) => entry.roleKey === roleKey);
  return item ? cloneValue(item) : null;
}

export function getAppRoleRegistrySnapshot(): PantavionAppRoleRegistrySnapshot {
  const list = listAppRoles();

  return {
    generatedAt: nowIso(),
    roleCount: list.length,
    privilegedCount: list.filter((item) => item.privileged).length,
    founderRoleCount: list.filter((item) => item.roleKey === 'founder').length,
    serviceRoleCount: list.filter((item) => item.roleKey === 'service').length,
  };
}

export default listAppRoles;
