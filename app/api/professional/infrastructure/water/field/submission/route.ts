import { createHash } from "crypto";

import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

type WaterFieldSubmissionBody = {
  type?: string;
  title?: string;
  description?: string;
  submittedBy?: string;
  contact?: string;
  role?: string;
  areaLabel?: string;
  roadLabel?: string;
  zoneLabel?: string;
  latitude?: number;
  longitude?: number;
  deviceId?: string;
  deviceToken?: string;
  deviceLabel?: string;
  evidenceRefs?: string[];
};

const ALLOWED_TYPES = new Set([
  "note",
  "photo_reference",
  "voice_reference",
  "fault_report",
  "possible_valve",
  "new_road",
  "new_area",
  "pipe_depth_observation",
  "pipe_material_observation",
  "underground_service_observation",
]);

function clean(value: unknown, maxLength = 500) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function cleanNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function hashToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function cleanEvidenceRefs(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => clean(item, 500))
    .filter(Boolean)
    .slice(0, 20);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as WaterFieldSubmissionBody;

    const type = clean(body.type, 80);
    const title = clean(body.title, 180);
    const description = clean(body.description, 2000);
    const deviceId = clean(body.deviceId, 120);
    const deviceToken = clean(body.deviceToken, 500);

    if (!ALLOWED_TYPES.has(type)) {
      return NextResponse.json(
        {
          ok: false,
          error: "invalid_submission_type",
        },
        { status: 400 },
      );
    }

    if (!title || !description) {
      return NextResponse.json(
        {
          ok: false,
          error: "missing_required_fields",
        },
        { status: 400 },
      );
    }

    if (!deviceId || !deviceToken) {
      return NextResponse.json(
        {
          ok: false,
          error: "missing_device_claim",
        },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();

    const payload = {
      id: `water-field-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      source: "pantavion-water-field-submission",
      type,
      status: "pending_founder_review",
      truthLabel: "field_observed",
      title,
      description,
      submittedBy: clean(body.submittedBy, 180),
      contact: clean(body.contact, 180),
      role: clean(body.role, 180),
      areaLabel: clean(body.areaLabel, 220),
      roadLabel: clean(body.roadLabel, 220),
      zoneLabel: clean(body.zoneLabel, 120),
      latitude: cleanNumber(body.latitude),
      longitude: cleanNumber(body.longitude),
      evidenceRefs: cleanEvidenceRefs(body.evidenceRefs),
      visibleToFounder: true,
      visibleToApprovedUsers: false,
      rawSensitiveDataHiddenFromUsers: true,
      aiEstimateIsVerifiedTruth: false,
      createdAt: now,
      updatedAt: now,
      device: {
        id: deviceId,
        tokenHash: hashToken(deviceToken),
        label: clean(body.deviceLabel, 220),
        submittedAt: now,
        userAgent: clean(request.headers.get("user-agent"), 300),
      },
    };

    await put(
      `water/private/field-submissions/${payload.id}.json`,
      JSON.stringify(payload, null, 2),
      {
        access: "private",
        allowOverwrite: false,
        contentType: "application/json",
      },
    );

    return NextResponse.json({
      ok: true,
      submissionId: payload.id,
      status: payload.status,
      storedPrivate: true,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "field_submission_failed",
      },
      { status: 500 },
    );
  }
}