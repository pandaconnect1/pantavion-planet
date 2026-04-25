export const aiSovereigntyRoadmap = {
  id: "ai-sovereignty-roadmap",
  title: "Pantavion AI Sovereignty Roadmap",
  status: "mandatory-deep-audit-foundation",
  priority: "critical",
  summary:
    "Pantavion may build its own AI systems, agents, routers, memory layers and future native models, but it must not claim sovereign/native AI models before they truly exist, are tested, documented and governed.",
  correction:
    "It is not forbidden to build Pantavion AI. What is forbidden is fake claiming that native Pantavion models already exist before proof.",
  levels: [
    {
      level: "provider_router",
      name: "Multi-provider AI Router",
      currentStatus: "allowed",
      meaning:
        "Pantavion can route tasks to external providers such as OpenAI, Claude, Gemini or future providers through governed abstraction."
    },
    {
      level: "pantavion_orchestrator",
      name: "Pantavion Orchestrator",
      currentStatus: "priority",
      meaning:
        "Pantavion-owned intent, plan, capability, policy and execution logic. This is the first real Pantavion brain."
    },
    {
      level: "domain_agents",
      name: "Pantavion Domain Agents",
      currentStatus: "allowed",
      meaning:
        "Specialized agents for translation, safety, media, marketplace, business, research and SOS support."
    },
    {
      level: "fine_tuned_models",
      name: "Fine-tuned / Private Models",
      currentStatus: "future",
      meaning:
        "Specialized models trained or tuned only with lawful data, consent, licensing and security controls."
    },
    {
      level: "native_models",
      name: "Pantavion Native Models",
      currentStatus: "roadmap",
      meaning:
        "Fully Pantavion-owned models are allowed as a long-term roadmap, but no public claim until real."
    },
    {
      level: "red_zone_autonomy",
      name: "Autonomous Red-Zone Decisions",
      currentStatus: "blocked",
      meaning:
        "AI must not decide alone in SOS, minors, legal, medical, identity-risk, bans, adult or public-safety cases."
    }
  ],
  gates: [
    "No fake proprietary model claim.",
    "Every AI capability has risk zone.",
    "Every Red Zone AI has human/control path.",
    "Training/fine-tuning data requires lawful source, consent or license.",
    "Provider-based AI must be labeled provider-backed until native.",
    "Native AI claims require proof, testing, documentation and governance."
  ],
  motto:
    "Pantavion can build its own AI, but truth, law, safety and audit come before public claims."
} as const;
