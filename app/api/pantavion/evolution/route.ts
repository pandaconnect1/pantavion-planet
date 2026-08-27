import { NextResponse } from "next/server";
import {
  analyzePantavionTechnologySignal,
  createPantavionEvolutionReport,
  type PantavionTechnologySignalInput,
} from "@/core/kernel/pantavion-evolution-engine";
import { pantavionCurrentTechnologySignals } from "@/core/kernel/pantavion-evolution-current-signals";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseSignal(value: unknown): PantavionTechnologySignalInput {
  if (!isObject(value)) throw new Error("signal_required");

  const requiredStrings = ["id", "title", "summary", "domain", "eventType", "observedAt"] as const;
  for (const key of requiredStrings) {
    if (typeof value[key] !== "string" || value[key].trim().length === 0) {
      throw new Error(`invalid_${key}`);
    }
  }

  const requiredScores = [
    "productionRelevance",
    "humanBenefitPotential",
    "noveltyPotential",
    "riskIfIgnored",
    "reversibility",
  ] as const;
  for (const key of requiredScores) {
    if (typeof value[key] !== "number" || !Number.isFinite(value[key])) {
      throw new Error(`invalid_${key}`);
    }
  }

  if (!Array.isArray(value.evidence) || value.evidence.length === 0) {
    throw new Error("evidence_required");
  }

  return value as unknown as PantavionTechnologySignalInput;
}

export async function GET() {
  const report = createPantavionEvolutionReport();
  const signals = pantavionCurrentTechnologySignals.map((signal) => ({
    signal,
    decision: analyzePantavionTechnologySignal(signal),
  }));

  return NextResponse.json({
    ok: true,
    contract: "pantavion-evolution-intelligence-v2",
    report,
    currentSignals: signals,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const signal = parseSignal(isObject(body) && "signal" in body ? body.signal : body);
    const decision = analyzePantavionTechnologySignal(signal);

    return NextResponse.json({
      ok: true,
      contract: "pantavion-evolution-intelligence-v2",
      signal,
      decision,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "invalid_signal",
      },
      { status: 400 },
    );
  }
}
