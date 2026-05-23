import { createHash } from "crypto";

import { list } from "@vercel/blob";
import { NextResponse } from "next/server";

import {
  decideWaterAIKernel,
  type WaterAIFaultInput,
} from "@/core/water/water-ai-operations-kernel";
import {
  decideWaterAIMapIntelligence,
  type WaterFaultMapInput,
  type WaterGeoPoint,
  type WaterMapAsset,
} from "@/core/water/water-ai-map-intelligence-kernel";

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

function trustedDeviceValue(secret: string) {
  return createHash("sha256").update(`pantavion-water-trusted-device-v1:${secret}`).digest("hex");
}

function hasAdminReadSession(request: Request) {
  if (process.env.NODE_ENV !== "production") return true;

  const expectedSecret = process.env.PANTAVION_WATER_ADMIN_SESSION_SECRET || "";
  if (!expectedSecret) return false;

  const cookieHeader = request.headers.get("cookie") || "";
  const sessionCookie = cookieValue(cookieHeader, "pantavion_water_admin_session");
  const trustedDeviceCookie = cookieValue(cookieHeader, "pantavion_water_trusted_device");

  return (
    sessionCookie === adminSessionValue(expectedSecret) ||
    trustedDeviceCookie === trustedDeviceValue(expectedSecret)
  );
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

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : {};
}

function asText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function asBoolean(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}

function arrayCount(value: unknown) {
  return Array.isArray(value) ? value.length : undefined;
}

function asGeoPoint(value: unknown): WaterGeoPoint | undefined {
  const data = asRecord(value);
  const lat = asNumber(data.lat) ?? asNumber(data.latitude);
  const lng = asNumber(data.lng) ?? asNumber(data.longitude);

  return typeof lat === "number" && typeof lng === "number" ? { lat, lng } : undefined;
}

function asMapAssets(value: unknown): WaterMapAsset[] {
  return Array.isArray(value) ? (value as WaterMapAsset[]) : [];
}

function toWaterAIFaultInput(item: unknown): WaterAIFaultInput {
  const data = asRecord(item);
  const location = asRecord(data.location);
  const timestamps = asRecord(data.timestamps);
  const recordedBy = asRecord(data.recordedBy);
  const assignedTo = asRecord(data.assignedTo);
  const excavation = asRecord(data.excavation);
  const audioTranscript = asRecord(data.audioTranscript);
  const managementMetrics = asRecord(data.managementMetrics);

  return {
    recordNumber: asText(data.recordNumber),
    title: asText(data.title),
    description: asText(data.description),
    source: asText(data.source),
    faultType: asText(data.faultType),
    priority: asText(data.priority),
    status: asText(data.status),
    createdByRole: asText(recordedBy.role),
    assignedToRole: asText(assignedTo.role),
    assignedToUserId: asText(assignedTo.userId),
    areaLabel: asText(location.areaLabel),
    roadLabel: asText(location.roadLabel),
    zoneLabel: asText(location.zoneLabel),
    nearestPipeId: asText(location.nearestPipeId),
    nearestValveId: asText(location.nearestValveId),
    mapLinked:
      asBoolean(location.mapLinked) ??
      Boolean(asText(location.mapPath) || asText(location.nearestPipeId) || asText(location.nearestValveId)),
    materialsDeclared: Array.isArray(data.materials) ? data.materials.length > 0 : asBoolean(data.materialsDeclared),
    excavationDeclared: asBoolean(excavation.wasExcavationDone),
    arrivalAt: asText(timestamps.crewArrivedAt),
    departureAt: asText(timestamps.crewDepartedAt),
    deliveredAt: asText(timestamps.deliveredAt),
    photosBeforeCount: asNumber(data.photosBeforeCount) ?? arrayCount(data.photosBefore),
    photosAfterCount: asNumber(data.photosAfterCount) ?? arrayCount(data.photosAfter),
    audioRefsCount: asNumber(data.audioRefsCount) ?? arrayCount(data.audioRefs),
    transcriptText: asText(audioTranscript.transcriptText),
    transcriptStatus: asText(audioTranscript.transcriptStatus),
    signatureEventsCount: asNumber(data.signatureEventsCount) ?? arrayCount(data.signatureEvents),
    repeatedFaultsNearbyCount: asNumber(managementMetrics.repeatedFaultCountNearby),
    possibleWaterLoss: asBoolean(managementMetrics.possibleWaterLoss),
    isFounderOnly: asBoolean(data.isFounderOnly),
  };
}

function toWaterFaultMapInput(item: unknown): WaterFaultMapInput {
  const data = asRecord(item);
  const location = asRecord(data.location);
  const managementMetrics = asRecord(data.managementMetrics);

  return {
    recordNumber: asText(data.recordNumber) || "pending-record",
    faultPoint: asGeoPoint(location.faultPoint) ?? asGeoPoint(data.faultPoint) ?? asGeoPoint(location),
    areaLabel: asText(location.areaLabel),
    roadLabel: asText(location.roadLabel),
    zoneLabel: asText(location.zoneLabel),
    existingPipeId: asText(location.nearestPipeId),
    existingValveId: asText(location.nearestValveId),
    existingZoneId: asText(location.zoneId) ?? asText(location.pressureZoneId),
    repeatedFaultsNearbyCount: asNumber(managementMetrics.repeatedFaultCountNearby),
    possibleWaterLoss: asBoolean(managementMetrics.possibleWaterLoss),
    assets: asMapAssets(data.mapAssets).length ? asMapAssets(data.mapAssets) : asMapAssets(location.mapAssets),
  };
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

    const aiOperationsDecision = decideWaterAIKernel(toWaterAIFaultInput(item));
    const aiMapDecision = decideWaterAIMapIntelligence(toWaterFaultMapInput(item));

    return NextResponse.json({
      ok: true,
      item,
      aiOperationsDecision,
      aiMapDecision,
      aiKernelVersion: "water_ai_operations_and_map_intelligence_v1",
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