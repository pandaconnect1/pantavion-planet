export type PantavionEcosystemDomain =
  | "ai_models"
  | "coding_agents"
  | "rag_memory"
  | "workflow_automation"
  | "google_full_stack_ai"
  | "china_superapp"
  | "seven_continent"
  | "presentation"
  | "video_media"
  | "image_design"
  | "writing_content"
  | "meetings_notes"
  | "voice_translation"
  | "search_research"
  | "knowledge_learning"
  | "productivity_work"
  | "tool_substitution"
  | "social_community"
  | "messaging_comms"
  | "payments_wallet"
  | "maps_mobility"
  | "local_services"
  | "marketplace_commerce"
  | "dating_matching"
  | "sos_safety"
  | "identity_access"
  | "legal_governance"
  | "water_infrastructure"
  | "cloud_ops"
  | "autonomous_engineering";

export type PantavionExecutionStatus =
  | "kernel_active"
  | "internal_planner_active"
  | "provider_required"
  | "connector_required"
  | "legal_review_required"
  | "founder_gate_required"
  | "future_worker_required";

export type PantavionEcosystemSignal = {
  readonly id: string;
  readonly observedName: string;
  readonly domain: PantavionEcosystemDomain;
  readonly origin: "global" | "china" | "google" | "pantavion" | "multi";
  readonly whatItDoes: string;
  readonly pantavionOwnedCapability: string;
  readonly executionStatus: PantavionExecutionStatus;
  readonly kernelModules: readonly string[];
  readonly protectedDomains: readonly string[];
  readonly legalBoundary: readonly string[];
};

function signal(input: PantavionEcosystemSignal): PantavionEcosystemSignal {
  return input;
}

export const PANTAVION_GLOBAL_ECOSYSTEM_SIGNALS: readonly PantavionEcosystemSignal[] = [
  signal({
    id: "ai-models-all",
    observedName: "ChatGPT / Claude / Gemini / Grok / Perplexity / DeepSeek / Gemma / Bard / Bing AI",
    domain: "ai_models",
    origin: "global",
    whatItDoes:
      "AI assistants and model providers for reasoning, coding, research, search, translation, multimodal work, live signal analysis and fallback routing.",
    pantavionOwnedCapability:
      "PantaAI Intelligence Matrix with provider routing by speed, advanced reasoning, research, coding, translator, privacy, cost, long context and reliability.",
    executionStatus: "internal_planner_active",
    kernelModules: [
      "model_provider_matrix",
      "agent_task_router",
      "privacy_router",
      "cost_guard",
      "provider_health_monitor",
    ],
    protectedDomains: ["private_data", "identity", "legal", "health", "financial"],
    legalBoundary: [
      "Official provider/API/connector only.",
      "No external logo, UI, brand or product claim copying.",
      "Protected data requires privacy and domain-kernel gates.",
    ],
  }),
  signal({
    id: "coding-agents-all",
    observedName: "Cursor / Claude Code / Codex / Windsurf / Copilot / Replit / Devin / Amazon Q",
    domain: "coding_agents",
    origin: "global",
    whatItDoes:
      "AI coding IDE, terminal coding agent, autonomous software engineer, cloud coding, code suggestions, repo repair and PR-generation patterns.",
    pantavionOwnedCapability:
      "PandaDev Autonomous Coding Kernel for repo scan, gap detection, scoped patch creation, branch/PR generation, audit, build, typecheck and repair loops.",
    executionStatus: "kernel_active",
    kernelModules: [
      "autonomous_engineering_kernel",
      "coding_provider_matrix",
      "github_pr_writer",
      "protected_path_policy",
      "build_typecheck_audit_gate",
    ],
    protectedDomains: ["water", "users", "access", "secrets", "production", "identity", "sos"],
    legalBoundary: [
      "No blind production mutation.",
      "No raw water/private infrastructure exposure.",
      "No secret exposure.",
      "No auto-merge until release policy exists.",
    ],
  }),
  signal({
    id: "rag-memory-all",
    observedName: "Pinecone / LlamaIndex / Haystack / Milvus",
    domain: "rag_memory",
    origin: "global",
    whatItDoes:
      "Vector databases, retrieval pipelines, source indexing, semantic search, code memory, document memory and source-grounded AI.",
    pantavionOwnedCapability:
      "PantaRAG Memory Kernel with source vault, private/public memory separation, citations, founder doctrine memory, code memory and protected Water memory lanes.",
    executionStatus: "internal_planner_active",
    kernelModules: [
      "source_vault",
      "retrieval_policy",
      "vector_index_contract",
      "citation_engine",
      "private_memory_guard",
    ],
    protectedDomains: ["private_data", "water", "legal", "identity"],
    legalBoundary: [
      "No private data indexing into external systems without consent/legal basis.",
      "Source licensing and citation rules required.",
      "Water/private infrastructure sources stay protected.",
    ],
  }),
  signal({
    id: "workflow-automation-all",
    observedName: "Make / Zapier / n8n / Gumloop",
    domain: "workflow_automation",
    origin: "global",
    whatItDoes:
      "Workflow automation, triggers, actions, connector chains, scheduled jobs, retries, app integrations and agentic operations.",
    pantavionOwnedCapability:
      "PantaFlow Automation Kernel with connector permissions, approval queue, external-effect gate, retry logs and audit trail.",
    executionStatus: "internal_planner_active",
    kernelModules: [
      "workflow_runner",
      "connector_registry",
      "approval_queue",
      "external_effect_gate",
      "retry_log",
    ],
    protectedDomains: ["users", "payments", "identity", "private_data", "production"],
    legalBoundary: [
      "No sending, billing, deleting, public posting or provider action without permission.",
      "Every external connector must be scoped and auditable.",
    ],
  }),
  signal({
    id: "google-full-stack-ai",
    observedName: "Google full-stack AI ecosystem",
    domain: "google_full_stack_ai",
    origin: "google",
    whatItDoes:
      "Models, video, coding, agents, FileSearch API, research, NotebookLM, design, image generation, workspace and search ecosystem patterns.",
    pantavionOwnedCapability:
      "Pantavion Full-Stack AI Kernel pattern: model router, video studio, coding agents, agent protocol, file search/RAG, research notebook and design studio.",
    executionStatus: "internal_planner_active",
    kernelModules: [
      "model_matrix",
      "media_kernel",
      "coding_kernel",
      "agent_protocol",
      "file_search_rag",
      "design_kernel",
    ],
    protectedDomains: ["private_data", "copyright", "identity", "production"],
    legalBoundary: [
      "Pattern adoption only.",
      "No Google product identity copying.",
      "Official API/connector required for provider integration.",
    ],
  }),
  signal({
    id: "china-superapp-ecosystem",
    observedName:
      "China super-app model: WeChat / Weibo / RedNote / QQ / Qzone / Bilibili / Alipay / Baidu / AMAP / Didi / Dianping / Douyin / Tantan",
    domain: "china_superapp",
    origin: "china",
    whatItDoes:
      "All-in-one ecosystem logic: messaging, mini-apps, identity, wallet, search, maps, media, short video, local services, commerce, dating and communities.",
    pantavionOwnedCapability:
      "PantaLife Super-App Kernel: Pantavion-owned lawful communication, services, local discovery, marketplace, media, payments abstraction, maps, social and relationship modules.",
    executionStatus: "kernel_active",
    kernelModules: [
      "pantalife_superapp_kernel",
      "social_universe_kernel",
      "payments_compliance_kernel",
      "maps_mobility_kernel",
      "local_services_kernel",
      "relationship_safety_kernel",
    ],
    protectedDomains: ["identity", "payments", "minors", "location", "privacy", "legal"],
    legalBoundary: [
      "No copying Chinese app logos, UI, product identity or marketplace claims.",
      "Payments, dating, minors, location and commerce require jurisdiction/legal gates.",
      "All features must be Pantavion-owned implementation.",
    ],
  }),
  signal({
    id: "seven-continent-ecosystem",
    observedName: "seven-continent ecosystem",
    domain: "seven_continent",
    origin: "multi",
    whatItDoes:
      "Regional ecosystem localization across Africa, Asia, Europe, North America, South America, Oceania and Antarctica.",
    pantavionOwnedCapability:
      "Seven-Continent Kernel for language, culture, law, commerce, safety, education, services, payments and communication localization.",
    executionStatus: "internal_planner_active",
    kernelModules: [
      "continent_localization_kernel",
      "regional_policy_kernel",
      "language_kernel",
      "service_availability_kernel",
    ],
    protectedDomains: ["legal", "payments", "identity", "minors", "privacy"],
    legalBoundary: [
      "Country-by-country legal review.",
      "Regional privacy and payments compliance.",
      "Cultural and language localization without stereotyping.",
    ],
  }),
  signal({
    id: "create-work-productivity",
    observedName:
      "presentation / video / image / writing / meetings / voice / search / knowledge / productivity",
    domain: "productivity_work",
    origin: "multi",
    whatItDoes:
      "Presentations, video creation, image/design, writing, meeting notes, voice, search, knowledge, education and productivity tools.",
    pantavionOwnedCapability:
      "PantaCreate + PantaWork Suite: presentations, media, design, writing, meeting memory, voice, search, knowledge and productivity command center.",
    executionStatus: "internal_planner_active",
    kernelModules: [
      "pantaslides",
      "pantavideo",
      "pantaimage",
      "pantawriting",
      "pantameeting",
      "pantavoice",
      "pantasearch",
      "pantaknowledge",
      "pantawork",
    ],
    protectedDomains: ["copyright", "private_data", "minors", "health", "legal"],
    legalBoundary: [
      "No copied templates or unlicensed media.",
      "Consent required for voice/likeness.",
      "High-risk health/legal/financial content requires safety gates.",
    ],
  }),
  signal({
    id: "tool-substitution-advisor",
    observedName: "tool substitution advisor: paid/free, fast/cheap/advanced",
    domain: "tool_substitution",
    origin: "global",
    whatItDoes:
      "Chooses cheaper, faster, more advanced, private, free-first, provider-best or internal-first routes for a user task.",
    pantavionOwnedCapability:
      "PantaTool Substitution Advisor with cost guard, provider matrix, internal capability selection, legal review and affiliate/sponsorship disclosure rules.",
    executionStatus: "kernel_active",
    kernelModules: [
      "tool_substitution_advisor",
      "cost_guard",
      "provider_matrix",
      "privacy_selector",
      "quality_speed_selector",
    ],
    protectedDomains: ["payments", "private_data", "provider_cost"],
    legalBoundary: [
      "No fake rankings.",
      "No guaranteed free replacement claims.",
      "Provider/pricing status must be verified or marked uncertain.",
    ],
  }),
  signal({
    id: "autonomous-maintenance-update-coding",
    observedName: "autonomous maintenance / update / coding / full cloud / 24/366",
    domain: "autonomous_engineering",
    origin: "pantavion",
    whatItDoes:
      "Continuous 24/366 observe, plan, code, audit, repair, branch, PR, memory, cost, provider health and cloud scheduled work.",
    pantavionOwnedCapability:
      "Pantavion Autonomous Engineering Kernel with cloud scheduler, persistent jobs, gap scanner, code generator, PR writer and protected child kernels.",
    executionStatus: "kernel_active",
    kernelModules: [
      "autonomous_engineering_kernel",
      "autonomous_job_queue",
      "capability_gap_scanner",
      "github_autonomous_writer",
      "vercel_cron",
      "protected_domain_cores",
    ],
    protectedDomains: ["water", "users", "access", "secrets", "production", "payments", "legal", "identity", "sos"],
    legalBoundary: [
      "Autonomous coding allowed.",
      "Protected direct mutation gated.",
      "Branch/PR creation allowed.",
      "Production deploy remains founder/release gated.",
    ],
  }),
  signal({
    id: "protected-water-identity-sos-legal",
    observedName: "Water / SOS / identity / payments / legal / users / access / secret production",
    domain: "water_infrastructure",
    origin: "pantavion",
    whatItDoes:
      "Protected executable child kernels for Water, users, access, secrets, production, payments, legal, identity and SOS.",
    pantavionOwnedCapability:
      "Protected Domain Kernel family: each critical area has its own kernel and listens to the central Kernel Orchestrator.",
    executionStatus: "kernel_active",
    kernelModules: [
      "water_kernel",
      "identity_access_kernel",
      "sos_kernel",
      "legal_payments_kernel",
      "secret_production_guard",
    ],
    protectedDomains: ["water", "users", "access", "secrets", "production", "payments", "legal", "identity", "sos"],
    legalBoundary: [
      "Protected domains are not excuses.",
      "They are executable child kernels.",
      "Direct mutation requires domain gate and founder/release policy.",
    ],
  }),
  signal({
    id: "live-translation-voice",
    observedName: "live translation",
    domain: "voice_translation",
    origin: "pantavion",
    whatItDoes:
      "Speech, text, subtitles, conversation mode, emergency language, accessibility and cross-cultural translation.",
    pantavionOwnedCapability:
      "PantaLive Translation Kernel with language detection, speech-to-text, translation, subtitles, voice output and emergency/offline fallback planning.",
    executionStatus: "internal_planner_active",
    kernelModules: [
      "live_translation_kernel",
      "voice_command_kernel",
      "language_detection_kernel",
      "emergency_language_kernel",
    ],
    protectedDomains: ["voice", "privacy", "sos", "minors"],
    legalBoundary: [
      "Translation is assistive, not guaranteed legal/medical replacement.",
      "Voice consent and privacy policy required.",
      "Emergency claims must be bounded.",
    ],
  }),
];

export function getPantavionGlobalEcosystemSignals(): readonly PantavionEcosystemSignal[] {
  return PANTAVION_GLOBAL_ECOSYSTEM_SIGNALS;
}

export function getPantavionSignalsByDomain(
  domain: PantavionEcosystemDomain,
): readonly PantavionEcosystemSignal[] {
  return PANTAVION_GLOBAL_ECOSYSTEM_SIGNALS.filter((signalItem) => signalItem.domain === domain);
}

export const pantavion_global_ecosystem_registry_marker_v1 =
  "pantavion_global_ecosystem_registry_c2_v1";
