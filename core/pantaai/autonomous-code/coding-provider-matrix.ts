export type PantavionCodingProviderId =
  | "cursor"
  | "claude_code"
  | "codex"
  | "windsurf"
  | "copilot"
  | "replit"
  | "devin"
  | "amazon_q";

export type PantavionCodingTask =
  | "repo_scan"
  | "bug_fix"
  | "new_feature"
  | "refactor"
  | "test_generation"
  | "build_repair"
  | "typescript_repair"
  | "documentation"
  | "cloud_infra"
  | "autonomous_pr";

export type PantavionCodingProvider = {
  id: PantavionCodingProviderId;
  label: string;
  observedPattern: string;
  supportedTasks: PantavionCodingTask[];
  pantavionOwnedRole: string;
  safetyGates: string[];
  status: "source_signal" | "internal_pattern_active" | "requires_provider" | "requires_connector";
};

export const PANTAVION_CODING_PROVIDER_MATRIX: PantavionCodingProvider[] = [
  {
    id: "cursor",
    label: "Cursor",
    observedPattern: "AI-first code editor and repo-aware coding flow.",
    supportedTasks: ["repo_scan", "bug_fix", "new_feature", "refactor", "documentation"],
    pantavionOwnedRole: "PandaDev IDE-pattern planner and codebase navigator.",
    safetyGates: ["repo_truth", "scoped_patch", "no_secret_exposure", "build_typecheck"],
    status: "source_signal",
  },
  {
    id: "claude_code",
    label: "Claude Code",
    observedPattern: "Terminal/codebase autonomous coding agent pattern.",
    supportedTasks: ["repo_scan", "refactor", "bug_fix", "typescript_repair", "documentation"],
    pantavionOwnedRole: "PandaDev terminal-agent pattern for large multi-file reasoning and repair.",
    safetyGates: ["repo_truth", "protected_path_policy", "founder_gate_for_protected_domains"],
    status: "source_signal",
  },
  {
    id: "codex",
    label: "OpenAI Codex",
    observedPattern: "Autonomous code generation and software task execution.",
    supportedTasks: ["bug_fix", "new_feature", "test_generation", "build_repair", "autonomous_pr"],
    pantavionOwnedRole: "PandaDev code writer and PR generator lane.",
    safetyGates: ["scoped_patch", "build_typecheck", "audit", "rollback_plan"],
    status: "requires_provider",
  },
  {
    id: "windsurf",
    label: "Windsurf",
    observedPattern: "Agentic IDE and code flow pattern.",
    supportedTasks: ["repo_scan", "new_feature", "refactor", "bug_fix"],
    pantavionOwnedRole: "PandaDev flow-state coding and multi-file edit planning.",
    safetyGates: ["scoped_patch", "dead_feature_gate", "no_fake_ui_gate"],
    status: "source_signal",
  },
  {
    id: "copilot",
    label: "GitHub Copilot",
    observedPattern: "Code suggestion and GitHub ecosystem coding assistance.",
    supportedTasks: ["bug_fix", "test_generation", "documentation", "typescript_repair"],
    pantavionOwnedRole: "Code suggestion support and GitHub-integrated assistant candidate.",
    safetyGates: ["github_permission_check", "scoped_patch", "audit"],
    status: "requires_provider",
  },
  {
    id: "replit",
    label: "Replit",
    observedPattern: "Cloud coding, prototype and sandbox pattern.",
    supportedTasks: ["new_feature", "documentation", "cloud_infra"],
    pantavionOwnedRole: "Cloud prototype/sandbox execution model for Pantavion experiments.",
    safetyGates: ["sandbox_only", "no_production_secret", "no_raw_data"],
    status: "source_signal",
  },
  {
    id: "devin",
    label: "Devin",
    observedPattern: "Autonomous software engineer agent pattern.",
    supportedTasks: ["repo_scan", "bug_fix", "new_feature", "build_repair", "autonomous_pr"],
    pantavionOwnedRole: "Long-running PandaDev autonomous engineering worker.",
    safetyGates: ["job_queue", "protected_domain_policy", "founder_gate", "no_auto_merge"],
    status: "source_signal",
  },
  {
    id: "amazon_q",
    label: "Amazon Q Developer",
    observedPattern: "Cloud/AWS-aware development assistant pattern.",
    supportedTasks: ["cloud_infra", "documentation", "bug_fix"],
    pantavionOwnedRole: "Cloud-provider-aware coding lane for infrastructure work.",
    safetyGates: ["cloud_permission_check", "secret_policy", "founder_gate_for_infra"],
    status: "requires_provider",
  },
];

export function selectCodingProvider(task: PantavionCodingTask): PantavionCodingProvider {
  const direct = PANTAVION_CODING_PROVIDER_MATRIX.find((provider) =>
    provider.supportedTasks.includes(task),
  );

  return direct ?? PANTAVION_CODING_PROVIDER_MATRIX[0];
}

export const pantavion_coding_provider_matrix_marker_v1 =
  "pantavion_coding_provider_matrix_c3_v1";
