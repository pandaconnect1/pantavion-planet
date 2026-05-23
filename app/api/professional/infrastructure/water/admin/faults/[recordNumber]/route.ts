import { createHash } from "crypto";

import { list } from "@vercel/blob";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    recordNumber: string;
  }>;
};

type BlobListItem = {
  url?: string;
  downloadUrl?: string;
};

function cookieValue(cookieHeader: string, name: string) {
  const cookies = cookieHeader.split(";").map((part) => part.trim());
  const found = cookies.find((part) => part.startsWith(`${name}=`));

  return found ? decodeURIComponent(found.slice(name.length + 1)) : "";
}

function adminSessionValue(secret: string) {
  return createHash("sha256").update(`pantavion-water-admin-session-v1:${secret}`).digest("hex");
}

function hasAdminReadSession(request: Request) {
  if (process.env.NODE_ENV !== "production") return true;

  const expectedSecret = process.env.PANTAVION_WATER_ADMIN_SESSION_SECRET || "";
  if (!expectedSecret) return false;

  const cookieHeader = request.headers.get("cookie") || "";
  const sessionCookie = cookieValue(cookieHeader, "pantavion_water_admin_session");

  return sessionCookie === adminSessionValue(expectedSecret);
}

function safeSegment(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9α-ω]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120) || "unknown";
}

async function readJson(blob: BlobListItem) {
  const url = blob.downloadUrl || blob.url;
  if (!url) return null;

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) return null;

  return response.json();
}

export async function GET(request: Request, context: RouteContext) {
  try {
    if (!hasAdminReadSession(request)) {
      return NextResponse.json(
        {
          ok: false,
          error: "identity_session_required",
          message: "Ο φάκελος βλάβης είναι ιδιωτικός. Χρειάζεται founder/admin session.",
        },
        { status: 403 },
      );
    }

    const { recordNumber } = await context.params;
    const safeRecordNumber = safeSegment(recordNumber);

    const approvalList = await list({
      prefix: `water/private/fault-approval-inbox/founder-admin/${safeRecordNumber}.json`,
      limit: 1,
    });

    const pendingList = approvalList.blobs?.length
      ? approvalList
      : await list({
          prefix: `water/private/fault-dossiers/pending/${safeRecordNumber}.json`,
          limit: 1,
        });

    const blob = (pendingList.blobs || [])[0] as BlobListItem | undefined;

    if (!blob) {
      return NextResponse.json(
        {
          ok: false,
          error: "fault_dossier_not_found",
          message: "Δεν βρέθηκε φάκελος βλάβης για αυτόν τον αύξοντα αριθμό.",
        },
        { status: 404 },
      );
    }

    const item = await readJson(blob);

    if (!item) {
      return NextResponse.json(
        {
          ok: false,
          error: "fault_dossier_read_failed",
          message: "Ο φάκελος βρέθηκε αλλά δεν διαβάστηκε σωστά.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      item,
      generatedAt: new Date().toISOString(),
      source: "water/private/fault-approval-inbox/founder-admin/",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "fault_dossier_failed",
      },
      { status: 500 },
    );
  }
}