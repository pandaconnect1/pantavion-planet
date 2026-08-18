import { NextRequest, NextResponse } from "next/server";
import { GLOBAL_SOCIAL_SECURITY_INVARIANTS } from "@/core/governance/social-country-pack-contract";
import { getSocialCountryPackRuntimeState } from "@/core/governance/social-country-packs";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const country = request.nextUrl.searchParams.get("country");
  const runtime = getSocialCountryPackRuntimeState(country);

  return NextResponse.json({
    ok: true,
    packId: "SOCIAL-GLOBAL-001",
    researchCutoff: "2026-07-17",
    countryCode: runtime.countryCode,
    countryState: runtime.state,
    runtimeEligible: runtime.runtimeEligible,
    countryPack: runtime.pack,
    globalBaseline: {
      lowData: true,
      offlineDrafts: true,
      storeAndForward: true,
      originalLanguagePreserved: true,
      chronologicalDefault: true,
      explainablePersonalization: true,
      minorsTargetedAds: false,
      accessibilityTarget: "WCAG 2.2 AA",
      privateChatExcludedFromSocialRanking: true,
      emergencyTruthOwnedBySOS: true,
    },
    securityInvariants: GLOBAL_SOCIAL_SECURITY_INVARIANTS,
    truth: runtime.pack
      ? "Country pack is recovered and reviewed; full VERIFIED_LIVE still requires production UI journey and policy acceptance tests."
      : "Country pack is research-pending. Global invariants remain active, but no country-specific legal behavior is claimed.",
  });
}
