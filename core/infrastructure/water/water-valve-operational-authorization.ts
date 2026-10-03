export type WaterValveOperationalRole =
  | "FOUNDER"
  | "ADMIN"
  | "FIELD_TECHNICIAN"
  | "SUPERVISOR";

export type WaterValveOperationalActor = {
  actorId: string;
  role: WaterValveOperationalRole;
  identityVerified: boolean;
  active: boolean;
};

export type WaterValveOperationalAuthorization =
  | { ok: true; actorId: string; role: WaterValveOperationalRole }
  | {
      ok: false;
      error:
        | "actor_unavailable"
        | "actor_inactive"
        | "actor_identity_unverified"
        | "role_not_authorized";
    };

const AUTHORIZED_VALVE_FIELD_ROLES = new Set<WaterValveOperationalRole>([
  "FOUNDER",
  "ADMIN",
  "FIELD_TECHNICIAN",
  "SUPERVISOR",
]);

export function authorizeWaterValveFieldAction(
  actor: WaterValveOperationalActor | null,
): WaterValveOperationalAuthorization {
  if (!actor || !actor.actorId.trim()) {
    return { ok: false, error: "actor_unavailable" };
  }
  if (!actor.active) {
    return { ok: false, error: "actor_inactive" };
  }
  if (!actor.identityVerified) {
    return { ok: false, error: "actor_identity_unverified" };
  }
  if (!AUTHORIZED_VALVE_FIELD_ROLES.has(actor.role)) {
    return { ok: false, error: "role_not_authorized" };
  }
  return { ok: true, actorId: actor.actorId, role: actor.role };
}
