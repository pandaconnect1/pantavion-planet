import { NextRequest, NextResponse } from "next/server";
import {
  assessPantavionConversionRequest,
  listPantavionConversionMatrix,
  type PantavionConversionRequestInput,
} from "@/core/conversion/format-matrix";
import { appendPantavionConversionAudit } from "@/core/conversion/conversion-audit";
import { verifyKernelRequest } from "@/core/kernel/kernel-auth";

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

  const actor = auth.ok ? auth.actor : "local-conversion-matrix";
  const matrix = listPantavionConversionMatrix();

  await appendPantavionConversionAudit({
    event: "conversion.matrix.read",
    actor,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({
    ok: true,
    capability: "pantavion_conversion_format_matrix",
    status: "internal",
    matrix,
    policy: {
      sourceTruth:
        "Original artifacts remain source truth. Derivatives must never be presented as originals.",
      dwg:
        "DWG/CAD source truth requires licensed adapter/provider and founder approval before production use.",
      automation:
        "Only non-sensitive supported/internal/beta conversions without founder approval may execute automatically.",
    },
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

  const actor = auth.ok ? auth.actor : "local-conversion-matrix";
  const body = (await request.json().catch(() => null)) as
    | Partial<PantavionConversionRequestInput>
    | null;

  if (!body?.sourceFormat || !body?.targetFormat) {
    return NextResponse.json(
      {
        ok: false,
        error: "sourceFormat and targetFormat are required",
      },
      { status: 400 }
    );
  }

  const conversionRequest: PantavionConversionRequestInput = {
    sourceFormat: body.sourceFormat,
    targetFormat: body.targetFormat,
    useCase: body.useCase,
    sensitive: body.sensitive,
    sourceTruth: body.sourceTruth,
    actor,
  };

  const assessment = assessPantavionConversionRequest(conversionRequest);

  await appendPantavionConversionAudit({
    event: "conversion.request.assessed",
    actor,
    createdAt: new Date().toISOString(),
    request: conversionRequest,
    assessment,
  });

  return NextResponse.json({
    ok: true,
    assessment,
  });
}
