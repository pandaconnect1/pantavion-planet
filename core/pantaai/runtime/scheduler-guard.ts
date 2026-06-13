import type {
  AutonomousEngineeringWriteMode,
} from "@/core/kernel/autonomous-engineering-kernel";

export type PantavionSchedulerTrigger =
  | "cron"
  | "api"
  | "manual"
  | "test";

export type PantavionSchedulerDecision = {
  readonly ok: boolean;
  readonly trigger: PantavionSchedulerTrigger;
  readonly requestedMode?: AutonomousEngineeringWriteMode;
  readonly effectiveMode: AutonomousEngineeringWriteMode;
  readonly authorized: boolean;
  readonly production: boolean;
  readonly maxJobs: number;
  readonly blockedReason?: string;
  readonly protectedDomains: readonly string[];
};

const WRITE_MODES: readonly AutonomousEngineeringWriteMode[] = [
  "observe",
  "draft",
  "local_scaffold",
  "github_pr",
];

const MUTATION_MODES: readonly AutonomousEngineeringWriteMode[] = [
  "local_scaffold",
  "github_pr",
];

function isWriteMode(value: string | null | undefined): value is AutonomousEngineeringWriteMode {
  return typeof value === "string" && WRITE_MODES.includes(value as AutonomousEngineeringWriteMode);
}

function isMutationMode(value: AutonomousEngineeringWriteMode): boolean {
  return MUTATION_MODES.includes(value);
}

function clampMaxJobs(value: number, authorized: boolean): number {
  const safeDefault = authorized ? 3 : 1;
  if (!Number.isFinite(value)) return safeDefault;

  const upper = authorized ? 10 : 1;
  return Math.max(1, Math.min(Math.floor(value), upper));
}

export function isPantavionSchedulerAuthorized(request: Request): boolean {
  const autonomousSecret = process.env.PANTAVION_AUTONOMOUS_SECRET;
  const cronSecret = process.env.CRON_SECRET;
  const expectedSecrets = [autonomousSecret, cronSecret].filter(
    (value): value is string => typeof value === "string" && value.length > 0,
  );

  if (expectedSecrets.length === 0) {
    return process.env.NODE_ENV !== "production";
  }

  const auth = request.headers.get("authorization") ?? "";
  const headerSecret = request.headers.get("x-pantavion-autonomous-secret") ?? "";
  const cronHeader = request.headers.get("x-vercel-cron-secret") ?? "";

  return expectedSecrets.some(
    (secret) =>
      auth === `Bearer ${secret}` ||
      headerSecret === secret ||
      cronHeader === secret,
  );
}

export function decidePantavionSchedulerRun(request: Request): PantavionSchedulerDecision {
  const url = new URL(request.url);
  const authorized = isPantavionSchedulerAuthorized(request);
  const production = process.env.NODE_ENV === "production";

  const triggerRaw = url.searchParams.get("trigger");
  const trigger: PantavionSchedulerTrigger =
    triggerRaw === "api" || triggerRaw === "manual" || triggerRaw === "test"
      ? triggerRaw
      : "cron";

  const requestedModeRaw = url.searchParams.get("mode");
  const requestedMode = isWriteMode(requestedModeRaw) ? requestedModeRaw : undefined;

  const envMode = isWriteMode(process.env.PANTAVION_AUTONOMOUS_WRITE_MODE)
    ? process.env.PANTAVION_AUTONOMOUS_WRITE_MODE
    : "observe";

  const wantedMode = requestedMode ?? envMode;
  const effectiveMode: AutonomousEngineeringWriteMode = authorized ? wantedMode : "observe";

  const maxJobsRaw = Number(url.searchParams.get("maxJobs") ?? "");
  const maxJobs = clampMaxJobs(maxJobsRaw, authorized);

  if (production && isMutationMode(wantedMode) && !authorized) {
    return {
      ok: false,
      trigger,
      requestedMode,
      effectiveMode: "observe",
      authorized,
      production,
      maxJobs: 1,
      blockedReason:
        "Production autonomous mutation mode requires PANTAVION_AUTONOMOUS_SECRET or CRON_SECRET authorization.",
      protectedDomains: [
        "production",
        "water",
        "users",
        "payments",
        "identity",
        "sos",
        "legal",
        "private_data",
      ],
    };
  }

  return {
    ok: true,
    trigger,
    requestedMode,
    effectiveMode,
    authorized,
    production,
    maxJobs,
    protectedDomains: isMutationMode(effectiveMode)
      ? ["production", "protected_domain", "founder_gate"]
      : [],
  };
}

export const pantavion_scheduler_guard_marker_v1 =
  "pantavion_scheduler_guard_c8a_v1";
