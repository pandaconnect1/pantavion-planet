import { NextRequest, NextResponse } from "next/server";
import { verifyKernelRequest } from "@/core/kernel/kernel-auth";
import {
  assessPantavionSensitiveArtifact,
  listPantavionSensitiveArtifactRules,
  type PantavionSensitiveArtifactInput
} from "@/core/vault/sensitive-artifact-vault";
import { appendPantavionSensitiveArtifactAudit } from "@/core/vault/sensitive-artifact-audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = verifyKernelRequest(request);

  if (!auth.ok && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.statusCode }
    );
  }

  const actor = auth.ok ? auth.actor : "local-sensitive-artifact-vault";
  const rules = listPantavionSensitiveArtifactRules();

  await appendPantavionSensitiveArtifactAudit({
    event: "sensitive.artifact.rules.read",
    actor,
    createdAt: new Date().toISOString()
  });

  return NextResponse.json({
    ok: true,
    capability: "pantavion_sensitive_artifact_vault",
    status: "internal",
    rules,
    policy: {
      sourceTruth:
        "Original DWG/CAD/source-truth artifacts are read-only and immutable by default.",
      secrets:
        "Secrets, tokens, keys, credentials, and env files must never be exposed to prompts, logs, client routes, public CI, or automatic agents.",
      approvals:
        "Legal, user-access, infrastructure, production, data-changing, billing, auth, DWG/source-truth, security, backup, and restore actions require founder approval."
    }
  });
}

export async function POST(request: NextRequest) {
  const auth = verifyKernelRequest(request);

  if (!auth.ok && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.statusCode }
    );
  }

  const actor = auth.ok ? auth.actor : "local-sensitive-artifact-vault";
  const body = (await request.json().catch(() => null)) as
    | Partial<PantavionSensitiveArtifactInput>
    | null;

  const vaultRequest: PantavionSensitiveArtifactInput = {
    path: body?.path,
    filename: body?.filename,
    extension: body?.extension,
    artifactClass: body?.artifactClass,
    operation: body?.operation ?? "unknown",
    sourceTruth: body?.sourceTruth,
    production: body?.production,
    containsSecret: body?.containsSecret,
    founderApproved: body?.founderApproved,
    actor,
    reason: body?.reason
  };

  const assessment = assessPantavionSensitiveArtifact(vaultRequest);

  await appendPantavionSensitiveArtifactAudit({
    event: "sensitive.artifact.assessed",
    actor: vaultRequest.actor ?? actor,
    createdAt: new Date().toISOString(),
    request: vaultRequest,
    assessment
  });

  return NextResponse.json({
    ok: true,
    assessment
  });
}
