export type SovereigntyStatus =
  | "pantavion_owned_core"
  | "self_host_path"
  | "regulated_processor_only"
  | "unavoidable_external_cost";

export type SovereigntyRisk = "medium" | "high" | "critical";

export type SovereignSystemRecord = {
  id: string;
  name: string;
  family: string;
  status: SovereigntyStatus;
  risk: SovereigntyRisk;
  thirdPartyCoreBlocked: boolean;
  ownedTarget: string;
  buildNow: string;
  fallbackRule: string;
  blockedDependency: string;
  nextStep: string;
};

export const SOVEREIGNTY_STATUS_LABELS: Record<SovereigntyStatus, string> = {
  pantavion_owned_core: "Pantavion-owned core",
  self_host_path: "Self-host path",
  regulated_processor_only: "Regulated processor only",
  unavoidable_external_cost: "Unavoidable external cost",
};

export const PANTAVION_SOVEREIGNTY_LEDGER: SovereignSystemRecord[] = [
  {
    id: "pantaai",
    name: "PantaAI",
    family: "AI / Execution / Intelligence",
    status: "pantavion_owned_core",
    risk: "critical",
    thirdPartyCoreBlocked: true,
    ownedTarget: "Pantavion-owned AI operating layer with router, memory, capability registry, execution engine, safety gates, local/open-source model lanes, fine-tuning path and future sovereign inference.",
    buildNow: "External AI providers are not the Pantavion core. They can only be temporary bridge, benchmark, fallback, user-key option or controlled premium lane.",
    fallbackRule: "Premium external AI must be capped, replaceable, logged, kill-switch controlled and never sold as unlimited.",
    blockedDependency: "Pantavion must not become an OpenAI, Anthropic, Google or other AI-provider wrapper.",
    nextStep: "Create PantaAI Router contracts, local-model lane, credit limits and provider kill switch."
  },
  {
    id: "pantamaps",
    name: "PantaMaps",
    family: "Maps / Travel / Interpreter",
    status: "pantavion_owned_core",
    risk: "critical",
    thirdPartyCoreBlocked: true,
    ownedTarget: "Pantavion-owned map layer for travel, interpreter, SOS context, offline packs, cached safe layers and future self-hosted tiles, geocoder and routing.",
    buildNow: "The product can have maps, but Google Maps, Mapbox or HERE must not be the core billing dependency.",
    fallbackRule: "Premium map providers may exist only as optional fallback chosen by Pantavion.",
    blockedDependency: "Do not create uncontrolled third-party cost for normal map views, POI searches or interpreter flows.",
    nextStep: "Create PantaMaps contracts for renderer, tile source, geocoder, routing, offline pack and fallback mode."
  },
  {
    id: "pantacomms",
    name: "PantaComms",
    family: "Messaging / Voice / Video / Media",
    status: "pantavion_owned_core",
    risk: "critical",
    thirdPartyCoreBlocked: true,
    ownedTarget: "Pantavion-owned communication engine for accounts, chats, groups, media messages, voice, video, receipts, presence, device sync, offline queue and abuse controls.",
    buildNow: "Pantavion internal messaging must not pay Twilio, WhatsApp, Viber, Messenger, Telegram or Meta per normal user communication.",
    fallbackRule: "Third-party messaging systems may only be lawful import/export bridges, user-initiated share targets or optional integrations.",
    blockedDependency: "Do not make external messaging networks the core of Pantavion communication.",
    nextStep: "Create PantaComms protocol contracts for chat, groups, media, presence, receipts, calls and offline queue."
  },
  {
    id: "pantatranslate",
    name: "PantaTranslate",
    family: "Translation / Voice / Interpreter",
    status: "pantavion_owned_core",
    risk: "critical",
    thirdPartyCoreBlocked: true,
    ownedTarget: "Pantavion-owned translation layer with offline phrase packs, emergency language cards, confidence status, local display and future self-hosted translation, STT and TTS.",
    buildNow: "Translation must have offline/local survival value before any premium provider mode.",
    fallbackRule: "DeepL, Google, Azure, OpenAI or ElevenLabs may only be online premium fallback, not the required base.",
    blockedDependency: "Do not promise perfect or certified translation and do not require paid providers for basic emergency phrases.",
    nextStep: "Create offline phrase pack schema, confidence model and high-risk disclaimer layer."
  },
  {
    id: "pantasos",
    name: "PantaSOS",
    family: "Safety / Crisis / Off-grid",
    status: "pantavion_owned_core",
    risk: "critical",
    thirdPartyCoreBlocked: true,
    ownedTarget: "Pantavion-owned SOS and off-grid identity packet with local display, QR/NFC, trusted contacts, cached phrases, delayed relay and jurisdiction gates.",
    buildNow: "SOS must be local-first and Pantavion-owned. SMS, WhatsApp, satellite, authorities and institutions are not default dependencies.",
    fallbackRule: "Institutions, certified authorities, rescue partners or satellite providers are future integrations or partner revenue lanes, not base dependency.",
    blockedDependency: "Do not claim authority dispatch, satellite rescue, EPIRB, PLB, 112, 911 or coast guard equivalence.",
    nextStep: "Create off-grid emergency packet schema and SOS truth ledger."
  },
  {
    id: "kernel-sentinel-mesh",
    name: "Kernel Sentinel Mesh",
    family: "Kernel / Monitoring / Recovery",
    status: "pantavion_owned_core",
    risk: "critical",
    thirdPartyCoreBlocked: true,
    ownedTarget: "Pantavion-owned multi-kernel monitoring and recovery system where Prime, Sentinel, Recovery, Cost and Sovereignty kernels watch the ecosystem and each other.",
    buildNow: "Monitoring is Kernel-first. External monitoring tools are not the source of Pantavion truth.",
    fallbackRule: "External monitoring is optional later fallback only and must not receive user content by default.",
    blockedDependency: "Do not make Datadog, Sentry or any third-party monitor the core Kernel truth layer.",
    nextStep: "Create Kernel Real-World Hardening Ledger for routes, dead buttons, claims, build failures and recovery priority."
  },
  {
    id: "pantamemory",
    name: "PantaMemory",
    family: "Memory / Search / Retrieval",
    status: "pantavion_owned_core",
    risk: "critical",
    thirdPartyCoreBlocked: true,
    ownedTarget: "Pantavion-owned memory and retrieval layer with user memory, project memory, business memory, source reliability, quotas, deletion and export.",
    buildNow: "Memory and RAG cannot be mandatory external vector DB dependency.",
    fallbackRule: "Managed vector DBs or provider file search may only be premium fallback.",
    blockedDependency: "Do not promise infinite memory, unlimited document ingestion or permanent storage without quotas.",
    nextStep: "Create memory quota, retention, export/delete and source reliability contracts."
  },
  {
    id: "pantadata",
    name: "PantaData",
    family: "Database / Storage / Auth",
    status: "self_host_path",
    risk: "high",
    thirdPartyCoreBlocked: false,
    ownedTarget: "Pantavion-owned data layer for identity, graph, storage, audit, quotas, backups, export and restore governance.",
    buildNow: "Hosted database/storage may be a temporary bridge, but architecture must allow migration to Pantavion-owned infrastructure.",
    fallbackRule: "Supabase, Firebase, Neon, S3-compatible or Vercel storage are bridge vendors, not permanent lock-in.",
    blockedDependency: "Do not promise unlimited storage, uploads, memory or permanent retention without cost controls.",
    nextStep: "Define auth/database stack, storage quotas and migration path."
  },
  {
    id: "pantapayments",
    name: "PantaPayments",
    family: "Payments / Billing / Commercial",
    status: "regulated_processor_only",
    risk: "critical",
    thirdPartyCoreBlocked: false,
    ownedTarget: "Pantavion-owned commercial policy, pricing, entitlements and access control, with external payment processor only for regulated card processing.",
    buildNow: "Stripe or similar is a payment processor, not the product owner or commercial truth source.",
    fallbackRule: "Use hosted checkout/test mode only after terms and gates. Marketplace payouts remain blocked.",
    blockedDependency: "Do not let payment processor define Pantavion product status or access truth.",
    nextStep: "Create pricing, terms, refund, cancellation and webhook entitlement contracts."
  },
  {
    id: "domains",
    name: "Pantavion Domains",
    family: "Brand / DNS / Public Identity",
    status: "unavoidable_external_cost",
    risk: "medium",
    thirdPartyCoreBlocked: false,
    ownedTarget: "Pantavion-owned brand identity, canonical URLs, public routing and SEO surface.",
    buildNow: "Use pantavion.com as canonical target when DNS and Search Console are ready.",
    fallbackRule: "Registrar/DNS is unavoidable infrastructure vendor, not a product dependency.",
    blockedDependency: "Do not rely permanently on temporary vercel.app URL as the main brand.",
    nextStep: "Connect pantavion.com and www.pantavion.com."
  }
];

export function getPantavionSovereigntySummary() {
  return {
    total: PANTAVION_SOVEREIGNTY_LEDGER.length,
    ownedCore: PANTAVION_SOVEREIGNTY_LEDGER.filter((record) => record.status === "pantavion_owned_core").length,
    critical: PANTAVION_SOVEREIGNTY_LEDGER.filter((record) => record.risk === "critical").length,
    thirdPartyCoreBlocked: PANTAVION_SOVEREIGNTY_LEDGER.filter((record) => record.thirdPartyCoreBlocked).length
  };
}
