import { NextResponse } from "next/server";

import { globalConnectCountryRegistryMetrics } from "@/core/global-connect/country-registry";
import { globalConnectReadinessSnapshot } from "@/core/global-connect/foundation-contract";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

/**
 * Read-only, local readiness declaration. It deliberately avoids a database or
 * provider probe: this branch must not turn an inspection endpoint into an
 * external provider call, migration, deployment, or production claim.
 */
export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      schema: "pantavion-global-connect-foundation-contract-v1",
      readiness: globalConnectReadinessSnapshot(),
      countryRegistry: globalConnectCountryRegistryMetrics(),
      translation: {
        state: "provider_pending",
        externalProviderCalledByThisEndpoint: false,
        privateContentDispatch: "blocked_without_recorded_consent_and_approved_policy",
        sosMachineTranslation: "blocked_in_foundation_contract",
      },
      database: {
        migrationState: "not_applied_by_this_branch",
        liveConnectivityChecked: false,
      },
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
