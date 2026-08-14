import { NextResponse } from "next/server";
import countries from "@/data/global/countries.iso3166.json";

export const dynamic = "force-dynamic";

type CountryTuple = [string, string, string, string];

export async function GET() {
  const rows = countries as CountryTuple[];
  const uniqueAlpha2 = new Set(rows.map(([alpha2]) => alpha2));
  const uniqueAlpha3 = new Set(rows.map(([, alpha3]) => alpha3));

  return NextResponse.json({
    ok: true,
    capability: "global-connect-foundation",
    readiness: "contract-and-migration-only",
    deploymentClaim: false,
    identity: {
      authProvider: "existing-supabase-auth",
      webauthnContract: true,
      providerNeutralPersistenceMigration: true,
      securityReviewComplete: false,
    },
    devicesAndSessions: {
      capabilitySnapshotContract: true,
      persistenceMigration: true,
      testedDeviceMatrix: false,
    },
    translation: {
      twoLaneContract: true,
      immutableOriginalContract: true,
      providerConnected: false,
      liveTranslationClaim: false,
    },
    countries: {
      entries: rows.length,
      uniqueAlpha2: uniqueAlpha2.size,
      uniqueAlpha3: uniqueAlpha3.size,
      expectedEntries: 249,
      evidenceDefault: "registry-only",
      nativeNamesComplete: false,
      continentAssignmentsComplete: false,
      jurisdictionApprovalImplied: false,
    },
    continents: [
      "Africa",
      "Antarctica",
      "Asia",
      "Europe",
      "North America",
      "Oceania",
      "South America",
    ],
  });
}
