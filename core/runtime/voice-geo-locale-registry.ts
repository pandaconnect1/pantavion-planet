// core/runtime/voice-geo-locale-registry.ts

export interface PantavionVoiceCityLocaleProfile {
  cityKey: string;
  cityName: string;
  countryCode: string;
  naturalLocales: string[];
  officialLocales: string[];
  bridgeFallbackLocales: string[];
}

export interface PantavionVoiceCountryLocaleProfile {
  countryCode: string;
  countryName: string;
  officialLocales: string[];
  bridgeFallbackLocales: string[];
}

export interface PantavionVoiceGeoRegistrySnapshot {
  generatedAt: string;
  cityProfileCount: number;
  countryProfileCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

const CITY_PROFILES: PantavionVoiceCityLocaleProfile[] = [
  {
    cityKey: 'athens-gr',
    cityName: 'Athens',
    countryCode: 'GR',
    naturalLocales: ['el-GR'],
    officialLocales: ['el-GR'],
    bridgeFallbackLocales: ['en-US'],
  },
  {
    cityKey: 'thessaloniki-gr',
    cityName: 'Thessaloniki',
    countryCode: 'GR',
    naturalLocales: ['el-GR'],
    officialLocales: ['el-GR'],
    bridgeFallbackLocales: ['en-US'],
  },
  {
    cityKey: 'barcelona-es',
    cityName: 'Barcelona',
    countryCode: 'ES',
    naturalLocales: ['ca-ES', 'es-ES'],
    officialLocales: ['es-ES'],
    bridgeFallbackLocales: ['en-US'],
  },
  {
    cityKey: 'montreal-ca',
    cityName: 'Montreal',
    countryCode: 'CA',
    naturalLocales: ['fr-CA', 'en-CA'],
    officialLocales: ['fr-CA', 'en-CA'],
    bridgeFallbackLocales: ['en-US'],
  },
  {
    cityKey: 'brussels-be',
    cityName: 'Brussels',
    countryCode: 'BE',
    naturalLocales: ['fr-BE', 'nl-BE'],
    officialLocales: ['fr-BE', 'nl-BE', 'de-BE'],
    bridgeFallbackLocales: ['en-US'],
  },
  {
    cityKey: 'istanbul-tr',
    cityName: 'Istanbul',
    countryCode: 'TR',
    naturalLocales: ['tr-TR'],
    officialLocales: ['tr-TR'],
    bridgeFallbackLocales: ['en-US'],
  },
  {
    cityKey: 'tokyo-jp',
    cityName: 'Tokyo',
    countryCode: 'JP',
    naturalLocales: ['ja-JP'],
    officialLocales: ['ja-JP'],
    bridgeFallbackLocales: ['en-US'],
  },
  {
    cityKey: 'seoul-kr',
    cityName: 'Seoul',
    countryCode: 'KR',
    naturalLocales: ['ko-KR'],
    officialLocales: ['ko-KR'],
    bridgeFallbackLocales: ['en-US'],
  },
  {
    cityKey: 'cairo-eg',
    cityName: 'Cairo',
    countryCode: 'EG',
    naturalLocales: ['ar-EG'],
    officialLocales: ['ar-EG'],
    bridgeFallbackLocales: ['en-US'],
  },
  {
    cityKey: 'sao-paulo-br',
    cityName: 'Sao Paulo',
    countryCode: 'BR',
    naturalLocales: ['pt-BR'],
    officialLocales: ['pt-BR'],
    bridgeFallbackLocales: ['en-US'],
  },
];

const COUNTRY_PROFILES: PantavionVoiceCountryLocaleProfile[] = [
  { countryCode: 'GR', countryName: 'Greece', officialLocales: ['el-GR'], bridgeFallbackLocales: ['en-US'] },
  { countryCode: 'ES', countryName: 'Spain', officialLocales: ['es-ES'], bridgeFallbackLocales: ['en-US'] },
  { countryCode: 'CA', countryName: 'Canada', officialLocales: ['en-CA', 'fr-CA'], bridgeFallbackLocales: ['en-US'] },
  { countryCode: 'BE', countryName: 'Belgium', officialLocales: ['fr-BE', 'nl-BE', 'de-BE'], bridgeFallbackLocales: ['en-US'] },
  { countryCode: 'TR', countryName: 'Turkey', officialLocales: ['tr-TR'], bridgeFallbackLocales: ['en-US'] },
  { countryCode: 'JP', countryName: 'Japan', officialLocales: ['ja-JP'], bridgeFallbackLocales: ['en-US'] },
  { countryCode: 'KR', countryName: 'South Korea', officialLocales: ['ko-KR'], bridgeFallbackLocales: ['en-US'] },
  { countryCode: 'EG', countryName: 'Egypt', officialLocales: ['ar-EG'], bridgeFallbackLocales: ['en-US'] },
  { countryCode: 'BR', countryName: 'Brazil', officialLocales: ['pt-BR'], bridgeFallbackLocales: ['en-US'] },
  { countryCode: 'DE', countryName: 'Germany', officialLocales: ['de-DE'], bridgeFallbackLocales: ['en-US'] },
  { countryCode: 'FR', countryName: 'France', officialLocales: ['fr-FR'], bridgeFallbackLocales: ['en-US'] },
  { countryCode: 'IT', countryName: 'Italy', officialLocales: ['it-IT'], bridgeFallbackLocales: ['en-US'] },
  { countryCode: 'US', countryName: 'United States', officialLocales: ['en-US'], bridgeFallbackLocales: ['en-US'] },
  { countryCode: 'GB', countryName: 'United Kingdom', officialLocales: ['en-GB'], bridgeFallbackLocales: ['en-US'] },
  { countryCode: 'CN', countryName: 'China', officialLocales: ['zh-CN'], bridgeFallbackLocales: ['en-US'] },
  { countryCode: 'UA', countryName: 'Ukraine', officialLocales: ['uk-UA'], bridgeFallbackLocales: ['en-US'] },
  { countryCode: 'RU', countryName: 'Russia', officialLocales: ['ru-RU'], bridgeFallbackLocales: ['en-US'] },
  { countryCode: 'IN', countryName: 'India', officialLocales: ['hi-IN', 'en-IN'], bridgeFallbackLocales: ['en-US'] },
  { countryCode: 'ID', countryName: 'Indonesia', officialLocales: ['id-ID'], bridgeFallbackLocales: ['en-US'] },
];

export function getVoiceCityLocaleProfile(cityKey?: string): PantavionVoiceCityLocaleProfile | null {
  if (!cityKey) {
    return null;
  }

  const normalized = cityKey.trim().toLowerCase();
  const item = CITY_PROFILES.find((profile) => profile.cityKey.toLowerCase() === normalized);
  return item ? (JSON.parse(JSON.stringify(item)) as PantavionVoiceCityLocaleProfile) : null;
}

export function getVoiceCountryLocaleProfile(countryCode?: string): PantavionVoiceCountryLocaleProfile | null {
  if (!countryCode) {
    return null;
  }

  const normalized = countryCode.trim().toUpperCase();
  const item = COUNTRY_PROFILES.find((profile) => profile.countryCode === normalized);
  return item ? (JSON.parse(JSON.stringify(item)) as PantavionVoiceCountryLocaleProfile) : null;
}

export function getVoiceGeoRegistrySnapshot(): PantavionVoiceGeoRegistrySnapshot {
  return {
    generatedAt: nowIso(),
    cityProfileCount: CITY_PROFILES.length,
    countryProfileCount: COUNTRY_PROFILES.length,
  };
}
