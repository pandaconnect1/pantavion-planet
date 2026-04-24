// core/intelligence/panta-ai-capability-index.ts

export type PantaAICapabilityArea =
  | "conversation"
  | "research"
  | "coding"
  | "app-building"
  | "writing"
  | "presentation"
  | "notes-memory"
  | "design"
  | "image"
  | "video"
  | "audio"
  | "data"
  | "automation"
  | "learning"
  | "business"
  | "finance"
  | "health-knowledge"
  | "security-defense"
  | "voice-translation"
  | "browser-search"
  | "productivity"
  | "identity-governance";

export type PantaAICapabilityAccess =
  | "public"
  | "signed-in"
  | "verified"
  | "restricted"
  | "admin-only";

export type PantaAICapabilityTruthMode =
  | "generative"
  | "verified"
  | "deterministic"
  | "creative"
  | "restricted"
  | "mixed";

export type PantaAILegalUseMode =
  | "pantavion-native"
  | "official-api-or-partner"
  | "user-provided-import"
  | "public-reference-only"
  | "open-standard-compatible"
  | "manual-user-workflow"
  | "restricted-review-required";

export interface PantaAIReferenceEcosystem {
  name: string;
  region:
    | "global"
    | "usa"
    | "europe"
    | "china"
    | "india"
    | "japan"
    | "korea"
    | "russia"
    | "open-source"
    | "unknown";
  type:
    | "ai-assistant"
    | "research"
    | "coding"
    | "notes"
    | "presentation"
    | "design"
    | "media"
    | "data"
    | "automation"
    | "browser"
    | "productivity"
    | "model-family"
    | "platform";
  legalUseMode: PantaAILegalUseMode;
  purposeInsidePantavion: string;
}

export interface PantaAICapabilityFamily {
  key: string;
  area: PantaAICapabilityArea;
  title: string;
  publicName: string;
  publicExplanation: string;
  userCanAsk: string[];
  pantavionDoes: string[];
  expectedResults: string[];
  internalKernelFamilies: string[];
  referenceEcosystems: PantaAIReferenceEcosystem[];
  legalBoundaries: string[];
  safetyBoundaries: string[];
  truthMode: PantaAICapabilityTruthMode;
  access: PantaAICapabilityAccess;
  publicSurface: "visible" | "visible-as-subsection" | "internal-only";
  defaultRoute: string;
}

export interface PantaAICapabilityIndexSummary {
  generatedAt: string;
  familyCount: number;
  publicVisibleCount: number;
  restrictedCount: number;
  adminOnlyCount: number;
  referenceEcosystemCount: number;
  legalModes: PantaAILegalUseMode[];
  areas: PantaAICapabilityArea[];
}

const REFERENCES = {
  openaiChatGPT: ref(
    "ChatGPT / OpenAI",
    "usa",
    "ai-assistant",
    "official-api-or-partner",
    "Reference for conversational AI, reasoning, coding, multimodal assistance and agentic workflows."
  ),
  anthropicClaude: ref(
    "Claude / Anthropic",
    "usa",
    "ai-assistant",
    "official-api-or-partner",
    "Reference for long-context reasoning, writing, coding and safe assistant workflows."
  ),
  googleGemini: ref(
    "Gemini / Google",
    "usa",
    "model-family",
    "official-api-or-partner",
    "Reference for multimodal AI, search-adjacent intelligence, workspace assistance and model routing."
  ),
  microsoftCopilot: ref(
    "Microsoft Copilot",
    "usa",
    "productivity",
    "official-api-or-partner",
    "Reference for productivity, document, enterprise and coding assistance patterns."
  ),
  metaAI: ref(
    "Meta AI",
    "usa",
    "ai-assistant",
    "public-reference-only",
    "Reference for social-integrated assistant experiences and consumer AI surfaces."
  ),
  grokX: ref(
    "Grok / X",
    "usa",
    "ai-assistant",
    "public-reference-only",
    "Reference for real-time social context and conversational search patterns."
  ),
  perplexity: ref(
    "Perplexity",
    "usa",
    "research",
    "public-reference-only",
    "Reference for answer-with-sources research experiences."
  ),
  notebookLm: ref(
    "NotebookLM",
    "usa",
    "research",
    "manual-user-workflow",
    "Reference for source-grounded study, document intelligence and notebook synthesis."
  ),
  obsidian: ref(
    "Obsidian",
    "global",
    "notes",
    "manual-user-workflow",
    "Reference for local-first notes, graph knowledge and personal memory workflows."
  ),
  gamma: ref(
    "Gamma",
    "global",
    "presentation",
    "public-reference-only",
    "Reference for AI-assisted presentation and document generation."
  ),
  roseAi: ref(
    "Rose AI",
    "global",
    "data",
    "public-reference-only",
    "Reference for data analysis and research workspace patterns."
  ),
  affinity: ref(
    "Affinity",
    "europe",
    "design",
    "manual-user-workflow",
    "Reference for professional design, layout and creative production workflows."
  ),
  figma: ref(
    "Figma",
    "usa",
    "design",
    "official-api-or-partner",
    "Reference for collaborative UI design, prototyping and design-system workflows."
  ),
  canva: ref(
    "Canva",
    "global",
    "design",
    "public-reference-only",
    "Reference for accessible design, templates and social media creative workflows."
  ),
  adobe: ref(
    "Adobe Creative Cloud / Firefly",
    "usa",
    "media",
    "official-api-or-partner",
    "Reference for professional creative tooling, image, video, layout and generative media workflows."
  ),
  runway: ref(
    "Runway",
    "usa",
    "media",
    "public-reference-only",
    "Reference for AI video generation and media editing workflows."
  ),
  higgsfield: ref(
    "Higgsfield",
    "global",
    "media",
    "public-reference-only",
    "Reference for AI video and motion-generation capability patterns."
  ),
  midjourney: ref(
    "Midjourney",
    "usa",
    "media",
    "manual-user-workflow",
    "Reference for high-quality image generation patterns."
  ),
  cursor: ref(
    "Cursor",
    "usa",
    "coding",
    "manual-user-workflow",
    "Reference for AI-assisted coding, repo editing and developer workflow patterns."
  ),
  githubCopilot: ref(
    "GitHub Copilot",
    "usa",
    "coding",
    "official-api-or-partner",
    "Reference for code completion, coding assistance and development productivity."
  ),
  replit: ref(
    "Replit",
    "usa",
    "coding",
    "official-api-or-partner",
    "Reference for browser-based coding, app hosting and build environments."
  ),
  notion: ref(
    "Notion",
    "usa",
    "productivity",
    "official-api-or-partner",
    "Reference for workspace organization, docs, tasks and knowledge-base experiences."
  ),
  zapier: ref(
    "Zapier",
    "usa",
    "automation",
    "official-api-or-partner",
    "Reference for no-code automation, triggers, actions and app connections."
  ),
  make: ref(
    "Make",
    "europe",
    "automation",
    "official-api-or-partner",
    "Reference for workflow automation, scenarios and integration orchestration."
  ),
  airtable: ref(
    "Airtable",
    "usa",
    "data",
    "official-api-or-partner",
    "Reference for structured data, lightweight apps and workflow databases."
  ),
  operaAria: ref(
    "Opera Aria",
    "europe",
    "browser",
    "public-reference-only",
    "Reference for browser-integrated assistant and web-navigation AI surfaces."
  ),
  appleIntelligence: ref(
    "Apple Intelligence",
    "usa",
    "platform",
    "public-reference-only",
    "Reference for privacy-oriented on-device and ecosystem-integrated AI experiences."
  ),
  ernie: ref(
    "ERNIE / Baidu",
    "china",
    "model-family",
    "public-reference-only",
    "Reference for Chinese AI model and search ecosystem patterns."
  ),
  qwen: ref(
    "Qwen / Alibaba",
    "china",
    "model-family",
    "open-standard-compatible",
    "Reference for multilingual model family and open model ecosystem patterns."
  ),
  hunyuan: ref(
    "Hunyuan / Tencent",
    "china",
    "model-family",
    "public-reference-only",
    "Reference for Chinese AI platform and enterprise capability patterns."
  ),
  doubao: ref(
    "Doubao / ByteDance",
    "china",
    "ai-assistant",
    "public-reference-only",
    "Reference for consumer assistant and creator ecosystem patterns."
  ),
  deepseek: ref(
    "DeepSeek",
    "china",
    "model-family",
    "open-standard-compatible",
    "Reference for reasoning/coding model family and cost-efficient model routing patterns."
  ),
  kimi: ref(
    "Kimi / Moonshot AI",
    "china",
    "ai-assistant",
    "public-reference-only",
    "Reference for long-context assistant and document understanding patterns."
  ),
  yandexGpt: ref(
    "YandexGPT",
    "russia",
    "model-family",
    "public-reference-only",
    "Reference for Russian-language model ecosystem and regional AI patterns."
  ),
  gigaChat: ref(
    "GigaChat / Sber",
    "russia",
    "model-family",
    "public-reference-only",
    "Reference for Russian-language assistant and model ecosystem patterns."
  ),
  hyperClova: ref(
    "HyperCLOVA X / Naver",
    "korea",
    "model-family",
    "public-reference-only",
    "Reference for Korean-language AI and regional platform patterns."
  ),
  krutrim: ref(
    "Krutrim",
    "india",
    "model-family",
    "public-reference-only",
    "Reference for India-focused AI model and multilingual local AI patterns."
  ),
  sarvam: ref(
    "Sarvam AI",
    "india",
    "model-family",
    "public-reference-only",
    "Reference for Indian-language AI, voice and regional assistant capability patterns."
  ),
};

const CAPABILITY_INDEX: PantaAICapabilityFamily[] = [
  {
    key: "universal-ai-assistant",
    area: "conversation",
    title: "Universal AI Assistant",
    publicName: "AI Assistant",
    publicExplanation:
      "One clear assistant surface for questions, planning, decisions, summaries, rewriting and personal support.",
    userCanAsk: [
      "Explain this simply.",
      "Help me plan my next step.",
      "Compare options and recommend a path.",
      "Turn my messy idea into a structured plan.",
    ],
    pantavionDoes: [
      "Resolves intent before selecting a capability.",
      "Routes the task to the right internal AI family.",
      "Keeps tool names secondary and outcome first.",
      "Uses truth, memory and safety checks when needed.",
    ],
    expectedResults: [
      "Clear answer",
      "Structured plan",
      "Decision support",
      "Follow-up action path",
    ],
    internalKernelFamilies: [
      "intent-resolution",
      "assistant-routing",
      "memory-aware-answering",
      "truth-zone-selection",
    ],
    referenceEcosystems: [
      REFERENCES.openaiChatGPT,
      REFERENCES.anthropicClaude,
      REFERENCES.googleGemini,
      REFERENCES.microsoftCopilot,
      REFERENCES.metaAI,
      REFERENCES.grokX,
    ],
    legalBoundaries: [
      "Use official APIs or approved partner routes when integrating external providers.",
      "Do not represent third-party AI products as Pantavion-owned.",
      "Store only allowed user memory under Pantavion memory policy.",
    ],
    safetyBoundaries: [
      "No unsafe instructions.",
      "No hidden impersonation.",
      "No high-stakes final authority without review.",
    ],
    truthMode: "mixed",
    access: "public",
    publicSurface: "visible",
    defaultRoute: "/intelligence",
  },
  {
    key: "verified-research-engine",
    area: "research",
    title: "Verified Research Engine",
    publicName: "Research",
    publicExplanation:
      "Deep research with source handling, comparison, evidence tracking, synthesis and uncertainty marking.",
    userCanAsk: [
      "Research this market.",
      "Compare these competitors.",
      "Find evidence before we decide.",
      "Summarize documents and show what matters.",
    ],
    pantavionDoes: [
      "Separates facts from synthesis.",
      "Requires source/provenance tracking.",
      "Flags uncertainty and missing evidence.",
      "Routes sensitive research through review when needed.",
    ],
    expectedResults: [
      "Evidence-backed summary",
      "Comparison matrix",
      "Research brief",
      "Decision-ready synthesis",
    ],
    internalKernelFamilies: [
      "retrieval",
      "source-verification",
      "evidence-ranking",
      "research-synthesis",
    ],
    referenceEcosystems: [
      REFERENCES.perplexity,
      REFERENCES.notebookLm,
      REFERENCES.googleGemini,
      REFERENCES.openaiChatGPT,
      REFERENCES.anthropicClaude,
    ],
    legalBoundaries: [
      "Respect copyright and source usage limits.",
      "Cite sources when public facts or fresh claims are used.",
      "Do not scrape or bypass access controls.",
    ],
    safetyBoundaries: [
      "Mark unverified claims.",
      "Avoid medical/legal/financial final decisions without qualified review.",
    ],
    truthMode: "verified",
    access: "signed-in",
    publicSurface: "visible",
    defaultRoute: "/intelligence/routing",
  },
  {
    key: "code-and-build-studio",
    area: "coding",
    title: "Code and Build Studio",
    publicName: "Build",
    publicExplanation:
      "Build apps, websites, APIs, dashboards and product flows with governed code assistance and validation.",
    userCanAsk: [
      "Build a Next.js page.",
      "Fix this TypeScript error.",
      "Create a dashboard.",
      "Turn this feature idea into files.",
    ],
    pantavionDoes: [
      "Creates build plans before code changes.",
      "Separates full-file replacement from unsafe snippets.",
      "Runs validation through typecheck/build gates.",
      "Keeps repo continuity and rollback discipline.",
    ],
    expectedResults: [
      "Implementation plan",
      "Full-file code",
      "Validated patch",
      "Recovery-safe build sequence",
    ],
    internalKernelFamilies: [
      "repo-awareness",
      "code-generation",
      "typecheck-validation",
      "build-validation",
      "rollback-policy",
    ],
    referenceEcosystems: [
      REFERENCES.githubCopilot,
      REFERENCES.cursor,
      REFERENCES.replit,
      REFERENCES.openaiChatGPT,
      REFERENCES.anthropicClaude,
    ],
    legalBoundaries: [
      "Use user-owned code, open-source-compatible references or official APIs.",
      "Do not copy proprietary source from external tools.",
      "Respect software licenses.",
    ],
    safetyBoundaries: [
      "No destructive commands without explicit user approval.",
      "No secrets exposure.",
      "No blind terminal paste of raw TypeScript.",
    ],
    truthMode: "deterministic",
    access: "signed-in",
    publicSurface: "visible",
    defaultRoute: "/intelligence/routing",
  },
  {
    key: "app-website-product-builder",
    area: "app-building",
    title: "App, Website and Product Builder",
    publicName: "App and Website Builder",
    publicExplanation:
      "From idea to product: landing pages, modules, forms, dashboards, app flows and launch-ready surfaces.",
    userCanAsk: [
      "Create a website for my idea.",
      "Design a product homepage.",
      "Build an app module.",
      "Make this ready for launch.",
    ],
    pantavionDoes: [
      "Turns intent into product structure.",
      "Maps public surfaces to internal capabilities.",
      "Keeps UX simple while kernel routing stays deep.",
      "Connects build, design, content and deployment readiness.",
    ],
    expectedResults: [
      "Page structure",
      "Product flow",
      "UI implementation",
      "Launch checklist",
    ],
    internalKernelFamilies: [
      "product-surface-design",
      "app-composition",
      "frontend-generation",
      "deployment-readiness",
    ],
    referenceEcosystems: [
      REFERENCES.replit,
      REFERENCES.figma,
      REFERENCES.canva,
      REFERENCES.githubCopilot,
      REFERENCES.openaiChatGPT,
    ],
    legalBoundaries: [
      "Use Pantavion-native templates or licensed assets.",
      "Avoid cloning third-party product UI exactly.",
    ],
    safetyBoundaries: [
      "Review payment, auth, privacy and data collection before production.",
    ],
    truthMode: "creative",
    access: "signed-in",
    publicSurface: "visible",
    defaultRoute: "/intelligence",
  },
  {
    key: "writing-content-engine",
    area: "writing",
    title: "Writing and Content Engine",
    publicName: "Writing",
    publicExplanation:
      "Write, rewrite, translate, summarize and adapt content for business, education, media and communication.",
    userCanAsk: [
      "Write this email.",
      "Rewrite this professionally.",
      "Summarize this text.",
      "Create a post or article.",
    ],
    pantavionDoes: [
      "Detects audience, tone and purpose.",
      "Produces structured writing outputs.",
      "Can connect writing with research and design.",
    ],
    expectedResults: [
      "Email",
      "Article",
      "Script",
      "Summary",
      "Translated or localized text",
    ],
    internalKernelFamilies: [
      "writing-generation",
      "translation",
      "tone-control",
      "content-structuring",
    ],
    referenceEcosystems: [
      REFERENCES.openaiChatGPT,
      REFERENCES.anthropicClaude,
      REFERENCES.googleGemini,
      REFERENCES.notion,
    ],
    legalBoundaries: [
      "Do not claim third-party text as sourced unless evidence exists.",
      "Respect copyright and user ownership.",
    ],
    safetyBoundaries: [
      "Avoid deceptive impersonation.",
      "Mark sensitive claims that need verification.",
    ],
    truthMode: "generative",
    access: "public",
    publicSurface: "visible-as-subsection",
    defaultRoute: "/intelligence",
  },
  {
    key: "presentation-document-studio",
    area: "presentation",
    title: "Presentation and Document Studio",
    publicName: "Presentations",
    publicExplanation:
      "Create decks, reports, briefs, proposals and structured documents from raw ideas or research.",
    userCanAsk: [
      "Make a pitch deck.",
      "Turn this into slides.",
      "Create a project report.",
      "Prepare a professional brief.",
    ],
    pantavionDoes: [
      "Converts messy information into narrative structure.",
      "Maps audience, purpose and slide hierarchy.",
      "Can feed from research, data and writing capabilities.",
    ],
    expectedResults: [
      "Slide outline",
      "Presentation copy",
      "Report structure",
      "Pitch narrative",
    ],
    internalKernelFamilies: [
      "deck-planning",
      "document-generation",
      "visual-briefing",
      "executive-summary",
    ],
    referenceEcosystems: [
      REFERENCES.gamma,
      REFERENCES.canva,
      REFERENCES.microsoftCopilot,
      REFERENCES.googleGemini,
    ],
    legalBoundaries: [
      "Use licensed templates/assets only.",
      "Do not copy third-party deck designs exactly.",
    ],
    safetyBoundaries: [
      "Verify public facts and data before final presentation.",
    ],
    truthMode: "mixed",
    access: "signed-in",
    publicSurface: "visible-as-subsection",
    defaultRoute: "/intelligence/capabilities",
  },
  {
    key: "notes-memory-knowledge-graph",
    area: "notes-memory",
    title: "Notes, Memory and Knowledge Graph",
    publicName: "Notes and Memory",
    publicExplanation:
      "Organize notes, meetings, files, ideas, personal knowledge and long-term continuity in one memory-aware system.",
    userCanAsk: [
      "Remember this project decision.",
      "Organize my notes.",
      "Summarize this meeting.",
      "Find what we decided before.",
    ],
    pantavionDoes: [
      "Classifies memory by sensitivity and retention.",
      "Links notes to people, projects, topics and decisions.",
      "Keeps continuity across sessions when allowed.",
    ],
    expectedResults: [
      "Structured notes",
      "Decision memory",
      "Meeting summary",
      "Knowledge graph links",
    ],
    internalKernelFamilies: [
      "memory-classification",
      "continuity-recall",
      "semantic-linking",
      "meeting-intelligence",
    ],
    referenceEcosystems: [
      REFERENCES.obsidian,
      REFERENCES.notebookLm,
      REFERENCES.notion,
      REFERENCES.openaiChatGPT,
    ],
    legalBoundaries: [
      "User controls what becomes persistent memory.",
      "Sensitive memory requires explicit governance.",
    ],
    safetyBoundaries: [
      "No hidden memory promotion.",
      "Sensitive personal data requires strict access rules.",
    ],
    truthMode: "mixed",
    access: "signed-in",
    publicSurface: "visible",
    defaultRoute: "/memory",
  },
  {
    key: "design-visual-identity-studio",
    area: "design",
    title: "Design and Visual Identity Studio",
    publicName: "Design",
    publicExplanation:
      "Create logos, brand systems, UI concepts, layouts, graphics and visual identity directions.",
    userCanAsk: [
      "Design a logo.",
      "Create a brand style.",
      "Make this UI look premium.",
      "Prepare visual directions.",
    ],
    pantavionDoes: [
      "Turns brand intent into visual system rules.",
      "Separates logo, UI, color, typography and usage.",
      "Can route to image/media generation or manual design workflows.",
    ],
    expectedResults: [
      "Brand direction",
      "Logo brief",
      "UI design rules",
      "Visual asset plan",
    ],
    internalKernelFamilies: [
      "brand-system",
      "visual-design",
      "ui-design",
      "asset-generation",
    ],
    referenceEcosystems: [
      REFERENCES.affinity,
      REFERENCES.figma,
      REFERENCES.canva,
      REFERENCES.adobe,
    ],
    legalBoundaries: [
      "Avoid trademark conflicts and copied brand identities.",
      "Use licensed fonts/assets only.",
    ],
    safetyBoundaries: [
      "No deceptive brand impersonation.",
    ],
    truthMode: "creative",
    access: "signed-in",
    publicSurface: "visible",
    defaultRoute: "/intelligence",
  },
  {
    key: "image-generation-editing",
    area: "image",
    title: "Image Generation and Editing",
    publicName: "Images",
    publicExplanation:
      "Generate, edit, refine and prepare images for brands, products, content, education and media.",
    userCanAsk: [
      "Create an image.",
      "Edit this visual.",
      "Make a product mockup.",
      "Create a campaign image.",
    ],
    pantavionDoes: [
      "Builds a visual brief.",
      "Routes to image generation or editing capability.",
      "Checks rights, safety and visual consistency.",
    ],
    expectedResults: [
      "Generated image brief",
      "Edited image request",
      "Asset set",
      "Mockup direction",
    ],
    internalKernelFamilies: [
      "image-generation",
      "image-editing",
      "visual-safety",
      "brand-consistency",
    ],
    referenceEcosystems: [
      REFERENCES.midjourney,
      REFERENCES.adobe,
      REFERENCES.canva,
      REFERENCES.openaiChatGPT,
    ],
    legalBoundaries: [
      "Respect image rights, likeness, trademarks and provider policies.",
    ],
    safetyBoundaries: [
      "No non-consensual sensitive edits.",
      "No harmful deceptive media.",
    ],
    truthMode: "creative",
    access: "signed-in",
    publicSurface: "visible-as-subsection",
    defaultRoute: "/intelligence/capabilities",
  },
  {
    key: "video-audio-media-engine",
    area: "video",
    title: "Video, Audio and Media Engine",
    publicName: "Video and Audio",
    publicExplanation:
      "Plan, generate, edit and package video, audio, podcast, reels, voiceover and media workflows.",
    userCanAsk: [
      "Create a short video idea.",
      "Make a podcast script.",
      "Plan a voiceover.",
      "Prepare media content.",
    ],
    pantavionDoes: [
      "Creates media production plans.",
      "Routes between script, voice, visuals and editing workflows.",
      "Applies rights and media safety checks.",
    ],
    expectedResults: [
      "Video plan",
      "Audio script",
      "Storyboard",
      "Media workflow",
    ],
    internalKernelFamilies: [
      "video-planning",
      "audio-generation",
      "voice-workflow",
      "media-packaging",
    ],
    referenceEcosystems: [
      REFERENCES.runway,
      REFERENCES.higgsfield,
      REFERENCES.adobe,
      REFERENCES.canva,
    ],
    legalBoundaries: [
      "Respect likeness, copyright, music rights and provider usage policies.",
    ],
    safetyBoundaries: [
      "No deceptive deepfake misuse.",
      "No unsafe or exploitative media generation.",
    ],
    truthMode: "creative",
    access: "signed-in",
    publicSurface: "visible-as-subsection",
    defaultRoute: "/intelligence/capabilities",
  },
  {
    key: "data-analysis-decision-engine",
    area: "data",
    title: "Data Analysis and Decision Engine",
    publicName: "Data",
    publicExplanation:
      "Analyze tables, business data, metrics, research datasets and operational information.",
    userCanAsk: [
      "Analyze this dataset.",
      "Find trends in this table.",
      "Create a dashboard plan.",
      "Explain these numbers.",
    ],
    pantavionDoes: [
      "Classifies data type and risk.",
      "Extracts insights and flags uncertainty.",
      "Can route to charts, summaries and decision support.",
    ],
    expectedResults: [
      "Insight summary",
      "Trend analysis",
      "Dashboard structure",
      "Decision notes",
    ],
    internalKernelFamilies: [
      "data-ingestion",
      "analytics",
      "charting",
      "business-intelligence",
    ],
    referenceEcosystems: [
      REFERENCES.roseAi,
      REFERENCES.airtable,
      REFERENCES.microsoftCopilot,
      REFERENCES.googleGemini,
    ],
    legalBoundaries: [
      "Do not ingest private data without user authorization.",
      "Respect data residency and privacy rules.",
    ],
    safetyBoundaries: [
      "Mark statistical uncertainty.",
      "Do not fabricate data.",
    ],
    truthMode: "verified",
    access: "signed-in",
    publicSurface: "visible",
    defaultRoute: "/intelligence/capabilities",
  },
  {
    key: "automation-agent-workflows",
    area: "automation",
    title: "Automation and Agent Workflows",
    publicName: "Automation",
    publicExplanation:
      "Automate repetitive work, connect tasks, route approvals, trigger actions and supervise workflows.",
    userCanAsk: [
      "Automate this task.",
      "Create a workflow.",
      "Set up a trigger.",
      "Connect these steps.",
    ],
    pantavionDoes: [
      "Builds a state machine before execution.",
      "Checks permissions, retries, fallback and audit.",
      "Routes only approved actions to tools/providers.",
    ],
    expectedResults: [
      "Workflow plan",
      "Trigger/action map",
      "Automation checklist",
      "Execution state model",
    ],
    internalKernelFamilies: [
      "workflow-orchestration",
      "agent-routing",
      "state-machine",
      "approval-gates",
    ],
    referenceEcosystems: [
      REFERENCES.zapier,
      REFERENCES.make,
      REFERENCES.notion,
      REFERENCES.airtable,
    ],
    legalBoundaries: [
      "Use official APIs or user-approved connections.",
      "No unauthorized account access.",
    ],
    safetyBoundaries: [
      "No destructive automation without explicit confirmation.",
      "All privileged automations require audit logging.",
    ],
    truthMode: "deterministic",
    access: "verified",
    publicSurface: "visible",
    defaultRoute: "/intelligence/routing",
  },
  {
    key: "learning-guided-mastery",
    area: "learning",
    title: "Learning and Guided Mastery",
    publicName: "Learn",
    publicExplanation:
      "Turn any goal into a learning path with sequence, practice, feedback and progress memory.",
    userCanAsk: [
      "Teach me cybersecurity defensively.",
      "Create a study plan.",
      "Help me learn coding.",
      "Make lessons for my level.",
    ],
    pantavionDoes: [
      "Detects skill level.",
      "Builds a sequenced path.",
      "Adds practice and progress checkpoints.",
      "Keeps restricted topics defensive and safe.",
    ],
    expectedResults: [
      "Learning path",
      "Lesson sequence",
      "Practice tasks",
      "Progress checkpoint",
    ],
    internalKernelFamilies: [
      "skill-detection",
      "curriculum-planning",
      "practice-feedback",
      "progress-memory",
    ],
    referenceEcosystems: [
      REFERENCES.notebookLm,
      REFERENCES.openaiChatGPT,
      REFERENCES.anthropicClaude,
      REFERENCES.googleGemini,
    ],
    legalBoundaries: [
      "Respect educational content rights.",
      "Do not present unsafe restricted training as casual content.",
    ],
    safetyBoundaries: [
      "Cybersecurity learning is defensive-first.",
      "Medical/legal/financial learning is educational, not final advice.",
    ],
    truthMode: "mixed",
    access: "signed-in",
    publicSurface: "visible",
    defaultRoute: "/intelligence",
  },
  {
    key: "business-strategy-operations",
    area: "business",
    title: "Business, Strategy and Operations",
    publicName: "Business",
    publicExplanation:
      "Support planning, pricing, strategy, market analysis, operations, launch and growth decisions.",
    userCanAsk: [
      "Create a business plan.",
      "Analyze competitors.",
      "Design pricing.",
      "Prepare a launch strategy.",
    ],
    pantavionDoes: [
      "Combines research, writing, data and planning.",
      "Builds operational steps.",
      "Flags assumptions and risks.",
    ],
    expectedResults: [
      "Business plan",
      "Market brief",
      "Pricing model",
      "Growth strategy",
    ],
    internalKernelFamilies: [
      "business-planning",
      "market-analysis",
      "pricing-support",
      "operations-design",
    ],
    referenceEcosystems: [
      REFERENCES.openaiChatGPT,
      REFERENCES.anthropicClaude,
      REFERENCES.perplexity,
      REFERENCES.roseAi,
    ],
    legalBoundaries: [
      "No guarantee of business results.",
      "Financial claims require verification and disclaimers.",
    ],
    safetyBoundaries: [
      "Mark assumptions.",
      "Avoid deceptive marketing guidance.",
    ],
    truthMode: "mixed",
    access: "signed-in",
    publicSurface: "visible-as-subsection",
    defaultRoute: "/intelligence/capabilities",
  },
  {
    key: "voice-language-interpreter",
    area: "voice-translation",
    title: "Voice and Language Interpreter",
    publicName: "Voice Translation",
    publicExplanation:
      "Translate speech, text and multilingual conversations with language detection and context adaptation.",
    userCanAsk: [
      "Translate this.",
      "Help me speak with someone in another language.",
      "Create a multilingual message.",
      "Detect the language.",
    ],
    pantavionDoes: [
      "Detects language intent.",
      "Routes to translation/interpreter workflows.",
      "Preserves context and clarity.",
    ],
    expectedResults: [
      "Translation",
      "Interpreter-ready message",
      "Localized text",
      "Voice workflow",
    ],
    internalKernelFamilies: [
      "language-detection",
      "translation",
      "voice-runtime",
      "locale-adaptation",
    ],
    referenceEcosystems: [
      REFERENCES.googleGemini,
      REFERENCES.openaiChatGPT,
      REFERENCES.sarvam,
      REFERENCES.appleIntelligence,
    ],
    legalBoundaries: [
      "Respect provider voice and speech policies.",
      "Do not store voice samples without consent.",
    ],
    safetyBoundaries: [
      "High-stakes translation should allow human review.",
    ],
    truthMode: "mixed",
    access: "public",
    publicSurface: "visible",
    defaultRoute: "/intelligence",
  },
  {
    key: "security-defense-review",
    area: "security-defense",
    title: "Security and Defensive Review",
    publicName: "Security Review",
    publicExplanation:
      "Defensive security checks, privacy review, audit thinking, incident readiness and safe hardening.",
    userCanAsk: [
      "Review this for security.",
      "Help me harden this system.",
      "Create an incident checklist.",
      "Check privacy risks.",
    ],
    pantavionDoes: [
      "Routes security tasks through restricted review.",
      "Keeps cyber defensive-first.",
      "Requires audit and admin visibility for sensitive paths.",
    ],
    expectedResults: [
      "Security checklist",
      "Risk review",
      "Incident plan",
      "Hardening recommendations",
    ],
    internalKernelFamilies: [
      "defensive-security",
      "risk-evaluation",
      "audit-logging",
      "restricted-policy",
    ],
    referenceEcosystems: [
      REFERENCES.openaiChatGPT,
      REFERENCES.anthropicClaude,
      REFERENCES.googleGemini,
      REFERENCES.githubCopilot,
    ],
    legalBoundaries: [
      "No offensive misuse surface.",
      "No unauthorized access guidance.",
      "Restricted/admin-only actions require approval.",
    ],
    safetyBoundaries: [
      "Defensive-first only.",
      "Audit-logged restricted actions.",
      "Admin review for high-risk requests.",
    ],
    truthMode: "restricted",
    access: "restricted",
    publicSurface: "visible-as-subsection",
    defaultRoute: "/security",
  },
  {
    key: "global-model-provider-awareness",
    area: "browser-search",
    title: "Global Model and Provider Awareness",
    publicName: "Global AI Map",
    publicExplanation:
      "Pantavion tracks global AI ecosystems across the US, Europe, China, India, Russia, Korea, Japan and open-source regions as capability references.",
    userCanAsk: [
      "Compare AI ecosystems.",
      "Find the right AI family for this task.",
      "Show global AI options.",
      "Track strengths and weaknesses.",
    ],
    pantavionDoes: [
      "Keeps a provider-aware capability map.",
      "Extracts strengths into Pantavion-native capabilities.",
      "Avoids dependency on one vendor.",
      "Uses legal integration routes only.",
    ],
    expectedResults: [
      "Provider map",
      "Capability comparison",
      "Routing recommendation",
      "Gap analysis",
    ],
    internalKernelFamilies: [
      "provider-awareness",
      "capability-scoring",
      "cost-routing",
      "fallback-routing",
      "global-tech-radar",
    ],
    referenceEcosystems: [
      REFERENCES.openaiChatGPT,
      REFERENCES.anthropicClaude,
      REFERENCES.googleGemini,
      REFERENCES.deepseek,
      REFERENCES.qwen,
      REFERENCES.ernie,
      REFERENCES.hunyuan,
      REFERENCES.doubao,
      REFERENCES.kimi,
      REFERENCES.yandexGpt,
      REFERENCES.gigaChat,
      REFERENCES.hyperClova,
      REFERENCES.krutrim,
      REFERENCES.sarvam,
    ],
    legalBoundaries: [
      "References do not imply ownership, endorsement or active integration.",
      "External integrations must use official APIs, allowed user workflows or open-standard-compatible routes.",
      "Pantavion must build its own lawful capability layer instead of cloning products.",
    ],
    safetyBoundaries: [
      "No provider lock-in.",
      "No unsafe scraping.",
      "No bypassing terms or access controls.",
    ],
    truthMode: "verified",
    access: "admin-only",
    publicSurface: "internal-only",
    defaultRoute: "/intelligence/routing",
  },
];

export function getPantaAICapabilityIndex(): PantaAICapabilityFamily[] {
  return CAPABILITY_INDEX.map((item) => clone(item));
}

export function getPantaAIPublicCapabilityFamilies(): PantaAICapabilityFamily[] {
  return getPantaAICapabilityIndex().filter(
    (item) => item.publicSurface !== "internal-only"
  );
}

export function getPantaAICapabilityFamily(
  key: string
): PantaAICapabilityFamily | null {
  const item = CAPABILITY_INDEX.find((entry) => entry.key === key);
  return item ? clone(item) : null;
}

export function getPantaAICapabilityIndexSummary(): PantaAICapabilityIndexSummary {
  const families = getPantaAICapabilityIndex();
  const references = families.flatMap((item) => item.referenceEcosystems);

  return {
    generatedAt: new Date().toISOString(),
    familyCount: families.length,
    publicVisibleCount: families.filter((item) => item.publicSurface !== "internal-only")
      .length,
    restrictedCount: families.filter((item) => item.access === "restricted")
      .length,
    adminOnlyCount: families.filter((item) => item.access === "admin-only")
      .length,
    referenceEcosystemCount: references.length,
    legalModes: unique(references.map((item) => item.legalUseMode)).sort(),
    areas: unique(families.map((item) => item.area)).sort(),
  };
}

export function searchPantaAICapabilityIndex(
  query: string
): PantaAICapabilityFamily[] {
  const normalized = normalize(query);
  if (!normalized) {
    return getPantaAIPublicCapabilityFamilies();
  }

  return getPantaAICapabilityIndex()
    .map((family) => ({
      family,
      score: scoreFamily(family, normalized),
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .map((item) => item.family);
}

function scoreFamily(
  family: PantaAICapabilityFamily,
  normalizedQuery: string
): number {
  const searchable = normalize(
    [
      family.key,
      family.area,
      family.title,
      family.publicName,
      family.publicExplanation,
      family.userCanAsk.join(" "),
      family.pantavionDoes.join(" "),
      family.expectedResults.join(" "),
      family.internalKernelFamilies.join(" "),
      family.referenceEcosystems.map((item) => item.name).join(" "),
    ].join(" ")
  );

  const tokens = normalize(normalizedQuery)
    .split(/\s+/)
    .filter((item) => item.length >= 3);

  let score = 0;

  if (searchable.includes(normalizedQuery)) {
    score += 20;
  }

  for (const token of tokens) {
    if (searchable.includes(token)) {
      score += token.length > 5 ? 4 : 2;
    }
  }

  return score;
}

function ref(
  name: string,
  region: PantaAIReferenceEcosystem["region"],
  type: PantaAIReferenceEcosystem["type"],
  legalUseMode: PantaAILegalUseMode,
  purposeInsidePantavion: string
): PantaAIReferenceEcosystem {
  return {
    name,
    region,
    type,
    legalUseMode,
    purposeInsidePantavion,
  };
}

function unique<T extends string>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9α-ωάέήίόύώϊϋΐΰ\s-]/gi, " ").trim();
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
