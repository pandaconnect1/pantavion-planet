import {
  createPantavionExecutorAdapterPlans,
  type PantavionExecutorAdapterKind,
  type PantavionExecutorAdapterPlan,
} from "./executor-adapter-planner";

export type PantavionGeneratedExecutorAdapterDraft = {
  readonly id: string;
  readonly sourceAdapterPlanId: string;
  readonly kind: PantavionExecutorAdapterKind;
  readonly path: string;
  readonly title: string;
  readonly content: string;
  readonly gates: readonly string[];
};

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90);
}

function pascal(value: string): string {
  const result = value
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

  return result || "PantavionExecutorAdapter";
}

function targetPath(plan: PantavionExecutorAdapterPlan): string {
  return `core/pantaai/execution-adapters/generated/${slug(plan.id)}.ts`;
}

function createContent(plan: PantavionExecutorAdapterPlan): string {
  const exportName = pascal(plan.id);

  return [
    "// Auto-generated Pantavion executor adapter draft.",
    "// Generated from C6 executor adapter planner.",
    "// This is a kernel execution contract, not public UI.",
    "",
    `export const ${exportName}Adapter = {`,
    `  id: ${JSON.stringify(plan.id)},`,
    `  sourcePackageId: ${JSON.stringify(plan.sourcePackageId)},`,
    `  kind: ${JSON.stringify(plan.kind)},`,
    `  status: ${JSON.stringify(plan.status)},`,
    `  title: ${JSON.stringify(plan.title)},`,
    `  kernelFamily: ${JSON.stringify(plan.kernelFamily)},`,
    `  safeTargets: ${JSON.stringify(plan.safeTargets, null, 2)},`,
    `  gatedTargets: ${JSON.stringify(plan.gatedTargets, null, 2)},`,
    `  executionContract: ${JSON.stringify(plan.executionContract, null, 2)},`,
    `  gates: ${JSON.stringify(plan.gates, null, 2)},`,
    "  rules: [",
    '    "Pantavion-owned lawful execution only",',
    '    "No copied external brand, UI, logo, claim or ranking",',
    '    "No static-only visible capability",',
    '    "Provider-required adapters must not pretend to be active",',
    '    "Protected-domain adapters must stay founder/release gated for direct mutation"',
    "  ]",
    "} as const;",
    "",
    `export type ${exportName}Adapter = typeof ${exportName}Adapter;`,
    "",
    `export function execute${exportName}Adapter(input: {`,
    "  readonly intent: string;",
    "  readonly context?: unknown;",
    "}) {",
    "  return {",
    "    ok: true,",
    `    adapterId: ${exportName}Adapter.id,`,
    `    kind: ${exportName}Adapter.kind,`,
    `    kernelFamily: ${exportName}Adapter.kernelFamily,`,
    "    intent: input.intent,",
    '    executionStatus: "adapter_contract_ready",',
    '    nextAction: "connect_real_executor_provider_or_internal_runtime",',
    `    gates: ${exportName}Adapter.gates,`,
    '    protectedBy: "pantavion_autonomous_engineering_kernel"',
    "  };",
    "}",
    "",
  ].join("\n");
}

export function createPantavionGeneratedExecutorAdapterDrafts(
  maxAdapters = 9,
): readonly PantavionGeneratedExecutorAdapterDraft[] {
  return createPantavionExecutorAdapterPlans(maxAdapters).map((plan) => ({
    id: `draft-${slug(plan.id)}`,
    sourceAdapterPlanId: plan.id,
    kind: plan.kind,
    path: targetPath(plan),
    title: plan.title,
    content: createContent(plan),
    gates: plan.gates,
  }));
}

export const pantavion_executor_adapter_module_generator_marker_v1 =
  "pantavion_executor_adapter_module_generator_c6b_v1";
