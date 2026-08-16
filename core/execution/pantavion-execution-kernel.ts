export type PantavionIntentGoal =
  | "build_business"
  | "learn_skill"
  | "create_media"
  | "automate_work"
  | "research_answer"
  | "social_messaging_dating"
  | "payments_vip"
  | "dwg_water"
  | "general_execution";

export type PantavionRiskZone = "Z1" | "Z2" | "Z3" | "Z4";

export type PantavionStepStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "skipped"
  | "gated";

export type PantavionCapabilityStatus =
  | "internal_runtime"
  | "requires_provider_adapter"
  | "requires_founder_approval"
  | "blocked";

export type PantavionIntent = {
  id: string;
  rawInput: string;
  normalizedInput: string;
  goal: PantavionIntentGoal;
  confidence: number;
  constraints: {
    budget?: "low" | "medium" | "high" | "unknown";
    skill?: "beginner" | "intermediate" | "advanced" | "unknown";
    urgency?: "low" | "medium" | "high" | "unknown";
    language?: string;
  };
  detectedSignals: string[];
  createdAt: string;
};

export type PantavionCapability = {
  id: string;
  title: string;
  type:
    | "planning"
    | "creation"
    | "development"
    | "growth"
    | "learning"
    | "research"
    | "automation"
    | "safety"
    | "billing"
    | "infrastructure";
  status: PantavionCapabilityStatus;
  riskZone: PantavionRiskZone;
  reliabilityScore: number;
  costTier: "free_internal" | "low" | "medium" | "high" | "provider_required";
  tools: string[];
  requiresFounderApproval: boolean;
};

export type PantavionPlanStep = {
  id: string;
  title: string;
  capabilityId: string;
  status: PantavionStepStatus;
  reason: string;
};

export type PantavionPlan = {
  id: string;
  intentId: string;
  title: string;
  steps: PantavionPlanStep[];
  createdAt: string;
};

export type PantavionExecutionArtifact = {
  stepId: string;
  capabilityId: string;
  status: PantavionStepStatus;
  summary: string;
  output: Record<string, unknown>;
  auditTags: string[];
};

export type PantavionExecutionResult = {
  ok: true;
  runtime: "pantavion_execution_kernel_v1";
  actor: string;
  intent: PantavionIntent;
  plan: PantavionPlan;
  artifacts: PantavionExecutionArtifact[];
  context: Record<string, unknown>;
  finalStatus: "completed" | "partial" | "gated" | "failed";
  responseOptions: {
    short: string;
    deep: string;
    nextActions: string[];
  };
  safety: {
    blockedActions: string[];
    approvalRequired: string[];
  };
  completedAt: string;
};

export const PANTAVION_EXECUTION_KERNEL_ID =
  "pantavion_execution_kernel_v1";

export const PANTAVION_CAPABILITY_REGISTRY: Record<string, PantavionCapability> = {
  intent_structuring: {
    id: "intent_structuring",
    title: "Intent Structuring",
    type: "planning",
    status: "internal_runtime",
    riskZone: "Z1",
    reliabilityScore: 0.86,
    costTier: "free_internal",
    tools: ["pantavion_internal_reasoner"],
    requiresFounderApproval: false
  },
  idea_generation: {
    id: "idea_generation",
    title: "Business / Project Idea Generation",
    type: "creation",
    status: "internal_runtime",
    riskZone: "Z1",
    reliabilityScore: 0.82,
    costTier: "free_internal",
    tools: ["pantavion_internal_planner"],
    requiresFounderApproval: false
  },
  brand_generation: {
    id: "brand_generation",
    title: "Brand Direction",
    type: "creation",
    status: "internal_runtime",
    riskZone: "Z1",
    reliabilityScore: 0.78,
    costTier: "free_internal",
    tools: ["pantavion_internal_creator"],
    requiresFounderApproval: false
  },
  website_blueprint: {
    id: "website_blueprint",
    title: "Website / App Blueprint",
    type: "development",
    status: "internal_runtime",
    riskZone: "Z2",
    reliabilityScore: 0.76,
    costTier: "free_internal",
    tools: ["nextjs", "pantavion_ui_blueprint"],
    requiresFounderApproval: false
  },
  marketing_plan: {
    id: "marketing_plan",
    title: "Marketing / Growth Plan",
    type: "growth",
    status: "internal_runtime",
    riskZone: "Z2",
    reliabilityScore: 0.77,
    costTier: "free_internal",
    tools: ["pantavion_growth_planner"],
    requiresFounderApproval: false
  },
  learning_path: {
    id: "learning_path",
    title: "Learning Path Builder",
    type: "learning",
    status: "internal_runtime",
    riskZone: "Z1",
    reliabilityScore: 0.81,
    costTier: "free_internal",
    tools: ["pantavion_learning_planner"],
    requiresFounderApproval: false
  },
  research_brief: {
    id: "research_brief",
    title: "Research Brief",
    type: "research",
    status: "requires_provider_adapter",
    riskZone: "Z2",
    reliabilityScore: 0.74,
    costTier: "provider_required",
    tools: ["future_search_adapter", "source_citation_adapter"],
    requiresFounderApproval: false
  },
  automation_plan: {
    id: "automation_plan",
    title: "Workflow Automation Plan",
    type: "automation",
    status: "internal_runtime",
    riskZone: "Z2",
    reliabilityScore: 0.76,
    costTier: "free_internal",
    tools: ["pantavion_workflow_planner"],
    requiresFounderApproval: false
  },
  social_safety_gate: {
    id: "social_safety_gate",
    title: "Social / Messaging / Dating Safety Gate",
    type: "safety",
    status: "requires_founder_approval",
    riskZone: "Z3",
    reliabilityScore: 0.8,
    costTier: "medium",
    tools: ["identity", "moderation", "age_gate", "report_block"],
    requiresFounderApproval: true
  },
  billing_vip_gate: {
    id: "billing_vip_gate",
    title: "Billing / Stripe / VIP Gate",
    type: "billing",
    status: "requires_founder_approval",
    riskZone: "Z3",
    reliabilityScore: 0.78,
    costTier: "provider_required",
    tools: ["stripe_future_adapter", "entitlement_registry"],
    requiresFounderApproval: true
  },
  dwg_source_truth_gate: {
    id: "dwg_source_truth_gate",
    title: "DWG / Water Source Truth Gate",
    type: "infrastructure",
    status: "requires_founder_approval",
    riskZone: "Z3",
    reliabilityScore: 0.86,
    costTier: "provider_required",
    tools: ["licensed_dwg_adapter_required", "private_vault"],
    requiresFounderApproval: true
  }
};

function normalizeText(input: string): string {
  return input.trim().replace(/\s+/g, " ");
}

function lower(input: string): string {
  return normalizeText(input).toLowerCase();
}

function includesAny(value: string, needles: string[]): boolean {
  return needles.some((needle) => value.includes(needle));
}

function inferGoal(input: string): PantavionIntentGoal {
  const value = lower(input);

  if (includesAny(value, ["business", "money", "λεφτ", "startup", "website", "site", "saas", "eshop"])) {
    return "build_business";
  }

  if (includesAny(value, ["learn", "course", "skill", "μαθ", "εκπαιδ", "cyber", "programming"])) {
    return "learn_skill";
  }

  if (includesAny(value, ["video", "image", "logo", "content", "creator", "canva", "media", "design"])) {
    return "create_media";
  }

  if (includesAny(value, ["automate", "automation", "workflow", "zapier", "make", "process", "εργασια"])) {
    return "automate_work";
  }

  if (includesAny(value, ["research", "ψαξ", "αναλυση", "analyze", "compare", "deep"])) {
    return "research_answer";
  }

  if (includesAny(value, ["facebook", "instagram", "telegram", "chat", "dating", "tinder", "grindr", "gaydar"])) {
    return "social_messaging_dating";
  }

  if (includesAny(value, ["stripe", "billing", "payment", "vip", "subscription", "πληρω"])) {
    return "payments_vip";
  }

  if (includesAny(value, ["dwg", "dxf", "water", "υδρευση", "ύδρευση", "cad", "gis"])) {
    return "dwg_water";
  }

  return "general_execution";
}

function inferConstraints(input: string): PantavionIntent["constraints"] {
  const value = lower(input);

  return {
    budget:
      includesAny(value, ["no money", "χωρις λεφτα", "χωρίς λεφτά", "low budget", "free"])
        ? "low"
        : includesAny(value, ["enterprise", "vip", "premium"])
          ? "high"
          : "unknown",
    skill:
      includesAny(value, ["beginner", "αρχαρι", "δεν ξερω"])
        ? "beginner"
        : includesAny(value, ["advanced", "expert", "pro"])
          ? "advanced"
          : "unknown",
    urgency:
      includesAny(value, ["urgent", "αμεσα", "τώρα", "now", "fast"])
        ? "high"
        : "unknown",
    language: /[α-ωΑ-Ω]/.test(input) ? "el" : "auto"
  };
}

function detectSignals(input: string): string[] {
  const value = lower(input);
  const signals: string[] = [];

  if (includesAny(value, ["real", "alith", "αληθ", "not static", "οχι στατικ"])) signals.push("wants_real_execution");
  if (includesAny(value, ["agent", "kernel", "ai", "automatic", "automata", "αυτομα"])) signals.push("agentic_execution_requested");
  if (includesAny(value, ["old files", "παλια", "recovery", "doctrine", "snapshot"])) signals.push("legacy_recovery_requested");
  if (includesAny(value, ["repo", "github", "deploy"])) signals.push("repo_deploy_requested");
  if (includesAny(value, ["approval", "founder"])) signals.push("founder_gate_required");

  return signals.length ? signals : ["general_user_goal"];
}

export function parsePantavionIntent(input: string): PantavionIntent {
  const normalizedInput = normalizeText(input);

  return {
    id: `intent_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    rawInput: input,
    normalizedInput,
    goal: inferGoal(normalizedInput),
    confidence: normalizedInput.length > 0 ? 0.78 : 0.2,
    constraints: inferConstraints(normalizedInput),
    detectedSignals: detectSignals(normalizedInput),
    createdAt: new Date().toISOString()
  };
}

function step(id: string, title: string, capabilityId: string, reason: string): PantavionPlanStep {
  return {
    id,
    title,
    capabilityId,
    reason,
    status: "pending"
  };
}

export function generatePantavionPlan(intent: PantavionIntent): PantavionPlan {
  let steps: PantavionPlanStep[] = [
    step("intent", "Structure user intent", "intent_structuring", "Every execution starts from normalized intent.")
  ];

  if (intent.goal === "build_business") {
    steps = [
      ...steps,
      step("idea", "Generate business idea", "idea_generation", "Convert user goal into a viable business direction."),
      step("brand", "Create brand direction", "brand_generation", "Turn the idea into a name, tone and positioning."),
      step("site", "Create website/app blueprint", "website_blueprint", "Produce a buildable Next.js/PWA blueprint."),
      step("growth", "Create marketing plan", "marketing_plan", "Prepare first growth channels and launch actions.")
    ];
  } else if (intent.goal === "learn_skill") {
    steps = [
      ...steps,
      step("path", "Build learning path", "learning_path", "Create staged learning plan from beginner to practical output."),
      step("practice", "Create practice execution plan", "automation_plan", "Turn learning into daily executable work.")
    ];
  } else if (intent.goal === "create_media") {
    steps = [
      ...steps,
      step("creative", "Create media concept", "idea_generation", "Convert request into creative direction."),
      step("production", "Create production workflow", "automation_plan", "Map tools, steps and output artifacts.")
    ];
  } else if (intent.goal === "automate_work") {
    steps = [
      ...steps,
      step("workflow", "Design automation workflow", "automation_plan", "Map trigger, actions, state and output.")
    ];
  } else if (intent.goal === "research_answer") {
    steps = [
      ...steps,
      step("brief", "Create research brief", "research_brief", "Prepare source-backed research work order.")
    ];
  } else if (intent.goal === "social_messaging_dating") {
    steps = [
      ...steps,
      step("safety", "Apply social/messaging/dating safety gate", "social_safety_gate", "Identity, consent and safety are mandatory.")
    ];
  } else if (intent.goal === "payments_vip") {
    steps = [
      ...steps,
      step("billing", "Apply billing/VIP approval gate", "billing_vip_gate", "Payments and VIP entitlements require approval.")
    ];
  } else if (intent.goal === "dwg_water") {
    steps = [
      ...steps,
      step("dwg", "Apply DWG source-truth gate", "dwg_source_truth_gate", "Original DWG/CAD source truth must be protected.")
    ];
  } else {
    steps = [
      ...steps,
      step("brief", "Create general execution brief", "research_brief", "Convert unknown request into structured next actions.")
    ];
  }

  return {
    id: `plan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    intentId: intent.id,
    title: `Pantavion plan for ${intent.goal}`,
    steps,
    createdAt: new Date().toISOString()
  };
}

function makeArtifact(
  stepItem: PantavionPlanStep,
  status: PantavionStepStatus,
  summary: string,
  output: Record<string, unknown>
): PantavionExecutionArtifact {
  return {
    stepId: stepItem.id,
    capabilityId: stepItem.capabilityId,
    status,
    summary,
    output,
    auditTags: ["pantavion_execution", stepItem.capabilityId, status]
  };
}

async function executeCapability(
  planStep: PantavionPlanStep,
  capability: PantavionCapability,
  context: Record<string, unknown>
): Promise<PantavionExecutionArtifact> {
  if (capability.requiresFounderApproval || capability.riskZone === "Z3" || capability.riskZone === "Z4") {
    return makeArtifact(planStep, "gated", `${capability.title} is gated and requires founder approval.`, {
      capability,
      requiredGate: "founder_approval",
      reason: planStep.reason
    });
  }

  if (capability.id === "intent_structuring") {
    return makeArtifact(planStep, "completed", "Intent structured into Pantavion execution context.", {
      structuredContext: context
    });
  }

  if (capability.id === "idea_generation") {
    const idea = `Pantavion-guided ${String(context.goal || "project")} with clear outcome, low-friction entry and execution path.`;

    return makeArtifact(planStep, "completed", "Generated a viable idea direction.", {
      idea,
      nextNeed: "brand_direction"
    });
  }

  if (capability.id === "brand_generation") {
    return makeArtifact(planStep, "completed", "Generated brand direction.", {
      brandName: "Pantavion Launch Path",
      positioning: "Result-first execution system, not a tool list.",
      tone: "premium, global, human-first"
    });
  }

  if (capability.id === "website_blueprint") {
    return makeArtifact(planStep, "completed", "Generated buildable website/app blueprint.", {
      route: "/pantavion/entry",
      api: "/api/pantavion/execute",
      sections: ["hero", "intent_input", "plan_preview", "execution_status", "next_actions"],
      stack: ["Next.js", "TypeScript", "Tailwind", "Pantavion Kernel"]
    });
  }

  if (capability.id === "marketing_plan") {
    return makeArtifact(planStep, "completed", "Generated first marketing plan.", {
      channels: ["founder network", "B2B demos", "short videos", "referral loop"],
      firstOffer: "Build your first execution path with Pantavion.",
      metric: "activated users completing one real flow"
    });
  }

  if (capability.id === "learning_path") {
    return makeArtifact(planStep, "completed", "Generated learning path.", {
      stages: ["foundation", "guided practice", "project", "review", "real output"],
      dailyLoop: ["learn", "do", "check", "improve"]
    });
  }

  if (capability.id === "automation_plan") {
    return makeArtifact(planStep, "completed", "Generated automation/workflow plan.", {
      workflow: ["trigger", "classify", "choose capability", "execute", "audit", "return result"],
      needsAdapter: false
    });
  }

  if (capability.id === "research_brief") {
    return makeArtifact(planStep, "completed", "Generated research brief and provider-adapter work order.", {
      researchStatus: "provider_adapter_required_for_live_sources",
      currentOutput: "structured research plan",
      needs: ["source adapter", "citation policy", "freshness scoring"]
    });
  }

  return makeArtifact(planStep, "failed", "Unknown capability handler.", {
    capabilityId: capability.id
  });
}

export async function executePantavionPlan(
  plan: PantavionPlan,
  intent: PantavionIntent
): Promise<{
  artifacts: PantavionExecutionArtifact[];
  context: Record<string, unknown>;
  finalStatus: "completed" | "partial" | "gated" | "failed";
}> {
  const context: Record<string, unknown> = {
    goal: intent.goal,
    input: intent.normalizedInput,
    constraints: intent.constraints,
    signals: intent.detectedSignals
  };

  const artifacts: PantavionExecutionArtifact[] = [];

  for (const planStep of plan.steps) {
    const capability = PANTAVION_CAPABILITY_REGISTRY[planStep.capabilityId];

    if (!capability) {
      artifacts.push(makeArtifact(planStep, "failed", "Capability missing from registry.", {
        missingCapabilityId: planStep.capabilityId
      }));

      return { artifacts, context, finalStatus: "failed" };
    }

    planStep.status = "running";
    const artifact = await executeCapability(planStep, capability, context);
    artifacts.push(artifact);
    planStep.status = artifact.status;

    Object.assign(context, artifact.output);
  }

  const gated = artifacts.some((artifact) => artifact.status === "gated");
  const failed = artifacts.some((artifact) => artifact.status === "failed");

  return {
    artifacts,
    context,
    finalStatus: failed ? "failed" : gated ? "gated" : "completed"
  };
}

export async function runPantavionExecution(
  input: string,
  actor = "anonymous_or_internal_user"
): Promise<PantavionExecutionResult> {
  const intent = parsePantavionIntent(input);
  const plan = generatePantavionPlan(intent);
  const execution = await executePantavionPlan(plan, intent);

  const approvalRequired = execution.artifacts
    .filter((artifact) => artifact.status === "gated")
    .map((artifact) => artifact.summary);

  return {
    ok: true,
    runtime: PANTAVION_EXECUTION_KERNEL_ID,
    actor,
    intent,
    plan,
    artifacts: execution.artifacts,
    context: execution.context,
    finalStatus: execution.finalStatus,
    responseOptions: {
      short:
        execution.finalStatus === "completed"
          ? "Pantavion converted the request into a plan and executed the safe internal steps."
          : "Pantavion converted the request into a plan; sensitive steps are gated.",
      deep:
        "Pantavion handled the request through intent structuring, capability mapping, plan generation, execution state and audit-tagged artifacts. Provider, billing, social, DWG and production actions remain gated.",
      nextActions: [
        "Persist this execution into user/project memory after auth and consent exist.",
        "Connect provider adapters for live AI/search/voice actions.",
        "Promote safe repeated patterns into agent work orders.",
        "Request founder approval for Z3/Z4 actions."
      ]
    },
    safety: {
      blockedActions: [
        "No unsafe scraping.",
        "No secret exposure.",
        "No production billing without approval.",
        "No DWG/source-truth transformation without approval.",
        "No social/dating/messaging production claims without identity and safety gates."
      ],
      approvalRequired
    },
    completedAt: new Date().toISOString()
  };
}
