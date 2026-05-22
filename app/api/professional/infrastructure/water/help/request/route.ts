import { createHash } from "crypto";

import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

type WaterHelpRequestBody = {
  category?: string;
  priority?: string;
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
  deviceId?: string;
  deviceToken?: string;
  deviceLabel?: string;
};

const ALLOWED_CATEGORIES = new Set([
  "tool_request",
  "material_request",
  "work_blocker",
  "collaboration_problem",
  "safety_problem",
  "service_problem",
  "analysis_request",
  "improvement_proposal",
  "other",
]);

const ALLOWED_PRIORITIES = new Set([
  "normal",
  "urgent",
  "critical",
]);

function clean(value: unknown, maxLength = 500) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function cleanEvidenceRefs(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => clean(item, 500))
    .filter(Boolean)
    .slice(0, 50);
}

function hashToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function routeHint(category: string, role: string, priority: string) {
  if (category === "tool_request" || category === "material_request") {
    return "supervisor_and_warehouse";
  }

  if (category === "collaboration_problem" || category === "service_problem") {
    return "supervisor_then_management";
  }

  if (category === "safety_problem" || priority === "critical") {
    return "supervisor_management_and_safety";
  }

  if (category === "analysis_request") {
    return role === "president" || role === "general_manager"
      ? "executive_analysis"
      : "supervisor_analysis";
  }

  if (category === "improvement_proposal") {
    return "continuous_improvement_queue";
  }

  return "supervisor_review";
}

function aiFirstRecommendation(category: string, priority: string) {
  if (category === "tool_request") {
    return "Έλεγχος αν το εργαλείο υπάρχει σε αποθήκη/συνεργείο και άμεση ενημέρωση επιστάτη.";
  }

  if (category === "material_request") {
    return "Έλεγχος υλικών, ποσότητας, σημείου εργασίας και ενημέρωση αποθήκης/επιστάτη.";
  }

  if (category === "work_blocker") {
    return "Να καταγραφεί τι εμποδίζει την εργασία και να ζητηθεί άμεση απόφαση επιστάτη.";
  }

  if (category === "collaboration_problem") {
    return "Να καταγραφεί ουδέτερα το πρόβλημα, χωρίς χαρακτηρισμούς, και να σταλεί στον υπεύθυνο για επίλυση.";
  }

  if (category === "safety_problem") {
    return "Άμεση ειδοποίηση υπεύθυνου. Αν υπάρχει κίνδυνος, η εργασία δεν συνεχίζεται μέχρι οδηγία.";
  }

  if (category === "analysis_request") {
    return "Να συγκεντρωθούν βλάβες, χρόνοι, υλικά, κόστος, ζώνες και ιστορικό για απάντηση διοίκησης.";
  }

  if (category === "improvement_proposal") {
    return "Να αξιολογηθεί ως πρόταση βελτίωσης με πιθανό όφελος, κόστος, ρίσκο και εφαρμοσιμότητα.";
  }

  return priority === "critical"
    ? "Άμεση προώθηση σε υπεύθυνο."
    : "Προώθηση για έλεγχο και απάντηση.";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as WaterHelpRequestBody;

    const category = clean(body.category, 80);
    const priority = clean(body.priority, 40) || "normal";
    const title = clean(body.title, 180);
    const description = clean(body.description, 4000);
    const deviceId = clean(body.deviceId, 120);
    const deviceToken = clean(body.deviceToken, 500);
    const role = clean(body.role, 120);

    if (!ALLOWED_CATEGORIES.has(category)) {
      return NextResponse.json(
        {
          ok: false,
          error: "invalid_category",
        },
        { status: 400 },
      );
    }

    if (!ALLOWED_PRIORITIES.has(priority)) {
      return NextResponse.json(
        {
          ok: false,
          error: "invalid_priority",
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
      id: `water-help-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      source: "pantavion-water-help-resolution-center",
      category,
      priority,
      status: "pending_review",
      title,
      description,
      requestedBy: clean(body.requestedBy, 180),
      role,
      contact: clean(body.contact, 180),
      areaLabel: clean(body.areaLabel, 220),
      roadLabel: clean(body.roadLabel, 220),
      zoneLabel: clean(body.zoneLabel, 120),
      targetDepartment: clean(body.targetDepartment, 180),
      suggestedAssignee: clean(body.suggestedAssignee, 180),
      evidenceRefs: cleanEvidenceRefs(body.evidenceRefs),
      aiRoutingHint: routeHint(category, role, priority),
      aiFirstRecommendation: aiFirstRecommendation(category, priority),
      visibleToFounder: true,
      visibleToApprovedUsers: false,
      visibleToRequester: true,
      requiresHumanReview: true,
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
      `water/private/help-requests/${payload.id}.json`,
      JSON.stringify(payload, null, 2),
      {
        access: "private",
        allowOverwrite: false,
        contentType: "application/json",
      },
    );

    return NextResponse.json({
      ok: true,
      requestId: payload.id,
      status: payload.status,
      aiRoutingHint: payload.aiRoutingHint,
      aiFirstRecommendation: payload.aiFirstRecommendation,
      storedPrivate: true,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "help_request_failed",
      },
      { status: 500 },
    );
  }
}