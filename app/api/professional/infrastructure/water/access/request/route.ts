import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

type WaterAccessRequestBody = {
  firstName?: string;
  lastName?: string;
  title?: string;
  organization?: string;
  emailOrPhone?: string;
  reason?: string;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 500) : "";
}

function normalizePhone(value: unknown) {
  return clean(value).replace(/[\s()\-.]/g, "");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as WaterAccessRequestBody;

    const payload = {
      id: `water-access-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      firstName: clean(body.firstName),
      lastName: clean(body.lastName),
      title: clean(body.title),
      organization: clean(body.organization),
      emailOrPhone: normalizePhone(body.emailOrPhone),
      reason: clean(body.reason),
      status: "pending_founder_review",
      createdAt: new Date().toISOString(),
      source: "pantavion-water-live-access-request",
    };

    if (!payload.firstName || !payload.lastName || !payload.title || !payload.emailOrPhone) {
      return NextResponse.json(
        {
          ok: false,
          error: "missing_required_fields",
        },
        { status: 400 },
      );
    }

    await put(
      `water/private/access-requests/${payload.id}.json`,
      JSON.stringify(payload, null, 2),
      {
        access: "private",
        allowOverwrite: false,
        contentType: "application/json",
      },
    );

    return NextResponse.json({
      ok: true,
      requestId: payload.id,
      status: payload.status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "request_failed",
      },
      { status: 500 },
    );
  }
}
