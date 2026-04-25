export const pantavionCompetitiveIntelligenceLayer = {
  id: "pantavion-competitive-intelligence-layer",
  title: "Pantavion Competitive Intelligence Layer",
  status: "mandatory-foundation",
  priority: "critical",
  summary:
    "Pantavion must continuously convert global market signals, AI tools, social trends, creator patterns, legal shifts, security risks, monetization models and competitor movements into lawful Pantavion-owned capabilities.",
  gates: [
    "No copying competitor branding, logos, screenshots, layouts or copyrighted lists.",
    "Use market signals as inspiration, not duplication.",
    "Every external tool signal becomes a Pantavion capability family, provider candidate, risk note or build roadmap item.",
    "Every trend must be classified by source, use case, risk, revenue potential and legal boundary.",
    "Every financial, health, adult, minors, government or security signal requires stricter risk classification.",
    "Every competitor insight must become a Pantavion-owned improvement.",
    "No false claims about being better than a competitor without proof.",
    "No user-income guarantees.",
    "No scraping private data or protected platforms.",
    "Competitive intelligence must feed the Kernel, not create random feature chaos."
  ],
  signalSources: [
    "Public websites",
    "Public social posts",
    "Tool directories",
    "AI product launches",
    "Developer ecosystems",
    "Academic and research sources",
    "App store patterns",
    "Marketplaces",
    "Messaging and social platforms",
    "Creator economy formats",
    "Public legal/regulatory updates",
    "Security advisories",
    "Public pricing models",
    "User feedback",
    "Pantavion internal usage signals"
  ],
  intelligenceFamilies: [
    {
      key: "ai_tools",
      name: "AI Tools and Provider Atlas",
      output: "Capability families, provider registry, routing candidates and build priorities."
    },
    {
      key: "communication",
      name: "Global Communication and Messaging",
      output: "Messenger features, import connectors, secure channels, translation and group systems."
    },
    {
      key: "voice_realtime",
      name: "Voice and Real-Time Execution",
      output: "Streaming execution, voice-native interaction, barge-in, latency and adaptive communication."
    },
    {
      key: "marketplace",
      name: "Marketplace and Classifieds",
      output: "Categories, listing models, business pages, paid visibility and anti-scam rules."
    },
    {
      key: "media_radio",
      name: "Media, Radio and Creator Economy",
      output: "Radio programming, creator studio, rights policy, broadcast lanes and monetization surfaces."
    },
    {
      key: "legal_safety",
      name: "Legal, Safety and Jurisdiction",
      output: "Country risk matrix, minors protection, adult restrictions, privacy and reporting flows."
    },
    {
      key: "security",
      name: "Security and Hacker Intelligence",
      output: "Threat models, API protections, abuse controls, incident response and resilience upgrades."
    },
    {
      key: "monetization",
      name: "Revenue and Access Strategy",
      output: "Pricing, subscriptions, trials, listing packages, build services and Stripe-safe products."
    },
    {
      key: "elite",
      name: "Elite and High-Trust Environments",
      output: "Secure private channels, verified access, confidential workflows and approval-based visibility."
    },
    {
      key: "knowledge",
      name: "Knowledge, Culture and Research",
      output: "Research library, source atlas, education, culture, history and public knowledge routes."
    }
  ],
  processingPath: [
    "Capture signal",
    "Classify source",
    "Classify user need",
    "Classify legal and safety risk",
    "Map to Pantavion capability family",
    "Decide build, provider, policy or reject",
    "Create route or registry entry",
    "Update Kernel audit",
    "Report to founder/operator",
    "Review for release gate"
  ],
  requiredOutputs: [
    "Capability candidate",
    "Provider candidate",
    "Risk note",
    "Legal boundary",
    "Revenue path",
    "Route requirement",
    "Design requirement",
    "Security requirement",
    "Founder report",
    "Roadmap priority"
  ],
  motto:
    "Observe the world legally, absorb the signal intelligently, transform it into Pantavion-owned capability."
} as const;
