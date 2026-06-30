import { NextRequest, NextResponse } from "next/server";
import {
  assessPantavionStartupBuilderRequest,
  listPantavionStartupBuilderStack,
  type PantavionStartupActionClass,
  type PantavionStartupBuilderRequestInput,
  type PantavionStartupDomain
} from "@/core/startup/startup-builder-stack";
import { appendPantavionStartupBuilderAudit } from "@/core/startup/startup-builder-audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeDomain(value: unknown): PantavionStartupDomain {
  const allowed: PantavionStartupDomain[] = [
    "ideation",
    "market_research",
    "business_model",
    "product_planning",
    "coding",
    "deployment",
    "legal",
    "finance",
    "brand_content",
    "sales_outreach",
    "ops_support",
    "analytics_growth",
    "workspace_agents",
    "unknown"
  ];

  return allowed.includes(value as PantavionStartupDomain)
    ? (value as PantavionStartupDomain)
    : "unknown";
}

function normalizeActionClass(value: unknown): PantavionStartupActionClass {
  const allowed: PantavionStartupActionClass[] = [
    "plan_only",
    "research",
    "generate_document",
    "write_code",
    "change_repo",
    "deploy",
    "send_external_message",
    "legal_review",
    "billing_finance",
    "auth_user_access",
    "provider_integration",
    "unknown"
  ];

  return allowed.includes(value as PantavionStartupActionClass)
    ? (value as PantavionStartupActionClass)
    : "unknown";
}

export async function GET() {
  const actor = "api:kernel:startup-builder-stack:get";
  const stack = listPantavionStartupBuilderStack();

  await appendPantavionStartupBuilderAudit({
    event: "startup.builder.stack.read",
    actor,
    createdAt: new Date().toISOString()
  });

  return NextResponse.json({
    ok: true,
    capability: "pantavion_startup_builder_stack_registry",
    status: "internal",
    stack,
    policy: {
      realCapability:
        "Every startup builder capability must declare status, provider/adapter state, risk zone, audit, and execution gates.",
      noFakeUi:
        "No fake/static/UI-only company builder capability may be presented as live execution.",
      approvals:
        "Repo, deploy, legal, auth, billing, secrets, source-truth, provider integration, external send, analytics, and production actions require founder approval."
    }
  });
}

export async function POST(request: NextRequest) {
  const actor = "api:kernel:startup-builder-stack:post";
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  const startupRequest: PantavionStartupBuilderRequestInput = {
    capabilityId: typeof body?.capabilityId === "string" ? body.capabilityId : undefined,
    domain: normalizeDomain(body?.domain),
    actionClass: normalizeActionClass(body?.actionClass),
    target: typeof body?.target === "string" ? body.target : undefined,
    useCase: typeof body?.useCase === "string" ? body.useCase : undefined,
    production: Boolean(body?.production),
    touchesRepo: Boolean(body?.touchesRepo),
    touchesAuth: Boolean(body?.touchesAuth),
    touchesBilling: Boolean(body?.touchesBilling),
    touchesLegal: Boolean(body?.touchesLegal),
    touchesSecrets: Boolean(body?.touchesSecrets),
    sendsExternalMessage: Boolean(body?.sendsExternalMessage),
    providerName: typeof body?.providerName === "string" ? body.providerName : undefined,
    founderApproved: Boolean(body?.founderApproved),
    actor: typeof body?.actor === "string" ? body.actor : actor
  };

  const assessment = assessPantavionStartupBuilderRequest(startupRequest);

  await appendPantavionStartupBuilderAudit({
    event: "startup.builder.request.assessed",
    actor: startupRequest.actor ?? actor,
    createdAt: new Date().toISOString(),
    request: startupRequest,
    assessment
  });

  return NextResponse.json({
    ok: true,
    assessment
  });
}
