import crypto from "node:crypto";
import { appendKernelAudit } from "./kernel-audit";
import {
  appendUserSignal,
  listUserSignals,
  getUserSignal,
  type UserSignalCategory,
  type UserSignalRecord,
  type UserSignalSeverity,
  type UserSignalSource,
} from "./user-signal-store";

export { listUserSignals, getUserSignal, type UserSignalRecord };

function classifyCategory(text: string): UserSignalCategory {
  const value = text.toLowerCase();

  if (
    value.includes("bug") ||
    value.includes("error") ||
    value.includes("λάθ") ||
    value.includes("lath") ||
    value.includes("σφάλ")
  ) {
    return "bug";
  }

  if (
    value.includes("missing") ||
    value.includes("κεν") ||
    value.includes("λείπει") ||
    value.includes("den yparxi") ||
    value.includes("δεν υπάρχει")
  ) {
    return "missing_capability";
  }

  if (
    value.includes("security") ||
    value.includes("safety") ||
    value.includes("audit") ||
    value.includes("approval") ||
    value.includes("ασφάλ")
  ) {
    return "safety";
  }

  if (
    value.includes("slow") ||
    value.includes("performance") ||
    value.includes("αργ") ||
    value.includes("κολλά")
  ) {
    return "performance";
  }

  if (
    value.includes("voice") ||
    value.includes("φων") ||
    value.includes("μιλώ") ||
    value.includes("μιλαω")
  ) {
    return "voice";
  }

  if (
    value.includes("accessibility") ||
    value.includes("elderly") ||
    value.includes("ηλικιω") ||
    value.includes("τυφλ")
  ) {
    return "accessibility";
  }

  if (
    value.includes("water") ||
    value.includes("dwg") ||
    value.includes("ύδρευση") ||
    value.includes("νερό")
  ) {
    return "water_infrastructure";
  }

  if (
    value.includes("startup") ||
    value.includes("agent") ||
    value.includes("builder")
  ) {
    return "startup_builder";
  }

  if (
    value.includes("better") ||
    value.includes("βελτί") ||
    value.includes("αναβάθ")
  ) {
    return "improvement";
  }

  return "unknown";
}

function classifySeverity(text: string): UserSignalSeverity {
  const value = text.toLowerCase();

  if (
    value.includes("critical") ||
    value.includes("production down") ||
    value.includes("data loss") ||
    value.includes("leak") ||
    value.includes("διαρρο") ||
    value.includes("χάθηκαν")
  ) {
    return "critical";
  }

  if (
    value.includes("urgent") ||
    value.includes("blocking") ||
    value.includes("δεν δουλεύ") ||
    value.includes("σπασ") ||
    value.includes("broken")
  ) {
    return "high";
  }

  if (
    value.includes("bug") ||
    value.includes("error") ||
    value.includes("missing") ||
    value.includes("λείπει")
  ) {
    return "medium";
  }

  if (value.length < 40) {
    return "low";
  }

  return "info";
}

function classifyZone(input: {
  text: string;
  source: UserSignalSource;
  severity: UserSignalSeverity;
}) {
  const value = input.text.toLowerCase();

  if (
    value.includes("secret") ||
    value.includes("api key") ||
    value.includes(".env") ||
    value.includes("dwg source") ||
    value.includes("delete database") ||
    value.includes("drop table") ||
    value.includes("billing") ||
    value.includes("payment") ||
    value.includes("auth")
  ) {
    return {
      safetyZone: "Z4_BLOCKED_MANUAL_ONLY" as const,
      trustBoundary: "blocked_sensitive" as const,
      recommendation:
        "Sensitive signal must be reviewed manually. No code execution or production mutation is allowed.",
    };
  }

  if (
    input.severity === "critical" ||
    value.includes("deploy") ||
    value.includes("database") ||
    value.includes("users") ||
    value.includes("login") ||
    value.includes("sos")
  ) {
    return {
      safetyZone: "Z3_FOUNDER_APPROVAL_REQUIRED" as const,
      trustBoundary: "founder_review_required" as const,
      recommendation:
        "Founder/admin review is required before converting this signal into implementation work.",
    };
  }

  if (
    input.source === "founder" ||
    input.source === "admin" ||
    input.severity === "high" ||
    input.severity === "medium"
  ) {
    return {
      safetyZone: "Z2_PREVIEW_REQUIRED" as const,
      trustBoundary: "no_code_execution" as const,
      recommendation:
        "Group this signal into ecosystem gap analysis. Any implementation must go through preview, build, typecheck and kernel tick.",
    };
  }

  return {
    safetyZone: "Z1_AUTO_SAFE" as const,
    trustBoundary: "no_code_execution" as const,
    recommendation:
      "Store signal for grouping and trend detection. Do not execute code from user signal.",
  };
}

function summarize(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= 180 ? clean : `${clean.slice(0, 177)}...`;
}

export async function createUserSignal(input: {
  text: string;
  actor?: string;
  source?: UserSignalSource;
}): Promise<UserSignalRecord> {
  const commandOrSignalText = String(input.text ?? "").trim();

  if (commandOrSignalText.length < 3) {
    throw new Error("User signal is too short.");
  }

  const actor = input.actor ?? "anonymous";
  const source = input.source ?? "user";
  const category = classifyCategory(commandOrSignalText);
  const severity = classifySeverity(commandOrSignalText);
  const zone = classifyZone({
    text: commandOrSignalText,
    source,
    severity,
  });

  const now = new Date().toISOString();

  const record: UserSignalRecord = {
    id: crypto.randomUUID(),
    version: 1,
    createdAt: now,
    updatedAt: now,
    actor,
    source,
    status: "received",
    category,
    severity,
    commandOrSignalText,
    safeSummary: summarize(commandOrSignalText),
    trustBoundary: zone.trustBoundary,
    safetyZone: zone.safetyZone,
    recommendation: zone.recommendation,
  };

  await appendUserSignal(record);

  await appendKernelAudit({
    id: crypto.randomUUID(),
    type: "kernel.user_signal.created",
    actor,
    createdAt: new Date().toISOString(),
    payload: {
      signalId: record.id,
      source,
      category,
      severity,
      safetyZone: record.safetyZone,
      trustBoundary: record.trustBoundary,
    },
  });

  return record;
}
