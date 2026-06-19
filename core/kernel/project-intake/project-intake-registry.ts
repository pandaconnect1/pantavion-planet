import { PANTAVION_COMMON_SERVICE_IDS } from "@/core/kernel/common/pantavion-common-services";
import type {
  PantavionProjectIntakeRecord,
  PantavionProjectIntakeReport
} from "./project-intake-types";

const allCommonServices = PANTAVION_COMMON_SERVICE_IDS;

export const PANTAVION_PROJECT_INTAKE_REGISTRY: PantavionProjectIntakeRecord[] = [
  {
    intakeId: "legacy-pantavion-one",
    title: "Pantavion One legacy product DNA",
    sourceKind: "legacy_repo",
    sourceReference: "pandaconnect1/pantavion-one",
    status: "mapped_to_existing_capability",
    proposedAction: "merge",
    mappedCapabilityIds: [
      "messages-chat",
      "stories",
      "music",
      "dates-connections",
      "health",
      "calendar-reminders",
      "culture",
      "environment",
      "education",
      "sports",
      "news-newspaper",
      "work-business",
      "family-friends",
      "economy-banks",
      "shipping-marine",
      "flights-travel",
      "tourism",
      "politics",
      "faith-religions",
      "vr-ar",
      "photos-multimedia",
      "contacts-import",
      "marketplace",
      "academy",
      "research",
      "communities",
      "support-care"
    ],
    usefulSignals: [
      "Unified daily life platform",
      "Social, media, work, learning, marketplace and care concepts",
      "Pantavion One should remain legacy redirect while its DNA lives inside Pantavion Planet"
    ],
    staticOrPrototypeSignals: [
      "Static UI concepts",
      "Placeholder surfaces",
      "No full backend/auth/provider implementation"
    ],
    realImplementationRequirements: [
      "Convert each useful static concept into a real Pantavion Planet capability",
      "Create isolated autonomous kernel work orders",
      "Promote to live only through realness gate"
    ],
    requiredSharedServices: allCommonServices,
    benchmarkRegions: ["global", "china", "usa", "europe", "japan", "korea", "russia", "india"],
    risk: "medium",
    founderReportRequired: true,
    notes: [
      "Do not restore Pantavion One as separate production product.",
      "Do not copy static buttons as live features."
    ]
  },
  {
    intakeId: "current-pantavion-planet-unfinished-routes",
    title: "Pantavion Planet unfinished routes and partial modules",
    sourceKind: "current_repo_file",
    sourceReference: "C:\\Users\\gnkkm\\pantavion-planet",
    status: "discovered",
    proposedAction: "extract_requirements",
    mappedCapabilityIds: [],
    proposedCapabilityTitle: "Unfinished Route Recovery",
    proposedKernelId: "unfinished-route-recovery-kernel",
    usefulSignals: [
      "Existing routes may contain unfinished product work",
      "Some routes may already be live, beta, foundation or static"
    ],
    staticOrPrototypeSignals: [
      "Route exists but no backend",
      "Button exists but no action",
      "Feature page exists but no provider/data/state"
    ],
    realImplementationRequirements: [
      "Inventory app routes",
      "Detect dead buttons and fake public actions",
      "Map each route to Universal Life capability",
      "Create work orders for missing backend/state/provider/legal gates"
    ],
    requiredSharedServices: allCommonServices,
    benchmarkRegions: ["global", "usa", "china", "europe"],
    risk: "medium",
    founderReportRequired: true,
    notes: [
      "Do not modify protected Water/SOS/users/access files during inventory."
    ]
  },
  {
    intakeId: "water-professional-infrastructure",
    title: "Protected Water Infrastructure module",
    sourceKind: "current_repo_file",
    sourceReference: "app/professional/infrastructure/water",
    status: "classified",
    proposedAction: "preserve",
    mappedCapabilityIds: ["water-infrastructure", "professional-infrastructure"],
    usefulSignals: [
      "Real protected professional infrastructure layer",
      "Private source vault concept",
      "Founder/admin approval model",
      "Field and engineering workflows"
    ],
    staticOrPrototypeSignals: [
      "Some admin/intelligence surfaces may still be partial",
      "Some DXF/DWG source workflows remain future or protected"
    ],
    realImplementationRequirements: [
      "Do not expose raw DWG/DXF/KMZ/private geodata",
      "Preserve approved users and access records",
      "All Water changes require protected scoped work orders",
      "Founder approval required for source, access, and public map changes"
    ],
    requiredSharedServices: allCommonServices,
    benchmarkRegions: ["global", "europe", "china", "usa", "japan"],
    risk: "critical",
    founderReportRequired: true,
    notes: [
      "Water is protected infrastructure, not a normal feature.",
      "No blind patches."
    ]
  },
  {
    intakeId: "sos-elder-safety",
    title: "SOS, elder and care safety modules",
    sourceKind: "current_repo_file",
    sourceReference: "app/sos and app/sos-interpreter",
    status: "classified",
    proposedAction: "preserve",
    mappedCapabilityIds: ["sos", "support-care", "sos-interpreter"],
    usefulSignals: [
      "Emergency language support",
      "Elder-safe interface",
      "Trusted contact and care direction"
    ],
    staticOrPrototypeSignals: [
      "Provider-backed voice/translation may still be incomplete",
      "Offline/Satellite-supported roadmap is not full certified emergency dispatch"
    ],
    realImplementationRequirements: [
      "No false emergency dispatch claims",
      "Trusted contacts and consent required",
      "Offline pack must be explicit about limits",
      "Medical and emergency disclaimers required"
    ],
    requiredSharedServices: allCommonServices,
    benchmarkRegions: ["global", "europe", "usa", "japan", "china"],
    risk: "critical",
    founderReportRequired: true,
    notes: [
      "SOS is life-protection, not casual UI."
    ]
  },
  {
    intakeId: "global-ecosystem-benchmark",
    title: "Global ecosystem benchmark intake",
    sourceKind: "external_benchmark",
    sourceReference: "China, USA, Europe, Japan, Korea, Russia, India, Southeast Asia and global platforms",
    status: "new_capability_candidate",
    proposedAction: "convert_to_kernel_candidate",
    mappedCapabilityIds: [],
    proposedCapabilityTitle: "Global Ecosystem Benchmark Matrix",
    proposedKernelId: "global-ecosystem-benchmark-kernel",
    usefulSignals: [
      "Super-app patterns",
      "Mini-app service patterns",
      "Search/maps/workspace patterns",
      "Personal cloud continuity patterns",
      "Social/media/community patterns",
      "Commerce/payment/logistics patterns",
      "AI workspace and agent workforce patterns"
    ],
    staticOrPrototypeSignals: [],
    realImplementationRequirements: [
      "Benchmark legal functional patterns only",
      "Do not copy protected UI, logos, code, claims or brand identity",
      "Find gaps in global systems and define Pantavion-owned improvements"
    ],
    requiredSharedServices: allCommonServices,
    benchmarkRegions: [
      "global",
      "china",
      "usa",
      "europe",
      "japan",
      "korea",
      "russia",
      "india",
      "southeast_asia",
      "africa",
      "latin_america",
      "oceania"
    ],
    risk: "high",
    founderReportRequired: true,
    notes: [
      "Pantavion should legally absorb ecosystem logic and fill their gaps."
    ]
  }
,  {
    intakeId: "legacy-pantavion-one-clean-family",
    title: "Pantavion One Clean legacy family",
    sourceKind: "legacy_repo",
    sourceReference: "pandaconnect1/pantavion-one-clean, pantavion-one-clean-98it, pantavion-one-clean-ui",
    status: "discovered",
    proposedAction: "extract_requirements",
    mappedCapabilityIds: [
      "universal-life",
      "messages-chat",
      "contacts-import",
      "voice-communication",
      "panta-ai",
      "global-state"
    ],
    proposedCapabilityTitle: "Pantavion Clean Legacy Recovery",
    proposedKernelId: "pantavion-clean-legacy-recovery-kernel",
    usefulSignals: [
      "Clean UI experiments",
      "Global state engine experiments",
      "Voice page experiments",
      "Early Pantavion identity and routing patterns"
    ],
    staticOrPrototypeSignals: [
      "No guaranteed production backend",
      "Some projects show no production deployment",
      "Some routes may be static prototypes only"
    ],
    realImplementationRequirements: [
      "Inspect source before migration",
      "Extract useful product DNA",
      "Map useful pieces to Pantavion Planet capabilities",
      "Convert static/demo flows into real routes, state, providers and permissions only after work orders"
    ],
    requiredSharedServices: allCommonServices,
    benchmarkRegions: ["global", "china", "usa", "europe", "japan", "korea"],
    risk: "medium",
    founderReportRequired: true,
    notes: [
      "Do not revive as separate product.",
      "Everything useful must be absorbed into Pantavion Planet."
    ]
  },
  {
    intakeId: "legacy-pantaai-family",
    title: "PantaAI and AI chatbot legacy family",
    sourceKind: "legacy_repo",
    sourceReference: "pandaconnect1/nextjs-ai-chatbot, pantaai, pantaai-v1, pantaai-template",
    status: "new_capability_candidate",
    proposedAction: "convert_to_kernel_candidate",
    mappedCapabilityIds: [
      "panta-ai",
      "ai-sovereignty",
      "research",
      "work-business",
      "academy"
    ],
    proposedCapabilityTitle: "PantaAI Center",
    proposedKernelId: "pantaai-center-kernel",
    usefulSignals: [
      "AI chat and assistant experiments",
      "PantaAI branding and early AI product direction",
      "Template and chatbot foundations",
      "Potential AI workspace, research, execution and agent center"
    ],
    staticOrPrototypeSignals: [
      "May contain template/demo code",
      "May not have full provider routing, memory, tools, billing, governance or safety"
    ],
    realImplementationRequirements: [
      "Unify into Pantavion Planet PantaAI Center",
      "Route through Master Kernel and Provider/Cost Kernel",
      "Add memory, tools, permissions, safety, usage limits and founder-visible audit",
      "No standalone AI chatbot product outside Pantavion Planet"
    ],
    requiredSharedServices: allCommonServices,
    benchmarkRegions: ["global", "china", "usa", "europe", "japan", "korea", "india"],
    risk: "high",
    founderReportRequired: true,
    notes: [
      "PantaAI must become execution center, not isolated chat demo."
    ]
  },
  {
    intakeId: "legacy-execution-evolution-engine-previews",
    title: "Execution Engine and Evolution Engine previews",
    sourceKind: "vercel_deployment",
    sourceReference: "Recent Vercel previews: execution-engine-v1, evolution-engine-v2, Evolution Engine V1, runtime safety previews",
    status: "discovered",
    proposedAction: "extract_requirements",
    mappedCapabilityIds: [
      "panta-ai",
      "ai-sovereignty",
      "global-benchmark",
      "kernel-governance"
    ],
    proposedCapabilityTitle: "Execution and Evolution Engine",
    proposedKernelId: "execution-evolution-engine-kernel",
    usefulSignals: [
      "Intent to execution architecture",
      "Runtime safety experiments",
      "Evolution/self-improvement engine signals",
      "Kernel-driven capability growth"
    ],
    staticOrPrototypeSignals: [
      "Preview deployments may not represent stable production",
      "May include partial or experimental code",
      "Needs audit before migration"
    ],
    realImplementationRequirements: [
      "Convert into Master Kernel controlled execution pipeline",
      "Define intent, plan, work order, build, audit, repair and deploy lifecycle",
      "No autonomous production mutation without kernel gate and founder report",
      "All evolution logic must be scoped, observable and rollback-safe"
    ],
    requiredSharedServices: allCommonServices,
    benchmarkRegions: ["global", "china", "usa", "europe", "japan", "russia"],
    risk: "critical",
    founderReportRequired: true,
    notes: [
      "This is central to future autonomous Pantavion growth."
    ]
  },
  {
    intakeId: "legacy-kernel-protocol-audit-files",
    title: "Old kernel, protocol and audit files",
    sourceKind: "current_repo_file",
    sourceReference: "kernel files, core/protocol, audit exports, route APIs, uploaded patch files",
    status: "discovered",
    proposedAction: "extract_requirements",
    mappedCapabilityIds: [
      "kernel-governance",
      "audit-deploy",
      "panta-ai",
      "provider-cost"
    ],
    proposedCapabilityTitle: "Kernel Protocol Recovery",
    proposedKernelId: "kernel-protocol-recovery-kernel",
    usefulSignals: [
      "Provider dispatch patterns",
      "Protocol gateway patterns",
      "Audit reports",
      "Old kernel upload instructions and partial implementations"
    ],
    staticOrPrototypeSignals: [
      "Some files may be partial patches",
      "Some files may be old upload artifacts",
      "Some may not be connected to production routes"
    ],
    realImplementationRequirements: [
      "Classify useful protocol ideas",
      "Merge into current Master Kernel architecture only after review",
      "Remove or quarantine obsolete upload artifacts",
      "Create work orders for real protocol/provider/router integration"
    ],
    requiredSharedServices: allCommonServices,
    benchmarkRegions: ["global", "usa", "china", "europe"],
    risk: "high",
    founderReportRequired: true,
    notes: [
      "Do not trust old files blindly. Intake first, merge later."
    ]
  },
  {
    intakeId: "legacy-v0-generated-projects",
    title: "v0 generated and template projects",
    sourceKind: "legacy_repo",
    sourceReference: "v0-new-project-* and other Vercel template-style projects",
    status: "discovered",
    proposedAction: "extract_requirements",
    mappedCapabilityIds: [],
    proposedCapabilityTitle: "Generated Prototype Intake",
    proposedKernelId: "generated-prototype-intake-kernel",
    usefulSignals: [
      "Possible useful UI layouts",
      "Possible feature experiments",
      "Possible early product concepts"
    ],
    staticOrPrototypeSignals: [
      "Likely static or template-level code",
      "May have no production backend",
      "May have no real data flow"
    ],
    realImplementationRequirements: [
      "Inspect before merging",
      "Extract only useful Pantavion-owned product patterns",
      "Convert to real capabilities through work orders",
      "Never present prototype UI as live function"
    ],
    requiredSharedServices: allCommonServices,
    benchmarkRegions: ["global", "usa", "europe"],
    risk: "medium",
    founderReportRequired: true,
    notes: [
      "Useful prototypes are not discarded, but must become real before public-live."
    ]
  },
  {
    intakeId: "legacy-rescue-runtime-stabilize",
    title: "Pantavion rescue and runtime stabilization projects",
    sourceKind: "vercel_deployment",
    sourceReference: "pantavion-clean-rescue, pantavion-runtime-stabilize and failed/error previews",
    status: "needs_founder_review",
    proposedAction: "extract_requirements",
    mappedCapabilityIds: [
      "recovery-rollback",
      "audit-deploy",
      "kernel-governance"
    ],
    proposedCapabilityTitle: "Runtime Recovery and Stabilization",
    proposedKernelId: "runtime-recovery-stabilization-kernel",
    usefulSignals: [
      "Recovery attempts",
      "Runtime stabilization ideas",
      "Deployment failure history",
      "Potential rollback and maintenance lessons"
    ],
    staticOrPrototypeSignals: [
      "Some deployments show error",
      "May contain emergency patches or unfinished recovery attempts"
    ],
    realImplementationRequirements: [
      "Extract failure lessons",
      "Create recovery/rollback policies",
      "Feed Maintenance Kernel memory",
      "Do not merge failed project code without audit"
    ],
    requiredSharedServices: allCommonServices,
    benchmarkRegions: ["global", "usa", "europe", "china"],
    risk: "high",
    founderReportRequired: true,
    notes: [
      "Failed deployments are still useful as memory and prevention data."
    ]
  }
];

export function getPantavionProjectIntakeReport(): PantavionProjectIntakeReport {
  return {
    totalRecords: PANTAVION_PROJECT_INTAKE_REGISTRY.length,
    legacyRepos: PANTAVION_PROJECT_INTAKE_REGISTRY.filter(
      (record) => record.sourceKind === "legacy_repo"
    ).length,
    staticPrototypes: PANTAVION_PROJECT_INTAKE_REGISTRY.filter(
      (record) => record.sourceKind === "static_prototype"
    ).length,
    unfinishedRoutes: PANTAVION_PROJECT_INTAKE_REGISTRY.filter(
      (record) => record.sourceKind === "unfinished_route"
    ).length,
    newCapabilityCandidates: PANTAVION_PROJECT_INTAKE_REGISTRY.filter(
      (record) => record.status === "new_capability_candidate"
    ).length,
    founderReviewRequired: PANTAVION_PROJECT_INTAKE_REGISTRY.filter(
      (record) => record.founderReportRequired
    ).length,
    blocked: PANTAVION_PROJECT_INTAKE_REGISTRY.filter(
      (record) => record.status === "blocked"
    ).length
  };
}

export function getPantavionProjectIntakeRecord(intakeId: string) {
  return PANTAVION_PROJECT_INTAKE_REGISTRY.find((record) => record.intakeId === intakeId);
}

export function getPantavionProjectIntakeRecordsForCapability(capabilityId: string) {
  return PANTAVION_PROJECT_INTAKE_REGISTRY.filter((record) =>
    record.mappedCapabilityIds.includes(capabilityId)
  );
}

