export type PantavionModelProviderId =
  | "chatgpt"
  | "claude"
  | "gemini"
  | "grok"
  | "perplexity"
  | "deepseek"
  | "gemma"
  | "bard_legacy"
  | "bing_ai";

export type PantavionModelLane =
  | "very_fast"
  | "advanced_reasoning"
  | "research"
  | "coding"
  | "translation"
  | "multimodal"
  | "long_context"
  | "low_cost"
  | "privacy_sensitive"
  | "fallback";

export type PantavionProviderStatus =
  | "candidate"
  | "requires_api_key"
  | "requires_connector"
  | "legacy_signal"
  | "internal_only"
  | "blocked";

export type PantavionSensitivity =
  | "public"
  | "internal"
  | "private"
  | "protected";

export type PantavionModelProvider = {
  readonly id: PantavionModelProviderId;
  readonly label: string;
  readonly observedSignal: string;
  readonly status: PantavionProviderStatus;
  readonly lanes: readonly PantavionModelLane[];
  readonly strengths: readonly string[];
  readonly limitations: readonly string[];
  readonly legalBoundaries: readonly string[];
  readonly protectedDataRule: string;
};

export type PantavionModelSelectionRequest = {
  readonly task: string;
  readonly requestedLane?: PantavionModelLane;
  readonly sensitivity: PantavionSensitivity;
  readonly requiresCoding?: boolean;
  readonly requiresResearch?: boolean;
  readonly requiresTranslation?: boolean;
  readonly requiresLongContext?: boolean;
  readonly requiresLowCost?: boolean;
};

export type PantavionModelSelectionResult = {
  readonly ok: true;
  readonly selectedProvider: PantavionModelProvider;
  readonly fallbackProviders: readonly PantavionModelProvider[];
  readonly requiredGates: readonly string[];
  readonly reason: string;
};

export const PANTAVION_MODEL_PROVIDER_MATRIX: readonly PantavionModelProvider[] = [
  {
    id: "chatgpt",
    label: "ChatGPT",
    observedSignal:
      "General AI assistant, reasoning, coding, creation, translation, multimodal work.",
    status: "requires_api_key",
    lanes: ["advanced_reasoning", "coding", "translation", "multimodal", "fallback"],
    strengths: [
      "general execution",
      "coding support",
      "structured outputs",
      "creative and operational work",
    ],
    limitations: [
      "provider key required",
      "private/protected data requires policy gate",
    ],
    legalBoundaries: [
      "official provider access only",
      "no brand/UI copying",
      "no unsafe private data calls",
    ],
    protectedDataRule:
      "Protected data may be summarized or transformed only through a privacy/policy gate.",
  },
  {
    id: "claude",
    label: "Claude",
    observedSignal:
      "Long-context reasoning, writing, analysis, code review and careful planning.",
    status: "requires_api_key",
    lanes: ["advanced_reasoning", "long_context", "coding", "research", "fallback"],
    strengths: [
      "long documents",
      "requirements review",
      "architecture critique",
      "safe writing",
    ],
    limitations: [
      "provider key required",
      "connector required for live repo automation",
    ],
    legalBoundaries: [
      "official provider access only",
      "no product identity copying",
    ],
    protectedDataRule:
      "Use for protected analysis only after redaction or approved private provider policy.",
  },
  {
    id: "gemini",
    label: "Gemini",
    observedSignal:
      "Google full-stack AI ecosystem: models, multimodal, research, coding and workspace adjacency.",
    status: "requires_api_key",
    lanes: ["multimodal", "research", "coding", "translation", "fallback"],
    strengths: [
      "Google ecosystem pattern",
      "multimodal workflows",
      "workspace/search adjacency",
    ],
    limitations: ["provider key and connector policy required"],
    legalBoundaries: [
      "official Google APIs/connectors only",
      "no Google UI/brand copying",
    ],
    protectedDataRule:
      "Workspace/private data must pass connector permission and region policy gates.",
  },
  {
    id: "grok",
    label: "Grok",
    observedSignal:
      "Fast live signal and conversational research pattern.",
    status: "requires_api_key",
    lanes: ["very_fast", "research", "fallback"],
    strengths: [
      "fast public signal interpretation",
      "social trend reading",
    ],
    limitations: ["provider availability and terms required"],
    legalBoundaries: [
      "provider terms required",
      "no unverified factual claims without source checks",
    ],
    protectedDataRule:
      "Do not route private/protected Pantavion data unless provider policy is approved.",
  },
  {
    id: "perplexity",
    label: "Perplexity",
    observedSignal:
      "Source-oriented research and answer verification pattern.",
    status: "requires_api_key",
    lanes: ["research", "very_fast", "fallback"],
    strengths: [
      "source discovery",
      "research answers",
      "citation-oriented workflow",
    ],
    limitations: [
      "provider key required",
      "not a replacement for internal source vault",
    ],
    legalBoundaries: [
      "cite sources",
      "respect source licensing",
      "no blind scraping",
    ],
    protectedDataRule:
      "Use for public research first; protected source retrieval stays in PantaRAG.",
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    observedSignal:
      "Reasoning/coding and cost-aware model signal from uploaded ecosystem context.",
    status: "requires_api_key",
    lanes: ["low_cost", "coding", "advanced_reasoning", "fallback"],
    strengths: [
      "cost-aware reasoning candidate",
      "coding candidate",
    ],
    limitations: [
      "provider policy, region, privacy and availability review required",
    ],
    legalBoundaries: [
      "provider terms required",
      "data policy review required",
    ],
    protectedDataRule:
      "Do not route protected data until region/privacy policy is explicitly approved.",
  },
  {
    id: "gemma",
    label: "Gemma",
    observedSignal:
      "Open/local model family signal for lightweight internal tasks.",
    status: "candidate",
    lanes: ["low_cost", "privacy_sensitive", "very_fast", "fallback"],
    strengths: [
      "local/self-hosted candidate",
      "low-cost internal worker candidate",
    ],
    limitations: [
      "hosting/inference infrastructure required",
      "quality varies by model/runtime",
    ],
    legalBoundaries: [
      "license review required",
      "deployment policy required",
    ],
    protectedDataRule:
      "Prefer for private low-risk internal classification once self-hosted policy exists.",
  },
  {
    id: "bard_legacy",
    label: "Google Bard",
    observedSignal:
      "Legacy Google assistant signal from uploaded tool maps.",
    status: "legacy_signal",
    lanes: ["fallback"],
    strengths: ["historical Google AI assistant pattern"],
    limitations: [
      "legacy/renamed signal; do not treat as active provider without verification",
    ],
    legalBoundaries: ["fold into Gemini/Google provider lane"],
    protectedDataRule:
      "No direct routing; legacy signal only.",
  },
  {
    id: "bing_ai",
    label: "Bing AI",
    observedSignal:
      "Microsoft search/chat assistant signal.",
    status: "requires_connector",
    lanes: ["research", "fallback"],
    strengths: [
      "search/chat pattern",
      "Microsoft ecosystem adjacency",
    ],
    limitations: ["connector/API path required"],
    legalBoundaries: [
      "official Microsoft access only",
      "no unverified claims",
    ],
    protectedDataRule:
      "Public research only until connector policy exists.",
  },
];

function scoreProvider(
  provider: PantavionModelProvider,
  request: PantavionModelSelectionRequest,
): number {
  let score = 0;

  if (request.requestedLane && provider.lanes.includes(request.requestedLane)) {
    score += 5;
  }

  if (request.requiresCoding && provider.lanes.includes("coding")) {
    score += 4;
  }

  if (request.requiresResearch && provider.lanes.includes("research")) {
    score += 4;
  }

  if (request.requiresTranslation && provider.lanes.includes("translation")) {
    score += 4;
  }

  if (request.requiresLongContext && provider.lanes.includes("long_context")) {
    score += 4;
  }

  if (request.requiresLowCost && provider.lanes.includes("low_cost")) {
    score += 4;
  }

  if (request.sensitivity === "protected" && provider.lanes.includes("privacy_sensitive")) {
    score += 3;
  }

  if (request.sensitivity === "protected" && provider.status === "requires_api_key") {
    score -= 2;
  }

  if (provider.status === "legacy_signal") {
    score -= 5;
  }

  if (provider.status === "blocked") {
    score -= 20;
  }

  return score;
}

export function selectPantavionModelProvider(
  request: PantavionModelSelectionRequest,
): PantavionModelSelectionResult {
  const ranked = [...PANTAVION_MODEL_PROVIDER_MATRIX]
    .filter((provider) => provider.status !== "blocked")
    .sort((a, b) => scoreProvider(b, request) - scoreProvider(a, request));

  const defaultProvider = PANTAVION_MODEL_PROVIDER_MATRIX.find(
    (provider) => provider.id === "chatgpt",
  );

  if (!defaultProvider) {
    throw new Error("Pantavion model provider matrix is missing the ChatGPT default provider.");
  }

  const selectedProvider: PantavionModelProvider = ranked[0] ?? defaultProvider;
  const fallbackProviders: PantavionModelProvider[] = ranked.slice(1, 4);

  const requiredGates = [
    "provider_key_check",
    "cost_guard",
    "privacy_policy_gate",
    "source_or_output_verification",
  ];

  if (request.sensitivity === "protected") {
    requiredGates.push("protected_data_gate", "founder_or_domain_kernel_policy");
  }

  if (request.requiresCoding) {
    requiredGates.push("repo_truth_gate", "scoped_patch_gate", "build_typecheck_audit_gate");
  }

  return {
    ok: true,
    selectedProvider,
    fallbackProviders,
    requiredGates,
    reason: `Selected ${selectedProvider.label} for task lane ${
      request.requestedLane ?? "auto"
    } with sensitivity ${request.sensitivity}.`,
  };
}

export const pantavion_model_provider_matrix_marker_v1 =
  "pantavion_model_provider_matrix_c3_v1";
