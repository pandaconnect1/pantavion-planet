// core/continuity/trusted-device-registry.ts

export interface PantavionTrustedDeviceRecord {
  deviceId: string;
  accountId: string;
  deviceName: string;
  deviceClass: 'phone' | 'tablet' | 'laptop' | 'desktop';
  platform: 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'web';
  trustLevel: 'standard' | 'high' | 'elevated';
  revoked: boolean;
  lastSeenAt: string;
}

export interface PantavionTrustedDeviceSnapshot {
  generatedAt: string;
  deviceCount: number;
  phoneCount: number;
  tabletCount: number;
  revokedCount: number;
  elevatedTrustCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const TRUSTED_DEVICES: PantavionTrustedDeviceRecord[] = [
  {
    deviceId: 'device_phone_001',
    accountId: 'acct_local_user_001',
    deviceName: 'Giwrgos iPhone',
    deviceClass: 'phone',
    platform: 'ios',
    trustLevel: 'high',
    revoked: false,
    lastSeenAt: '2026-04-22T18:10:00.000Z',
  },
  {
    deviceId: 'device_tablet_002',
    accountId: 'acct_local_user_001',
    deviceName: 'Giwrgos iPad',
    deviceClass: 'tablet',
    platform: 'ios',
    trustLevel: 'standard',
    revoked: false,
    lastSeenAt: '2026-04-22T17:55:00.000Z',
  },
  {
    deviceId: 'device_laptop_003',
    accountId: 'acct_pro_user_002',
    deviceName: 'Work Laptop',
    deviceClass: 'laptop',
    platform: 'windows',
    trustLevel: 'high',
    revoked: false,
    lastSeenAt: '2026-04-22T18:12:00.000Z',
  },
  {
    deviceId: 'device_desktop_004',
    accountId: 'acct_founder_004',
    deviceName: 'Founder Desktop',
    deviceClass: 'desktop',
    platform: 'windows',
    trustLevel: 'elevated',
    revoked: false,
    lastSeenAt: '2026-04-22T18:15:00.000Z',
  },
  {
    deviceId: 'device_phone_old_005',
    accountId: 'acct_elite_user_003',
    deviceName: 'Old Android Phone',
    deviceClass: 'phone',
    platform: 'android',
    trustLevel: 'standard',
    revoked: true,
    lastSeenAt: '2026-04-12T08:00:00.000Z',
  },
];

export function listTrustedDevices(): PantavionTrustedDeviceRecord[] {
  return TRUSTED_DEVICES.map((item) => cloneValue(item));
}

export function getTrustedDeviceSnapshot(): PantavionTrustedDeviceSnapshot {
  const list = listTrustedDevices();

  return {
    generatedAt: nowIso(),
    deviceCount: list.length,
    phoneCount: list.filter((item) => item.deviceClass === 'phone').length,
    tabletCount: list.filter((item) => item.deviceClass === 'tablet').length,
    revokedCount: list.filter((item) => item.revoked).length,
    elevatedTrustCount: list.filter((item) => item.trustLevel === 'elevated').length,
  };
}

export default listTrustedDevices;
