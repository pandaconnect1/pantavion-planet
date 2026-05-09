import {
  isAuthorizedWaterPerson,
  type PantavionWaterAuthorizedPerson,
} from "./water-serving-contract";

export const PANTAVION_WATER_CONTROLLED_ACCESS_VERSION =
  "water-controlled-access-v1" as const;

export type PantavionWaterControlledAccessMode =
  | "denied"
  | "viewer"
  | "operator"
  | "admin"
  | "founder-admin";

export interface PantavionWaterAccessDecision {
  allowed: boolean;
  mode: PantavionWaterControlledAccessMode;
  blockers: string[];
  mayViewControlledNetwork: boolean;
  mayViewFullControlledFounderScope: boolean;
  mayExportRawNetwork: false;
}

function normalizeAccessLevel(accessLevel: string): string {
  return accessLevel.trim().toLowerCase();
}

export function evaluateControlledWaterAccess(
  person: PantavionWaterAuthorizedPerson,
): PantavionWaterAccessDecision {
  const blockers: string[] = [];

  if (!isAuthorizedWaterPerson(person)) {
    blockers.push(
      "Authorized water access requires first name, last name, title, access level, and active status.",
    );
  }

  if (person.status === "inactive") {
    blockers.push("Water access is inactive.");
  }

  if (person.status === "revoked") {
    blockers.push("Water access is revoked.");
  }

  const accessLevel = normalizeAccessLevel(person.accessLevel);

  const isFounderAdmin =
    accessLevel === "founder-admin" ||
    accessLevel === "founder-admin-diagnostic" ||
    accessLevel === "founder" ||
    accessLevel === "admin-owner";

  const isAdmin = isFounderAdmin || accessLevel === "admin" || accessLevel === "network-admin";
  const isOperator = isAdmin || accessLevel === "operator" || accessLevel === "field-operator";
  const isViewer = isOperator || accessLevel === "viewer" || accessLevel === "read-only";

  if (!isViewer) {
    blockers.push("Water access level is not permitted.");
  }

  if (blockers.length > 0) {
    return {
      allowed: false,
      mode: "denied",
      blockers,
      mayViewControlledNetwork: false,
      mayViewFullControlledFounderScope: false,
      mayExportRawNetwork: false,
    };
  }

  return {
    allowed: true,
    mode: isFounderAdmin ? "founder-admin" : isAdmin ? "admin" : isOperator ? "operator" : "viewer",
    blockers: [],
    mayViewControlledNetwork: true,
    mayViewFullControlledFounderScope: isFounderAdmin,
    mayExportRawNetwork: false,
  };
}
