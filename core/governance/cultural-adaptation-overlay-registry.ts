// core/governance/cultural-adaptation-overlay-registry.ts

export type PantavionCulturalSensitivity =
  | 'standard'
  | 'high'
  | 'critical';

export interface PantavionCulturalAdaptationOverlayRecord {
  overlayKey: string;
  localeKey: string;
  region: string;
  religiousSensitivity: PantavionCulturalSensitivity;
  institutionalSensitivity: PantavionCulturalSensitivity;
  familyContextSensitivity: PantavionCulturalSensitivity;
  escalationPreference: 'normal' | 'high-human-escalation';
  notes: string[];
}

export interface PantavionCulturalAdaptationOverlaySnapshot {
  generatedAt: string;
  overlayCount: number;
  criticalReligiousSensitivityCount: number;
  criticalInstitutionalSensitivityCount: number;
  highHumanEscalationCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const CULTURAL_OVERLAYS: PantavionCulturalAdaptationOverlayRecord[] = [
  {
    overlayKey: 'overlay-el-GR',
    localeKey: 'el-GR',
    region: 'europe',
    religiousSensitivity: 'high',
    institutionalSensitivity: 'high',
    familyContextSensitivity: 'high',
    escalationPreference: 'high-human-escalation',
    notes: ['Greek locale should preserve respectful cultural and relational tone.'],
  },
  {
    overlayKey: 'overlay-en-US',
    localeKey: 'en-US',
    region: 'north-america',
    religiousSensitivity: 'standard',
    institutionalSensitivity: 'high',
    familyContextSensitivity: 'standard',
    escalationPreference: 'normal',
    notes: ['Global default backbone locale with strong institutional clarity.'],
  },
  {
    overlayKey: 'overlay-ar-SA',
    localeKey: 'ar-SA',
    region: 'mena',
    religiousSensitivity: 'critical',
    institutionalSensitivity: 'high',
    familyContextSensitivity: 'high',
    escalationPreference: 'high-human-escalation',
    notes: ['Requires strong religious and cultural respect posture.'],
  },
  {
    overlayKey: 'overlay-hi-IN',
    localeKey: 'hi-IN',
    region: 'asia',
    religiousSensitivity: 'high',
    institutionalSensitivity: 'high',
    familyContextSensitivity: 'high',
    escalationPreference: 'high-human-escalation',
    notes: ['Requires multilingual and socially nuanced contextual adaptation.'],
  },
  {
    overlayKey: 'overlay-ja-JP',
    localeKey: 'ja-JP',
    region: 'asia',
    religiousSensitivity: 'standard',
    institutionalSensitivity: 'high',
    familyContextSensitivity: 'high',
    escalationPreference: 'normal',
    notes: ['Precision and respect posture must remain consistently high.'],
  },
  {
    overlayKey: 'overlay-ru-RU',
    localeKey: 'ru-RU',
    region: 'eurasia',
    religiousSensitivity: 'high',
    institutionalSensitivity: 'critical',
    familyContextSensitivity: 'high',
    escalationPreference: 'high-human-escalation',
    notes: ['Institutional and sovereign sensitivity should remain elevated.'],
  },
];

export function listCulturalAdaptationOverlays(): PantavionCulturalAdaptationOverlayRecord[] {
  return CULTURAL_OVERLAYS.map((item) => cloneValue(item));
}

export function getCulturalAdaptationOverlaySnapshot(): PantavionCulturalAdaptationOverlaySnapshot {
  const list = listCulturalAdaptationOverlays();

  return {
    generatedAt: nowIso(),
    overlayCount: list.length,
    criticalReligiousSensitivityCount: list.filter((item) => item.religiousSensitivity === 'critical').length,
    criticalInstitutionalSensitivityCount: list.filter((item) => item.institutionalSensitivity === 'critical').length,
    highHumanEscalationCount: list.filter((item) => item.escalationPreference === 'high-human-escalation').length,
  };
}

export default listCulturalAdaptationOverlays;
