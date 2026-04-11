import type {
  IntakePacket,
  KernelState,
  Plan,
  PlanStep,
  PriorityState,
  SignalEntry,
} from "./types";
import { createKernelId, nowIso } from "./types";

export interface PlanBuildInput {
  state: KernelState;
  packet: IntakePacket;
  signals: SignalEntry[];
  priority: PriorityState;
}

const step = (
  kind: PlanStep["kind"],
  title: string,
  description: string,
  requiresApproval: boolean = false,
  metadata: Record<string, unknown> = {}
): PlanStep => ({
  id: createKernelId("step"),
  kind,
  title,
  description,
  status: "pending",
  requiresApproval,
  metadata,
});

export const buildPlanFromAnalysis = (input: PlanBuildInput): Plan => {
  const lower = input.packet.normalizedText.toLowerCase();
  const strategic = input.signals.some((signal) => signal.type === "new_strategic_thread");
  const missingInfo = input.signals.some((signal) => signal.type === "missing_information");
  const risk = input.signals.some(
    (signal) => signal.type === "risk" || signal.type === "governance_concern"
  );

  const steps: PlanStep[] = [
    step("capture", "Capture canonical intake", "Normalize the intake and attach it to the kernel state."),
    step("memory", "Persist governed memory", "Store scoped memory entries with continuity metadata."),
    step("signal", "Evaluate signals", "Score urgency, risk, opportunity, and strategic relevance."),
    step("plan", "Prepare governed response path", "Construct the immediate response and next actions."),
  ];

  if (strategic) {
    steps.push(
      step(
        "plan",
        "Map kernel architecture impact",
        "Promote this thread into the Pantavion strategic kernel roadmap.",
        false,
        { strategic: true }
      )
    );
    steps.push(
      step(
        "plan",
        "Attach capability taxonomy relevance",
        "Relate the intake to workspaces, capability registry, and orchestration doctrine.",
        false,
        { taxonomy: true }
      )
    );
  }

  if (missingInfo) {
    steps.push(
      step(
        "clarify",
        "Clarification gate",
        "Request missing data only if it blocks execution or truthfulness.",
        false
      )
    );
  }

  if (risk) {
    steps.push(
      step(
        "governance",
        "Governance and safety review",
        "Check whether the execution path needs tighter controls or verification.",
        true
      )
    );
  }

  if (
    lower.includes("code") ||
    lower.includes("terminal") ||
    lower.includes("build") ||
    lower.includes("kernel")
  ) {
    steps.push(
      step(
        "execute",
        "Prepare implementation path",
        "Generate implementation-ready output or a safe execution simulation.",
        true
      )
    );
  } else {
    steps.push(
      step(
        "respond",
        "Deliver structured response",
        "Produce the best governed completion based on current state.",
        false
      )
    );
  }

  const confidence = missingInfo ? 0.72 : strategic ? 0.88 : 0.8;
  const now = nowIso();
  const goal =
    input.packet.intent === "build"
      ? "Advance Pantavion build intent"
      : input.packet.intent === "analyze"
      ? "Produce governed analysis"
      : "Handle user request with governed intelligence";

  return {
    id: createKernelId("plan"),
    createdAt: now,
    updatedAt: now,
    goal,
    summary:
      "Canonical kernel plan built from intake, memory, signals, and current Pantavion governance baseline.",
    sourceIntakeId: input.packet.id,
    status: "ready",
    priorityBand: input.priority.band,
    steps,
    notes: [
      "Kernel-first doctrine preserved.",
      "Continuity, memory, signal, planning, and governance remain coupled.",
      "Full-file and compact architecture preference retained.",
    ],
    fallbackPaths: [
      "If execution is blocked, return governed analysis only.",
      "If confidence drops, require clarification or verification.",
      "If commit mode is not approved, stay in dry-run mode.",
    ],
    approvalRequired: steps.some((currentStep) => currentStep.requiresApproval),
    confidence,
  };
};

export const flattenTasksFromPlans = (plans: Plan[]): PlanStep[] =>
  plans.flatMap((plan) => plan.steps);

/* PANTAVION_LEGACY_PLANNER_COMPAT */
const clonePlannerCompat = <T>(value: T): T =>
  JSON.parse(JSON.stringify(value)) as T;

export const addPlannerEntry = (state: any, plan: any): any => {
  const next = clonePlannerCompat(state ?? {});
  next.plans = Array.isArray(next.plans) ? next.plans : [];
  next.tasks = Array.isArray(next.tasks) ? next.tasks : [];

  const normalized: Plan = {
    id: plan?.id ?? createKernelId("plan"),
    createdAt: plan?.createdAt ?? nowIso(),
    updatedAt: nowIso(),
    goal: plan?.goal ?? plan?.title ?? "Legacy planner entry",
    summary:
      plan?.summary ??
      plan?.description ??
      "Legacy planner entry added for compatibility with app/evolution/page.tsx",
    sourceIntakeId: plan?.sourceIntakeId,
    status: plan?.status ?? "draft",
    priorityBand: plan?.priorityBand ?? "LOW",
    steps: Array.isArray(plan?.steps) ? plan.steps : [],
    notes: Array.isArray(plan?.notes) ? plan.notes : [],
    fallbackPaths: Array.isArray(plan?.fallbackPaths) ? plan.fallbackPaths : [],
    approvalRequired: Boolean(plan?.approvalRequired ?? false),
    confidence: typeof plan?.confidence === "number" ? plan.confidence : 0.6,
  };

  next.plans.push(normalized);

  if (Array.isArray(normalized.steps) && normalized.steps.length > 0) {
    next.tasks = [...next.tasks, ...normalized.steps];
  }

  return next;
};
