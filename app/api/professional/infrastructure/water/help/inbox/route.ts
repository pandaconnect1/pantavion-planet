import { createHash } from "crypto";

import { list } from "@vercel/blob";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BlobListItem = {
  url?: string;
  downloadUrl?: string;
};

type WaterHelpInboxRequest = {
  id?: string;
  category?: string;
  priority?: string;
  status?: string;
  title?: string;
  description?: string;
  requestedBy?: string;
  role?: string;
  contact?: string;
  areaLabel?: string;
  roadLabel?: string;
  zoneLabel?: string;
  targetDepartment?: string;
  suggestedAssignee?: string;
  evidenceRefs?: string[];
  aiRoutingHint?: string;
  aiFirstRecommendation?: string;
  createdAt?: string;
  updatedAt?: string;
  routing?: {
    mode?: string;
    deliveryStatus?: string;
    deliveryTargetLabel?: string;
    requiresManualForwarding?: boolean;
    resolvedUserId?: string;
    resolvedUserLabel?: string;
    resolvedUserRole?: string;
    fallbackRole?: string;
    fallbackReason?: string;
  };
  inboxTarget?: {
    type?: string;
    id?: string;
    label?: string;
  };
  device?: {
    id?: string;
    tokenHash?: string;
    label?: string;
    submittedAt?: string;
  };
};

function clean(value: string | null, maxLength = 300) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function hashToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function publicItem(payload: WaterHelpInboxRequest) {
  return {
    id: payload.id || "",
    category: payload.category || "",
    priority: payload.priority || "",
    status: payload.status || "",
    title: payload.title || "",
    description: payload.description || "",
    requestedBy: payload.requestedBy || "",
    role: payload.role || "",
    contact: payload.contact || "",
    areaLabel: payload.areaLabel || "",
    roadLabel: payload.roadLabel || "",
    zoneLabel: payload.zoneLabel || "",
    targetDepartment: payload.targetDepartment || "",
    suggestedAssignee: payload.suggestedAssignee || "",
    evidenceRefs: Array.isArray(payload.evidenceRefs) ? payload.evidenceRefs : [],
    aiRoutingHint: payload.aiRoutingHint || "",
    aiFirstRecommendation: payload.aiFirstRecommendation || "",
    createdAt: payload.createdAt || "",
    updatedAt: payload.updatedAt || "",
    routing: {
      mode: payload.routing?.mode || "",
      deliveryStatus: payload.routing?.deliveryStatus || "",
      deliveryTargetLabel: payload.routing?.deliveryTargetLabel || "",
      requiresManualForwarding: Boolean(payload.routing?.requiresManualForwarding),
      resolvedUserId: payload.routing?.resolvedUserId || "",
      resolvedUserLabel: payload.routing?.resolvedUserLabel || "",
      resolvedUserRole: payload.routing?.resolvedUserRole || "",
      fallbackRole: payload.routing?.fallbackRole || "",
      fallbackReason: payload.routing?.fallbackReason || "",
    },
    inboxTarget: {
      type: payload.inboxTarget?.type || "",
      id: payload.inboxTarget?.id || "",
      label: payload.inboxTarget?.label || "",
    },
  };
}

async function readBlobJson(blob: BlobListItem) {
  const url = blob.downloadUrl || blob.url;

  if (!url) return null;

  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) return null;

  return (await response.json()) as WaterHelpInboxRequest;
}

async function listRequesterOwnRequests(deviceId: string, deviceToken: string) {
  const tokenHash = hashToken(deviceToken);

  const result = await list({
    prefix: "water/private/help-requests/",
    limit: 100,
  });

  const blobs = (result.blobs || []) as BlobListItem[];
  const payloads = await Promise.all(blobs.map((blob) => readBlobJson(blob)));

  return payloads
    .filter((item): item is WaterHelpInboxRequest => Boolean(item))
    .filter((item) => {
      const sameToken = item.device?.tokenHash === tokenHash;
      const sameDevice = deviceId ? item.device?.id === deviceId : true;
      return sameToken && sameDevice;
    })
    .map(publicItem)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const scope = clean(url.searchParams.get("scope"), 40) || "requester";

  try {
    if (scope === "founder" || scope === "admin" || scope === "user") {
      return NextResponse.json(
        {
          ok: false,
          error: "identity_session_required",
          message:
            "Η προβολή αυτή χρειάζεται πραγματικό Pantavion login/session. Δεν εμφανίζονται ιδιωτικά αιτήματα με δημόσιο URL.",
        },
        { status: 403 },
      );
    }

    const deviceId = clean(url.searchParams.get("deviceId"), 120);
    const deviceToken =
      request.headers.get("x-pantavion-device-token") ||
      clean(url.searchParams.get("deviceToken"), 500);

    if (!deviceToken) {
      return NextResponse.json(
        {
          ok: false,
          error: "missing_device_token",
          message: "Δεν βρέθηκε τοπικό κλειδί συσκευής για τα δικά μου αιτήματα.",
        },
        { status: 400 },
      );
    }

    const items = await listRequesterOwnRequests(deviceId, deviceToken);

    return NextResponse.json({
      ok: true,
      scope: "requester",
      count: items.length,
      items,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "help_inbox_failed",
      },
      { status: 500 },
    );
  }
}
