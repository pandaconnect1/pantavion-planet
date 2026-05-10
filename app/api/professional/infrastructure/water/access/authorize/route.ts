import { NextResponse } from "next/server";

type WaterAccessAuthorizeBody = {
  code?: string;
  firstName?: string;
  lastName?: string;
  title?: string;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const body = (await request.json()) as WaterAccessAuthorizeBody;

  const configuredCode = process.env.PANTAVION_WATER_FOUNDER_ACCESS_CODE || "";
  const submittedCode = clean(body.code);

  if (!configuredCode) {
    return NextResponse.json(
      {
        ok: false,
        error: "founder_access_code_not_configured",
      },
      { status: 403 },
    );
  }

  if (!submittedCode || submittedCode !== configuredCode) {
    return NextResponse.json(
      {
        ok: false,
        error: "access_not_approved",
      },
      { status: 403 },
    );
  }

  return NextResponse.json({
    ok: true,
    approved: true,
    approvedAt: new Date().toISOString(),
    holder: {
      firstName: clean(body.firstName),
      lastName: clean(body.lastName),
      title: clean(body.title),
    },
  });
}
