export type PantaAIVisibleAccessMode =
  | "public"
  | "signed-in"
  | "restricted"
  | "admin-only";

export type PantaAIVisibleCard = {
  key: string;
  title: string;
  subtitle: string;
  publicExplanation: string;
  whatItDoes: string[];
  whenToUseIt: string[];
  exampleUserRequests: string[];
  internalCapabilityFamilies: string[];
  accessMode: PantaAIVisibleAccessMode;
  safetyBoundaries: string[];
  expectedResult: string[];
};

export type PantaAIVisibleSurfaceSummary = {
  title: string;
  subtitle: string;
  mission: string;
  cardCount: number;
  publicCount: number;
  signedInCount: number;
  restrictedCount: number;
  adminOnlyCount: number;
  capabilityFamilies: string[];
};

const PANTAAI_VISIBLE_CARDS: PantaAIVisibleCard[] = [
  {
    key: "ai-assistant",
    title: "AI Assistant",
    subtitle: "One intelligent entry point for daily questions, plans and decisions.",
    publicExplanation:
      "Use this when you do not know which tool or workflow you need. Pantavion reads the goal, classifies the request and routes it to the right capability family.",
    whatItDoes: [
      "Understands user intent instead of only reading keywords.",
      "Turns vague requests into structured next steps.",
      "Routes work to research, writing, building, learning, planning or creation paths.",
      "Keeps the experience simple while the Prime Kernel handles complexity behind the surface."
    ],
    whenToUseIt: [
      "When the user wants a general answer.",
      "When the user needs a plan.",
      "When the user is unsure which capability to use.",
      "When the request crosses multiple domains."
    ],
    exampleUserRequests: [
      "Help me organize my day.",
      "Explain this in simple words.",
      "Tell me what I should do next.",
      "Find the best way to solve this."
    ],
    internalCapabilityFamilies: [
      "intent-resolution",
      "answer-strategy",
      "planning",
      "memory-continuity",
      "kernel-routing"
    ],
    accessMode: "public",
    safetyBoundaries: [
      "No hidden authority over user decisions.",
      "High-risk advice routes to safer guidance and review paths.",
      "Truth zone must be visible internally."
    ],
    expectedResult: [
      "Clear answer.",
      "Structured next steps.",
      "Recommended Pantavion path."
    ]
  },
  {
    key: "deep-research",
    title: "Deep Research",
    subtitle: "Evidence-aware research, comparison and synthesis.",
    publicExplanation:
      "Use this for serious research, market intelligence, academic synthesis, competitor analysis and evidence-backed decisions.",
    whatItDoes: [
      "Breaks a research question into subquestions.",
      "Collects and compares sources.",
      "Separates verified information from generative reasoning.",
      "Produces summaries, reports, tables and action recommendations."
    ],
    whenToUseIt: [
      "When accuracy matters.",
      "When comparing companies, technologies or markets.",
      "When preparing decisions, reports or strategy.",
      "When the answer must not be superficial."
    ],
    exampleUserRequests: [
      "Compare these AI tools.",
      "Research the market for this product.",
      "Summarize this topic with evidence.",
      "Find what competitors have and what Pantavion still lacks."
    ],
    internalCapabilityFamilies: [
      "research-retrieval",
      "evidence-scoring",
      "source-comparison",
      "market-intelligence",
      "truth-governance"
    ],
    accessMode: "signed-in",
    safetyBoundaries: [
      "Unverified claims must not be promoted as facts.",
      "Sources and confidence should be tracked.",
      "High-stakes domains require stronger caution."
    ],
    expectedResult: [
      "Evidence summary.",
      "Gap analysis.",
      "Strategic recommendation."
    ]
  },
  {
    key: "writing",
    title: "Writing",
    subtitle: "Professional writing for messages, documents, scripts and public text.",
    publicExplanation:
      "Use this for emails, articles, product descriptions, speeches, posts, reports, summaries and rewrites.",
    whatItDoes: [
      "Drafts text from user intent.",
      "Improves clarity, tone and structure.",
      "Creates multiple versions for different audiences.",
      "Transforms rough notes into polished documents."
    ],
    whenToUseIt: [
      "When the user needs professional text.",
      "When rough notes need structure.",
      "When tone or language must be improved.",
      "When content must be adapted for another audience."
    ],
    exampleUserRequests: [
      "Write this professionally.",
      "Make this shorter and clearer.",
      "Create a product description.",
      "Turn my notes into a formal document."
    ],
    internalCapabilityFamilies: [
      "text-generation",
      "editing",
      "translation",
      "summarization",
      "document-structuring"
    ],
    accessMode: "public",
    safetyBoundaries: [
      "No fake credentials or fabricated claims.",
      "Sensitive documents require privacy-aware handling.",
      "Legal or medical text must stay bounded."
    ],
    expectedResult: [
      "Polished text.",
      "Alternative versions.",
      "Ready-to-use draft."
    ]
  },
  {
    key: "coding-build",
    title: "Coding / Build",
    subtitle: "Apps, websites, code, debugging and software planning.",
    publicExplanation:
      "Use this when the user wants to build software, fix code, create a website, design a feature or understand a technical system.",
    whatItDoes: [
      "Turns product intent into technical structure.",
      "Creates code-ready plans and implementation steps.",
      "Explains errors and repair paths.",
      "Supports app, website, API and workflow construction."
    ],
    whenToUseIt: [
      "When building a website.",
      "When creating an app.",
      "When debugging code.",
      "When translating a product idea into architecture."
    ],
    exampleUserRequests: [
      "Build me a landing page.",
      "Fix this TypeScript error.",
      "Create the folder structure.",
      "Turn this feature into code."
    ],
    internalCapabilityFamilies: [
      "code-generation",
      "debugging",
      "architecture-planning",
      "frontend-build",
      "backend-design",
      "execution-kernel"
    ],
    accessMode: "signed-in",
    safetyBoundaries: [
      "No malware or abuse code.",
      "Security tools remain defensive-first.",
      "Production changes require controlled review."
    ],
    expectedResult: [
      "Working code path.",
      "Build steps.",
      "Debug explanation."
    ]
  },
  {
    key: "design-image",
    title: "Design / Image",
    subtitle: "Visual identity, image creation, editing and design direction.",
    publicExplanation:
      "Use this for logos, brand systems, mockups, visual concepts, image prompts, layout direction and creative identity.",
    whatItDoes: [
      "Creates design direction from brand intent.",
      "Organizes colors, shapes, hierarchy and visual meaning.",
      "Supports image generation and image editing workflows.",
      "Connects visual output with Pantavion identity rules."
    ],
    whenToUseIt: [
      "When designing a logo.",
      "When creating brand assets.",
      "When preparing product visuals.",
      "When improving image direction."
    ],
    exampleUserRequests: [
      "Create a premium logo direction.",
      "Design an app icon.",
      "Make this image more futuristic.",
      "Create a visual system for this product."
    ],
    internalCapabilityFamilies: [
      "image-generation",
      "image-editing",
      "brand-design",
      "ui-design",
      "visual-identity"
    ],
    accessMode: "signed-in",
    safetyBoundaries: [
      "Do not copy protected brand identity.",
      "Respect user-provided design constraints.",
      "Avoid misleading or harmful visual content."
    ],
    expectedResult: [
      "Visual direction.",
      "Prompt-ready output.",
      "Design-ready structure."
    ]
  },
  {
    key: "video-audio",
    title: "Video / Audio",
    subtitle: "Media creation, voice, clips, narration and audio workflows.",
    publicExplanation:
      "Use this for video scripts, voiceovers, audio ideas, clips, narration, podcast planning and future media generation workflows.",
    whatItDoes: [
      "Creates video and audio concepts.",
      "Builds scripts, storyboards and production plans.",
      "Supports voice and narration workflows.",
      "Prepares content for creator and business use."
    ],
    whenToUseIt: [
      "When creating a video.",
      "When planning a podcast.",
      "When preparing a voiceover.",
      "When turning an idea into media."
    ],
    exampleUserRequests: [
      "Create a short video script.",
      "Plan a podcast episode.",
      "Make this into a voiceover.",
      "Turn this idea into a reel."
    ],
    internalCapabilityFamilies: [
      "video-generation",
      "audio-generation",
      "voice-synthesis",
      "storyboarding",
      "media-planning"
    ],
    accessMode: "signed-in",
    safetyBoundaries: [
      "Synthetic media must follow consent and disclosure rules.",
      "No impersonation or deceptive voice use.",
      "Sensitive media routes to review."
    ],
    expectedResult: [
      "Script.",
      "Storyboard.",
      "Production-ready plan."
    ]
  },
  {
    key: "presentations",
    title: "Presentations",
    subtitle: "Slides, pitch decks, reports and visual storytelling.",
    publicExplanation:
      "Use this when the user needs a pitch, business deck, training material, report presentation or structured visual story.",
    whatItDoes: [
      "Turns content into slide structure.",
      "Creates deck outlines and speaker notes.",
      "Organizes arguments visually.",
      "Supports export-ready presentation workflows."
    ],
    whenToUseIt: [
      "When pitching an idea.",
      "When presenting research.",
      "When preparing training material.",
      "When creating a business or investor deck."
    ],
    exampleUserRequests: [
      "Make this into slides.",
      "Create a pitch deck.",
      "Turn my report into a presentation.",
      "Build a 10-slide structure."
    ],
    internalCapabilityFamilies: [
      "presentation-generation",
      "visual-storytelling",
      "business-communication",
      "document-to-deck"
    ],
    accessMode: "signed-in",
    safetyBoundaries: [
      "No fabricated metrics.",
      "Sensitive company data must stay scoped.",
      "Claims require verification when presented as facts."
    ],
    expectedResult: [
      "Slide outline.",
      "Deck structure.",
      "Speaker-ready content."
    ]
  },
  {
    key: "business-strategy",
    title: "Business / Strategy",
    subtitle: "Planning, pricing, operations, positioning and execution.",
    publicExplanation:
      "Use this for business ideas, pricing, market positioning, launch plans, operations, product strategy and execution discipline.",
    whatItDoes: [
      "Turns business goals into plans.",
      "Builds pricing, positioning and go-to-market paths.",
      "Identifies risks and missing pieces.",
      "Creates execution checklists."
    ],
    whenToUseIt: [
      "When starting a business.",
      "When pricing a service.",
      "When planning a launch.",
      "When organizing operations."
    ],
    exampleUserRequests: [
      "Help me price this service.",
      "Create a launch plan.",
      "Find the risks in this business.",
      "Make a strategy for this product."
    ],
    internalCapabilityFamilies: [
      "business-planning",
      "pricing-support",
      "market-analysis",
      "operations-planning",
      "strategy-execution"
    ],
    accessMode: "signed-in",
    safetyBoundaries: [
      "Financial guidance must not pretend to be regulated advice.",
      "Market assumptions should be clearly marked.",
      "High-risk decisions require user approval."
    ],
    expectedResult: [
      "Business plan.",
      "Pricing direction.",
      "Execution roadmap."
    ]
  },
  {
    key: "learning-mastery",
    title: "Learning / Mastery",
    subtitle: "Guided learning paths from beginner to professional.",
    publicExplanation:
      "Use this when the user wants to learn a skill, understand a subject, prepare for a role or build mastery over time.",
    whatItDoes: [
      "Creates step-by-step learning paths.",
      "Adapts difficulty to the user.",
      "Explains concepts clearly.",
      "Creates drills, quizzes and practice paths."
    ],
    whenToUseIt: [
      "When learning a new skill.",
      "When preparing for work or study.",
      "When moving from beginner to advanced.",
      "When the user needs structured progress."
    ],
    exampleUserRequests: [
      "Teach me cybersecurity from zero.",
      "Make a learning path for data analysis.",
      "Explain this like I am a beginner.",
      "Give me practice exercises."
    ],
    internalCapabilityFamilies: [
      "guided-mastery",
      "curriculum-generation",
      "skill-tree",
      "practice-drills",
      "assessment"
    ],
    accessMode: "public",
    safetyBoundaries: [
      "High-stakes domains require safe boundaries.",
      "No unsafe training for misuse.",
      "Learning claims should be honest and progressive."
    ],
    expectedResult: [
      "Learning path.",
      "Practice plan.",
      "Skill progression."
    ]
  },
  {
    key: "automation-workflows",
    title: "Automation / Workflows",
    subtitle: "Turn repeated tasks into governed workflows.",
    publicExplanation:
      "Use this when the user wants to automate work, connect steps, reduce manual tasks or create repeatable execution flows.",
    whatItDoes: [
      "Finds repeated tasks.",
      "Converts steps into workflows.",
      "Plans triggers, checks and outputs.",
      "Routes execution through safe orchestration."
    ],
    whenToUseIt: [
      "When work repeats often.",
      "When tasks need to be connected.",
      "When a process needs tracking.",
      "When the user wants execution instead of only advice."
    ],
    exampleUserRequests: [
      "Automate this workflow.",
      "Make a repeatable process.",
      "Create a checklist that runs every week.",
      "Connect these steps into one flow."
    ],
    internalCapabilityFamilies: [
      "workflow-orchestration",
      "task-state-machine",
      "automation-planning",
      "execution-tracking",
      "fallback-routing"
    ],
    accessMode: "signed-in",
    safetyBoundaries: [
      "Automation requires permission boundaries.",
      "Destructive actions need confirmation.",
      "External tool execution must be governed."
    ],
    expectedResult: [
      "Workflow design.",
      "Execution steps.",
      "Automation plan."
    ]
  },
  {
    key: "notes-memory",
    title: "Notes / Memory",
    subtitle: "Meetings, notes, summaries, recall and continuity.",
    publicExplanation:
      "Use this for notes, meeting summaries, personal knowledge, project memory and long-term continuity.",
    whatItDoes: [
      "Captures notes and decisions.",
      "Summarizes meetings and documents.",
      "Links memory to projects and tasks.",
      "Keeps continuity across time."
    ],
    whenToUseIt: [
      "When summarizing a meeting.",
      "When organizing notes.",
      "When tracking decisions.",
      "When recovering context."
    ],
    exampleUserRequests: [
      "Summarize this meeting.",
      "Remember the decision from today.",
      "Organize these notes.",
      "Show me what we decided before."
    ],
    internalCapabilityFamilies: [
      "meeting-intelligence",
      "semantic-memory",
      "decision-ledger",
      "continuity-recall",
      "project-memory"
    ],
    accessMode: "signed-in",
    safetyBoundaries: [
      "Memory must be consent-aware.",
      "Sensitive notes require scope and retention rules.",
      "Generated memory cannot override verified records."
    ],
    expectedResult: [
      "Summary.",
      "Action items.",
      "Recall-ready memory object."
    ]
  },
  {
    key: "data-analytics",
    title: "Data / Analytics",
    subtitle: "Tables, reports, dashboards, insights and data reasoning.",
    publicExplanation:
      "Use this for CSVs, reports, business metrics, dashboards, data cleaning, summaries and analytics planning.",
    whatItDoes: [
      "Reads structured data.",
      "Finds trends and anomalies.",
      "Creates summaries and dashboards.",
      "Explains what the data means."
    ],
    whenToUseIt: [
      "When analyzing a spreadsheet.",
      "When building a report.",
      "When tracking performance.",
      "When looking for patterns."
    ],
    exampleUserRequests: [
      "Analyze this data.",
      "Find the trend.",
      "Create a dashboard plan.",
      "Explain these numbers."
    ],
    internalCapabilityFamilies: [
      "data-analysis",
      "dashboarding",
      "reporting",
      "statistical-reasoning",
      "business-intelligence"
    ],
    accessMode: "signed-in",
    safetyBoundaries: [
      "Private data must stay scoped.",
      "Financial or medical data requires caution.",
      "Data uncertainty must be visible."
    ],
    expectedResult: [
      "Insight summary.",
      "Tables or charts plan.",
      "Decision support."
    ]
  },
  {
    key: "health-knowledge",
    title: "Health Knowledge",
    subtitle: "Safe health information, preparation and explanation.",
    publicExplanation:
      "Use this for health knowledge, appointment preparation, symptom explanation, medical document summaries and safe education.",
    whatItDoes: [
      "Explains health topics clearly.",
      "Prepares questions for doctors.",
      "Summarizes medical documents when provided.",
      "Routes urgent or dangerous cases away from casual AI use."
    ],
    whenToUseIt: [
      "When understanding medical information.",
      "When preparing for a doctor visit.",
      "When summarizing health documents.",
      "When learning about health safely."
    ],
    exampleUserRequests: [
      "Explain this diagnosis in simple terms.",
      "Prepare questions for my doctor.",
      "Summarize this medical note.",
      "Tell me when this needs urgent help."
    ],
    internalCapabilityFamilies: [
      "health-knowledge-compression",
      "medical-document-summary",
      "safety-triage",
      "doctor-preparation"
    ],
    accessMode: "restricted",
    safetyBoundaries: [
      "No replacement for a doctor.",
      "Emergency symptoms must route to urgent care guidance.",
      "No diagnosis certainty without clinical authority."
    ],
    expectedResult: [
      "Safe explanation.",
      "Doctor questions.",
      "Urgency guidance."
    ]
  },
  {
    key: "finance-guidance",
    title: "Finance-Aware Guidance",
    subtitle: "Budgeting, cost awareness, pricing and business finance context.",
    publicExplanation:
      "Use this for budgets, pricing, cost planning, subscription decisions, business estimates and financial organization.",
    whatItDoes: [
      "Organizes budgets and costs.",
      "Supports pricing logic.",
      "Compares options and tradeoffs.",
      "Explains financial choices in plain language."
    ],
    whenToUseIt: [
      "When planning a budget.",
      "When pricing a service.",
      "When comparing costs.",
      "When organizing business expenses."
    ],
    exampleUserRequests: [
      "Help me plan this budget.",
      "Compare these costs.",
      "Create a pricing model.",
      "Show me where money is going."
    ],
    internalCapabilityFamilies: [
      "budget-planning",
      "pricing-support",
      "cost-analysis",
      "financial-organization"
    ],
    accessMode: "signed-in",
    safetyBoundaries: [
      "No regulated investment advice.",
      "Risk must be clear.",
      "User keeps final decision authority."
    ],
    expectedResult: [
      "Budget structure.",
      "Cost comparison.",
      "Pricing direction."
    ]
  },
  {
    key: "security-defense",
    title: "Security / Defense",
    subtitle: "Defensive cyber support, safety checks and audit-ready guidance.",
    publicExplanation:
      "Use this for defensive security, account safety, incident preparation, checklists, audits and protection planning.",
    whatItDoes: [
      "Creates defensive checklists.",
      "Explains risks and safe posture.",
      "Supports incident response planning.",
      "Routes restricted cyber requests to controlled paths."
    ],
    whenToUseIt: [
      "When improving account security.",
      "When preparing a security checklist.",
      "When responding to a suspected incident.",
      "When auditing defensive readiness."
    ],
    exampleUserRequests: [
      "Create a security checklist.",
      "Help me secure my account.",
      "Prepare an incident response plan.",
      "Review this security posture."
    ],
    internalCapabilityFamilies: [
      "defensive-security",
      "risk-evaluation",
      "audit-logging",
      "incident-response",
      "restricted-admin-security"
    ],
    accessMode: "restricted",
    safetyBoundaries: [
      "No offensive misuse.",
      "No stealth, credential theft or exploit guidance.",
      "Restricted and admin-only flows must be audit-logged."
    ],
    expectedResult: [
      "Defensive checklist.",
      "Risk posture.",
      "Safe incident response steps."
    ]
  },
  {
    key: "app-website-builder",
    title: "App / Website Builder",
    subtitle: "From idea to page, app, workflow or product structure.",
    publicExplanation:
      "Use this when the user wants Pantavion to help build an app, website, service, landing page, workflow or product concept.",
    whatItDoes: [
      "Turns ideas into product structure.",
      "Defines pages, components, data models and flows.",
      "Creates implementation-ready plans.",
      "Connects build work to the Prime Kernel."
    ],
    whenToUseIt: [
      "When creating a new website.",
      "When building an app.",
      "When turning a title into a product.",
      "When planning a service or workflow."
    ],
    exampleUserRequests: [
      "Build me a website for this idea.",
      "Turn this service into an app.",
      "Create the homepage structure.",
      "Make a full product plan."
    ],
    internalCapabilityFamilies: [
      "app-builder",
      "website-builder",
      "workflow-blueprint",
      "product-architecture",
      "kernel-build-supervision"
    ],
    accessMode: "signed-in",
    safetyBoundaries: [
      "Generated build plans must respect policy and identity boundaries.",
      "Production deployment needs review.",
      "External services require legal and provider-compliant integration."
    ],
    expectedResult: [
      "Product blueprint.",
      "Page structure.",
      "Implementation path."
    ]
  }
];

function cloneCard(card: PantaAIVisibleCard): PantaAIVisibleCard {
  return {
    ...card,
    whatItDoes: [...card.whatItDoes],
    whenToUseIt: [...card.whenToUseIt],
    exampleUserRequests: [...card.exampleUserRequests],
    internalCapabilityFamilies: [...card.internalCapabilityFamilies],
    safetyBoundaries: [...card.safetyBoundaries],
    expectedResult: [...card.expectedResult]
  };
}

export function getPantaAIVisibleSurfaceCards(): PantaAIVisibleCard[] {
  return PANTAAI_VISIBLE_CARDS.map((card) => cloneCard(card));
}

export function getPantaAIVisibleSurfaceCard(
  key: string
): PantaAIVisibleCard | null {
  const card = PANTAAI_VISIBLE_CARDS.find((item) => item.key === key);
  return card ? cloneCard(card) : null;
}

export function getPantaAIVisibleSurfaceSummary(): PantaAIVisibleSurfaceSummary {
  const cards = getPantaAIVisibleSurfaceCards();
  const capabilityFamilies = Array.from(
    new Set(cards.flatMap((card) => card.internalCapabilityFamilies))
  ).sort();

  return {
    title: "PantaAI Center",
    subtitle: "One organized place for AI, creation, research, work, learning, automation and execution.",
    mission:
      "The PantaAI Center prevents tool chaos by turning scattered AI tools and services into governed Pantavion capability families.",
    cardCount: cards.length,
    publicCount: cards.filter((card) => card.accessMode === "public").length,
    signedInCount: cards.filter((card) => card.accessMode === "signed-in").length,
    restrictedCount: cards.filter((card) => card.accessMode === "restricted").length,
    adminOnlyCount: cards.filter((card) => card.accessMode === "admin-only").length,
    capabilityFamilies
  };
}
