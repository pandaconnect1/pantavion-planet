import { list } from "@vercel/blob";
import { NextResponse } from "next/server";

type WaterAccessAuthorizeBody = {
  code?: string;
  emailOrPhone?: string;
  firstName?: string;
  lastName?: string;
  title?: string;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePhone(value: unknown) {
  return clean(value)
    .toLowerCase()
    .replace(/[\s()\-.]/g, "");
}

async function approvedPhoneExists(phone: string) {
  if (!phone) return false;

  const pathname = `water/private/approved-contacts/${phone}.json`;
  const result = await list({
    prefix: pathname,
    limit: 1,
  });

  return result.blobs.some((blob) => blob.pathname === pathname);
}

export async function POST(request: Request) {
  const body = (await request.json()) as WaterAccessAuthorizeBody;

  const founderCode = process.env.PANTAVION_WATER_FOUNDER_ACCESS_CODE || "";
  const submittedCode = clean(body.code);
  const submittedPhone = normalizePhone(body.emailOrPhone || body.code);

  const isFounderAccess = Boolean(founderCode) && submittedCode === founderCode;
  const isApprovedPhoneAccess = await approvedPhoneExists(submittedPhone);

  if (!founderCode && !submittedPhone) {
    return NextResponse.json(
      {
        ok: false,
        error: "founder_access_code_not_configured",
      },
      { status: 403 },
    );
  }

  if (!isFounderAccess && !isApprovedPhoneAccess) {
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
    accessMode: isFounderAccess ? "founder" : "approved-phone",
    approvedAt: new Date().toISOString(),
    holder: {
      firstName: clean(body.firstName),
      lastName: clean(body.lastName),
      title: clean(body.title),
      phone: submittedPhone,
    },
  });
}

