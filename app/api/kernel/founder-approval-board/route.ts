import { NextRequest, NextResponse } from "next/server";
import {
  assessPantavionFounderApprovalRecord,
  type PantavionApprovalActionClass,
  type PantavionApprovalRiskZone,
  type PantavionFounderApprovalDecisionInput,
  type PantavionFounderApprovalRequestInput
} from "@/core/approval/founder-approval-board";
import {
  appendPantavionFounderApprovalAudit,
  createStoredPantavionFounderApprovalRequest,
  decideStoredPantavionFounderApprovalRequest,
  readPantavionFounderApprovalRecords
} from "@/core/approval/founder-approval-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isRiskZone(value: unknown): value is PantavionApprovalRiskZone {
  return value === "Z1" || value === "Z2" || value === "Z3" || value === "Z4";
}

function normalizeRiskZone(value: unknown): PantavionApprovalRiskZone {
  return isRiskZone(value) ? value : "Z3";
}

function normalizeActionClass(value: unknown): PantavionApprovalActionClass {
  const allowed: PantavionApprovalActionClass[] = [
    "dwg_source_truth",
    "cad_gis_conversion",
    "secret_access",
    "auth_user_access",
    "billing_payment",
    "production_deploy",
    "infrastructure_change",
    "legal_compliance",
    "backup_restore",
    "security_sensitive",
    "repo_ci_cd",
    "data_changing",
    "provider_cloud_upload",
    "unknown"
  ];

  return allowed.includes(value as PantavionApprovalActionClass)
    ? (value as PantavionApprovalActionClass)
    : "unknown";
}

export async function GET() {
  const actor = "api:kernel:founder-approval-board:get";
  const records = await readPantavionFounderApprovalRecords();

  await appendPantavionFounderApprovalAudit({
    event: "founder.approval.requests.read",
    actor,
    createdAt: new Date().toISOString()
  });

  return NextResponse.json({
    ok: true,
    capability: "pantavion_founder_approval_board",
    status: "internal",
    records,
    assessments: records.map((record) => assessPantavionFounderApprovalRecord(record)),
    policy: {
      z3z4:
        "Z3/Z4 actions require founder approval before execution.",
      sensitive:
        "DWG/source-truth, secrets, auth, billing, production, infrastructure, legal, backup/restore, CI/CD, provider cloud upload, and data-changing actions require approval.",
      execution:
        "Approval does not bypass build, typecheck, kernel, scoped git add, audit, or deployment guardrails."
    }
  });
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | Partial<PantavionFounderApprovalRequestInput>
    | null;

  if (!body?.title || !body?.requestedBy || !body?.reason) {
    return NextResponse.json(
      {
        ok: false,
        error: "title, requestedBy, and reason are required"
      },
      { status: 400 }
    );
  }

  const approvalRequest: PantavionFounderApprovalRequestInput = {
    title: body.title,
    actionClass: normalizeActionClass(body.actionClass),
    riskZone: normalizeRiskZone(body.riskZone),
    requestedBy: body.requestedBy,
    reason: body.reason,
    target: body.target,
    route: body.route,
    relatedArtifactPath: body.relatedArtifactPath,
    relatedRequestId: body.relatedRequestId,
    proposedAction: body.proposedAction,
    expiresAt: body.expiresAt,
    metadata: body.metadata
  };

  const record = await createStoredPantavionFounderApprovalRequest(approvalRequest);
  const assessment = assessPantavionFounderApprovalRecord(record);

  return NextResponse.json({
    ok: true,
    record,
    assessment
  });
}

export async function PATCH(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | Partial<PantavionFounderApprovalDecisionInput>
    | null;

  if (
    !body?.requestId ||
    !body?.decision ||
    !body?.decidedBy ||
    !body?.reason ||
    !["approved", "rejected", "cancelled"].includes(body.decision)
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: "requestId, valid decision, decidedBy, and reason are required"
      },
      { status: 400 }
    );
  }

  try {
    const decisionRequest: PantavionFounderApprovalDecisionInput = {
      requestId: body.requestId,
      decision: body.decision,
      decidedBy: body.decidedBy,
      reason: body.reason
    };

    const record = await decideStoredPantavionFounderApprovalRequest(decisionRequest);
    const assessment = assessPantavionFounderApprovalRecord(record);

    return NextResponse.json({
      ok: true,
      record,
      assessment
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 404 }
    );
  }
}
