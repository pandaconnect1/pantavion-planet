import { NextRequest, NextResponse } from "next/server";
import {
  assessPantavionRepoAgentSafety,
  createPantavionAiCodeProvenanceRecord,
  listPantavionRepoAgentSafetyPolicy,
  type PantavionRepoAgentActionClass,
  type PantavionRepoAgentSafetyInput,
  type PantavionRepoAgentSourceOrigin
} from "@/core/agent/repo-agent-safety-gate";
import { appendPantavionRepoAgentSafetyAudit } from "@/core/agent/repo-agent-safety-audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeActionClass(value: unknown): PantavionRepoAgentActionClass {
  const allowed: PantavionRepoAgentActionClass[] = [
    "repo_read",
    "issue_pr_ingest",
    "external_repo_clone",
    "dependency_install",
    "command_execution",
    "file_write",
    "git_add",
    "git_commit",
    "git_push",
    "ci_cd_change",
    "production_deploy",
    "secrets_access",
    "security_change",
    "source_truth_change",
    "unknown"
  ];

  return allowed.includes(value as PantavionRepoAgentActionClass)
    ? (value as PantavionRepoAgentActionClass)
    : "unknown";
}

function normalizeSourceOrigin(value: unknown): PantavionRepoAgentSourceOrigin {
  const allowed: PantavionRepoAgentSourceOrigin[] = [
    "founder_direct",
    "repo_file",
    "github_issue",
    "github_pr",
    "external_repo",
    "ai_generated",
    "unknown"
  ];

  return allowed.includes(value as PantavionRepoAgentSourceOrigin)
    ? (value as PantavionRepoAgentSourceOrigin)
    : "unknown";
}

function stringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value.filter((item): item is string => typeof item === "string");
}

export async function GET() {
  const actor = "api:kernel:repo-agent-safety-gate:get";
  const policy = listPantavionRepoAgentSafetyPolicy();

  await appendPantavionRepoAgentSafetyAudit({
    event: "repo.agent.safety.policy.read",
    actor,
    createdAt: new Date().toISOString()
  });

  return NextResponse.json({
    ok: true,
    capability: "pantavion_repo_agent_runtime_safety_gate",
    status: "internal",
    policy,
    rules: {
      scopedGit:
        "Scoped git add only. git add . and git add --all are blocked.",
      untrustedInput:
        "GitHub issue, PR, and external repo text must not trigger automatic execution.",
      secrets:
        "Secrets must never enter agent context, prompts, logs, browser-visible routes, or public CI output.",
      checks:
        "Code-changing actions require npm run build, npx tsc --noEmit --pretty false, and npm run kernel before merge or deploy.",
      approvals:
        "Production, auth, billing, legal, security, CI/CD, source-truth, provider cloud upload, infrastructure, and data-changing actions require founder approval."
    }
  });
}

export async function POST(request: NextRequest) {
  const actor = "api:kernel:repo-agent-safety-gate:post";
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  const safetyRequest: PantavionRepoAgentSafetyInput = {
    actionClass: normalizeActionClass(body?.actionClass),
    command: typeof body?.command === "string" ? body.command : undefined,
    touchedFiles: stringArray(body?.touchedFiles),
    sourceTextOrigin: normalizeSourceOrigin(body?.sourceTextOrigin),
    generatedByProvider:
      typeof body?.generatedByProvider === "string" ? body.generatedByProvider : undefined,
    generatedByAgentId:
      typeof body?.generatedByAgentId === "string" ? body.generatedByAgentId : undefined,
    humanReviewer:
      typeof body?.humanReviewer === "string" ? body.humanReviewer : undefined,
    commandsRun: stringArray(body?.commandsRun),
    approvalId: typeof body?.approvalId === "string" ? body.approvalId : undefined,
    founderApproved: Boolean(body?.founderApproved),
    actor: typeof body?.actor === "string" ? body.actor : actor,
    reason: typeof body?.reason === "string" ? body.reason : undefined
  };

  const assessment = assessPantavionRepoAgentSafety(safetyRequest);

  await appendPantavionRepoAgentSafetyAudit({
    event: "repo.agent.safety.assessed",
    actor: safetyRequest.actor ?? actor,
    createdAt: new Date().toISOString(),
    request: safetyRequest,
    assessment
  });

  const provenance = assessment.requiresProvenanceRecord
    ? createPantavionAiCodeProvenanceRecord(safetyRequest, assessment)
    : null;

  if (provenance) {
    await appendPantavionRepoAgentSafetyAudit({
      event: "repo.agent.provenance.recorded",
      actor: safetyRequest.actor ?? actor,
      createdAt: new Date().toISOString(),
      request: safetyRequest,
      assessment,
      provenance
    });
  }

  return NextResponse.json({
    ok: true,
    assessment,
    provenance
  });
}
