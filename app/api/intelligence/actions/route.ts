// app/api/intelligence/actions/route.ts

import { NextResponse } from "next/server";
import * as ActionEngine from "../../../../core/intelligence/panta-ai-action-engine";
import * as Admission from "../../../../core/intelligence/panta-ai-kernel-admission";
import * as VisibleSurface from "../../../../core/public-surface/panta-ai-visible-surface";

type UnknownRecord = Record<string, unknown>;

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const capabilityKey = url.searchParams.get("capability");

  const surfaces = getCapabilitySurfaces();

  if (capabilityKey) {
    const surface = surfaces.find((item) => getString(item, "key") === capabilityKey);

    if (!surface) {
      return NextResponse.json(
        {
          ok: false,
          error: "PantaAI capability was not found.",
          capabilityKey,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      surface,
      admission: createAdmissionPacket({
        capabilityKey,
        userGoal: `Inspect capability ${capabilityKey}`,
        source: "api:get",
      }),
    });
  }

  return NextResponse.json({
    ok: true,
    summary: {
      title: "PantaAI Action Gateway",
      mission:
        "A governed Pantavion intelligence gateway that turns scattered AI tools into capability families.",
      surfaceCount: surfaces.length,
      capabilityFamilies: Array.from(
        new Set(
          surfaces.flatMap((surface) =>
            getArray(surface, "internalCapabilityFamilies")
          )
        )
      ).sort(),
    },
    surfaces,
  });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as UnknownRecord;

  const capabilityKey = getString(body, "capabilityKey", "general-ai-assistance");
  const userGoal = getString(body, "userGoal", "Use PantaAI capability");

  const actionPacket = createActionPacket({
    capabilityKey,
    userGoal,
    userContext: body.userContext ?? null,
    requestedMode: body.requestedMode ?? "guided",
    actorId: body.actorId ?? "anonymous",
    locale: body.locale ?? "en",
    source: "api:post",
  });

  const admissionPacket = createAdmissionPacket({
    capabilityKey,
    userGoal,
    actionPacket,
    source: "api:post",
  });

  return NextResponse.json({
    ok: true,
    capabilityKey,
    userGoal,
    actionPacket,
    admissionPacket,
  });
}

function getCapabilitySurfaces(): UnknownRecord[] {
  const fromActionEngine = callArrayExport(ActionEngine, [
    "getPantaAIActionSurfaces",
    "getPantaAICapabilityActions",
    "listPantaAIActions",
  ]);

  if (fromActionEngine.length > 0) {
    return fromActionEngine;
  }

  const fromVisibleSurface = callArrayExport(VisibleSurface, [
    "getPantaAIVisibleSurfaceCards",
    "getPantaAIPublicSurfaceCards",
    "getPantaAIPublicSurfaceSpec",
  ]);

  if (fromVisibleSurface.length > 0) {
    return fromVisibleSurface;
  }

  return [];
}

function createActionPacket(input: UnknownRecord): UnknownRecord {
  const fn = getFirstFunction(ActionEngine, [
    "createPantaAIActionPacket",
    "runPantaAIAction",
    "createActionPacket",
    "buildPantaAIActionPacket",
  ]);

  if (fn) {
    return asRecord(fn(input));
  }

  return {
    id: `pantaai_action_${Date.now()}`,
    status: "created",
    mode: "fallback-action-packet",
    capabilityKey: input.capabilityKey,
    userGoal: input.userGoal,
    kernelLane: "prime-kernel",
    executionPosture: "governed",
    workingPlan: [
      "Resolve the user goal.",
      "Match the goal to a Pantavion capability family.",
      "Apply access, safety, legal and truth boundaries.",
      "Route through the Prime Kernel before execution.",
    ],
    auditNotes: [
      "Fallback packet used because no exported action packet factory was found.",
      "This route is real and ready for engine export alignment.",
    ],
  };
}

function createAdmissionPacket(input: UnknownRecord): UnknownRecord {
  const fn = getFirstFunction(Admission, [
    "createPantaAIKernelAdmissionPacket",
    "admitPantaAIAction",
    "createAdmissionPacket",
    "buildPantaAIKernelAdmission",
  ]);

  if (fn) {
    return asRecord(fn(input));
  }

  return {
    id: `pantaai_admission_${Date.now()}`,
    status: "admitted-for-kernel-review",
    capabilityKey: input.capabilityKey,
    userGoal: input.userGoal,
    kernelRoute: "prime-kernel.intelligence.panta-ai",
    gates: [
      "capability-resolution",
      "policy-check",
      "truth-boundary-check",
      "execution-routing",
      "audit-log",
    ],
  };
}

function callArrayExport(source: unknown, names: string[]): UnknownRecord[] {
  const fn = getFirstFunction(source, names);
  if (!fn) return [];

  const result = fn();

  if (Array.isArray(result)) {
    return result.map(asRecord);
  }

  const record = asRecord(result);
  const cards = record.cards;
  if (Array.isArray(cards)) {
    return cards.map(asRecord);
  }

  return [];
}

function getFirstFunction(source: unknown, names: string[]): ((input?: unknown) => unknown) | null {
  const record = asRecord(source);

  for (const name of names) {
    const candidate = record[name];
    if (typeof candidate === "function") {
      return candidate as (input?: unknown) => unknown;
    }
  }

  return null;
}

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" ? (value as UnknownRecord) : {};
}

function getString(record: UnknownRecord, key: string, fallback = ""): string {
  const value = record[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function getArray(record: UnknownRecord, key: string): string[] {
  const value = record[key];
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}
