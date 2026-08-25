import { NextResponse } from "next/server";
import {
  pantavionYouthCapabilityDefinitions,
  resolvePantavionYouthCapability,
  type PantavionYouthCapability,
} from "@/core/governance/youth-capability-benefit-engine";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CAPABILITIES = Object.keys(pantavionYouthCapabilityDefinitions) as PantavionYouthCapability[];

function parseAge(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const age = Number(value);
  if (!Number.isInteger(age) || age < 0 || age > 130) throw new Error("invalid age");
  return age;
}

function parseCountry(value: unknown): string {
  const country = String(value ?? "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(country)) throw new Error("invalid country");
  return country;
}

function parseCapability(value: unknown): PantavionYouthCapability {
  const capability = String(value ?? "") as PantavionYouthCapability;
  if (!CAPABILITIES.includes(capability)) throw new Error("invalid capability");
  return capability;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const countryCode = parseCountry(url.searchParams.get("country") || "CY");
    const age = parseAge(url.searchParams.get("age"));
    const capabilityParam = url.searchParams.get("capability");
    const guardianConsent = url.searchParams.get("guardianConsent") === "true";

    if (capabilityParam) {
      const capability = parseCapability(capabilityParam);
      return NextResponse.json({
        ok: true,
        contract: "pantavion-youth-policy-v1",
        decision: resolvePantavionYouthCapability({ countryCode, age, capability, guardianConsent }),
      });
    }

    return NextResponse.json({
      ok: true,
      contract: "pantavion-youth-policy-v1",
      countryCode,
      age,
      decisions: CAPABILITIES.map((capability) =>
        resolvePantavionYouthCapability({ countryCode, age, capability, guardianConsent }),
      ),
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "invalid request" },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const countryCode = parseCountry(body.countryCode ?? body.country ?? "CY");
    const age = parseAge(body.age);
    const capability = parseCapability(body.capability);
    const guardianConsent = body.guardianConsent === true;
    const ageProof = body.ageProof && typeof body.ageProof === "object"
      ? {
          verified: body.ageProof.verified === true,
          minimumAgeProven: Number.isInteger(body.ageProof.minimumAgeProven)
            ? body.ageProof.minimumAgeProven
            : undefined,
        }
      : undefined;

    return NextResponse.json({
      ok: true,
      contract: "pantavion-youth-policy-v1",
      decision: resolvePantavionYouthCapability({
        countryCode,
        age,
        capability,
        guardianConsent,
        ageProof,
      }),
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "invalid request" },
      { status: 400 },
    );
  }
}
