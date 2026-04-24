// core/intake/tool-capability-registry.ts

export interface PantavionToolCapabilityRecord {
  toolKey: string;
  toolClass: 'code' | 'media' | 'translation' | 'voice' | 'analysis' | 'deployment' | 'billing' | 'design';
  costTier: 'low' | 'medium' | 'high';
  trustTier: 'standard' | 'high' | 'critical';
  canTouchSensitiveData: boolean;
  humanApprovalRequired: boolean;
}

export interface PantavionToolCapabilitySnapshot {
  generatedAt: string;
  toolCount: number;
  criticalTrustCount: number;
  sensitiveDataToolCount: number;
  humanApprovalRequiredCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const TOOL_CAPABILITIES: PantavionToolCapabilityRecord[] = [
  { toolKey: 'code-generator', toolClass: 'code', costTier: 'high', trustTier: 'high', canTouchSensitiveData: false, humanApprovalRequired: false },
  { toolKey: 'translation-engine', toolClass: 'translation', costTier: 'medium', trustTier: 'high', canTouchSensitiveData: true, humanApprovalRequired: false },
  { toolKey: 'voice-engine', toolClass: 'voice', costTier: 'medium', trustTier: 'high', canTouchSensitiveData: true, humanApprovalRequired: false },
  { toolKey: 'media-parser', toolClass: 'media', costTier: 'high', trustTier: 'high', canTouchSensitiveData: true, humanApprovalRequired: false },
  { toolKey: 'deployment-engine', toolClass: 'deployment', costTier: 'high', trustTier: 'critical', canTouchSensitiveData: true, humanApprovalRequired: true },
  { toolKey: 'billing-engine', toolClass: 'billing', costTier: 'medium', trustTier: 'critical', canTouchSensitiveData: true, humanApprovalRequired: true },
  { toolKey: 'design-engine', toolClass: 'design', costTier: 'medium', trustTier: 'standard', canTouchSensitiveData: false, humanApprovalRequired: false },
];

export function listToolCapabilities(): PantavionToolCapabilityRecord[] {
  return TOOL_CAPABILITIES.map((item) => cloneValue(item));
}

export function getToolCapabilitySnapshot(): PantavionToolCapabilitySnapshot {
  const list = listToolCapabilities();

  return {
    generatedAt: nowIso(),
    toolCount: list.length,
    criticalTrustCount: list.filter((item) => item.trustTier === 'critical').length,
    sensitiveDataToolCount: list.filter((item) => item.canTouchSensitiveData).length,
    humanApprovalRequiredCount: list.filter((item) => item.humanApprovalRequired).length,
  };
}

export default listToolCapabilities;
