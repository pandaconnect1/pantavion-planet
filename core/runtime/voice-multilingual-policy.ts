// core/runtime/voice-multilingual-policy.ts

import {
  getVoiceBackboneLanguage,
  getVoiceBackboneSnapshot,
} from './voice-language-backbone';

import {
  getVoiceCityLocaleProfile,
  getVoiceCountryLocaleProfile,
  getVoiceGeoRegistrySnapshot,
} from './voice-geo-locale-registry';

import { saveKernelState } from '../storage/kernel-state-store';

export interface PantavionVoiceLocaleResolutionInput {
  explicitUserLocale?: string;
  conversationLocale?: string;
  cityKey?: string;
  countryCode?: string;
  globalFallbackLocale?: string;
}

export interface PantavionVoiceLocaleCandidate {
  locale: string;
  source:
    | 'explicit-user'
    | 'conversation'
    | 'city-natural'
    | 'city-official'
    | 'country-official'
    | 'bridge-fallback'
    | 'global-fallback';
  isBackboneSupported: boolean;
  backboneTier?: string;
  operationalStatus?: string;
}

export interface PantavionVoiceLocaleResolution {
  selectedLocale: string;
  selectedSource: PantavionVoiceLocaleCandidate['source'];
  candidates: PantavionVoiceLocaleCandidate[];
  notes: string[];
}

export interface PantavionMultilingualVoicePolicyOutput {
  generatedAt: string;
  input: PantavionVoiceLocaleResolutionInput;
  resolution: PantavionVoiceLocaleResolution;
  backboneSnapshot: ReturnType<typeof getVoiceBackboneSnapshot>;
  geoSnapshot: ReturnType<typeof getVoiceGeoRegistrySnapshot>;
  rendered: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function uniqStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function toCandidate(
  locale: string,
  source: PantavionVoiceLocaleCandidate['source'],
): PantavionVoiceLocaleCandidate {
  const backbone = getVoiceBackboneLanguage(locale);

  return {
    locale,
    source,
    isBackboneSupported: Boolean(backbone),
    backboneTier: backbone?.tier,
    operationalStatus: backbone?.operationalStatus,
  };
}

function pushCandidates(
  target: PantavionVoiceLocaleCandidate[],
  locales: string[] | undefined,
  source: PantavionVoiceLocaleCandidate['source'],
): void {
  for (const locale of locales ?? []) {
    if (!locale || !locale.trim()) {
      continue;
    }

    if (target.some((item) => item.locale.toLowerCase() === locale.trim().toLowerCase())) {
      continue;
    }

    target.push(toCandidate(locale.trim(), source));
  }
}

export function resolveVoiceLocale(
  input: PantavionVoiceLocaleResolutionInput,
): PantavionVoiceLocaleResolution {
  const city = getVoiceCityLocaleProfile(input.cityKey);
  const country = getVoiceCountryLocaleProfile(input.countryCode ?? city?.countryCode);
  const globalFallbackLocale = input.globalFallbackLocale?.trim() || 'en-US';

  const candidates: PantavionVoiceLocaleCandidate[] = [];

  pushCandidates(candidates, input.explicitUserLocale ? [input.explicitUserLocale] : [], 'explicit-user');
  pushCandidates(candidates, input.conversationLocale ? [input.conversationLocale] : [], 'conversation');
  pushCandidates(candidates, city?.naturalLocales, 'city-natural');
  pushCandidates(candidates, city?.officialLocales, 'city-official');
  pushCandidates(candidates, country?.officialLocales, 'country-official');
  pushCandidates(candidates, city?.bridgeFallbackLocales, 'bridge-fallback');
  pushCandidates(candidates, country?.bridgeFallbackLocales, 'bridge-fallback');
  pushCandidates(candidates, [globalFallbackLocale], 'global-fallback');

  const selected = candidates[0] ?? toCandidate(globalFallbackLocale, 'global-fallback');

  const notes = uniqStrings([
    input.explicitUserLocale ? 'Explicit user locale has highest priority.' : '',
    input.conversationLocale ? 'Conversation locale remains second priority when present.' : '',
    city ? `City profile detected: ${city.cityName}.` : 'No city profile detected.',
    country ? `Country profile detected: ${country.countryName}.` : 'No country profile detected.',
    selected.isBackboneSupported
      ? `Selected locale ${selected.locale} is inside stable backbone.`
      : `Selected locale ${selected.locale} is outside stable backbone and may use expansion path.`,
  ]);

  return {
    selectedLocale: selected.locale,
    selectedSource: selected.source,
    candidates,
    notes,
  };
}

function renderPolicy(output: PantavionMultilingualVoicePolicyOutput): string {
  return [
    'PANTAVION MULTILINGUAL VOICE POLICY',
    `generatedAt=${output.generatedAt}`,
    `selectedLocale=${output.resolution.selectedLocale}`,
    `selectedSource=${output.resolution.selectedSource}`,
    `candidateCount=${output.resolution.candidates.length}`,
    `backboneCount=${output.backboneSnapshot.count}`,
    `cityProfileCount=${output.geoSnapshot.cityProfileCount}`,
    `countryProfileCount=${output.geoSnapshot.countryProfileCount}`,
    '',
    'CANDIDATES',
    ...output.resolution.candidates.map((item) =>
      `- locale=${item.locale} source=${item.source} backbone=${item.isBackboneSupported ? 'yes' : 'no'} status=${item.operationalStatus ?? 'expansion'}`
    ),
    '',
    'NOTES',
    ...output.resolution.notes.map((item) => `- ${item}`),
  ].join('\n');
}

export function runMultilingualVoicePolicy(
  input: PantavionVoiceLocaleResolutionInput,
): PantavionMultilingualVoicePolicyOutput {
  const resolution = resolveVoiceLocale(input);
  const backboneSnapshot = getVoiceBackboneSnapshot();
  const geoSnapshot = getVoiceGeoRegistrySnapshot();

  const output: PantavionMultilingualVoicePolicyOutput = {
    generatedAt: nowIso(),
    input,
    resolution,
    backboneSnapshot,
    geoSnapshot,
    rendered: '',
  };

  output.rendered = renderPolicy(output);

  saveKernelState({
    key: 'runtime.voice.multilingual-policy.latest',
    kind: 'report',
    payload: {
      input,
      resolution,
      backboneSnapshot,
      geoSnapshot,
    },
    tags: ['runtime', 'voice', 'multilingual', 'policy', 'latest'],
    metadata: {
      selectedLocale: resolution.selectedLocale,
      selectedSource: resolution.selectedSource,
      candidateCount: resolution.candidates.length,
    },
  });

  return output;
}

export default runMultilingualVoicePolicy;
