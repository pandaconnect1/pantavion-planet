import { NextRequest, NextResponse } from 'next/server';
import {
  GLOBAL_COUNTRY_COUNT,
  listLocalizedCountries,
} from '@/core/global/country-registry';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const locale = request.nextUrl.searchParams.get('locale') || 'en';
  const countries = listLocalizedCountries(locale);

  return NextResponse.json({
    service: 'pantavion-global-connect',
    readiness: 'foundation-partial',
    verifiedAt: new Date().toISOString(),
    countryRegistry: {
      standard: 'ISO-3166-1-alpha-2',
      expectedCount: 249,
      actualCount: GLOBAL_COUNTRY_COUNT,
      complete: GLOBAL_COUNTRY_COUNT === 249,
      defaultEvidenceStatus: 'registry-only',
      locale,
      countries,
    },
    translation: {
      model: 'provider-neutral-two-lane',
      state: 'use-canonical-runtime-health-endpoint',
      canonicalHealthEndpoint: '/api/pantavion/interpreter/health',
      note: 'This endpoint does not claim a translation provider is connected.',
    },
    deviceStrategy: {
      core: 'responsive-web-pwa-progressive-enhancement',
      supportMatrixVerified: false,
      note: 'Platform/browser support remains blocked until the defined device and accessibility matrix is executed.',
    },
    productionPolicy: {
      countrySensitiveFeaturesRequireApproval: true,
      registryPresenceDoesNotEqualLegalApproval: true,
    },
  });
}
