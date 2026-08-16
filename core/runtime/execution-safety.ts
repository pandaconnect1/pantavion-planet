export type PantavionSafetyZone =
  | "Z1_AUTO_SAFE"
  | "Z2_PREVIEW_REQUIRED"
  | "Z3_FOUNDER_APPROVAL_REQUIRED"
  | "Z4_BLOCKED_MANUAL_ONLY";

export type SafetyVerdict = {
  zone: PantavionSafetyZone;
  allowed: boolean;
  reviewRequired: boolean;
  founderApprovalRequired: boolean;
  rollbackRequired: boolean;
  reason: string;
};

const z4Words = [
  "delete database",
  "drop table",
  "wipe",
  "secret",
  "private key",
  "production deploy",
  "force push",
  "payment",
  "billing",
  "user access",
  "auth",
  "water master",
  "dwg source",
];

const z3Words = [
  "deploy",
  "migration",
  "dependency",
  "package-lock",
  "github workflow",
  "provider",
  "api key",
  "storage",
  "database",
  "login",
  "sms",
  "email",
  "sos",
];

export function classifyExecution(input: {
  action: string;
  path?: string;
  actor?: string;
}): SafetyVerdict {
  const text = `${input.action} ${input.path ?? ""}`.toLowerCase();

  if (z4Words.some((word) => text.includes(word))) {
    return {
      zone: "Z4_BLOCKED_MANUAL_ONLY",
      allowed: false,
      reviewRequired: true,
      founderApprovalRequired: true,
      rollbackRequired: true,
      reason: "High-risk action is blocked without manual founder approval.",
    };
  }

  if (z3Words.some((word) => text.includes(word))) {
    return {
      zone: "Z3_FOUNDER_APPROVAL_REQUIRED",
      allowed: false,
      reviewRequired: true,
      founderApprovalRequired: true,
      rollbackRequired: true,
      reason: "Sensitive change requires founder approval before execution.",
    };
  }

  if (text.includes("route") || text.includes("runtime") || text.includes("agent")) {
    return {
      zone: "Z2_PREVIEW_REQUIRED",
      allowed: true,
      reviewRequired: true,
      founderApprovalRequired: false,
      rollbackRequired: true,
      reason: "Runtime-affecting change may proceed only through preview and checks.",
    };
  }

  return {
    zone: "Z1_AUTO_SAFE",
    allowed: true,
    reviewRequired: false,
    founderApprovalRequired: false,
    rollbackRequired: false,
    reason: "Low-risk internal read-only or report action.",
  };
}
