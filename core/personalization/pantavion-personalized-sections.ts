export type PantavionSectionState = "connected" | "building" | "foundation";

export type PantavionPersonalizationContext = {
  language?: string | null;
  country?: string | null;
};

export type PantavionRecoveredCapability = {
  id: string;
  title: string;
  description: string;
  state: PantavionSectionState;
  href?: string;
  donorPrs: number[];
};

export type PantavionPersonalizedSection = {
  id: string;
  title: string;
  description: string;
  priority: number;
  capabilities: PantavionRecoveredCapability[];
};

const sections: PantavionPersonalizedSection[] = [
  {
    id: "people-social",
    title: "Άνθρωποι & Social",
    description: "Το ανθρώπινο δίκτυό σου: profile, people, requests, feed, reactions, comments, media και nearby.",
    priority: 100,
    capabilities: [
      { id: "people", title: "Άνθρωποι", description: "Profiles, αιτήματα, συνδέσεις, nearby και block/unblock.", state: "connected", href: "/people", donorPrs: [166, 174, 182, 185, 186, 187, 211] },
      { id: "social-feed", title: "Social", description: "Feed, posts, reactions, comments, media και Social Map foundation.", state: "connected", href: "/social", donorPrs: [138, 163, 164, 174, 175, 176, 177, 178, 182, 183, 185, 186, 187, 189, 211] },
      { id: "communities", title: "Κοινότητες & κοινωνικά πλαίσια", description: "Family, Friends, Communities, Professional, Business, Learning, Dating και Elite Society contexts.", state: "building", donorPrs: [138, 174, 182] },
    ],
  },
  {
    id: "communication",
    title: "Επικοινωνία",
    description: "Μηνύματα, realtime, μετάφραση μέσα στη συνομιλία και μελλοντικά voice/video rooms.",
    priority: 98,
    capabilities: [
      { id: "messages", title: "Μηνύματα", description: "Authenticated conversations και persistent messages.", state: "connected", href: "/messages", donorPrs: [166, 172, 184, 211] },
      { id: "chat-translation", title: "Realtime Chat + μετάφραση", description: "Realtime delivery state και per-message translation μέσω του canonical translation runtime.", state: "building", href: "/messages", donorPrs: [146, 171, 180, 181, 184, 196, 211] },
      { id: "group-language-fanout", title: "Πολυγλωσσικές ομάδες", description: "Ένα πρωτότυπο μήνυμα, διαφορετική γλώσσα ανά παραλήπτη.", state: "foundation", donorPrs: [138, 146] },
      { id: "secure-chat", title: "Secure / Elite Chat", description: "Recovered policy/readiness foundation· πραγματικό E2EE δεν δηλώνεται έτοιμο χωρίς audited protocol.", state: "foundation", donorPrs: [138] },
    ],
  },
  {
    id: "interpreter",
    title: "Διερμηνέας & Γλώσσες",
    description: "Text, speech-to-text, language detection, accessibility normalization και bidirectional interpreting.",
    priority: 96,
    capabilities: [
      { id: "translate", title: "Μετάφραση", description: "Canonical provider-aware translation runtime.", state: "connected", href: "/translate", donorPrs: [140, 141, 142, 144, 145, 146, 160, 171, 180, 181] },
      { id: "interpreter", title: "Αμφίδρομος Διερμηνέας", description: "Two-speaker flow με MediaRecorder/server STT, translation και speech output.", state: "building", href: "/translate/interpreter", donorPrs: [143, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 161, 162, 194, 195, 196, 208, 209, 210] },
      { id: "language-detection", title: "Αυτόματη αναγνώριση γλώσσας", description: "Script-first/model-fallback language detection recovered selectively from historical Interpreter work.", state: "building", donorPrs: [143, 161, 162, 193, 194] },
    ],
  },
  {
    id: "personal-space",
    title: "Ο προσωπικός μου χώρος",
    description: "Profile, contacts και ιδιωτικά media κάτω από τον ίδιο λογαριασμό.",
    priority: 94,
    capabilities: [
      { id: "profile", title: "Προφίλ", description: "Η ταυτότητα εμφάνισης, γλώσσα και προσωπικά στοιχεία σου.", state: "connected", href: "/profile", donorPrs: [163, 173, 188, 197, 212] },
      { id: "contacts", title: "Επαφές", description: "Consent-based contacts/import foundation χωρίς να συγχέονται με Pantavion users.", state: "connected", href: "/contacts", donorPrs: [166, 173, 174] },
      { id: "personal-media", title: "Φωτογραφίες & αρχεία", description: "Private personal media library με owner-only boundary.", state: "connected", href: "/my-media", donorPrs: [173, 174, 183] },
    ],
  },
  {
    id: "identity-trust",
    title: "Ταυτότητα, Εμπιστοσύνη & Ασφάλεια",
    description: "Registration, consent, age/trust/security tiers, protected accounts και Owner/Safety control.",
    priority: 92,
    capabilities: [
      { id: "registration", title: "Εγγραφή & consent", description: "Current production identity model με launch gate και recovered secure registration fields.", state: "building", donorPrs: [166, 183, 185, 186, 187, 188, 197] },
      { id: "protected-identity", title: "Protected / υψηλής ασφάλειας λογαριασμοί", description: "Recovered policy for passkeys/security keys, manual review και protected profiles· απαιτεί πραγματική enrollment/provider verification.", state: "foundation", donorPrs: [188, 191] },
      { id: "owner-safety", title: "Owner / Trust & Safety", description: "Authenticated control surface πάνω σε production Trust & Safety RPCs και AAL2/role gates.", state: "connected", donorPrs: [191] },
    ],
  },
  {
    id: "business-market",
    title: "Business, Αγγελίες & Αγορά",
    description: "Business, jobs, events, marketplace, public listings και internal Ads foundation.",
    priority: 80,
    capabilities: [
      { id: "listings", title: "Αγγελίες / Listings", description: "Moderated public listings lifecycle και RLS-backed public state.", state: "building", donorPrs: [138, 164, 167, 168, 189] },
      { id: "ads", title: "Pantavion Ads", description: "Recovered internal advertising and sales workflow foundations.", state: "foundation", donorPrs: [138] },
      { id: "business-context", title: "Business Social", description: "Business relationship context μέσα στο ενιαίο Social shell.", state: "foundation", donorPrs: [138, 167, 182] },
    ],
  },
  {
    id: "media-knowledge",
    title: "Media, Ειδήσεις & Γνώση",
    description: "Verified-source media, news/radio/podcast/video και provider-independent Knowledge Vault.",
    priority: 76,
    capabilities: [
      { id: "media", title: "Media / News / Radio", description: "Rights/provenance-aware media schema και public media feed foundation.", state: "building", href: "/media", donorPrs: [167, 168, 189] },
      { id: "knowledge-vault", title: "Global Knowledge Vault", description: "Evidence/provenance ledger, temporal graph, rights engine, search/index και protected viewer architecture.", state: "foundation", donorPrs: [179] },
    ],
  },
  {
    id: "world-maps",
    title: "Κόσμος, Χώρες & Χάρτες",
    description: "Global Connect, country registry, Social Map, travel/world context και professional infrastructure maps.",
    priority: 72,
    capabilities: [
      { id: "global-connect", title: "Global Connect", description: "Canonical registry 249 country/area codes με truthful readiness evidence.", state: "foundation", donorPrs: [167, 207] },
      { id: "social-map", title: "Social Map", description: "Consent-based location sharing, approximate visibility, expiry/revoke και emergency-location separation.", state: "building", href: "/social/map", donorPrs: [174, 182] },
      { id: "water", title: "Professional Water / Infrastructure", description: "Protected water network runtime, access controls, range loading, locks και administrator workflow.", state: "connected", href: "/professional/infrastructure/water", donorPrs: [89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 139] },
    ],
  },
  {
    id: "safety-resilience",
    title: "Safety, SOS & Ανθεκτικότητα",
    description: "Trust & Safety, incident health/alerts, emergency boundaries και future resilience transports.",
    priority: 70,
    capabilities: [
      { id: "incident-health", title: "Incident / Health foundation", description: "Provider-independent incidents, redacted alerts και degraded health reporting foundation.", state: "foundation", donorPrs: [130, 190] },
      { id: "sos", title: "SOS", description: "Recovered emergency architecture remains governed separately; translation can be consumed where verified.", state: "foundation", donorPrs: [138, 143, 167, 190] },
    ],
  },
  {
    id: "core-ai-continuity",
    title: "PantaAI, Kernel & Συνέχεια",
    description: "Capability registry, durable execution, continuity graph, Guardian, agents and recovery/completion engine.",
    priority: 66,
    capabilities: [
      { id: "durable-execution", title: "Durable Execution", description: "Task registry, idempotency, retries, checkpoints και persistent-store contract.", state: "building", donorPrs: [88, 169] },
      { id: "continuity", title: "Continuity Graph", description: "Threads, decisions, provenance artifacts, recall bundles και execution links.", state: "building", donorPrs: [165, 170] },
      { id: "guardian", title: "Guardian / Audit", description: "Runtime safety, AI integrity, translation integrity και production verification gates.", state: "connected", donorPrs: [71, 73, 139, 176, 177, 178, 181, 185, 186, 187, 190, 195, 196] },
      { id: "evolution", title: "Evolution / Recovery Engine", description: "Recovered source inventory, founder-vision findings, unfinished-plan ingestion και canonical completion ledger.", state: "foundation", donorPrs: [72, 88, 165, 212] },
    ],
  },
];

function personalizationBoost(section: PantavionPersonalizedSection, context: PantavionPersonalizationContext) {
  let boost = 0;
  if (context.language && context.language !== "en" && section.id === "interpreter") boost += 12;
  if (context.country && section.id === "world-maps") boost += 5;
  return boost;
}

export function getPantavionPersonalizedSections(context: PantavionPersonalizationContext = {}) {
  return [...sections]
    .map((section) => ({ ...section, priority: section.priority + personalizationBoost(section, context) }))
    .sort((a, b) => b.priority - a.priority);
}

export function getRecoveredDonorPrs() {
  return Array.from(new Set(sections.flatMap((section) => section.capabilities.flatMap((capability) => capability.donorPrs)))).sort((a, b) => a - b);
}
