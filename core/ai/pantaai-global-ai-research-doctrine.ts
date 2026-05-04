/**
 * PantaAI Global AI Research Doctrine
 *
 * Purpose:
 * Study global AI capabilities legally and convert the findings into
 * Pantavion-owned technology, architecture, products, agents, workflows,
 * safety systems, and provider strategies.
 *
 * This is not copying.
 * This is lawful competitive intelligence, capability mapping, public research,
 * official documentation review, product observation, technical benchmarking,
 * and original Pantavion design.
 */

export const pantaAiGlobalAiResearchDoctrineId =
  "pantaai_global_ai_research_doctrine_v1";

export const pantaAiGlobalResearchSourcesAllowed = [
  "official_public_documentation",
  "public_research_papers",
  "licensed_sources",
  "public_product_observation",
  "official_API_documentation",
  "user_provided_material_with_rights",
  "open_source_projects_under_their_licenses",
  "public_benchmarks_with_careful_limits",
  "legal_provider_terms_and_safety_docs",
] as const;

export const pantaAiGlobalResearchSourcesForbidden = [
  "private_or_stolen_data",
  "copied_proprietary_code",
  "copied_brand_or_logo",
  "protected_UI_clone",
  "false_model_claim",
  "unlicensed_training_data_use",
  "terms_violating_scraping",
  "unsafe_medical_financial_or_emergency_claims",
] as const;

export const pantaAiGlobalResearchTargets = [
  "large_language_models",
  "reasoning_models",
  "coding_agents",
  "research_agents",
  "multimodal_models",
  "voice_and_speech_systems",
  "translation_systems",
  "AI_tool_use",
  "agent_frameworks",
  "memory_systems",
  "retrieval_and_source_grounding",
  "model_routing",
  "cost_control",
  "safety_and_policy_systems",
  "enterprise_AI_governance",
  "local_and_open_models",
  "future_robotic_or_humanoid_interfaces",
] as const;

export const pantaAiGlobalResearchOutput = [
  "capability_maps",
  "gap_reports",
  "provider_comparison_notes",
  "legal_and_terms_notes",
  "risk_and_cost_notes",
  "Pantavion_owned_architecture_proposals",
  "agent_and_tool_designs",
  "implementation_backlog",
  "founder_approval_recommendations",
] as const;

export function getPantaAiGlobalAiResearchDoctrineSummary() {
  return {
    id: pantaAiGlobalAiResearchDoctrineId,
    allowedSources: pantaAiGlobalResearchSourcesAllowed,
    forbiddenSources: pantaAiGlobalResearchSourcesForbidden,
    targets: pantaAiGlobalResearchTargets,
    output: pantaAiGlobalResearchOutput,
  };
}
