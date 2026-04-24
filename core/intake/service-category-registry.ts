// core/intake/service-category-registry.ts

export interface PantavionServiceCategoryRecord {
  categoryKey: string;
  title: string;
  serviceType: 'daily-life' | 'translation' | 'safety' | 'premium' | 'production';
  paidEligible: boolean;
  emergencyLinked: boolean;
  humanAssistRecommended: boolean;
}

export interface PantavionServiceCategorySnapshot {
  generatedAt: string;
  categoryCount: number;
  paidEligibleCount: number;
  emergencyLinkedCount: number;
  humanAssistRecommendedCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const SERVICE_CATEGORIES: PantavionServiceCategoryRecord[] = [
  { categoryKey: 'translation-service', title: 'Translation Service', serviceType: 'translation', paidEligible: true, emergencyLinked: true, humanAssistRecommended: false },
  { categoryKey: 'community-services', title: 'Community Services', serviceType: 'daily-life', paidEligible: false, emergencyLinked: false, humanAssistRecommended: true },
  { categoryKey: 'sos-guidance', title: 'SOS Guidance', serviceType: 'safety', paidEligible: false, emergencyLinked: true, humanAssistRecommended: true },
  { categoryKey: 'elite-concierge', title: 'Elite Concierge', serviceType: 'premium', paidEligible: true, emergencyLinked: false, humanAssistRecommended: true },
  { categoryKey: 'app-production-service', title: 'App Production Service', serviceType: 'production', paidEligible: true, emergencyLinked: false, humanAssistRecommended: true },
];

export function listServiceCategories(): PantavionServiceCategoryRecord[] {
  return SERVICE_CATEGORIES.map((item) => cloneValue(item));
}

export function getServiceCategorySnapshot(): PantavionServiceCategorySnapshot {
  const list = listServiceCategories();

  return {
    generatedAt: nowIso(),
    categoryCount: list.length,
    paidEligibleCount: list.filter((item) => item.paidEligible).length,
    emergencyLinkedCount: list.filter((item) => item.emergencyLinked).length,
    humanAssistRecommendedCount: list.filter((item) => item.humanAssistRecommended).length,
  };
}

export default listServiceCategories;
