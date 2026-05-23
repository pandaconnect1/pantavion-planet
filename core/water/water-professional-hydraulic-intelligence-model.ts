import { createHash, timingSafeEqual } from "crypto";

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SESSION_COOKIE = "pantavion_water_admin_session";
const TRUSTED_DEVICE_COOKIE = "pantavion_water_trusted_device";

type AdminSessionBody = {
  accessCode?: string;
};

function clean(value: unknown, maxLength = 1000) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function sessionValue(secret: string) {
  return createHash("sha256").update(`pantavion-water-admin-session-v1:${secret}`).digest("hex");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  if (left.length !== right.length) return false;

  return timingSafeEqual(left, right);
}

export async function POST(request: Request) {
  try {
    const expectedSecret = clean(process.env.PANTAVION_WATER_ADMIN_SESSION_SECRET, 1000);

    if (!expectedSecret) {
      return NextResponse.json(
        {
          ok: false,
          error: "admin_secret_not_configured",
          message: "Δεν έχει ρυθμιστεί το founder/admin secret στο Vercel.",
        },
        { status: 500 },
      );
    }

    const body = (await request.json()) as AdminSessionBody;
    const accessCode = clean(body.accessCode, 1000);

    if (!accessCode || !safeEqual(accessCode, expectedSecret)) {
      return NextResponse.json(
        {
          ok: false,
          error: "invalid_admin_access_code",
          message: "Λάθος founder/admin access code.",
        },
        { status: 401 },
      );
    }

    const response = NextResponse.json({
      ok: true,
      message: "Το founder/admin session ενεργοποιήθηκε.",
      redirectTo: "/professional/infrastructure/water/admin/faults",
    });

    response.cookies.set({
      name: SESSION_COOKIE,
      value: sessionValue(expectedSecret),
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "admin_session_failed",
      },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({
    ok: true,
    message: "Το founder/admin session έκλεισε.",
  });

  response.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });

  return response;
}

export type WaterLossReportScope =
  | "whole_network"
  | "district"
  | "neighborhood"
  | "street"
  | "zone"
  | "crew"
  | "pipe_material"
  | "fault_type";

export type WaterLossCategory =
  | "visible_leak"
  | "hidden_leak"
  | "pipe_break"
  | "valve_failure"
  | "pressure_related_loss"
  | "meter_or_apparent_loss"
  | "unauthorized_or_unbilled_use"
  | "unknown_loss";

export type WaterReportSeverity =
  | "info"
  | "watch"
  | "warning"
  | "serious"
  | "critical";

export type WaterLossReportInputRow = {
  recordNumber: string;
  scopeId?: string;
  scopeLabel?: string;
  scopeType: WaterLossReportScope;

  faultType?: string;
  lossCategory?: WaterLossCategory;

  area?: string;
  neighborhood?: string;
  street?: string;
  zone?: string;
  pipeMaterial?: string;
  pipeDiameterMm?: number;

  responseMinutes?: number;
  repairMinutes?: number;
  estimatedLeakHours?: number;
  estimatedLossCubicMeters?: number;
  estimatedCost?: number;

  visibleLeak?: boolean;
  repeatedFault?: boolean;
  pressureIssue?: boolean;
  missingValve?: boolean;
  missingMapEvidence?: boolean;

  createdAt?: string;
  completedAt?: string;
};

export type WaterProfessionalLossReport = {
  scopeType: WaterLossReportScope;
  scopeId: string;
  scopeLabel: string;

  totalFaults: number;
  visibleLeaks: number;
  hiddenOrUnknownLeaks: number;
  repeatedFaults: number;
  pressureRelatedIssues: number;
  missingValveSignals: number;
  missingMapEvidenceSignals: number;

  estimatedLossCubicMeters: number;
  estimatedCost: number;

  averageResponseMinutes: number | null;
  averageRepairMinutes: number | null;

  faultsByCategory: Record<string, number>;
  faultsByStreet: Record<string, number>;
  faultsByZone: Record<string, number>;
  faultsByMaterial: Record<string, number>;

  worstStreets: Array<{ label: string; count: number }>;
  worstZones: Array<{ label: string; count: number }>;
  worstMaterials: Array<{ label: string; count: number }>;

  severity: WaterReportSeverity;
  executiveSummary: string;
  recommendedActions: string[];
  founderAdminReviewRequired: boolean;
  engineerReviewRequired: boolean;
  auditRequired: true;
};

function addCount(target: Record<string, number>, key: string | undefined) {
  const cleanKey = key && key.trim() ? key.trim() : "unknown";
  target[cleanKey] = (target[cleanKey] || 0) + 1;
}

function topCounts(source: Record<string, number>, limit = 5) {
  return Object.entries(source)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function averageOrNull(values: number[]) {
  const clean = values.filter((value) => Number.isFinite(value));
  if (!clean.length) return null;
  return Math.round(clean.reduce((sum, value) => sum + value, 0) / clean.length);
}

export function buildWaterProfessionalLossReport(input: {
  scopeType: WaterLossReportScope;
  scopeId?: string;
  scopeLabel?: string;
  rows: WaterLossReportInputRow[];
}): WaterProfessionalLossReport {
  const rows = input.rows || [];

  const faultsByCategory: Record<string, number> = {};
  const faultsByStreet: Record<string, number> = {};
  const faultsByZone: Record<string, number> = {};
  const faultsByMaterial: Record<string, number> = {};

  let visibleLeaks = 0;
  let hiddenOrUnknownLeaks = 0;
  let repeatedFaults = 0;
  let pressureRelatedIssues = 0;
  let missingValveSignals = 0;
  let missingMapEvidenceSignals = 0;
  let estimatedLossCubicMeters = 0;
  let estimatedCost = 0;

  const responseTimes: number[] = [];
  const repairTimes: number[] = [];

  for (const row of rows) {
    addCount(faultsByCategory, row.lossCategory || row.faultType || "unknown_loss");
    addCount(faultsByStreet, row.street);
    addCount(faultsByZone, row.zone);
    addCount(faultsByMaterial, row.pipeMaterial);

    if (row.visibleLeak || row.lossCategory === "visible_leak") visibleLeaks += 1;
    if (!row.visibleLeak && (row.lossCategory === "hidden_leak" || row.lossCategory === "unknown_loss" || !row.lossCategory)) {
      hiddenOrUnknownLeaks += 1;
    }

    if (row.repeatedFault) repeatedFaults += 1;
    if (row.pressureIssue || row.lossCategory === "pressure_related_loss") pressureRelatedIssues += 1;
    if (row.missingValve) missingValveSignals += 1;
    if (row.missingMapEvidence) missingMapEvidenceSignals += 1;

    if (typeof row.estimatedLossCubicMeters === "number") estimatedLossCubicMeters += row.estimatedLossCubicMeters;
    if (typeof row.estimatedCost === "number") estimatedCost += row.estimatedCost;
    if (typeof row.responseMinutes === "number") responseTimes.push(row.responseMinutes);
    if (typeof row.repairMinutes === "number") repairTimes.push(row.repairMinutes);
  }

  const totalFaults = rows.length;
  const worstStreets = topCounts(faultsByStreet);
  const worstZones = topCounts(faultsByZone);
  const worstMaterials = topCounts(faultsByMaterial);

  let severity: WaterReportSeverity = "info";
  if (totalFaults >= 5 || repeatedFaults >= 2 || pressureRelatedIssues >= 2) severity = "watch";
  if (totalFaults >= 10 || repeatedFaults >= 4 || estimatedLossCubicMeters >= 100) severity = "warning";
  if (totalFaults >= 20 || repeatedFaults >= 8 || estimatedLossCubicMeters >= 500) severity = "serious";
  if (totalFaults >= 40 || estimatedLossCubicMeters >= 1500) severity = "critical";

  const recommendedActions: string[] = [];

  if (visibleLeaks > 0) recommendedActions.push("Έλεγχος εμφανών διαρροών και χρόνων αποκατάστασης.");
  if (hiddenOrUnknownLeaks > 0) recommendedActions.push("Έλεγχος για αφανείς ή μη επιβεβαιωμένες απώλειες.");
  if (repeatedFaults > 0) recommendedActions.push("Ανάλυση επαναλαμβανόμενων βλαβών ανά οδό/ζώνη.");
  if (pressureRelatedIssues > 0) recommendedActions.push("Υδραυλικός έλεγχος πιέσεων και αδύνατων σημείων.");
  if (missingValveSignals > 0) recommendedActions.push("Μελέτη για νέες βάνες ή επιβεβαίωση υπαρχουσών βανών.");
  if (missingMapEvidenceSignals > 0) recommendedActions.push("Συμπλήρωση τεκμηρίων χάρτη και field verification.");
  if (worstStreets[0]) recommendedActions.push(`Προτεραιότητα ελέγχου στην οδό/περιοχή: ${worstStreets[0].label}.`);
  if (worstZones[0]) recommendedActions.push(`Προτεραιότητα ζώνης: ${worstZones[0].label}.`);

  return {
    scopeType: input.scopeType,
    scopeId: input.scopeId || "unassigned-report-scope",
    scopeLabel: input.scopeLabel || "Άγνωστο πεδίο αναφοράς",

    totalFaults,
    visibleLeaks,
    hiddenOrUnknownLeaks,
    repeatedFaults,
    pressureRelatedIssues,
    missingValveSignals,
    missingMapEvidenceSignals,

    estimatedLossCubicMeters: Number(estimatedLossCubicMeters.toFixed(2)),
    estimatedCost: Number(estimatedCost.toFixed(2)),

    averageResponseMinutes: averageOrNull(responseTimes),
    averageRepairMinutes: averageOrNull(repairTimes),

    faultsByCategory,
    faultsByStreet,
    faultsByZone,
    faultsByMaterial,

    worstStreets,
    worstZones,
    worstMaterials,

    severity,
    executiveSummary:
      `Water Loss Report: ${input.scopeLabel || input.scopeType}, faults=${totalFaults}, ` +
      `visibleLeaks=${visibleLeaks}, repeatedFaults=${repeatedFaults}, ` +
      `estimatedLossM3=${estimatedLossCubicMeters.toFixed(2)}, severity=${severity}.`,
    recommendedActions,
    founderAdminReviewRequired: severity === "warning" || severity === "serious" || severity === "critical",
    engineerReviewRequired: pressureRelatedIssues > 0 || repeatedFaults >= 2 || severity === "serious" || severity === "critical",
    auditRequired: true,
  };
}

export const WATER_REPORTING_INTELLIGENCE_NEXT_ACTIONS = [
  "Executive report by whole network",
  "Loss report by zone",
  "Fault report by street",
  "Visible versus hidden leak classification",
  "Repeated fault ranking",
  "Pressure weak point ranking",
  "Valve improvement recommendations",
  "Crew response and repair time statistics",
] as const;