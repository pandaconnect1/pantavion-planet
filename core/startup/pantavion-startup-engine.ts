export type StartupStageKey =
  | "problem"
  | "customer"
  | "market"
  | "solution"
  | "business-model"
  | "validation"
  | "product"
  | "go-to-market"
  | "finance"
  | "funding"
  | "operations"
  | "risk-compliance"
  | "metrics"
  | "scale";

export interface StartupStageDefinition {
  key: StartupStageKey;
  title: string;
  purpose: string;
  requiredEvidence: string[];
  outputs: string[];
  pantaAiLanes: string[];
}

export interface StartupIntake {
  idea?: string;
  problem?: string;
  targetCustomer?: string;
  geography?: string;
  sector?: string;
  stage?: string;
  budget?: string;
  founderGoal?: string;
}

export interface StartupExecutionPacket {
  id: string;
  createdAt: string;
  status: "planning";
  truthMode: "evidence-first";
  intake: Required<StartupIntake>;
  currentStage: StartupStageKey;
  stages: StartupStageDefinition[];
  nextActions: string[];
  evidenceGaps: string[];
  governance: string[];
}

export const PANTAVION_STARTUP_STAGES: StartupStageDefinition[] = [
  {
    key: "problem",
    title: "Problem",
    purpose: "Define the real problem before building a solution.",
    requiredEvidence: ["Observed pain", "Frequency", "Current workaround", "Cost of inaction"],
    outputs: ["Problem statement", "Assumption register"],
    pantaAiLanes: ["research", "critical-thinking", "memory"],
  },
  {
    key: "customer",
    title: "Customer",
    purpose: "Identify who has the problem, who uses the product and who pays.",
    requiredEvidence: ["Customer segments", "User/payor distinction", "Interview evidence"],
    outputs: ["ICP", "Personas", "Interview plan"],
    pantaAiLanes: ["research", "people", "notes-memory"],
  },
  {
    key: "market",
    title: "Market",
    purpose: "Measure demand, alternatives, geography and competitive pressure.",
    requiredEvidence: ["TAM/SAM/SOM assumptions", "Competitor alternatives", "Market timing"],
    outputs: ["Market map", "Opportunity thesis"],
    pantaAiLanes: ["deep-research", "data-analysis", "critical-thinking"],
  },
  {
    key: "solution",
    title: "Solution",
    purpose: "Map the smallest differentiated solution to the validated problem.",
    requiredEvidence: ["Problem-solution fit hypothesis", "Differentiation", "User outcome"],
    outputs: ["Value proposition", "Solution scope"],
    pantaAiLanes: ["general-ai-assistance", "design-image", "critical-thinking"],
  },
  {
    key: "business-model",
    title: "Business model",
    purpose: "Define how value is delivered and how revenue can be earned sustainably.",
    requiredEvidence: ["Pricing assumptions", "Unit economics assumptions", "Channel economics"],
    outputs: ["Revenue model", "Pricing hypotheses", "Cost model"],
    pantaAiLanes: ["business-strategy", "finance-aware-guidance", "data-analysis"],
  },
  {
    key: "validation",
    title: "Validation",
    purpose: "Test the riskiest assumptions with measurable experiments.",
    requiredEvidence: ["Experiment design", "Success threshold", "Observed result"],
    outputs: ["Validation ledger", "Keep/change/stop decision"],
    pantaAiLanes: ["deep-research", "data-analysis", "automation-agents"],
  },
  {
    key: "product",
    title: "Product",
    purpose: "Build the smallest real product that can test value and retention.",
    requiredEvidence: ["Acceptance criteria", "Working backend", "Connected UI", "Test result"],
    outputs: ["MVP scope", "Implementation backlog", "Release evidence"],
    pantaAiLanes: ["coding-build", "app-website-builder", "automation-agents"],
  },
  {
    key: "go-to-market",
    title: "Go to market",
    purpose: "Choose channels, messaging, onboarding and launch sequence.",
    requiredEvidence: ["Channel tests", "Acquisition cost assumptions", "Conversion evidence"],
    outputs: ["GTM plan", "Launch experiments", "Messaging matrix"],
    pantaAiLanes: ["business-strategy", "writing-editing", "design-image"],
  },
  {
    key: "finance",
    title: "Finance",
    purpose: "Model cash needs, runway, revenue, costs and downside scenarios.",
    requiredEvidence: ["Budget", "Runway", "Base/upside/downside scenarios"],
    outputs: ["Financial model", "Cash plan", "Milestone budget"],
    pantaAiLanes: ["finance-aware-guidance", "data-analysis"],
  },
  {
    key: "funding",
    title: "Funding",
    purpose: "Match funding source to stage, evidence, ownership and obligations.",
    requiredEvidence: ["Use of funds", "Milestones", "Funding terms", "Eligibility evidence"],
    outputs: ["Funding strategy", "Application/investor evidence pack"],
    pantaAiLanes: ["deep-research", "business-strategy", "productivity-documents"],
  },
  {
    key: "operations",
    title: "Operations",
    purpose: "Create repeatable delivery, ownership, support and execution routines.",
    requiredEvidence: ["Process owners", "Service levels", "Operational risks"],
    outputs: ["Operating model", "Workflow map", "Responsibility matrix"],
    pantaAiLanes: ["automation-agents", "productivity-documents", "notes-memory"],
  },
  {
    key: "risk-compliance",
    title: "Risk & compliance",
    purpose: "Identify legal, privacy, safety, security and sector obligations early.",
    requiredEvidence: ["Jurisdiction", "Data flows", "Safety risks", "Security controls"],
    outputs: ["Risk register", "Compliance checklist", "Escalation list"],
    pantaAiLanes: ["security-defense", "deep-research", "critical-thinking"],
  },
  {
    key: "metrics",
    title: "Metrics",
    purpose: "Measure product value, growth, retention, economics and execution truthfully.",
    requiredEvidence: ["North-star metric", "Retention", "Conversion", "Unit economics"],
    outputs: ["Metric tree", "Dashboard specification"],
    pantaAiLanes: ["data-analysis", "automation-agents"],
  },
  {
    key: "scale",
    title: "Scale",
    purpose: "Scale only after repeatable value, delivery and economics are evidenced.",
    requiredEvidence: ["Retention stability", "Repeatable acquisition", "Operational capacity", "Runway"],
    outputs: ["Scale gates", "Expansion roadmap"],
    pantaAiLanes: ["business-strategy", "automation-agents", "data-analysis"],
  },
];

export function createStartupExecutionPacket(input: StartupIntake): StartupExecutionPacket {
  const normalized: Required<StartupIntake> = {
    idea: clean(input.idea),
    problem: clean(input.problem),
    targetCustomer: clean(input.targetCustomer),
    geography: clean(input.geography),
    sector: clean(input.sector),
    stage: clean(input.stage),
    budget: clean(input.budget),
    founderGoal: clean(input.founderGoal),
  };

  const currentStage = inferCurrentStage(normalized);
  const evidenceGaps = buildEvidenceGaps(normalized, currentStage);

  return {
    id: `startup_${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: "planning",
    truthMode: "evidence-first",
    intake: normalized,
    currentStage,
    stages: PANTAVION_STARTUP_STAGES.map((stage) => ({
      ...stage,
      requiredEvidence: [...stage.requiredEvidence],
      outputs: [...stage.outputs],
      pantaAiLanes: [...stage.pantaAiLanes],
    })),
    nextActions: buildNextActions(currentStage, evidenceGaps),
    evidenceGaps,
    governance: [
      "Do not call assumptions facts.",
      "Current market, funding, legal and regulatory claims require verification.",
      "No external action, application, purchase, publication or message is sent without explicit authorization.",
      "Sensitive user or company data must follow consent, access and retention controls.",
      "A startup capability is not DONE until backend, UI, tests, deployment and live verification are evidenced.",
    ],
  };
}

function inferCurrentStage(input: Required<StartupIntake>): StartupStageKey {
  if (!input.problem) return "problem";
  if (!input.targetCustomer) return "customer";
  if (!input.geography || !input.sector) return "market";
  if (!input.idea) return "solution";
  return "validation";
}

function buildEvidenceGaps(input: Required<StartupIntake>, currentStage: StartupStageKey): string[] {
  const gaps: string[] = [];
  if (!input.problem) gaps.push("Concrete problem statement");
  if (!input.targetCustomer) gaps.push("Target customer / user / payor definition");
  if (!input.geography) gaps.push("Target geography");
  if (!input.sector) gaps.push("Sector / market category");
  if (!input.idea) gaps.push("Proposed solution");
  if (!input.budget) gaps.push("Available budget or funding constraint");
  if (!input.founderGoal) gaps.push("Founder goal and success definition");

  const stage = PANTAVION_STARTUP_STAGES.find((item) => item.key === currentStage);
  if (stage) gaps.push(...stage.requiredEvidence.map((item) => `${stage.title}: ${item}`));
  return Array.from(new Set(gaps));
}

function buildNextActions(currentStage: StartupStageKey, gaps: string[]): string[] {
  const stage = PANTAVION_STARTUP_STAGES.find((item) => item.key === currentStage);
  return [
    `Work current gate: ${stage?.title ?? currentStage}`,
    ...gaps.slice(0, 4).map((gap) => `Collect evidence: ${gap}`),
    "Use PantaAI research/critical-thinking lanes to test assumptions before advancing.",
    "Record evidence and decision before moving to the next stage.",
  ];
}

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
