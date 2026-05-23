import { createHash } from "crypto";

import { list } from "@vercel/blob";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BlobListItem = {
  url?: string;
  downloadUrl?: string;
};

type FaultDossier = {
  recordNumber?: string;
  status?: string;
  priority?: string;
  faultType?: string;
  title?: string;
  description?: string;
  source?: string;
  recordedBy?: {
    userId?: string;
    name?: string;
    role?: string;
    deviceId?: string;
  };
  timestamps?: {
    recordedAt?: string;
    givenAt?: string;
    assignedAt?: string;
    crewArrivedAt?: string;
    completedAt?: string;
    deliveredAt?: string;
    approvedAt?: string;
  };
  location?: {
    areaLabel?: string;
    roadLabel?: string;
    zoneLabel?: string;
    nearestPipeId?: string;
    nearestPipeLabel?: string;
    nearestValveId?: string;
    nearestValveLabel?: string;
    pressureZoneId?: string;
    mapPath?: string;
    mapLinkStatus?: string;
  };
  contactName?: string;
  contactPhone?: string;
  audioTranscript?: {
    audioRefs?: string[];
    transcriptStatus?: string;
    transcriptText?: string;
  };
  evidence?: Array<{
    kind?: string;
    ref?: string;
  }>;
  approvalState?: string;
  aiChecks?: Array<{
    id?: string;
    severity?: string;
    category?: string;
    message?: string;
    suggestedAction?: string;
    resolved?: boolean;
  }>;
  managementMetrics?: {
    responseMinutes?: number;
    repairMinutes?: number;
    totalWorkMinutes?: number;
    estimatedWaterLoss?: string;
    estimatedCost?: string;
    repeatedFaultCountNearby?: number;
    highRiskArea?: boolean;
    reportTags?: string[];
  };
  recordLocked?: boolean;
  audit?: {
    storedPrivate?: boolean;
    visibleToFounderAdmin?: boolean;
    officialAfterApprovalOnly?: boolean;
    note?: string;
  };
};

function clean(value: unknown, maxLength = 500) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function maskPhone(value: string) {
  const cleaned = value.replace(/[^\d+]/g, "");

  if (!cleaned) return "";
  if (cleaned.length <= 4) return "****";

  return `${cleaned.slice(0, 3)}****${cleaned.slice(-2)}`;
}

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

  const cookieHeader = request.headers.get("cookie") || "";
  const expectedSecret = process.env.PANTAVION_WATER_ADMIN_SESSION_SECRET || "";

  if (!expectedSecret) return false;

  const expectedSession = adminSessionValue(expectedSecret);
  const sessionCookie = cookieValue(cookieHeader, "pantavion_water_admin_session");

  return Boolean(sessionCookie && sessionCookie === expectedSession);
}

async function readBlobJson(blob: BlobListItem) {
  const url = blob.downloadUrl || blob.url;

  if (!url) return null;

  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) return null;

  return (await response.json()) as FaultDossier;
}

function publicFault(item: FaultDossier) {
  const aiChecks = Array.isArray(item.aiChecks) ? item.aiChecks : [];
  const missingChecks = aiChecks.filter((check) => !check.resolved);

  return {
    recordNumber: clean(item.recordNumber, 160),
    status: clean(item.status, 80),
    priority: clean(item.priority, 80),
    faultType: clean(item.faultType, 80),
    title: clean(item.title, 220),
    description: clean(item.description, 800),
    source: clean(item.source, 80),
    recordedAt: clean(item.timestamps?.recordedAt, 80),
    recordedByName: clean(item.recordedBy?.name, 180),
    recordedByRole: clean(item.recordedBy?.role, 120),
    deviceId: clean(item.recordedBy?.deviceId, 160),
    contactName: clean(item.contactName, 160),
    contactPhoneMasked: maskPhone(clean(item.contactPhone, 80)),
    areaLabel: clean(item.location?.areaLabel, 220),
    roadLabel: clean(item.location?.roadLabel, 220),
    zoneLabel: clean(item.location?.zoneLabel, 120),
    mapPath: clean(item.location?.mapPath, 500),
    mapLinkStatus: clean(item.location?.mapLinkStatus, 80),
    nearestPipeLabel: clean(item.location?.nearestPipeLabel, 220),
    nearestValveLabel: clean(item.location?.nearestValveLabel, 220),
    pressureZoneId: clean(item.location?.pressureZoneId, 160),
    approvalState: clean(item.approvalState, 120),
    aiMissingCount: missingChecks.length,
    aiCriticalCount: missingChecks.filter((check) => check.severity === "critical").length,
    aiChecks: missingChecks.slice(0, 8).map((check) => ({
      id: clean(check.id, 120),
      severity: clean(check.severity, 80),
      category: clean(check.category, 120),
      message: clean(check.message, 500),
      suggestedAction: clean(check.suggestedAction, 500),
    })),
    evidenceCount: Array.isArray(item.evidence) ? item.evidence.length : 0,
    transcriptStatus: clean(item.audioTranscript?.transcriptStatus, 80),
    deliveryTargetLabel: "Founder/Admin approval inbox",
    nextStep: "Έλεγχος από επιστάτη ή founder/admin και μετά ανάθεση σε υπεύθυνο/συνεργείο.",
    recordLocked: Boolean(item.recordLocked),
  };
}

export async function GET(request: Request) {
  try {
    if (!hasAdminReadSession(request)) {
      return NextResponse.json(
        {
          ok: false,
          error: "identity_session_required",
          message:
            "Η λίστα βλαβών είναι ιδιωτική. Χρειάζεται πραγματικό Pantavion founder/admin session για προβολή.",
        },
        { status: 403 },
      );
    }

    const result = await list({
      prefix: "water/private/fault-approval-inbox/founder-admin/",
      limit: 100,
    });

    const blobs = (result.blobs || []) as BlobListItem[];
    const payloads = await Promise.all(blobs.map((blob) => readBlobJson(blob)));

    const items = payloads
      .filter((item): item is FaultDossier => Boolean(item))
      .map(publicFault)
      .sort((a, b) => String(b.recordedAt).localeCompare(String(a.recordedAt)));

    return NextResponse.json({
      ok: true,
      count: items.length,
      items,
      generatedAt: new Date().toISOString(),
      source: "water/private/fault-approval-inbox/founder-admin/",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "admin_faults_list_failed",
      },
      { status: 500 },
    );
  }
}
