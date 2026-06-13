import type { AutonomousEngineeringWriteMode } from "@/core/kernel/autonomous-engineering-kernel";

export type PantavionProductionEnvCheck = {
  readonly ok: boolean;
  readonly marker: "pantavion_production_env_check_c8c_v1";
  readonly production: boolean;
  readonly autonomousSecretConfigured: boolean;
  readonly cronSecretConfigured: boolean;
  readonly githubTokenConfigured: boolean;
  readonly githubOwnerConfigured: boolean;
  readonly githubRepoConfigured: boolean;
  readonly baseBranchConfigured: boolean;
  readonly writeMode: AutonomousEngineeringWriteMode;
  readonly safeForObserve: boolean;
  readonly safeForGithubPr: boolean;
  readonly warnings: readonly string[];
  readonly requiredBeforeFullAutonomy: readonly string[];
};

const WRITE_MODES: readonly AutonomousEngineeringWriteMode[] = [
  "observe",
  "draft",
  "local_scaffold",
  "github_pr",
];

function isWriteMode(value: string | undefined): value is AutonomousEngineeringWriteMode {
  return typeof value === "string" && WRITE_MODES.includes(value as AutonomousEngineeringWriteMode);
}

function exists(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export function checkPantavionProductionAutonomyEnvironment(
  env: NodeJS.ProcessEnv = process.env,
): PantavionProductionEnvCheck {
  const production = env.NODE_ENV === "production";
  const autonomousSecretConfigured = exists(env.PANTAVION_AUTONOMOUS_SECRET);
  const cronSecretConfigured = exists(env.CRON_SECRET);
  const githubTokenConfigured = exists(env.PANTAVION_GITHUB_TOKEN);
  const githubOwnerConfigured = exists(env.PANTAVION_GITHUB_OWNER);
  const githubRepoConfigured = exists(env.PANTAVION_GITHUB_REPO);
  const baseBranchConfigured = exists(env.PANTAVION_GITHUB_BASE_BRANCH);
  const writeMode = isWriteMode(env.PANTAVION_AUTONOMOUS_WRITE_MODE)
    ? env.PANTAVION_AUTONOMOUS_WRITE_MODE
    : "observe";

  const warnings: string[] = [];
  const requiredBeforeFullAutonomy: string[] = [];

  if (!autonomousSecretConfigured && !cronSecretConfigured) {
    warnings.push("No autonomous/cron secret configured. Production mutation must stay blocked.");
    requiredBeforeFullAutonomy.push("Set PANTAVION_AUTONOMOUS_SECRET or CRON_SECRET.");
  }

  if (writeMode === "github_pr") {
    if (!githubTokenConfigured) requiredBeforeFullAutonomy.push("Set PANTAVION_GITHUB_TOKEN.");
    if (!githubOwnerConfigured) requiredBeforeFullAutonomy.push("Set PANTAVION_GITHUB_OWNER.");
    if (!githubRepoConfigured) requiredBeforeFullAutonomy.push("Set PANTAVION_GITHUB_REPO.");
    if (!baseBranchConfigured) requiredBeforeFullAutonomy.push("Set PANTAVION_GITHUB_BASE_BRANCH.");
  }

  const safeForObserve = true;
  const safeForGithubPr =
    (autonomousSecretConfigured || cronSecretConfigured) &&
    githubTokenConfigured &&
    githubOwnerConfigured &&
    githubRepoConfigured &&
    baseBranchConfigured;

  if (production && writeMode !== "observe" && !safeForGithubPr) {
    warnings.push("Production write mode is not fully configured for safe GitHub PR autonomy.");
  }

  return {
    ok: writeMode === "observe" || safeForGithubPr,
    marker: "pantavion_production_env_check_c8c_v1",
    production,
    autonomousSecretConfigured,
    cronSecretConfigured,
    githubTokenConfigured,
    githubOwnerConfigured,
    githubRepoConfigured,
    baseBranchConfigured,
    writeMode,
    safeForObserve,
    safeForGithubPr,
    warnings,
    requiredBeforeFullAutonomy,
  };
}

export const pantavion_production_env_check_marker_v1 =
  "pantavion_production_env_check_c8c_v1";
