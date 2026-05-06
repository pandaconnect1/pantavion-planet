export const PANTAVION_AUTONOMOUS_INTERNAL_AI_OS_V1 = {
  marker: "PANTAVION_AUTONOMOUS_INTERNAL_AI_OS_V1",
  mode: "autonomous-audit-research-reporting-founder-gated-building",
  doctrine:
    "Pantavion internal AI must autonomously inspect, audit, research, detect gaps, report failures, protect product truth, and prepare builder work. Production mutation remains founder-gated.",
  kernels: [
    "PANTAVION_GUARDIAN_KERNEL_V1",
    "PANTAVION_BUILDER_KERNEL_V1",
    "PANTAVION_RESEARCH_KERNEL_V1",
    "PANTAVION_PRODUCT_TRUTH_KERNEL_V1",
    "PANTAVION_LANGUAGE_KERNEL_V1",
    "PANTAVION_SAFETY_LEGAL_KERNEL_V1",
    "PANTAVION_USER_AI_CONTROL_PLANE_V1",
    "PANTAVION_FOUNDER_APPROVAL_GATE_V1"
  ],
  autonomousDuties: [
    "audit build and TypeScript",
    "detect missing public routes",
    "detect unsafe SOS claims",
    "detect language regression",
    "detect fake live features",
    "detect dead buttons",
    "detect missing product truth",
    "open GitHub issue on failure",
    "prepare founder-approved builder work"
  ],
  hardLimits: [
    "no uncontrolled production self-modification",
    "no false emergency dispatch claims",
    "no fake SMS email payment provider claims",
    "no claim that all 7000 languages are fully live today"
  ]
} as const;
