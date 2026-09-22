import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { planAdaptiveCapability } from "@/core/sovereign/adaptive-capability-fabric";

export const dynamic = "force-dynamic";

type ExecuteBody = {
  intent?: string;
  input?: string;
  desiredOutcome?: string;
  locale?: string;
  targetLocale?: string;
  jurisdiction?: string;
  maxCost?: number;
  deadlineAt?: string;
};

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "X-Pantavion-Truth": "adaptive-plan-not-production-mutation",
    },
  });
}

export async function GET() {
  return json({
    ok: true,
    service: "pantai-execute",
    route: "/api/pantai/execute",
    status: "adaptive_planning_online",
    runtime: "pantavion_adaptive_capability_fabric_v1",
    executionBoundary: {
      productionMutation: false,
      durableExecutionRequiredForBuilds: true,
      verifiedLiveRequiredBeforeUserReadyClaim: true,
    },
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return json(
      {
        ok: false,
        error: "authentication_required",
        execution: {
          status: "blocked",
          productionMutation: false,
        },
      },
      401,
    );
  }

  let body: ExecuteBody = {};
  try {
    body = (await request.json()) as ExecuteBody;
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }

  const intent = String(body.intent || body.input || "").trim();
  const desiredOutcome = String(body.desiredOutcome || intent).trim();

  if (!intent || !desiredOutcome) {
    return json({ ok: false, error: "intent_required" }, 400);
  }

  if (intent.length > 20_000 || desiredOutcome.length > 20_000) {
    return json({ ok: false, error: "intent_too_large" }, 413);
  }

  const plan = planAdaptiveCapability({
    intentId: crypto.randomUUID(),
    userId: user.id,
    text: intent,
    desiredOutcome,
    locale: body.locale || null,
    targetLocale: body.targetLocale || null,
    jurisdiction: body.jurisdiction || null,
    // Never accept authorization scopes from the client.
    // This planning surface receives read-only authority; execution authority is resolved separately.
    actorScopes: ["read"],
    maxCost:
      typeof body.maxCost === "number" && Number.isFinite(body.maxCost)
        ? Math.max(0, body.maxCost)
        : undefined,
    deadlineAt: body.deadlineAt,
  });

  return json({
    ok: true,
    service: "pantai-execute",
    route: "/api/pantai/execute",
    execution: {
      status: plan.outcomePlan.state,
      mode: "adaptive_capability_planning",
      productionMutation: false,
      requiresOwnerApproval: plan.outcomePlan.requiresOwnerApproval,
      disposition: plan.disposition,
      risk: plan.risk,
    },
    plan,
    timestamp: new Date().toISOString(),
  });
}
