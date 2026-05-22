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

type WaterHelpDirectoryUser = {
  userId: string;
  displayName: string;
  role: string;
  contact?: string;
  isActive?: boolean;
  areaLabels?: string[];
  zoneLabels?: string[];
  departmentLabels?: string[];
  superiorUserId?: string;
  superiorDisplayName?: string;
  superiorRole?: string;
};

type WaterHelpDeliveryTarget = {
  type: "founder_admin" | "user" | "role";
  id: string;
  label: string;
};

type WaterHelpRouting = {
  mode: "direct_user" | "superior_forwarding" | "founder_admin_review";
  requestedTargetName: string;
  requestedDepartment: string;
  resolvedUserId: string;
  resolvedUserLabel: string;
  resolvedUserRole: string;
  fallbackRole: string;
  fallbackReason: string;
  founderAdminCopy: true;
  requiresManualForwarding: boolean;
  deliveryStatus:
    | "sent_to_user_inbox"
    | "sent_to_superior_inbox"
    | "pending_founder_admin_forwarding";
  deliveryTargetLabel: string;
  deliveryTargets: WaterHelpDeliveryTarget[];
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

function readWaterHelpDirectory() {
  const raw = process.env.PANTAVION_WATER_HELP_USER_DIRECTORY_JSON;

  if (!raw) return [] as WaterHelpDirectoryUser[];

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => item as Partial<WaterHelpDirectoryUser>)
      .filter((item) => item.userId && item.displayName && item.role)
      .map((item) => ({
        userId: String(item.userId),
        displayName: String(item.displayName),
        role: String(item.role),
        contact: item.contact ? String(item.contact) : "",
        isActive: item.isActive !== false,
        areaLabels: Array.isArray(item.areaLabels) ? item.areaLabels.map(String) : [],
        zoneLabels: Array.isArray(item.zoneLabels) ? item.zoneLabels.map(String) : [],
        departmentLabels: Array.isArray(item.departmentLabels)
          ? item.departmentLabels.map(String)
          : [],
        superiorUserId: item.superiorUserId ? String(item.superiorUserId) : "",
        superiorDisplayName: item.superiorDisplayName ? String(item.superiorDisplayName) : "",
        superiorRole: item.superiorRole ? String(item.superiorRole) : "",
      }))
      .filter((item) => item.isActive);
  } catch {
    return [];
  }
}

function userMatchesRequestedTarget(user: WaterHelpDirectoryUser, targetName: string, contact: string) {
  const target = normalize(targetName);
  const contactNeedle = normalize(contact);

  if (!target && !contactNeedle) return false;

  const values = [
    user.userId,
    user.displayName,
    user.contact || "",
  ].map((value) => normalize(value));

  return values.some((value) => value && (value === target || value === contactNeedle));
}

function scopeScore(user: WaterHelpDirectoryUser, areaLabel: string, zoneLabel: string, targetDepartment: string) {
  let score = 0;

  const area = normalize(areaLabel);
  const zone = normalize(zoneLabel);
  const department = normalize(targetDepartment);

  const userAreas = (user.areaLabels || []).map(normalize);
  const userZones = (user.zoneLabels || []).map(normalize);
  const userDepartments = (user.departmentLabels || []).map(normalize);

  if (area && userAreas.includes(area)) score += 3;
  if (zone && userZones.includes(zone)) score += 3;
  if (department && userDepartments.includes(department)) score += 2;

  return score;
}

function fallbackRoleFor(category: string, priority: string, targetDepartment: string) {
  const department = normalize(targetDepartment);

  if (category === "tool_request" || category === "material_request" || department.includes("αποθηκ")) {
    return {
      fallbackRole: "warehouse_or_supervisor",
      fallbackReason: "Αφορά εργαλείο, υλικό ή αποθήκη.",
      preferredRoles: ["warehouse", "supervisor", "chief_supervisor", "founder_admin"],
    };
  }

  if (category === "safety_problem" || priority === "critical") {
    return {
      fallbackRole: "safety_or_chief_supervisor",
      fallbackReason: "Αφορά ασφάλεια ή κρίσιμη προτεραιότητα.",
      preferredRoles: ["chief_supervisor", "supervisor", "founder_admin"],
    };
  }

  if (category === "analysis_request") {
    return {
      fallbackRole: "management_or_founder_admin",
      fallbackReason: "Αφορά ανάλυση, αναφορά ή διοίκηση.",
      preferredRoles: ["general_manager", "president", "founder_admin", "chief_supervisor"],
    };
  }

  if (category === "collaboration_problem" || category === "service_problem") {
    return {
      fallbackRole: "supervisor_or_management",
      fallbackReason: "Αφορά συνεργασία, υπηρεσία ή διαδικασία.",
      preferredRoles: ["supervisor", "chief_supervisor", "general_manager", "founder_admin"],
    };
  }

  return {
    fallbackRole: "supervisor_review",
    fallbackReason: "Δεν βρέθηκε άμεσος υπεύθυνος. Χρειάζεται έλεγχος από ανώτερο.",
    preferredRoles: ["supervisor", "chief_supervisor", "founder_admin"],
  };
}

function resolveWaterHelpRouting(input: {
  category: string;
  priority: string;
  role: string;
  contact: string;
  areaLabel: string;
  zoneLabel: string;
  targetDepartment: string;
  suggestedAssignee: string;
}): WaterHelpRouting {
  const users = readWaterHelpDirectory();
  const directUser = users.find((user) =>
    userMatchesRequestedTarget(user, input.suggestedAssignee, input.contact),
  );

  if (directUser) {
    return {
      mode: "direct_user",
      requestedTargetName: input.suggestedAssignee,
      requestedDepartment: input.targetDepartment,
      resolvedUserId: directUser.userId,
      resolvedUserLabel: directUser.displayName,
      resolvedUserRole: directUser.role,
      fallbackRole: "",
      fallbackReason: "Ο υπεύθυνος βρέθηκε ως ενεργός χρήστης Pantavion.",
      founderAdminCopy: true,
      requiresManualForwarding: false,
      deliveryStatus: "sent_to_user_inbox",
      deliveryTargetLabel: directUser.displayName,
      deliveryTargets: [
        { type: "founder_admin", id: "founder-admin", label: "Founder/Admin" },
        { type: "user", id: directUser.userId, label: directUser.displayName },
      ],
    };
  }

  const fallback = fallbackRoleFor(input.category, input.priority, input.targetDepartment);
  const superior = users
    .filter((user) => fallback.preferredRoles.includes(user.role))
    .map((user) => ({
      user,
      score: scopeScore(user, input.areaLabel, input.zoneLabel, input.targetDepartment),
    }))
    .sort((a, b) => b.score - a.score)[0]?.user;

  if (superior) {
    return {
      mode: "superior_forwarding",
      requestedTargetName: input.suggestedAssignee,
      requestedDepartment: input.targetDepartment,
      resolvedUserId: superior.userId,
      resolvedUserLabel: superior.displayName,
      resolvedUserRole: superior.role,
      fallbackRole: fallback.fallbackRole,
      fallbackReason: fallback.fallbackReason,
      founderAdminCopy: true,
      requiresManualForwarding: true,
      deliveryStatus: "sent_to_superior_inbox",
      deliveryTargetLabel: superior.displayName,
      deliveryTargets: [
        { type: "founder_admin", id: "founder-admin", label: "Founder/Admin" },
        { type: "user", id: superior.userId, label: superior.displayName },
      ],
    };
  }

  return {
    mode: "founder_admin_review",
    requestedTargetName: input.suggestedAssignee,
    requestedDepartment: input.targetDepartment,
    resolvedUserId: "",
    resolvedUserLabel: "",
    resolvedUserRole: "",
    fallbackRole: fallback.fallbackRole,
    fallbackReason: fallback.fallbackReason,
    founderAdminCopy: true,
    requiresManualForwarding: true,
    deliveryStatus: "pending_founder_admin_forwarding",
    deliveryTargetLabel: "Founder/Admin για χειροκίνητη προώθηση",
    deliveryTargets: [
      { type: "founder_admin", id: "founder-admin", label: "Founder/Admin" },
      { type: "role", id: fallback.fallbackRole, label: fallback.fallbackRole },
    ],
  };
}

function inboxPathFor(requestId: string, target: WaterHelpDeliveryTarget) {
  if (target.type === "user") {
    return `water/private/help-inbox/users/${safePathSegment(target.id)}/${requestId}.json`;
  }

  if (target.type === "role") {
    return `water/private/help-inbox/roles/${safePathSegment(target.id)}/${requestId}.json`;
  }

  return `water/private/help-inbox/founder-admin/${requestId}.json`;
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

    const routing = resolveWaterHelpRouting({
      category,
      priority,
      role,
      contact: clean(body.contact, 180),
      areaLabel: clean(body.areaLabel, 220),
      zoneLabel: clean(body.zoneLabel, 120),
      targetDepartment: clean(body.targetDepartment, 180),
      suggestedAssignee: clean(body.suggestedAssignee, 180),
    });

    const deliveryRecords = routing.deliveryTargets.map((target) => ({
      targetType: target.type,
      targetId: target.id,
      targetLabel: target.label,
      status: "stored_private_copy",
      storedAt: now,
      storagePath: inboxPathFor(`water-help-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, target),
    }));

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
      routing,
      deliveryRecords,
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

    await Promise.all(
      routing.deliveryTargets.map((target) =>
        put(
          inboxPathFor(payload.id, target),
          JSON.stringify(
            {
              ...payload,
              inboxTarget: target,
            },
            null,
            2,
          ),
          {
            access: "private",
            allowOverwrite: false,
            contentType: "application/json",
          },
        ),
      ),
    );

    return NextResponse.json({
      ok: true,
      requestId: payload.id,
      status: payload.status,
      aiRoutingHint: payload.aiRoutingHint,
      aiFirstRecommendation: payload.aiFirstRecommendation,
      routingMode: payload.routing.mode,
      deliveryStatus: payload.routing.deliveryStatus,
      deliveryTargetLabel: payload.routing.deliveryTargetLabel,
      requiresManualForwarding: payload.routing.requiresManualForwarding,
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