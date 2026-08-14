import { NextResponse } from "next/server";

import {
  type CountryEvidenceStatus,
  listGlobalConnectCountries,
  localizedGlobalConnectCountryName,
} from "@/core/global-connect/country-registry";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const COUNTRY_STATUSES = new Set<CountryEvidenceStatus>([
  "registry-only",
  "research-pending",
  "evidence-partial",
  "reviewed",
  "legally-reviewed",
  "approved-for-production",
  "suspended",
]);

function requestedLocale(value: string | null): string {
  if (!value || value.length > 35) {
    return "en";
  }

  try {
    const canonicalLocales = (
      Intl as typeof Intl & { getCanonicalLocales?: (locales: string | readonly string[]) => string[] }
    ).getCanonicalLocales;
    return canonicalLocales?.(value)[0] || value;
  } catch {
    return "en";
  }
}

function normalizedSearch(value: string | null): string {
  return (value || "").normalize("NFKC").trim().toLocaleLowerCase().slice(0, 100);
}

/**
 * Lists the registry-only 249-entry ledger using localized display names and a
 * locale-aware alphabetical order. It never reports that a country pack is
 * legally reviewed, active, or production-approved unless the stored status
 * says so; the current foundation ledger is registry-only for every entry.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const locale = requestedLocale(url.searchParams.get("locale"));
  const query = normalizedSearch(url.searchParams.get("q"));
  const requestedStatus = url.searchParams.get("status");
  const status = requestedStatus && COUNTRY_STATUSES.has(requestedStatus as CountryEvidenceStatus)
    ? (requestedStatus as CountryEvidenceStatus)
    : null;

  const records = listGlobalConnectCountries(locale)
    .filter((record) => !status || record.status === status)
    .map((record) => {
      const localizedName = localizedGlobalConnectCountryName(record, locale);
      const haystack = [record.isoAlpha2, record.canonicalName, localizedName, ...record.nativeNames]
        .join(" ")
        .toLocaleLowerCase(locale);

      return { record, localizedName, matches: !query || haystack.includes(query) };
    })
    .filter((item) => item.matches)
    .map(({ record, localizedName }) => ({
      isoAlpha2: record.isoAlpha2,
      canonicalName: record.canonicalName,
      localizedName,
      nativeNames: record.nativeNames,
      primaryContinent: record.primaryContinent,
      status: record.status,
      evidence: record.evidence,
    }));

  return NextResponse.json(
    {
      ok: true,
      schema: "pantavion-global-connect-country-registry-v1",
      locale,
      count: records.length,
      records,
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
