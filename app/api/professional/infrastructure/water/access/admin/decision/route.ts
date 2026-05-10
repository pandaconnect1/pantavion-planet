import { list, put } from "@vercel/blob";
import { NextResponse } from "next/server";

type DecisionBody = {
  founderCode?: string;
  requestId?: string;
  decision?: "approve" | "reject";
};

type BlobLike = {
  url: string;
  downloadUrl?: string;
  pathname: string;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePhone(value: unknown) {
  return clean(value)
    .toLowerCase()
    .replace(/[\s()\-.]/g, "");
}

function founderOk(value: unknown) {
  const founderCode = process.env.PANTAVION_WATER_FOUNDER_ACCESS_CODE || "";
  return Boolean(founderCode) && clean(value) === founderCode;
}

async function readJsonBlob(blob: BlobLike) {
  const response = await fetch(blob.downloadUrl || blob.url, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("blob_read_failed");
  }

  return response.json();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as DecisionBody;

    if (!founderOk(body.founderCode)) {
      return NextResponse.json(
        {
          ok: false,
          error: "founder_not_authorized",
        },
        { status: 403 },
      );
    }

    const requestId = clean(body.requestId);
    const decision = body.decision === "reject" ? "reject" : "approve";

    if (!requestId) {
      return NextResponse.json(
        {
          ok: false,
          error: "missing_request_id",
        },
        { status: 400 },
      );
    }

    const requestPath = `water/private/access-requests/${requestId}.json`;
    const result = await list({
      prefix: requestPath,
      limit: 1,
    });

    const requestBlob = (result.blobs as BlobLike[]).find(
      (blob) => blob.pathname === requestPath,
    );

    if (!requestBlob) {
      return NextResponse.json(
        {
          ok: false,
          error: "request_not_found",
        },
        { status: 404 },
      );
    }

    const payload = await readJsonBlob(requestBlob);
    const approvedPhone = normalizePhone(payload.emailOrPhone);

    if (!approvedPhone) {
      return NextResponse.json(
        {
          ok: false,
          error: "missing_phone",
        },
        { status: 400 },
      );
    }

    const updatedPayload = {
      ...payload,
      status: decision === "approve" ? "approved" : "rejected",
      decidedAt: new Date().toISOString(),
      decidedBy: "pantavion-founder",
    };

    await put(requestPath, JSON.stringify(updatedPayload, null, 2), {
      access: "private",
      allowOverwrite: true,
      contentType: "application/json",
    });

    if (decision === "approve") {
      await put(
        `water/private/approved-contacts/${approvedPhone}.json`,
        JSON.stringify(
          {
            phone: approvedPhone,
            firstName: clean(payload.firstName),
            lastName: clean(payload.lastName),
            title: clean(payload.title),
            requestId,
            approvedAt: updatedPayload.decidedAt,
            approvedBy: "pantavion-founder",
            status: "approved",
          },
          null,
          2,
        ),
        {
          access: "private",
          allowOverwrite: true,
          contentType: "application/json",
        },
      );
    }

    return NextResponse.json({
      ok: true,
      requestId,
      decision,
      phone: approvedPhone,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "decision_failed",
      },
      { status: 500 },
    );
  }
}
