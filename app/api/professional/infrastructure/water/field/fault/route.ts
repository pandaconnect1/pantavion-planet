import { createHash } from "crypto";

import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

import type {
  WaterFaultActorRole,
  WaterFaultPriority,
  WaterFaultRecordSource,
  WaterFaultType,
} from "@/core/water/water-fault-lifecycle-model";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type FieldFaultBody = {
  faultType?: WaterFaultType;
  priority?: WaterFaultPriority;
  source?: WaterFaultRecordSource;

  title?: string;
  description?: string;

  contactName?: string;
  contactPhone?: string;

  areaLabel?: string;
  roadLabel?: string;
  zoneLabel?: string;

  recordedByName?: string;
  recordedByRole?: WaterFaultActorRole;

  photoRefs?: string[];
  audioRefs?: string[];
  transcriptText?: string;
  note?: string;

  deviceId?: string;
  deviceToken?: string;
};

const ALLOWED_FAULT_TYPES = new Set<WaterFaultType>([
  "fault",
  "leak",
  "broken_pipe",
  "possible_valve",
  "no_water",
  "pressure_problem",
  "quality_problem",
  "other",
]);

const ALLOWED_PRIORITIES = new Set<WaterFaultPriority>(["normal", "urgent", "critical"]);

const ALLOWED_SOURCES = new Set<WaterFaultRecordSource>([
  "phone",
  "audio",
  "pdf",
  "scanner",
  "photo",
  "map",
  "field",
  "citizen",
  "email",
  "fax",
  "office",
  "other",
]);

const ALLOWED_ROLES = new Set<WaterFaultActorRole>([
  "citizen",
  "call_center",
  "worker",
  "technician",
  "assistant_supervisor",
  "supervisor",
  "chief_supervisor",
  "warehouse",
  "accounting",
  "technical_services",
  "contractor",
  "general_manager",
  "president",
  "founder_admin",
  "ai",
]);

function clean(value: unknown, maxLength = 500) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function cleanArray(value: unknown, maxItems = 12) {
  return Array.isArray(value)
    ? value.map((item) => clean(item, 500)).filter(Boolean).slice(0, maxItems)
    : [];
}

function hashToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
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

function makeRecordNumber(now: Date) {
  const stamp = now
    .toISOString()
    .replace(/[-:T.Z]/g, "")
    .slice(0, 14);

  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();

  return `WF-${stamp}-${suffix}`;
}

function faultType(value: unknown): WaterFaultType {
  const candidate = clean(value, 80) as WaterFaultType;
  return ALLOWED_FAULT_TYPES.has(candidate) ? candidate : "fault";
}

function priority(value: unknown): WaterFaultPriority {
  const candidate = clean(value, 80) as WaterFaultPriority;
  return ALLOWED_PRIORITIES.has(candidate) ? candidate : "normal";
}

function source(value: unknown): WaterFaultRecordSource {
  const candidate = clean(value, 80) as WaterFaultRecordSource;
  return ALLOWED_SOURCES.has(candidate) ? candidate : "field";
}

function role(value: unknown): WaterFaultActorRole {
  const candidate = clean(value, 80) as WaterFaultActorRole;
  return ALLOWED_ROLES.has(candidate) ? candidate : "worker";
}

function aiMissingChecks(input: {
  title: string;
  description: string;
  areaLabel: string;
  roadLabel: string;
  zoneLabel: string;
  photoRefs: string[];
  audioRefs: string[];
  transcriptText: string;
}) {
  const checks: Array<{
    id: string;
    severity: "info" | "warning" | "critical";
    category: string;
    message: string;
    suggestedAction: string;
    requiresHumanApproval: boolean;
    resolved: boolean;
  }> = [];

  if (!input.title) {
    checks.push({
      id: "missing-title",
      severity: "warning",
      category: "missing_field",
      message: "Λείπει τίτλος βλάβης.",
      suggestedAction: "Συμπλήρωσε σύντομο τίτλο για να μπορεί να ταξινομηθεί η βλάβη.",
      requiresHumanApproval: false,
      resolved: false,
    });
  }

  if (!input.description && !input.audioRefs.length && !input.transcriptText) {
    checks.push({
      id: "missing-description-or-audio",
      severity: "warning",
      category: "missing_field",
      message: "Λείπει περιγραφή ή ηχητική σημείωση.",
      suggestedAction: "Γράψε τι συνέβη ή πρόσθεσε ηχητικό που θα μεταγραφεί.",
      requiresHumanApproval: false,
      resolved: false,
    });
  }

  if (!input.areaLabel && !input.roadLabel && !input.zoneLabel) {
    checks.push({
      id: "missing-location",
      severity: "critical",
      category: "map_risk",
      message: "Δεν υπάρχει ακόμη περιοχή, οδός ή ζώνη.",
      suggestedAction: "Συμπλήρωσε έστω ένα στοιχείο τοποθεσίας ή άνοιξε τη βλάβη στον χάρτη.",
      requiresHumanApproval: true,
      resolved: false,
    });
  }

  if (!input.photoRefs.length) {
    checks.push({
      id: "missing-photo-before",
      severity: "info",
      category: "photo_required",
      message: "Δεν υπάρχει φωτογραφία πριν την αποκατάσταση.",
      suggestedAction: "Αν είναι δυνατό, πρόσθεσε φωτογραφία πριν σκεπαστεί ή αλλάξει το σημείο.",
      requiresHumanApproval: false,
      resolved: false,
    });
  }

  return checks;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as FieldFaultBody;
    const now = new Date();
    const createdAt = now.toISOString();

    const title = clean(body.title, 220);
    const description = clean(body.description, 4000);
    const areaLabel = clean(body.areaLabel, 220);
    const roadLabel = clean(body.roadLabel, 220);
    const zoneLabel = clean(body.zoneLabel, 120);
    const photoRefs = cleanArray(body.photoRefs);
    const audioRefs = cleanArray(body.audioRefs);
    const transcriptText = clean(body.transcriptText, 6000);
    const deviceToken = clean(body.deviceToken, 500);
    const recordNumber = makeRecordNumber(now);

    if (!title && !description && !audioRefs.length && !photoRefs.length) {
      return NextResponse.json(
        {
          ok: false,
          error: "missing_fault_content",
          message: "Χρειάζεται τίτλος, περιγραφή, φωτογραφία ή ηχητική σημείωση.",
        },
        { status: 400 },
      );
    }

    const aiChecks = aiMissingChecks({
      title,
      description,
      areaLabel,
      roadLabel,
      zoneLabel,
      photoRefs,
      audioRefs,
      transcriptText,
    });

    const dossier = {
      recordNumber,
      status: "pending_approval",
      priority: priority(body.priority),
      faultType: faultType(body.faultType),

      title: title || "Νέα βλάβη πεδίου",
      description,

      source: source(body.source),
      sourceReference: "",

      recordedBy: {
        userId: "",
        name: clean(body.recordedByName, 180),
        role: role(body.recordedByRole),
        deviceId: clean(body.deviceId, 160),
      },

      device: {
        id: clean(body.deviceId, 160),
        tokenHash: deviceToken ? hashToken(deviceToken) : "",
        submittedAt: createdAt,
      },

      timestamps: {
        recordedAt: createdAt,
      },

      location: {
        areaLabel,
        roadLabel,
        zoneLabel,
        mapLinkStatus: areaLabel || roadLabel || zoneLabel ? "manual_location" : "missing",
      },

      contactName: clean(body.contactName, 180),
      contactPhone: clean(body.contactPhone, 80),

      materials: [],
      excavation: {
        wasExcavationDone: false,
      },

      audioTranscript: {
        audioRefs,
        originalAudioFile: audioRefs[0] || "",
        transcriptStatus: audioRefs.length
          ? transcriptText
            ? "transcribed"
            : "pending_transcription"
          : "none",
        transcriptText,
      },

      evidence: [
        ...photoRefs.map((ref) => ({
          kind: "photo_before",
          ref,
          uploadedBy: clean(body.recordedByName, 180),
          uploadedAt: createdAt,
        })),
        ...audioRefs.map((ref) => ({
          kind: "audio",
          ref,
          uploadedBy: clean(body.recordedByName, 180),
          uploadedAt: createdAt,
        })),
      ],

      signatureEvents: [],
      communicationEvents: [
        {
          id: `fault-created-${Date.now()}`,
          action: "created",
          from: {
            userId: "",
            name: clean(body.recordedByName, 180),
            role: role(body.recordedByRole),
            deviceId: clean(body.deviceId, 160),
          },
          message: clean(body.note, 1500) || "Γρήγορη καταχώρηση βλάβης από πεδίο.",
          createdAt,
          smsRequested: false,
          smsStatus: "not_requested",
        },
      ],

      workerNotes: clean(body.note, 1500) ? [clean(body.note, 1500)] : [],
      supervisorNotes: [],
      managementNotes: [],
      founderAdminNotes: [],
      aiNotes: aiChecks.map((check) => check.message),
      approvalNotes: [],

      approvalState: "pending_supervisor",
      aiChecks,

      managementMetrics: {
        reportTags: [
          "pending approval",
          areaLabel ? `area:${areaLabel}` : "area:missing",
          zoneLabel ? `zone:${zoneLabel}` : "zone:missing",
        ],
      },

      recordLocked: false,
      audit: {
        storedPrivate: true,
        visibleToFounderAdmin: true,
        officialAfterApprovalOnly: true,
        note:
          "Quick field capture creates a pending approval fault dossier. It is not final truth until supervisor/founder/admin approval.",
      },
    };

    await put(
      `water/private/fault-dossiers/pending/${safeSegment(recordNumber)}.json`,
      JSON.stringify(dossier, null, 2),
      {
        access: "private",
        allowOverwrite: false,
        contentType: "application/json",
      },
    );

    await put(
      `water/private/fault-approval-inbox/founder-admin/${safeSegment(recordNumber)}.json`,
      JSON.stringify(dossier, null, 2),
      {
        access: "private",
        allowOverwrite: false,
        contentType: "application/json",
      },
    );

    return NextResponse.json({
      ok: true,
      recordNumber,
      status: "pending_approval",
      approvalState: "pending_supervisor",
      aiMissingCount: aiChecks.filter((check) => !check.resolved).length,
      aiChecks,
      mapLinkStatus: dossier.location.mapLinkStatus,
      message:
        "Η βλάβη καταχωρήθηκε ως pending approval. Χρειάζεται έλεγχος/έγκριση πριν γίνει επίσημος φάκελος.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "field_fault_create_failed",
      },
      { status: 500 },
    );
  }
}
