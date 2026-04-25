/**
 * core/intelligence/panta-ai-public-surface-spec.ts
 *
 * PantaAI Center Public Surface Spec
 *
 * Purpose:
 * - Gives Pantavion Planet public AI surface.
 * - Avoids chaotic tool zoo.
 * - Converts external AI/tool market patterns into lawful Pantavion capability families.
 * - Keeps the user experience simple while the Prime Kernel handles orchestration internally.
 */

export type PantaAIAccessMode =
  | 'public'
  | 'signed-in'
  | 'verified'
  | 'restricted'
  | 'admin-only';

export type PantaAITruthMode =
  | 'deterministic'
  | 'verified'
  | 'generative'
  | 'mixed';

export type PantaAICapabilityFamily =
  | 'general-ai-assistance'
  | 'deep-research'
  | 'writing-editing'
  | 'coding-build'
  | 'app-website-builder'
  | 'design-image'
  | 'video-media'
  | 'audio-voice'
  | 'presentations'
  | 'notes-memory'
  | 'learning-mastery'
  | 'data-analysis'
  | 'automation-agents'
  | 'business-strategy'
  | 'finance-aware-guidance'
  | 'health-knowledge'
  | 'security-defense'
  | 'translation-localization'
  | 'productivity-documents';

export interface PantaAITaskExample {
  title: string;
  userCanAsk: string[];
  expectedResult: string;
}

export interface PantaAIPublicSurfaceCard {
  key: string;
  title: string;
  subtitle: string;
  publicExplanationEl: string;
  publicExplanationEn: string;
  whatItDoes: string[];
  whenToUseIt: string[];
  taskExamples: PantaAITaskExample[];
  internalCapabilityFamilies: PantaAICapabilityFamily[];
  accessMode: PantaAIAccessMode;
  truthMode: PantaAITruthMode;
  safetyBoundaries: string[];
  relatedExternalPatterns: string[];
}

export interface PantaAIPublicSurfaceSpec {
  key: string;
  title: string;
  subtitle: string;
  doctrine: string[];
  publicPurposeEl: string;
  publicPurposeEn: string;
  cards: PantaAIPublicSurfaceCard[];
}

export interface PantaAIPublicSurfaceSummary {
  title: string;
  subtitle: string;
  cardCount: number;
  publicCount: number;
  signedInCount: number;
  restrictedCount: number;
  adminOnlyCount: number;
  capabilityFamilies: PantaAICapabilityFamily[];
}

export const PANTA_AI_PUBLIC_SURFACE_SPEC: PantaAIPublicSurfaceSpec = {
  key: 'panta-ai-center',
  title: 'PantaAI Center',
  subtitle:
    'One organized AI center for asking, researching, building, learning, creating, working and automating.',
  publicPurposeEl:
    'Το PantaAI Center είναι η καθαρή δημόσια πύλη AI του Pantavion. Ο χρήστης δεν βλέπει χαοτική λίστα εργαλείων. Βλέπει οργανωμένες εργασίες, τι κάνουν, πότε τις χρησιμοποιεί και τι αποτέλεσμα παίρνει.',
  publicPurposeEn:
    'The PantaAI Center is Pantavion public AI gateway. The user does not see a chaotic tool list. The user sees organized work modes, what they do, when to use them, and what result to expect.',
  doctrine: [
    'Public simplicity, internal depth.',
    'Capabilities, not tool chaos.',
    'Lawful integration or Pantavion-native equivalent.',
    'Result-first UX.',
    'Prime Kernel chooses routing, provider, memory, truth mode, safety and fallback.',
    'External tools are treated as capability signals, connectors, benchmarks or lawful integrations.',
    'Restricted and defensive domains never become casual public misuse surfaces.',
  ],
  cards: [
    {
      key: 'ask-ai',
      title: 'Ask AI',
      subtitle: 'General questions, guidance and daily help.',
      publicExplanationEl:
        'Για γρήγορες ερωτήσεις, εξηγήσεις, ιδέες, αποφάσεις και καθημερινή βοήθεια.',
      publicExplanationEn:
        'For quick questions, explanations, ideas, decisions and everyday help.',
      whatItDoes: [
        'Answers questions.',
        'Explains topics simply or deeply.',
        'Helps organize thoughts.',
        'Suggests next steps.',
      ],
      whenToUseIt: [
        'When the user needs a fast answer.',
        'When the user needs explanation.',
        'When the user is unsure where to start.',
      ],
      taskExamples: [
        {
          title: 'Explain a difficult topic',
          userCanAsk: [
            'Explain this to me simply.',
            'Give me the professional version.',
            'Compare the options.',
          ],
          expectedResult: 'Clear explanation with next-step guidance.',
        },
      ],
      internalCapabilityFamilies: ['general-ai-assistance'],
      accessMode: 'public',
      truthMode: 'mixed',
      safetyBoundaries: [
        'Truth zone must be clear.',
        'High-risk advice is routed to safer guidance mode.',
      ],
      relatedExternalPatterns: ['ChatGPT', 'Claude', 'Gemini', 'Perplexity-style answers'],
    },
    {
      key: 'research-ai',
      title: 'Research',
      subtitle: 'Deep research, sources, comparison and evidence.',
      publicExplanationEl:
        'Για βαθιά έρευνα, σύγκριση πηγών, τεκμηρίωση, αναφορές, papers και καθαρά συμπεράσματα.',
      publicExplanationEn:
        'For deep research, source comparison, evidence, references, papers and clear conclusions.',
      whatItDoes: [
        'Builds research briefs.',
        'Compares sources.',
        'Extracts evidence.',
        'Separates known facts from uncertain claims.',
      ],
      whenToUseIt: [
        'When accuracy matters.',
        'When the user needs sources.',
        'When the user compares technologies, markets or strategies.',
      ],
      taskExamples: [
        {
          title: 'Research package',
          userCanAsk: [
            'Research this market.',
            'Compare these systems.',
            'Find what is missing internationally.',
          ],
          expectedResult: 'Structured research summary with evidence posture and gaps.',
        },
      ],
      internalCapabilityFamilies: ['deep-research', 'notes-memory'],
      accessMode: 'signed-in',
      truthMode: 'verified',
      safetyBoundaries: [
        'Current facts require verification.',
        'Medical, legal and financial areas require caution and source discipline.',
      ],
      relatedExternalPatterns: ['NotebookLM', 'Perplexity', 'Elicit', 'research notebooks'],
    },
    {
      key: 'write-ai',
      title: 'Write',
      subtitle: 'Documents, messages, posts, scripts and professional text.',
      publicExplanationEl:
        'Για γράψιμο, διόρθωση, μετάφραση, email, άρθρα, βιογραφικά, παρουσιάσεις λόγου και επαγγελματικό ύφος.',
      publicExplanationEn:
        'For writing, editing, translation, email, articles, resumes, scripts and professional tone.',
      whatItDoes: [
        'Drafts text.',
        'Improves wording.',
        'Changes tone.',
        'Summarizes long material.',
      ],
      whenToUseIt: [
        'When the user needs text ready to send.',
        'When the user needs correction or polish.',
        'When the user needs professional formatting.',
      ],
      taskExamples: [
        {
          title: 'Professional rewrite',
          userCanAsk: [
            'Make this more professional.',
            'Write a short message.',
            'Turn this into a formal document.',
          ],
          expectedResult: 'Clean text ready for review or use.',
        },
      ],
      internalCapabilityFamilies: ['writing-editing', 'productivity-documents'],
      accessMode: 'public',
      truthMode: 'generative',
      safetyBoundaries: [
        'User approval before sending externally.',
        'No false claims or fake credentials.',
      ],
      relatedExternalPatterns: ['ChatGPT writing', 'Claude writing', 'Grammarly-style editing'],
    },
    {
      key: 'build-ai',
      title: 'Build',
      subtitle: 'Apps, websites, code, systems and technical plans.',
      publicExplanationEl:
        'Για δημιουργία εφαρμογών, ιστοσελίδων, αρχιτεκτονικής, κώδικα, APIs, workflows και τεχνικών βημάτων.',
      publicExplanationEn:
        'For building apps, websites, architecture, code, APIs, workflows and technical steps.',
      whatItDoes: [
        'Creates implementation plans.',
        'Generates code structures.',
        'Explains file-by-file changes.',
        'Routes complex builds through the Prime Kernel.',
      ],
      whenToUseIt: [
        'When the user wants to build a real product.',
        'When the user needs code or architecture.',
        'When the user needs controlled implementation steps.',
      ],
      taskExamples: [
        {
          title: 'Build a feature',
          userCanAsk: [
            'Build this page.',
            'Create the API route.',
            'Explain exactly where this file goes.',
          ],
          expectedResult: 'Implementation plan or full-file code block with safety boundaries.',
        },
      ],
      internalCapabilityFamilies: ['coding-build', 'app-website-builder', 'automation-agents'],
      accessMode: 'signed-in',
      truthMode: 'mixed',
      safetyBoundaries: [
        'No fragment patches when full file is required.',
        'No destructive commands without explicit confirmation.',
        'Repository truth must be checked before claiming completion.',
      ],
      relatedExternalPatterns: ['Cursor', 'Codex', 'Replit Agent', 'Bolt', 'Lovable'],
    },
    {
      key: 'create-media-ai',
      title: 'Create / Media',
      subtitle: 'Images, video, audio, voice, creative assets and campaigns.',
      publicExplanationEl:
        'Για εικόνες, βίντεο, ήχο, φωνή, μουσική, διαφημιστικές ιδέες, δημιουργικά assets και παραγωγή media.',
      publicExplanationEn:
        'For images, video, audio, voice, music, campaign ideas, creative assets and media production.',
      whatItDoes: [
        'Plans creative assets.',
        'Generates prompts and production flows.',
        'Organizes media workflows.',
        'Connects design, video, image and audio capability families.',
      ],
      whenToUseIt: [
        'When the user wants visual or media output.',
        'When the user needs brand assets.',
        'When the user needs campaign material.',
      ],
      taskExamples: [
        {
          title: 'Create a campaign pack',
          userCanAsk: [
            'Make image ideas for this brand.',
            'Create a video concept.',
            'Plan a social media campaign.',
          ],
          expectedResult: 'Structured creative brief and production-ready asset plan.',
        },
      ],
      internalCapabilityFamilies: ['design-image', 'video-media', 'audio-voice'],
      accessMode: 'signed-in',
      truthMode: 'generative',
      safetyBoundaries: [
        'Copyright and likeness rules must be respected.',
        'No unsafe impersonation.',
      ],
      relatedExternalPatterns: ['Higgsfield', 'Runway', 'Midjourney', 'DALL-E', 'ElevenLabs'],
    },
    {
      key: 'design-ai',
      title: 'Design',
      subtitle: 'UI, branding, layouts, logos, presentations and visual systems.',
      publicExplanationEl:
        'Για brand, UI, layouts, logos, visual systems, presentation design και καθαρή αισθητική παραγωγή.',
      publicExplanationEn:
        'For brand, UI, layouts, logos, visual systems, presentation design and clean visual production.',
      whatItDoes: [
        'Builds design briefs.',
        'Defines visual systems.',
        'Organizes design assets.',
        'Prepares UI and presentation structures.',
      ],
      whenToUseIt: [
        'When the user needs professional visuals.',
        'When the user needs a brand system.',
        'When the user needs a deck, landing page or UI direction.',
      ],
      taskExamples: [
        {
          title: 'Design system',
          userCanAsk: [
            'Create a brand guide.',
            'Design a homepage structure.',
            'Prepare a presentation layout.',
          ],
          expectedResult: 'Structured design direction with components, rules and usage notes.',
        },
      ],
      internalCapabilityFamilies: ['design-image', 'presentations', 'productivity-documents'],
      accessMode: 'signed-in',
      truthMode: 'generative',
      safetyBoundaries: [
        'No copying competitor brand identity.',
        'Design must be Pantavion-native or licensed.',
      ],
      relatedExternalPatterns: ['Affinity', 'Figma', 'Canva', 'Gamma'],
    },
    {
      key: 'learn-ai',
      title: 'Learn',
      subtitle: 'Guided mastery, study paths, practice and progress.',
      publicExplanationEl:
        'Για εκμάθηση, μαθήματα, skill paths, quizzes, πρακτική εξάσκηση και σταδιακή πρόοδο.',
      publicExplanationEn:
        'For learning, lessons, skill paths, quizzes, practice and gradual progress.',
      whatItDoes: [
        'Creates learning paths.',
        'Adapts to user level.',
        'Explains with examples.',
        'Tracks progress when memory is enabled.',
      ],
      whenToUseIt: [
        'When the user wants to learn a field.',
        'When the user needs a beginner-to-advanced path.',
        'When the user needs drills or practice.',
      ],
      taskExamples: [
        {
          title: 'Mastery path',
          userCanAsk: [
            'Teach me cybersecurity safely.',
            'Make a Python path.',
            'Explain this like a teacher.',
          ],
          expectedResult: 'Structured learning plan with levels, exercises and next steps.',
        },
      ],
      internalCapabilityFamilies: ['learning-mastery', 'notes-memory'],
      accessMode: 'signed-in',
      truthMode: 'mixed',
      safetyBoundaries: [
        'Restricted skills use defensive-first framing.',
        'High-risk domains require safety boundaries.',
      ],
      relatedExternalPatterns: ['Khan Academy style paths', 'roadmaps', 'guided tutors'],
    },
    {
      key: 'memory-ai',
      title: 'Memory / Notes',
      subtitle: 'Notes, continuity, summaries, meetings and personal knowledge.',
      publicExplanationEl:
        'Για σημειώσεις, σύνοψη συναντήσεων, προσωπική γνώση, project continuity και οργανωμένη μνήμη.',
      publicExplanationEn:
        'For notes, meeting summaries, personal knowledge, project continuity and organized memory.',
      whatItDoes: [
        'Stores structured notes with consent.',
        'Summarizes meetings.',
        'Links decisions to projects.',
        'Supports long-term continuity.',
      ],
      whenToUseIt: [
        'When the user wants not to lose decisions.',
        'When the user works on long projects.',
        'When the user wants organized recall.',
      ],
      taskExamples: [
        {
          title: 'Project memory',
          userCanAsk: [
            'Save this as project memory.',
            'Summarize this meeting.',
            'Show what we decided.',
          ],
          expectedResult: 'Structured memory record with summary, scope and recall path.',
        },
      ],
      internalCapabilityFamilies: ['notes-memory', 'productivity-documents'],
      accessMode: 'signed-in',
      truthMode: 'mixed',
      safetyBoundaries: [
        'Consent and memory class must be respected.',
        'Sensitive memories require stronger access controls.',
      ],
      relatedExternalPatterns: ['Obsidian', 'Notion', 'NotebookLM', 'meeting assistants'],
    },
    {
      key: 'data-ai',
      title: 'Data / Analysis',
      subtitle: 'Tables, charts, insights, business intelligence and reports.',
      publicExplanationEl:
        'Για ανάλυση δεδομένων, πίνακες, dashboards, οικονομικά στοιχεία, reports και επιχειρησιακή εικόνα.',
      publicExplanationEn:
        'For data analysis, tables, dashboards, financial data, reports and operational insight.',
      whatItDoes: [
        'Reads structured data.',
        'Finds patterns.',
        'Creates analysis plans.',
        'Prepares reports and dashboards.',
      ],
      whenToUseIt: [
        'When the user has data files.',
        'When the user needs business insight.',
        'When the user needs charts or summaries.',
      ],
      taskExamples: [
        {
          title: 'Data report',
          userCanAsk: [
            'Analyze this spreadsheet.',
            'Find trends.',
            'Create a report.',
          ],
          expectedResult: 'Data summary, risk notes, insights and suggested actions.',
        },
      ],
      internalCapabilityFamilies: ['data-analysis', 'productivity-documents'],
      accessMode: 'signed-in',
      truthMode: 'verified',
      safetyBoundaries: [
        'Data provenance must be tracked.',
        'Private data requires tenant isolation.',
      ],
      relatedExternalPatterns: ['Rose AI', 'BI tools', 'spreadsheet assistants'],
    },
    {
      key: 'automation-ai',
      title: 'Automation / Agents',
      subtitle: 'Workflows, tasks, reminders, routing and controlled execution.',
      publicExplanationEl:
        'Για αυτοματισμούς, βήματα εργασίας, agents, επαναλαμβανόμενες εργασίες, reminders και controlled execution.',
      publicExplanationEn:
        'For automation, workflow steps, agents, repeated tasks, reminders and controlled execution.',
      whatItDoes: [
        'Turns intent into workflow.',
        'Tracks steps.',
        'Supports retries and fallback.',
        'Routes execution through Kernel governance.',
      ],
      whenToUseIt: [
        'When the user wants work done repeatedly.',
        'When a process has multiple steps.',
        'When the task must continue later.',
      ],
      taskExamples: [
        {
          title: 'Workflow automation',
          userCanAsk: [
            'Automate this process.',
            'Create a weekly workflow.',
            'Track these steps until complete.',
          ],
          expectedResult: 'Governed execution plan with state, logs and fallback.',
        },
      ],
      internalCapabilityFamilies: ['automation-agents', 'notes-memory'],
      accessMode: 'verified',
      truthMode: 'mixed',
      safetyBoundaries: [
        'No privileged action without identity and delegation.',
        'Execution state must be auditable.',
      ],
      relatedExternalPatterns: ['Zapier', 'Make', 'agent platforms', 'A2A-style task flows'],
    },
    {
      key: 'business-strategy-ai',
      title: 'Business / Strategy',
      subtitle: 'Plans, pricing, operations, launches and decision support.',
      publicExplanationEl:
        'Για επιχειρηματικά σχέδια, στρατηγική, pricing, launch plans, operations και αποφάσεις.',
      publicExplanationEn:
        'For business plans, strategy, pricing, launch plans, operations and decisions.',
      whatItDoes: [
        'Creates business plans.',
        'Compares options.',
        'Builds launch steps.',
        'Connects strategy with execution.',
      ],
      whenToUseIt: [
        'When the user starts or improves a business.',
        'When the user needs pricing support.',
        'When the user needs operational clarity.',
      ],
      taskExamples: [
        {
          title: 'Launch plan',
          userCanAsk: [
            'Make a launch plan.',
            'Compare pricing models.',
            'Prepare an execution checklist.',
          ],
          expectedResult: 'Structured plan with risks, steps, metrics and next actions.',
        },
      ],
      internalCapabilityFamilies: ['business-strategy', 'finance-aware-guidance'],
      accessMode: 'signed-in',
      truthMode: 'mixed',
      safetyBoundaries: [
        'Financial claims must be cautious.',
        'No guaranteed income promises.',
      ],
      relatedExternalPatterns: ['strategy frameworks', 'startup planning tools', 'Gamma-style business decks'],
    },
    {
      key: 'finance-aware-guidance',
      title: 'Finance-Aware Guidance',
      subtitle: 'Budget, pricing, cost awareness and financial planning support.',
      publicExplanationEl:
        'Για προϋπολογισμό, κόστος, pricing, βασική οικονομική οργάνωση και finance-aware αποφάσεις.',
      publicExplanationEn:
        'For budgeting, cost, pricing, basic financial organization and finance-aware decisions.',
      whatItDoes: [
        'Helps structure budgets.',
        'Explains cost tradeoffs.',
        'Supports pricing analysis.',
        'Flags uncertainty and risk.',
      ],
      whenToUseIt: [
        'When the user plans money-related decisions.',
        'When the user compares costs.',
        'When the user needs pricing or budget support.',
      ],
      taskExamples: [
        {
          title: 'Budget and pricing support',
          userCanAsk: [
            'Help me plan a budget.',
            'Compare these costs.',
            'Build a pricing model.',
          ],
          expectedResult: 'Organized financial reasoning with safety notes and assumptions.',
        },
      ],
      internalCapabilityFamilies: ['finance-aware-guidance', 'data-analysis'],
      accessMode: 'signed-in',
      truthMode: 'mixed',
      safetyBoundaries: [
        'Not personalized investment advice.',
        'High-stakes financial decisions require professional verification.',
      ],
      relatedExternalPatterns: ['finance calculators', 'market data tools', 'budget planners'],
    },
    {
      key: 'health-knowledge-ai',
      title: 'Health Knowledge',
      subtitle: 'Health information, summaries and doctor-ready organization.',
      publicExplanationEl:
        'Για κατανόηση ιατρικών πληροφοριών, οργάνωση ερωτήσεων για γιατρό και ασφαλή health knowledge υποστήριξη.',
      publicExplanationEn:
        'For understanding health information, organizing doctor questions and safe health knowledge support.',
      whatItDoes: [
        'Explains medical information at a high level.',
        'Organizes symptoms or notes for a doctor.',
        'Summarizes health documents when provided.',
        'Separates general knowledge from medical advice.',
      ],
      whenToUseIt: [
        'When the user needs to understand health information.',
        'When the user wants to prepare for a doctor visit.',
        'When the user needs a summary of health material.',
      ],
      taskExamples: [
        {
          title: 'Doctor preparation',
          userCanAsk: [
            'Help me prepare questions for my doctor.',
            'Explain this medical term.',
            'Summarize this health document.',
          ],
          expectedResult: 'General health explanation and doctor-ready question list.',
        },
      ],
      internalCapabilityFamilies: ['health-knowledge', 'deep-research'],
      accessMode: 'signed-in',
      truthMode: 'verified',
      safetyBoundaries: [
        'Not a diagnosis.',
        'Emergency symptoms must be directed to urgent help.',
        'Medical facts require verification.',
      ],
      relatedExternalPatterns: ['medical knowledge assistants', 'health document summarizers'],
    },
    {
      key: 'security-defense-ai',
      title: 'Security / Defense',
      subtitle: 'Defensive cyber support, safety checks and incident readiness.',
      publicExplanationEl:
        'Για αμυντική κυβερνοασφάλεια, έλεγχο ασφαλείας, incident readiness και audit-logged προστασία.',
      publicExplanationEn:
        'For defensive cybersecurity, safety checks, incident readiness and audit-logged protection.',
      whatItDoes: [
        'Supports defensive checklists.',
        'Helps organize incident response.',
        'Explains security posture.',
        'Routes sensitive security work to restricted flows.',
      ],
      whenToUseIt: [
        'When the user needs defensive security help.',
        'When an organization needs an incident checklist.',
        'When a system needs risk evaluation.',
      ],
      taskExamples: [
        {
          title: 'Defensive cyber support',
          userCanAsk: [
            'Create a security checklist.',
            'Prepare incident response steps.',
            'Explain this defensive security concept.',
          ],
          expectedResult: 'Defensive, safe and audit-friendly security guidance.',
        },
      ],
      internalCapabilityFamilies: ['security-defense'],
      accessMode: 'restricted',
      truthMode: 'verified',
      safetyBoundaries: [
        'No offensive misuse.',
        'No credential theft guidance.',
        'No exploit execution for casual users.',
        'Restricted and admin-only paths where needed.',
      ],
      relatedExternalPatterns: ['defensive cyber tools', 'SIEM', 'incident response platforms'],
    },
  ],
};

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function getPantaAIPublicSurfaceSpec(): PantaAIPublicSurfaceSpec {
  return cloneValue(PANTA_AI_PUBLIC_SURFACE_SPEC);
}

export function listPantaAIPublicSurfaceCards(): PantaAIPublicSurfaceCard[] {
  return PANTA_AI_PUBLIC_SURFACE_SPEC.cards.map((card) => cloneValue(card));
}

export function getPantaAIPublicSurfaceCard(
  key: string,
): PantaAIPublicSurfaceCard | null {
  const item = PANTA_AI_PUBLIC_SURFACE_SPEC.cards.find((card) => card.key === key);
  return item ? cloneValue(item) : null;
}

export function getPantaAIPublicSurfaceSummary(): PantaAIPublicSurfaceSummary {
  const cards = PANTA_AI_PUBLIC_SURFACE_SPEC.cards;
  const capabilityFamilies = Array.from(
    new Set(cards.flatMap((card) => card.internalCapabilityFamilies)),
  ).sort();

  return {
    title: PANTA_AI_PUBLIC_SURFACE_SPEC.title,
    subtitle: PANTA_AI_PUBLIC_SURFACE_SPEC.subtitle,
    cardCount: cards.length,
    publicCount: cards.filter((card) => card.accessMode === 'public').length,
    signedInCount: cards.filter((card) => card.accessMode === 'signed-in').length,
    restrictedCount: cards.filter((card) => card.accessMode === 'restricted').length,
    adminOnlyCount: cards.filter((card) => card.accessMode === 'admin-only').length,
    capabilityFamilies,
  };
}

export function searchPantaAIPublicSurfaceCards(
  query: string,
): PantaAIPublicSurfaceCard[] {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return listPantaAIPublicSurfaceCards();
  }

  return PANTA_AI_PUBLIC_SURFACE_SPEC.cards
    .filter((card) => {
      const text = [
        card.key,
        card.title,
        card.subtitle,
        card.publicExplanationEl,
        card.publicExplanationEn,
        ...card.whatItDoes,
        ...card.whenToUseIt,
        ...card.internalCapabilityFamilies,
        ...card.relatedExternalPatterns,
      ]
        .join(' ')
        .toLowerCase();

      return text.includes(normalized);
    })
    .map((card) => cloneValue(card));
}

export function getPantaAICardsByAccessMode(
  accessMode: PantaAIAccessMode,
): PantaAIPublicSurfaceCard[] {
  return PANTA_AI_PUBLIC_SURFACE_SPEC.cards
    .filter((card) => card.accessMode === accessMode)
    .map((card) => cloneValue(card));
}

export function isPantaAIPublicCard(key: string): boolean {
  const card = PANTA_AI_PUBLIC_SURFACE_SPEC.cards.find((item) => item.key === key);
  return Boolean(card && card.accessMode === 'public');
}

