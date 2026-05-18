import { NextRequest, NextResponse } from "next/server";
import {
  createPantavionImplementationPlan,
  type PantavionImplementationRequest,
  type PantavionImplementationSurface,
} from "@/core/kernel/pantavion-implementation-engine";

export const dynamic = "force-dynamic";

const allowedSurfaces: PantavionImplementationSurface[] = [
  "kernel",
  "api",
  "app_route",
  "admin",
  "sos",
  "water",
  "translation",
  "marketplace",
  "social",
  "ai",
  "docs",
];

type ImplementationPlanBody = {
  id?: unknown;
  title?: unknown;
  founderIntent?: unknown;
  targetFiles?: unknown;
  surfaces?: unknown;
  requiresRuntimeBehavior?: unknown;
  requiresFounderApproval?: unknown;
  touchesSensitiveData?: unknown;
  touchesProductionAccess?: unknown;
  visibleUserInterface?: unknown;
  hasBackendOrRoute?: unknown;
  hasAudit?: unknown;
  hasBuildVerification?: unknown;
};

function text(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : fallback;
}

function boolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function stringList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function isSurface(value: string): value is PantavionImplementationSurface {
  return allowedSurfaces.includes(value as PantavionImplementationSurface);
}

function surfaceList(value: unknown): PantavionImplementationSurface[] {
  const surfaces = stringList(value).filter(isSurface);

  return surfaces.length > 0 ? surfaces : ["kernel"];
}

function createRequestFromBody(body: ImplementationPlanBody): PantavionImplementationRequest {
  const targetFiles = stringList(body.targetFiles);
  const requiresRuntimeBehavior = boolean(body.requiresRuntimeBehavior, true);
  const hasBackendOrRoute = boolean(body.hasBackendOrRoute, true);

  return {
    id: text(body.id, `implementation-${Date.now()}`),
    title: text(body.title, "Pantavion implementation request"),
    founderIntent: text(body.founderIntent, "No founder intent provided."),
    targetFiles,
    surfaces: surfaceList(body.surfaces),
    requiresRuntimeBehavior,
    requiresFounderApproval: boolean(body.requiresFounderApproval, false),
    touchesSensitiveData: boolean(body.touchesSensitiveData, false),
    touchesProductionAccess: boolean(body.touchesProductionAccess, false),
    visibleUserInterface: boolean(body.visibleUserInterface, false),
    hasBackendOrRoute,
    hasAudit: boolean(body.hasAudit, false),
    hasBuildVerification: boolean(body.hasBuildVerification, false),
  };
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/pantavion/implementation-plan",
    purpose:
      "Convert founder intent into a Pantavion implementation plan with scoped files, risk findings, approval boundaries, and verification commands.",
    accepts: {
      method: "POST",
      body: {
        founderIntent: "string",
        targetFiles: "string[]",
        surfaces: allowedSurfaces,
        requiresRuntimeBehavior: "boolean",
        requiresFounderApproval: "boolean",
        touchesSensitiveData: "boolean",
        touchesProductionAccess: "boolean",
        visibleUserInterface: "boolean",
        hasBackendOrRoute: "boolean",
        hasAudit: "boolean",
        hasBuildVerification: "boolean",
      },
    },
  });
}

export async function POST(request: NextRequest) {
  let body: ImplementationPlanBody;

  try {
    body = (await request.json()) as ImplementationPlanBody;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid JSON body.",
      },
      { status: 400 },
    );
  }

  const implementationRequest = createRequestFromBody(body);
  const plan = createPantavionImplementationPlan(implementationRequest);

  return NextResponse.json({
    ok: true,
    route: "/api/pantavion/implementation-plan",
    runtime: true,
    generatedAt: new Date().toISOString(),
    request: implementationRequest,
    plan,
  });
}
