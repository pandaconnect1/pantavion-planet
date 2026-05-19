import { list, put } from "@vercel/blob";
import { NextResponse } from "next/server";

type DecisionBody = {
  founderCode?: string;
  requestId?: string;
  decision?: "approve" | "reject" | "revoke";
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
    .replace(/[\s().-]/g, "");
}

function founderOk(value: unknown) {
  const founderCode = process.env.PANTAVION_WATER_FOUNDER_ACCESS_CODE || "";
  return Boolean(founderCode) && clean(value) === founderCode;
}

function privateBlobHeaders(): HeadersInit {
  const token = process.env.BLOB_READ_WRITE_TOKEN || "";

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

async function readJsonBlob(blob: BlobLike) {
  const response = await fetch(blob.downloadUrl || blob.url, {
    cache: "no-store",
    headers: privateBlobHeaders(),
  });

  if (!response.ok) {
    throw new Error(`blob_read_failed_${response.status}`);
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
    const decision =
      body.decision === "reject" ? "reject" : body.decision === "revoke" ? "revoke" : "approve";

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
    const deviceId = clean(payload.device?.id);
    const deviceTokenHash = clean(payload.device?.tokenHash);

    if (!approvedPhone) {
      return NextResponse.json(
        {
          ok: false,
          error: "missing_phone",
        },
        { status: 400 },
      );
    }

    if (decision === "approve" && (!deviceId || !deviceTokenHash)) {
      return NextResponse.json(
        {
          ok: false,
          error: "request_missing_device_claim",
        },
        { status: 400 },
      );
    }

    const nextStatus =
      decision === "approve" ? "approved" : decision === "revoke" ? "revoked" : "rejected";

    const decidedAt = new Date().toISOString();

    const updatedPayload = {
      ...payload,
      status: nextStatus,
      decidedAt,
      decidedBy: "pantavion-founder",
    };

    await put(requestPath, JSON.stringify(updatedPayload, null, 2), {
      access: "private",
      allowOverwrite: true,
      contentType: "application/json",
    });

    if (decision === "approve") {
      await put(
        `water/private/approved-devices/${deviceId}.json`,
        JSON.stringify(
          {
            deviceId,
            tokenHash: deviceTokenHash,
            phone: approvedPhone,
            firstName: clean(payload.firstName),
            lastName: clean(payload.lastName),
            title: clean(payload.title),
            organization: clean(payload.organization),
            requestId,
            approvedAt: decidedAt,
            approvedBy: "pantavion-founder",
            status: "approved",
            revoked: false,
            accessMode: "device-bound",
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

      await put(
        `water/private/approved-contacts/${approvedPhone}.json`,
        JSON.stringify(
          {
            phone: approvedPhone,
            firstName: clean(payload.firstName),
            lastName: clean(payload.lastName),
            title: clean(payload.title),
            organization: clean(payload.organization),
            lastApprovedDeviceId: deviceId,
            requestId,
            approvedAt: decidedAt,
            approvedBy: "pantavion-founder",
            status: "approved",
            accessMode: "device-bound",
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

    if (decision === "revoke" && deviceId) {
      await put(
        `water/private/approved-devices/${deviceId}.json`,
        JSON.stringify(
          {
            deviceId,
            tokenHash: deviceTokenHash,
            phone: approvedPhone,
            firstName: clean(payload.firstName),
            lastName: clean(payload.lastName),
            title: clean(payload.title),
            organization: clean(payload.organization),
            requestId,
            revokedAt: decidedAt,
            revokedBy: "pantavion-founder",
            status: "revoked",
            revoked: true,
            accessMode: "device-bound",
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
      status: nextStatus,
      phone: approvedPhone,
      deviceId: deviceId || null,
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