export type PantavionCapabilityRisk =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type PantavionCapabilityStatus =
  | "signal_locked"
  | "kernel_registered"
  | "integration_ready"
  | "requires_provider_key"
  | "requires_legal_review"
  | "blocked_until_founder_approval";

export type PantavionCapabilityFamily =
  | "ai_model"
  | "reasoning"
  | "research"
  | "coding_agent"
  | "rag_memory"
  | "workflow_automation"
  | "china_superapp_pattern"
  | "google_full_stack_pattern"
  | "presentation"
  | "video"
  | "image"
  | "writing"
  | "meetings"
  | "voice"
  | "search"
  | "knowledge"
  | "productivity"
  | "translation"
  | "social"
  | "messaging"
  | "payments"
  | "maps_mobility"
  | "local_services"
  | "commerce"
  | "dating_social"
  | "media_entertainment"
  | "security"
  | "water_infrastructure"
  | "identity_access"
  | "sos_safety"
  | "legal_governance"
  | "cloud_ops";

export type PantavionCapabilityEntry = {
  id: string;
  displayName: string;
  sourceSignal: string;
  family: PantavionCapabilityFamily;
  origin: "global" | "china" | "pantavion" | "multi";
  capabilitySummary: string;
  pantavionOwnedImplementation: string;
  allowedExecutionModes: Array<
    | "observe"
    | "plan"
    | "draft"
    | "execute_internal"
    | "provider_call"
    | "github_pr"
    | "founder_gate"
  >;
  protectedDomains: string[];
  risk: PantavionCapabilityRisk;
  status: PantavionCapabilityStatus;
};

const entry = (
  id: string,
  displayName: string,
  family: PantavionCapabilityFamily,
  origin: PantavionCapabilityEntry["origin"],
  capabilitySummary: string,
  pantavionOwnedImplementation: string,
  risk: PantavionCapabilityRisk = "medium",
  status: PantavionCapabilityStatus = "kernel_registered",
  protectedDomains: string[] = []
): PantavionCapabilityEntry => ({
  id,
  displayName,
  sourceSignal: displayName,
  family,
  origin,
  capabilitySummary,
  pantavionOwnedImplementation,
  allowedExecutionModes: [
    "observe",
    "plan",
    "draft",
    "execute_internal",
    "provider_call",
    "github_pr",
    "founder_gate",
  ],
  protectedDomains,
  risk,
  status,
});

export const PANTAVION_PROVIDER_ECOSYSTEM_REGISTRY: PantavionCapabilityEntry[] = [
  entry(
    "chatgpt",
    "ChatGPT",
    "ai_model",
    "global",
    "General AI assistant, reasoning, writing, coding, analysis, multimodal work depending on provider.",
    "Pantavion uses this pattern as one possible model provider behind a sovereign model router, not as the product identity.",
    "medium",
    "requires_provider_key"
  ),
  entry(
    "claude",
    "Claude",
    "reasoning",
    "global",
    "Long-context reasoning, writing, document analysis, coding assistance, careful review workflows.",
    "Pantavion maps this to deep reasoning, document review, legal-safe drafting, and engineering critique lanes.",
    "medium",
    "requires_provider_key"
  ),
  entry(
    "gemini",
    "Gemini",
    "google_full_stack_pattern",
    "global",
    "Workspace-oriented AI, multimodal reasoning, search-connected workflows, Google ecosystem adjacency.",
    "Pantavion maps this to workspace intelligence, multimodal execution, calendar/email/docs connectors, and research.",
    "medium",
    "requires_provider_key"
  ),
  entry(
    "grok",
    "Grok",
    "research",
    "global",
    "Fast conversational model and current-event style reasoning.",
    "Pantavion maps this to fast signal interpretation, social trend analysis, and public pulse intelligence.",
    "medium",
    "requires_provider_key"
  ),
  entry(
    "perplexity",
    "Perplexity",
    "research",
    "global",
    "Source-oriented research and web answer workflows.",
    "Pantavion maps this to citation-first research, source ranking, and evidence-backed answers.",
    "medium",
    "requires_provider_key"
  ),
  entry(
    "deepseek",
    "DeepSeek",
    "ai_model",
    "global",
    "Reasoning and coding model signal from the uploaded tool maps.",
    "Pantavion maps this to optional cost/performance model routing where legally and technically available.",
    "medium",
    "requires_provider_key"
  ),
  entry(
    "gemma",
    "Gemma",
    "ai_model",
    "global",
    "Open model family signal for lightweight research and local/cloud model routing.",
    "Pantavion maps this to local or self-hosted model lanes when infrastructure allows.",
    "medium",
    "requires_provider_key"
  ),
  entry(
    "bard",
    "Google Bard",
    "ai_model",
    "global",
    "Legacy Google AI assistant signal from uploaded images.",
    "Pantavion keeps this as historical Google assistant pattern, folded into Gemini/Google ecosystem routing.",
    "low",
    "signal_locked"
  ),
  entry(
    "bing_ai",
    "Bing AI",
    "search",
    "global",
    "Search/chat assistant signal from uploaded images.",
    "Pantavion maps this to search-assisted answer generation and browser/search routing.",
    "medium",
    "requires_provider_key"
  ),

  entry(
    "cursor",
    "Cursor",
    "coding_agent",
    "global",
    "AI coding IDE pattern for editing, refactoring, and codebase navigation.",
    "Pantavion maps this to internal repo-aware coding agent workflows and guarded patch generation.",
    "high",
    "integration_ready",
    ["code", "production"]
  ),
  entry(
    "claude_code",
    "Claude Code",
    "coding_agent",
    "global",
    "Terminal and repository coding agent pattern.",
    "Pantavion maps this to command-aware code generation, audit loops, and PR creation under policy.",
    "high",
    "integration_ready",
    ["code", "production"]
  ),
  entry(
    "codex",
    "OpenAI Codex",
    "coding_agent",
    "global",
    "Autonomous coding and software task execution signal.",
    "Pantavion maps this to code writer, reviewer, and migration worker lanes.",
    "high",
    "requires_provider_key",
    ["code", "production"]
  ),
  entry(
    "windsurf",
    "Windsurf",
    "coding_agent",
    "global",
    "AI-native IDE flow signal.",
    "Pantavion maps this to continuous coding context and multi-file refactor execution.",
    "high",
    "integration_ready",
    ["code", "production"]
  ),
  entry(
    "copilot",
    "GitHub Copilot",
    "coding_agent",
    "global",
    "Code suggestion and repository assistance pattern.",
    "Pantavion maps this to assisted implementation suggestions and developer acceleration.",
    "medium",
    "requires_provider_key",
    ["code"]
  ),
  entry(
    "replit",
    "Replit",
    "coding_agent",
    "global",
    "Cloud coding and deployment assistant pattern.",
    "Pantavion maps this to cloud build, prototype generation, and sandbox execution flows.",
    "high",
    "integration_ready",
    ["code", "cloud"]
  ),
  entry(
    "devin",
    "Devin",
    "coding_agent",
    "global",
    "Autonomous software engineer agent signal.",
    "Pantavion maps this to long-running engineering jobs, repo diagnosis, and PR delivery.",
    "critical",
    "integration_ready",
    ["code", "production", "deployment"]
  ),
  entry(
    "amazon_q",
    "Amazon Q Developer",
    "coding_agent",
    "global",
    "Cloud and AWS-aware development assistant pattern.",
    "Pantavion maps this to cloud provider assistance and infrastructure-aware coding under permission gates.",
    "high",
    "requires_provider_key",
    ["cloud", "production"]
  ),

  entry(
    "pinecone",
    "Pinecone",
    "rag_memory",
    "global",
    "Vector database/RAG storage pattern.",
    "Pantavion maps this to retrieval memory indexes for documents, code, knowledge, and infrastructure data.",
    "high",
    "requires_provider_key",
    ["memory", "private_data"]
  ),
  entry(
    "llamaindex",
    "LlamaIndex",
    "rag_memory",
    "global",
    "RAG orchestration and data indexing framework pattern.",
    "Pantavion maps this to source ingestion, citations, document retrieval, and codebase memory.",
    "high",
    "integration_ready",
    ["memory", "private_data"]
  ),
  entry(
    "haystack",
    "Haystack",
    "rag_memory",
    "global",
    "Search/retrieval pipeline framework.",
    "Pantavion maps this to enterprise search and evidence retrieval pipelines.",
    "medium",
    "integration_ready",
    ["memory"]
  ),
  entry(
    "milvus",
    "Milvus",
    "rag_memory",
    "global",
    "Vector database pattern for large-scale semantic search.",
    "Pantavion maps this to self-hosted retrieval infrastructure for sovereign memory.",
    "high",
    "integration_ready",
    ["memory", "private_data"]
  ),

  entry(
    "make",
    "Make",
    "workflow_automation",
    "global",
    "Visual workflow automation.",
    "Pantavion maps this to internal workflow builder and connector execution.",
    "high",
    "requires_provider_key",
    ["automation"]
  ),
  entry(
    "zapier",
    "Zapier",
    "workflow_automation",
    "global",
    "App-to-app automation and triggers.",
    "Pantavion maps this to connector automation and external app workflow bridges.",
    "high",
    "requires_provider_key",
    ["automation"]
  ),
  entry(
    "n8n",
    "n8n",
    "workflow_automation",
    "global",
    "Self-hosted workflow automation pattern.",
    "Pantavion maps this to sovereign automation workers and private workflow execution.",
    "high",
    "integration_ready",
    ["automation", "private_data"]
  ),
  entry(
    "gumloop",
    "Gumloop",
    "workflow_automation",
    "global",
    "AI workflow automation pattern.",
    "Pantavion maps this to AI-native process chains and repeatable work automations.",
    "medium",
    "signal_locked"
  ),

  entry(
    "gamma",
    "Gamma",
    "presentation",
    "global",
    "AI presentation generation pattern.",
    "Pantavion maps this to PantaDeck: slide/story/pitch generation with brand-safe templates.",
    "medium",
    "integration_ready"
  ),
  entry(
    "notebooklm",
    "NotebookLM",
    "knowledge",
    "global",
    "Notebook and source-grounded research assistant pattern.",
    "Pantavion maps this to PantaResearch notebooks, source-grounded summaries, and project memory.",
    "medium",
    "integration_ready",
    ["memory"]
  ),
  entry(
    "opusclip",
    "OpusClip",
    "video",
    "global",
    "Short-form video clipping and repurposing pattern.",
    "Pantavion maps this to Creator Studio clipping, captions, and social-ready media packaging.",
    "medium",
    "integration_ready",
    ["media"]
  ),
  entry(
    "granola",
    "Granola",
    "meetings",
    "global",
    "AI meeting notes pattern.",
    "Pantavion maps this to meeting memory, summaries, action items, and private notes.",
    "medium",
    "integration_ready",
    ["private_data"]
  ),
  entry(
    "wispr",
    "Wispr Flow",
    "voice",
    "global",
    "Voice dictation/productivity pattern.",
    "Pantavion maps this to voice command, live transcription, translation, and hands-free execution.",
    "medium",
    "integration_ready",
    ["voice", "privacy"]
  ),

  entry(
    "wechat",
    "WeChat",
    "china_superapp_pattern",
    "china",
    "Messaging, mini-programs, payments, social, identity, services, and commerce in one ecosystem.",
    "Pantavion maps this to a legal, Pantavion-owned super-app operating model: communication plus services plus payments plus mini capabilities.",
    "critical",
    "kernel_registered",
    ["identity", "payments", "privacy"]
  ),
  entry(
    "weibo",
    "Weibo",
    "social",
    "china",
    "Public microblogging, trends, social broadcasting, and public conversation.",
    "Pantavion maps this to global pulse, posts, public signal, and moderated civic/social conversation.",
    "high",
    "kernel_registered",
    ["moderation", "privacy"]
  ),
  entry(
    "rednote",
    "RedNote",
    "social",
    "china",
    "Lifestyle, discovery, social commerce, creator posts, and recommendations.",
    "Pantavion maps this to culture, local discovery, creator education, commerce recommendations, and lawful content safety.",
    "high",
    "kernel_registered",
    ["moderation", "commerce"]
  ),
  entry(
    "qq",
    "QQ",
    "messaging",
    "china",
    "Messaging, groups, communities, social identity, and entertainment.",
    "Pantavion maps this to youth-safe/community-safe messaging, groups, and identity-scoped chat.",
    "high",
    "kernel_registered",
    ["minors", "privacy"]
  ),
  entry(
    "qzone",
    "Qzone",
    "social",
    "china",
    "Profile/social space pattern.",
    "Pantavion maps this to personal worlds, profile spaces, albums, posts, and controlled visibility.",
    "medium",
    "kernel_registered",
    ["privacy"]
  ),
  entry(
    "bilibili",
    "Bilibili",
    "media_entertainment",
    "china",
    "Video, communities, learning, fan culture, and entertainment.",
    "Pantavion maps this to video channels, learning media, community education, and creator governance.",
    "medium",
    "kernel_registered",
    ["media", "moderation"]
  ),
  entry(
    "alipay",
    "Alipay",
    "payments",
    "china",
    "Payments, wallet, financial services, merchant utilities, and service ecosystem.",
    "Pantavion maps this to compliant payments, invoices, merchant access, subscriptions, and region-specific financial rules.",
    "critical",
    "requires_legal_review",
    ["payments", "legal", "identity"]
  ),
  entry(
    "baidu",
    "Baidu",
    "search",
    "china",
    "Search, maps, AI, cloud, and knowledge services.",
    "Pantavion maps this to regional search, knowledge indexing, source atlas, and China/Asia-aware discovery.",
    "high",
    "kernel_registered",
    ["search", "privacy"]
  ),
  entry(
    "amap",
    "AMAP",
    "maps_mobility",
    "china",
    "Maps, navigation, mobility, local POI and routing.",
    "Pantavion maps this to maps, local services, field routes, and infrastructure-aware navigation.",
    "high",
    "kernel_registered",
    ["location", "water_infrastructure"]
  ),
  entry(
    "didi",
    "Didi",
    "maps_mobility",
    "china",
    "Ride-hailing, mobility marketplace, driver/rider matching.",
    "Pantavion maps this to lawful service matching, transport coordination, and local mobility workflows.",
    "high",
    "requires_legal_review",
    ["location", "identity", "payments"]
  ),
  entry(
    "dianping",
    "Dianping",
    "local_services",
    "china",
    "Local reviews, restaurants, city discovery, and service recommendations.",
    "Pantavion maps this to city/local business discovery, ratings, bookings, and trusted local recommendations.",
    "medium",
    "kernel_registered",
    ["commerce", "moderation"]
  ),
  entry(
    "douyin",
    "Douyin",
    "media_entertainment",
    "china",
    "Short video, creator commerce, recommendations, and live social media.",
    "Pantavion maps this to short video, creator economy, safety moderation, and localized media feeds.",
    "high",
    "kernel_registered",
    ["media", "minors", "moderation"]
  ),
  entry(
    "tantan",
    "Tantan",
    "dating_social",
    "china",
    "Dating/social matching pattern.",
    "Pantavion maps this to age-gated, consent-driven relationship discovery with strict safety and legal controls.",
    "critical",
    "requires_legal_review",
    ["identity", "age_gate", "safety"]
  ),
];

export function getPantavionCapabilityRegistry() {
  return PANTAVION_PROVIDER_ECOSYSTEM_REGISTRY;
}

export function getCapabilitiesByFamily(family: PantavionCapabilityFamily) {
  return PANTAVION_PROVIDER_ECOSYSTEM_REGISTRY.filter((item) => item.family === family);
}

export function getCapabilitiesByProtectedDomain(domain: string) {
  return PANTAVION_PROVIDER_ECOSYSTEM_REGISTRY.filter((item) =>
    item.protectedDomains.includes(domain)
  );
}

export const pantavion_autonomous_registry_marker_v1 =
  "pantavion_autonomous_registry_c1_v1";
