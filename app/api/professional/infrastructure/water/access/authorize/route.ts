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

function normalizeAccessContact(value: unknown) {
  return clean(value)
    .toLowerCase()
    .replace(/[\s()\-.]/g, "");
}

function readApprovedContacts() {
  return (process.env.PANTAVION_WATER_APPROVED_CONTACTS || "")
    .split(",")
    .map((item) => normalizeAccessContact(item))
    .filter(Boolean);
}

export async function POST(request: Request) {
  const body = (await request.json()) as WaterAccessAuthorizeBody;

  const founderCode = process.env.PANTAVION_WATER_FOUNDER_ACCESS_CODE || "";
  const submittedCode = clean(body.code);
  const submittedContact = normalizeAccessContact(body.emailOrPhone || body.code);
  const approvedContacts = readApprovedContacts();

  const isFounderAccess = Boolean(founderCode) && submittedCode === founderCode;
  const isApprovedContactAccess =
    Boolean(submittedContact) && approvedContacts.includes(submittedContact);

  if (!founderCode && approvedContacts.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error: "founder_access_code_not_configured",
      },
      { status: 403 },
    );
  }

  if (!isFounderAccess && !isApprovedContactAccess) {
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
    accessMode: isFounderAccess ? "founder" : "approved-contact",
    approvedAt: new Date().toISOString(),
    holder: {
      firstName: clean(body.firstName),
      lastName: clean(body.lastName),
      title: clean(body.title),
      contact: submittedContact,
    },
  });
}
