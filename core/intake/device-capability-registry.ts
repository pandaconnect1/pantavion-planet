// core/intake/device-capability-registry.ts

export interface PantavionDeviceCapabilityRecord {
  deviceClass: 'phone' | 'tablet' | 'laptop' | 'desktop';
  touchPrimary: boolean;
  lowBandwidthModeRequired: boolean;
  safeAreaAware: boolean;
  accessibilityBaselineRequired: boolean;
}

export interface PantavionDeviceCapabilitySnapshot {
  generatedAt: string;
  deviceCount: number;
  touchPrimaryCount: number;
  lowBandwidthRequiredCount: number;
  accessibilityBaselineRequiredCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const DEVICE_CAPABILITIES: PantavionDeviceCapabilityRecord[] = [
  { deviceClass: 'phone', touchPrimary: true, lowBandwidthModeRequired: true, safeAreaAware: true, accessibilityBaselineRequired: true },
  { deviceClass: 'tablet', touchPrimary: true, lowBandwidthModeRequired: true, safeAreaAware: true, accessibilityBaselineRequired: true },
  { deviceClass: 'laptop', touchPrimary: false, lowBandwidthModeRequired: false, safeAreaAware: false, accessibilityBaselineRequired: true },
  { deviceClass: 'desktop', touchPrimary: false, lowBandwidthModeRequired: false, safeAreaAware: false, accessibilityBaselineRequired: true },
];

export function listDeviceCapabilities(): PantavionDeviceCapabilityRecord[] {
  return DEVICE_CAPABILITIES.map((item) => cloneValue(item));
}

export function getDeviceCapabilitySnapshot(): PantavionDeviceCapabilitySnapshot {
  const list = listDeviceCapabilities();

  return {
    generatedAt: nowIso(),
    deviceCount: list.length,
    touchPrimaryCount: list.filter((item) => item.touchPrimary).length,
    lowBandwidthRequiredCount: list.filter((item) => item.lowBandwidthModeRequired).length,
    accessibilityBaselineRequiredCount: list.filter((item) => item.accessibilityBaselineRequired).length,
  };
}

export default listDeviceCapabilities;
