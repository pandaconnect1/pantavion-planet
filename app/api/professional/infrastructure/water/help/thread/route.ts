import { createHash } from "crypto";

import { list, put } from "@vercel/blob";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type WaterHelpThreadAction =
  | "note"
  | "forward"
  | "reply"
  | "assignment"
  | "status_update"
  | "material_request"
  | "tool_request"
  | "safety_update"
  | "map_context"
  | "ai_recommendation";

type WaterHelpThreadBody = {
  requestId?: string;
  faultId?: string;
  actionType?: WaterHelpThreadAction;
  message?: string;

  fromUserId?: string;
  fromName?: string;
  fromRole?: string;

  toUserId?: string;
  toName?: string;
  toRole?: string;
  toDepartment?: string;

  priority?: string;
  status?: string;
  newStatus?: string;

  areaLabel?: string;
  roadLabel?: string;
  zoneLabel?: string;
  mapPath?: string;

  smsRequested?: boolean;
  smsPhone?: string;

  deviceId?: string;
  deviceToken?: string;
};

type WaterHelpThreadEvent = {
  id: string;
  requestId: string;
  faultId: string;
  actionType: WaterHelpThreadAction;
  createdAt: string;
  priority: string;
  status: string;
  newStatus: string;
  message: string;
  actor: {
    userId: string;
    name: string;
    role: string;
    deviceId: string;
    deviceTokenHash: string;
  };
  target: {
    userId: string;
    name: string;
    role: string;
    department: string;
  };
  mapContext: {
    areaLabel: string;
    roadLabel: string;
    zoneLabel: string;
    mapPath: string;
    canOpenMap: boolean;
  };
  delivery: {
    pantavionThreadRecorded: true;
    smsRequested: boolean;
    smsStatus: "not_requested" | "not_sent_provider_not_connected";
    smsPhoneMasked: string;
  };
  audit: {
    storedPrivate: true;
    visibleToFounderAdmin: true;
    requiresIdentitySessionForFullRead: true;
    note: string;
  };
};

type BlobListItem = {
  url?: string;
  downloadUrl?: string;
};

const ALLOWED_ACTIONS = new Set<WaterHelpThreadAction>([
  "note",
  "forward",
  "reply",
  "assignment",
  "status_update",
  "material_request",
  "tool_request",
  "safety_update",
  "map_context",
  "ai_recommendation",
]);

function clean(value: unknown, maxLength = 500) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ς/g, "σ")
    .replace(/[^a-z0-9α-ω]+/g, " ")
    .trim();
}

function safePathSegment(value: string) {
  return normalize(value).replace(/\s+/g, "-").slice(0, 120) || "unknown";
}

function hashToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function makeThreadEventId() {
  return `water-thread-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function maskPhone(value: string) {
  const cleaned = value.replace(/[^\d+]/g, "");

  if (cleaned.length <= 4) return cleaned ? "****" : "";

  return `${cleaned.slice(0, 3)}****${cleaned.slice(-2)}`;
}

function actionType(value: unknown): WaterHelpThreadAction {
  const candidate = clean(value, 80) as WaterHelpThreadAction;

  return ALLOWED_ACTIONS.has(candidate) ? candidate : "note";
}

function publicEvent(event: WaterHelpThreadEvent) {
  return {
    id: event.id,
    requestId: event.requestId,
    faultId: event.faultId,
    actionType: event.actionType,
    createdAt: event.createdAt,
    priority: event.priority,
    status: event.status,
    newStatus: event.newStatus,
    message: event.message,
    actor: {
      userId: event.actor.userId,
      name: event.actor.name,
      role: event.actor.role,
    },
    target: event.target,
    mapContext: event.mapContext,
    delivery: event.delivery,
  };
}

async function readBlobJson(blob: BlobListItem) {
  const url = blob.downloadUrl || blob.url;

  if (!url) return null;

  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) return null;

  return (await response.json()) as WaterHelpThreadEvent;
}

async function listRequesterThreadEvents(requestId: string, deviceId: string, deviceToken: string) {
  const tokenHash = hashToken(deviceToken);

  const result = await list({
    prefix: `water/private/help-threads/${safePathSegment(requestId)}/`,
    limit: 100,
  });

  const blobs = (result.blobs || []) as BlobListItem[];
  const payloads = await Promise.all(blobs.map((blob) => readBlobJson(blob)));

  return payloads
    .filter((item): item is WaterHelpThreadEvent => Boolean(item))
    .filter((item) => {
      const sameToken = item.actor.deviceTokenHash === tokenHash;
      const sameDevice = deviceId ? item.actor.deviceId === deviceId : true;
      return sameToken && sameDevice;
    })
    .map(publicEvent)
    .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as WaterHelpThreadBody;

    const requestId = clean(body.requestId, 160);
    const message = clean(body.message, 4000);

    if (!requestId || !message) {
      return NextResponse.json(
        {
          ok: false,
          error: "missing_request_id_or_message",
        },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const deviceToken = clean(body.deviceToken, 500);
    const toUserId = clean(body.toUserId, 160);
    const toRole = clean(body.toRole, 160);

    const event: WaterHelpThreadEvent = {
      id: makeThreadEventId(),
      requestId,
      faultId: clean(body.faultId, 160),
      actionType: actionType(body.actionType),
      createdAt: now,
      priority: clean(body.priority, 80) || "normal",
      status: clean(body.status, 80) || "recorded",
      newStatus: clean(body.newStatus, 80),
      message,
      actor: {
        userId: clean(body.fromUserId, 160),
        name: clean(body.fromName, 180),
        role: clean(body.fromRole, 120),
        deviceId: clean(body.deviceId, 160),
        deviceTokenHash: deviceToken ? hashToken(deviceToken) : "",
      },
      target: {
        userId: toUserId,
        name: clean(body.toName, 180),
        role: toRole,
        department: clean(body.toDepartment, 180),
      },
      mapContext: {
        areaLabel: clean(body.areaLabel, 220),
        roadLabel: clean(body.roadLabel, 220),
        zoneLabel: clean(body.zoneLabel, 120),
        mapPath: clean(body.mapPath, 500),
        canOpenMap: Boolean(clean(body.mapPath, 500) || clean(body.areaLabel, 220) || clean(body.roadLabel, 220)),
      },
      delivery: {
        pantavionThreadRecorded: true,
        smsRequested: Boolean(body.smsRequested),
        smsStatus: body.smsRequested ? "not_sent_provider_not_connected" : "not_requested",
        smsPhoneMasked: maskPhone(clean(body.smsPhone, 80)),
      },
      audit: {
        storedPrivate: true,
        visibleToFounderAdmin: true,
        requiresIdentitySessionForFullRead: true,
        note:
          "This records a private Pantavion thread event only. It does not claim external SMS delivery without a connected provider.",
      },
    };

    const threadPath = `water/private/help-threads/${safePathSegment(requestId)}/${event.id}.json`;

    await put(threadPath, JSON.stringify(event, null, 2), {
      access: "private",
      allowOverwrite: false,
      contentType: "application/json",
    });

    await put(`water/private/help-thread-inbox/founder-admin/${event.id}.json`, JSON.stringify(event, null, 2), {
      access: "private",
      allowOverwrite: false,
      contentType: "application/json",
    });

    if (toUserId) {
      await put(
        `water/private/help-thread-inbox/users/${safePathSegment(toUserId)}/${event.id}.json`,
        JSON.stringify(event, null, 2),
        {
          access: "private",
          allowOverwrite: false,
          contentType: "application/json",
        },
      );
    }

    if (!toUserId && toRole) {
      await put(
        `water/private/help-thread-inbox/roles/${safePathSegment(toRole)}/${event.id}.json`,
        JSON.stringify(event, null, 2),
        {
          access: "private",
          allowOverwrite: false,
          contentType: "application/json",
        },
      );
    }

    return NextResponse.json({
      ok: true,
      eventId: event.id,
      requestId: event.requestId,
      actionType: event.actionType,
      deliveryStatus: "recorded_private_pantavion_thread",
      smsStatus: event.delivery.smsStatus,
      mapAvailable: event.mapContext.canOpenMap,
      message:
        event.delivery.smsStatus === "not_sent_provider_not_connected"
          ? "Το μήνυμα καταγράφηκε στο Pantavion thread. SMS δεν εστάλη γιατί δεν υπάρχει συνδεδεμένος SMS provider."
          : "Το μήνυμα καταγράφηκε στο ιδιωτικό Pantavion thread.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "help_thread_post_failed",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestId = clean(url.searchParams.get("requestId"), 160);
  const scope = clean(url.searchParams.get("scope"), 40) || "requester";

  try {
    if (!requestId) {
      return NextResponse.json(
        {
          ok: false,
          error: "missing_request_id",
        },
        { status: 400 },
      );
    }

    if (scope === "admin" || scope === "founder" || scope === "user") {
      return NextResponse.json(
        {
          ok: false,
          error: "identity_session_required",
          message:
            "Η πλήρης προβολή συνομιλίας χρειάζεται πραγματικό Pantavion login/session. Δεν ανοίγει ιδιωτικό thread με δημόσιο URL.",
        },
        { status: 403 },
      );
    }

    const deviceId = clean(url.searchParams.get("deviceId"), 160);
    const deviceToken =
      request.headers.get("x-pantavion-device-token") ||
      clean(url.searchParams.get("deviceToken"), 500);

    if (!deviceToken) {
      return NextResponse.json(
        {
          ok: false,
          error: "missing_device_token",
          message: "Δεν βρέθηκε τοπικό κλειδί συσκευής για προβολή δικού μου thread.",
        },
        { status: 400 },
      );
    }

    const items = await listRequesterThreadEvents(requestId, deviceId, deviceToken);

    return NextResponse.json({
      ok: true,
      scope: "requester",
      requestId,
      count: items.length,
      items,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "help_thread_get_failed",
      },
      { status: 500 },
    );
  }
}
