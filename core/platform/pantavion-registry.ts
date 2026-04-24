export type PantavionStatus =
  | "live-foundation"
  | "active-preview"
  | "provider-required"
  | "regulated-required";

export type PantavionRoute = {
  path: string;
  title: string;
  family: string;
  status: PantavionStatus;
  summary: string;
  worksNow: string[];
  next: string[];
};

export type PantavionFamily = {
  key: string;
  title: string;
  promise: string;
  routes: string[];
};

export const pantavionFamilies: PantavionFamily[] = [
  {
    key: "planet",
    title: "Planet Screen",
    promise: "Ο πλανήτης ως μία ζωντανή οθόνη: χώρες, κουλτούρες, σήματα, προβλήματα, λύσεις.",
    routes: ["/planet", "/global/countries", "/global/environment", "/global/politics", "/global/conflicts"],
  },
  {
    key: "language",
    title: "Universal Communication",
    promise: "Γέφυρα γλωσσών για κείμενο, φωνή, υπότιτλους, κοινότητες και μελλοντικά live rooms.",
    routes: ["/language", "/voice", "/messages", "/rooms", "/daily/chat"],
  },
  {
    key: "social",
    title: "People & Social Universe",
    promise: "Προφίλ, άνθρωποι, κοινότητες, σχέσεις, γνωριμίες και κοινωνική παρουσία.",
    routes: ["/people", "/profile", "/communities", "/daily/dating", "/daily/stories"],
  },
  {
    key: "media",
    title: "Media Universe",
    promise: "Βίντεο, μουσική, live, short-form, long-form, creators και πολιτισμική έκφραση.",
    routes: ["/media", "/daily/video", "/daily/music", "/channels", "/creators"],
  },
  {
    key: "ai",
    title: "PantaAI Center",
    promise: "Intent → Plan → Capability → Execution → Result → Memory.",
    routes: ["/intelligence", "/intelligence/execute", "/research", "/create", "/build"],
  },
  {
    key: "work",
    title: "Work / Services / Income",
    promise: "Εργασία, υπηρεσίες, marketplace, business profiles, earnings και monetization.",
    routes: ["/work", "/services", "/marketplace", "/earnings", "/business", "/pricing"],
  },
  {
    key: "culture",
    title: "Knowledge / Culture / Education",
    promise: "Χώρες, ιστορία, θρησκείες, παραδόσεις, έρευνα, εκπαίδευση και βιβλιοθήκες.",
    routes: ["/culture", "/learning", "/global/history", "/global/tech"],
  },
  {
    key: "safety",
    title: "Safety / Law / Identity",
    promise: "Identity, age gate, minors protection, safety center, reporting, privacy και legal rules.",
    routes: ["/safety", "/legal", "/terms", "/privacy", "/minors", "/onboarding/age", "/onboarding/country", "/onboarding/language", "/onboarding/purpose"],
  },
  {
    key: "elite",
    title: "Pantavion Elite",
    promise: "Founding access, premium circles, verified professional visibility και advanced execution.",
    routes: ["/elite", "/founding", "/download"],
  },
];

export const pantavionRoutes: PantavionRoute[] = [
  {
    path: "/planet",
    title: "Planet Screen",
    family: "Planet",
    status: "live-foundation",
    summary: "Η πρώτη πραγματική επιφάνεια του Pantavion ως παγκόσμιο command screen.",
    worksNow: ["Πραγματικό route", "Περιεχόμενο πλανητικής δομής", "Σύνδεση με χώρες, περιβάλλον, πολιτική, συγκρούσεις"],
    next: ["Live map provider", "World signal ingestion", "Country/culture database"],
  },
  {
    path: "/language",
    title: "Language Bridge",
    family: "Universal Communication",
    status: "live-foundation",
    summary: "Πραγματικό text bridge shell με API route και provider-ready contract.",
    worksNow: ["Πραγματικό route", "Client input", "API response", "Foundation dictionary/fallback"],
    next: ["Σύνδεση με translation provider", "Speech-to-text", "Text-to-speech", "Live bidirectional voice rooms"],
  },
  {
    path: "/voice",
    title: "Voice Interpreter",
    family: "Universal Communication",
    status: "provider-required",
    summary: "Η βάση για αμφίδρομη φωνητική μετάφραση σε πραγματικό χρόνο.",
    worksNow: ["Πραγματικό route", "Σαφής product contract", "No dead button"],
    next: ["Microphone permission flow", "STT provider", "TTS provider", "low-latency translation pipeline"],
  },
  {
    path: "/messages",
    title: "Messages",
    family: "Universal Communication",
    status: "active-preview",
    summary: "Μηνύματα και συνομιλίες ως μέρος του universal communication layer.",
    worksNow: ["Πραγματικό route", "Navigation works", "Conversation surface defined"],
    next: ["Database", "Realtime transport", "Moderation queues", "Translation per message"],
  },
  {
    path: "/rooms",
    title: "Cross-Language Rooms",
    family: "Universal Communication",
    status: "active-preview",
    summary: "Δωμάτια όπου άνθρωποι διαφορετικών γλωσσών μπορούν να μιλούν και να διαβάζουν σε δική τους γλώσσα.",
    worksNow: ["Πραγματικό route", "Room concept visible"],
    next: ["WebRTC", "Captions", "Group translation", "Trust & safety controls"],
  },
  {
    path: "/people",
    title: "People & Social",
    family: "Social",
    status: "active-preview",
    summary: "Η κοινωνική επιφάνεια του Pantavion για ανθρώπους, σχέσεις και κοινότητες.",
    worksNow: ["Πραγματικό route", "Social universe contract"],
    next: ["User database", "Profiles", "Follow/friend graph", "Privacy scopes"],
  },
  {
    path: "/profile",
    title: "Profile",
    family: "Identity",
    status: "active-preview",
    summary: "Μία ταυτότητα με πολλά scoped selves: public, professional, creator, business, protected.",
    worksNow: ["Πραγματικό route", "Profile model defined"],
    next: ["Photo upload", "Verification", "Privacy scope engine", "Minors protected profile"],
  },
  {
    path: "/communities",
    title: "Communities",
    family: "Social",
    status: "active-preview",
    summary: "Κοινότητες ανά γλώσσα, χώρα, θέμα, επάγγελμα, κουλτούρα και ενδιαφέρον.",
    worksNow: ["Πραγματικό route", "Community direction defined"],
    next: ["Groups database", "Roles", "Moderation", "Translation layers"],
  },
  {
    path: "/media",
    title: "Media Universe",
    family: "Media",
    status: "active-preview",
    summary: "Βίντεο, μουσική, live, creators, channels και πολιτισμικό περιεχόμενο.",
    worksNow: ["Πραγματικό route", "Media family visible"],
    next: ["Upload pipeline", "Storage", "Transcoding", "Rights and moderation"],
  },
  {
    path: "/channels",
    title: "Channels",
    family: "Media",
    status: "active-preview",
    summary: "Creator and media channels for long-form, short-form, live and cultural content.",
    worksNow: ["Πραγματικό route", "Channel direction defined"],
    next: ["Creator profiles", "Subscriptions", "Recommendations", "Media processing"],
  },
  {
    path: "/creators",
    title: "Creators",
    family: "Media / Income",
    status: "active-preview",
    summary: "Creator economy surface connected to media, services and monetization.",
    worksNow: ["Πραγματικό route", "Creator economy contract"],
    next: ["Creator onboarding", "Payments provider", "Payouts", "Analytics"],
  },
  {
    path: "/intelligence",
    title: "PantaAI Center",
    family: "AI",
    status: "live-foundation",
    summary: "Το κέντρο AI του Pantavion. Όχι tool directory: intent-driven execution system.",
    worksNow: ["Πραγματικό route", "Capability families", "Execution doctrine"],
    next: ["Provider router", "Memory store", "Tool connectors", "Workspace execution"],
  },
  {
    path: "/intelligence/execute",
    title: "PantaAI Execute",
    family: "AI",
    status: "live-foundation",
    summary: "Πραγματικό intent execution shell με API route που παράγει plan/result packet.",
    worksNow: ["Client input", "API route", "Intent parser", "Plan generator", "Result packet"],
    next: ["LLM provider", "Tool execution", "Memory governance", "Workspace actions"],
  },
  {
    path: "/research",
    title: "Research",
    family: "AI / Knowledge",
    status: "active-preview",
    summary: "Research surface για αναζήτηση, μελέτη, σύνοψη, sources και knowledge workflows.",
    worksNow: ["Πραγματικό route", "Research lane defined"],
    next: ["Search provider", "Citation pipeline", "Document ingestion", "Knowledge memory"],
  },
  {
    path: "/create",
    title: "Create",
    family: "AI / Media",
    status: "active-preview",
    summary: "Creation surface για κείμενο, εικόνα, media, posts, campaigns, designs και projects.",
    worksNow: ["Πραγματικό route", "Create lane defined"],
    next: ["Asset storage", "Generation providers", "Project history", "Rights rules"],
  },
  {
    path: "/build",
    title: "Build",
    family: "AI / Execution",
    status: "active-preview",
    summary: "Build lane για websites, apps, automations και business workflows.",
    worksNow: ["Πραγματικό route", "Build lane defined"],
    next: ["Code workspace", "Deployment provider", "Template registry", "Execution sandbox"],
  },
  {
    path: "/work",
    title: "Work",
    family: "Work",
    status: "active-preview",
    summary: "Εργασία, επαγγελματικές ευκαιρίες, projects και professional discovery.",
    worksNow: ["Πραγματικό route", "Work surface defined"],
    next: ["Jobs database", "Applications", "Professional verification", "Matching"],
  },
  {
    path: "/services",
    title: "Services",
    family: "Work",
    status: "active-preview",
    summary: "Υπηρεσίες ανθρώπων και επιχειρήσεων με παγκόσμια ανακάλυψη.",
    worksNow: ["Πραγματικό route", "Services surface defined"],
    next: ["Listings", "Booking", "Reviews", "Payments"],
  },
  {
    path: "/marketplace",
    title: "Marketplace",
    family: "Commerce",
    status: "active-preview",
    summary: "Αγορά για υπηρεσίες, listings, creators, business offers και local/global commerce.",
    worksNow: ["Πραγματικό route", "Marketplace lane defined"],
    next: ["Catalog", "Orders", "Payments", "Compliance"],
  },
  {
    path: "/earnings",
    title: "Earnings",
    family: "Income",
    status: "regulated-required",
    summary: "Εισοδήματα, creator monetization, service payouts, invoices and subscriptions.",
    worksNow: ["Πραγματικό route", "Earnings model visible"],
    next: ["Payments provider", "Tax/KYC review", "Invoices", "Payouts"],
  },
  {
    path: "/business",
    title: "Business Profiles",
    family: "Work",
    status: "active-preview",
    summary: "Business identity, services, verified presence, listings και professional visibility.",
    worksNow: ["Πραγματικό route", "Business profile direction"],
    next: ["Business onboarding", "Verification", "Listings", "Analytics"],
  },
  {
    path: "/pricing",
    title: "Pricing",
    family: "Commerce",
    status: "active-preview",
    summary: "Founding, Pro, Business and Elite commercial structure.",
    worksNow: ["Πραγματικό route", "Commercial tiers visible"],
    next: ["Payment provider", "Subscription backend", "Entitlements"],
  },
  {
    path: "/culture",
    title: "Culture",
    family: "Knowledge",
    status: "active-preview",
    summary: "Πολιτισμοί, παραδόσεις, κοινωνίες, ιστορία και παγκόσμια γνώση.",
    worksNow: ["Πραγματικό route", "Culture lane visible"],
    next: ["Knowledge graph", "Country pages", "Libraries", "Learning paths"],
  },
  {
    path: "/learning",
    title: "Learning",
    family: "Education",
    status: "active-preview",
    summary: "Learning paths, guided mastery, languages, skills, universities and research.",
    worksNow: ["Πραγματικό route", "Learning lane visible"],
    next: ["Course engine", "Progress tracking", "Credentials", "AI tutor"],
  },
  {
    path: "/safety",
    title: "Safety Center",
    family: "Safety",
    status: "live-foundation",
    summary: "Safety, reporting, emergency, minors protection, moderation and lawful escalation.",
    worksNow: ["Πραγματικό route", "Safety rules visible", "No fake admin access"],
    next: ["Reports database", "Audit logs", "Moderation queue", "Emergency workflows"],
  },
  {
    path: "/legal",
    title: "Legal Center",
    family: "Legal",
    status: "live-foundation",
    summary: "Legal gateway για Terms, Privacy, minors, content policy and compliance.",
    worksNow: ["Πραγματικό route", "Legal routing visible"],
    next: ["Lawyer-reviewed text", "Versioning", "Country-specific rules", "Consent records"],
  },
  {
    path: "/terms",
    title: "Terms",
    family: "Legal",
    status: "active-preview",
    summary: "Terms of service route. Requires legal review before production claim.",
    worksNow: ["Πραγματικό route", "Terms placeholder with review status"],
    next: ["Legal drafting", "Version acceptance tracking", "Locale review"],
  },
  {
    path: "/privacy",
    title: "Privacy",
    family: "Legal",
    status: "active-preview",
    summary: "Privacy route. Requires GDPR/privacy counsel before production legal use.",
    worksNow: ["Πραγματικό route", "Privacy placeholder with review status"],
    next: ["Privacy policy", "Data map", "Retention rules", "DPA/cookie rules"],
  },
  {
    path: "/minors",
    title: "Minors Protection",
    family: "Safety",
    status: "active-preview",
    summary: "Protected accounts, age zones, guardian logic and child-safety escalation.",
    worksNow: ["Πραγματικό route", "Minors protection surface visible"],
    next: ["Age assurance", "Guardian consent", "Restricted discovery", "Escalation workflow"],
  },
  {
    path: "/founding",
    title: "Founding Access",
    family: "Elite",
    status: "active-preview",
    summary: "Founding member access and early supporter channel.",
    worksNow: ["Πραγματικό route", "Founding commercial surface"],
    next: ["Waitlist database", "Payment provider", "Member entitlements"],
  },
  {
    path: "/elite",
    title: "Pantavion Elite",
    family: "Elite",
    status: "active-preview",
    summary: "Premium access, verified circles, advanced AI/tools and professional networking.",
    worksNow: ["Πραγματικό route", "Elite positioning"],
    next: ["Verification", "Membership", "Premium routing", "Private circles"],
  },
  {
    path: "/download",
    title: "Download / Install",
    family: "PWA",
    status: "live-foundation",
    summary: "Installable app direction for web, mobile, tablet and desktop.",
    worksNow: ["Πραγματικό route", "PWA manifest", "Install guidance"],
    next: ["Icons", "Service worker", "Offline shell", "App store strategy"],
  },
  {
    path: "/import",
    title: "Import Contacts",
    family: "Identity / People",
    status: "active-preview",
    summary: "Contact import from phone, computer, email and CSV where legally possible.",
    worksNow: ["Πραγματικό route", "Import policy visible"],
    next: ["CSV parser", "Contacts permission flow", "Provider integrations", "Consent"],
  },
  {
    path: "/onboarding/age",
    title: "Age Gate",
    family: "Onboarding",
    status: "live-foundation",
    summary: "Age gate route before protected account areas.",
    worksNow: ["Πραγματικό route", "Age gate requirement visible"],
    next: ["Persistence", "Country rules", "Minor-safe routing"],
  },
  {
    path: "/onboarding/country",
    title: "Country Setup",
    family: "Onboarding",
    status: "live-foundation",
    summary: "Country setup for localization, compliance and regional experience.",
    worksNow: ["Πραγματικό route", "Country flow visible"],
    next: ["Country registry", "Compliance mapping", "Regional defaults"],
  },
  {
    path: "/onboarding/language",
    title: "Language Setup",
    family: "Onboarding",
    status: "live-foundation",
    summary: "Language preference route for the multilingual foundation.",
    worksNow: ["Πραγματικό route", "Language preference flow visible"],
    next: ["Locale routing", "Translation catalog", "Legal language status"],
  },
  {
    path: "/onboarding/purpose",
    title: "Purpose Setup",
    family: "Onboarding",
    status: "live-foundation",
    summary: "Purpose selection: connect, learn, work, create, build, sell, discover.",
    worksNow: ["Πραγματικό route", "Purpose flow visible"],
    next: ["Personalized dashboard", "Memory profile", "Capability routing"],
  },
  {
    path: "/daily/chat",
    title: "Daily Hub — Chat",
    family: "Daily",
    status: "active-preview",
    summary: "Daily chat entry surface.",
    worksNow: ["Πραγματικό route", "No dead button"],
    next: ["Realtime chat backend", "Message translation", "Safety filters"],
  },
  {
    path: "/daily/stories",
    title: "Daily Hub — Stories",
    family: "Daily",
    status: "active-preview",
    summary: "Stories surface for short updates.",
    worksNow: ["Πραγματικό route", "No dead button"],
    next: ["Story upload", "Expiry", "Privacy scopes"],
  },
  {
    path: "/daily/video",
    title: "Daily Hub — Video",
    family: "Daily",
    status: "active-preview",
    summary: "Video surface for short and long video.",
    worksNow: ["Πραγματικό route", "No dead button"],
    next: ["Video upload", "Transcoding", "Moderation"],
  },
  {
    path: "/daily/music",
    title: "Daily Hub — Music",
    family: "Daily",
    status: "active-preview",
    summary: "Music and audio culture surface.",
    worksNow: ["Πραγματικό route", "No dead button"],
    next: ["Audio upload", "Rights", "Discovery"],
  },
  {
    path: "/daily/dating",
    title: "Daily Hub — Dating",
    family: "Daily",
    status: "active-preview",
    summary: "Dating/relationships surface with safety-first constraints.",
    worksNow: ["Πραγματικό route", "No dead button"],
    next: ["Age verification", "Safety policy", "Matching rules"],
  },
  {
    path: "/daily/market",
    title: "Daily Hub — Market",
    family: "Daily",
    status: "active-preview",
    summary: "Daily marketplace entry.",
    worksNow: ["Πραγματικό route", "No dead button"],
    next: ["Listings", "Orders", "Payments"],
  },
  {
    path: "/daily/sports",
    title: "Daily Hub — Sports",
    family: "Daily",
    status: "active-preview",
    summary: "Sports news, communities and media.",
    worksNow: ["Πραγματικό route", "No dead button"],
    next: ["Sports data feeds", "Communities", "Live events"],
  },
  {
    path: "/global/countries",
    title: "Global Hub — Countries",
    family: "Global",
    status: "active-preview",
    summary: "Countries surface for global navigation.",
    worksNow: ["Πραγματικό route", "No dead button"],
    next: ["Country database", "Culture pages", "Language defaults"],
  },
  {
    path: "/global/maritime",
    title: "Global Hub — Maritime",
    family: "Global",
    status: "active-preview",
    summary: "Maritime world lane.",
    worksNow: ["Πραγματικό route", "No dead button"],
    next: ["Maritime data", "Ports", "News", "Services"],
  },
  {
    path: "/global/aviation",
    title: "Global Hub — Aviation",
    family: "Global",
    status: "active-preview",
    summary: "Aviation world lane.",
    worksNow: ["Πραγματικό route", "No dead button"],
    next: ["Aviation data", "Airports", "News", "Services"],
  },
  {
    path: "/global/history",
    title: "Global Hub — History",
    family: "Global",
    status: "active-preview",
    summary: "History and civilizations lane.",
    worksNow: ["Πραγματικό route", "No dead button"],
    next: ["Knowledge graph", "Libraries", "Timelines"],
  },
  {
    path: "/global/conflicts",
    title: "Global Hub — Conflicts",
    family: "Global",
    status: "active-preview",
    summary: "Global conflicts and crisis awareness lane.",
    worksNow: ["Πραγματικό route", "No dead button"],
    next: ["Verified sources", "Safety rules", "Crisis escalation"],
  },
  {
    path: "/global/tech",
    title: "Global Hub — Technology",
    family: "Global",
    status: "active-preview",
    summary: "Technology, innovation and AI lane.",
    worksNow: ["Πραγματικό route", "No dead button"],
    next: ["Tech news", "Research", "Builders community"],
  },
  {
    path: "/global/politics",
    title: "Global Hub — Politics",
    family: "Global",
    status: "active-preview",
    summary: "Politics and governance awareness lane.",
    worksNow: ["Πραγματικό route", "No dead button"],
    next: ["Country governance data", "News", "Civic safety rules"],
  },
  {
    path: "/global/environment",
    title: "Global Hub — Environment",
    family: "Global",
    status: "active-preview",
    summary: "Environment, climate, local problems and solutions.",
    worksNow: ["Πραγματικό route", "No dead button"],
    next: ["Environmental data", "Local reports", "Solution networks"],
  }
];

export function getPantavionRoute(path: string): PantavionRoute | undefined {
  const normalized = path === "" ? "/" : path;
  return pantavionRoutes.find((route) => route.path === normalized);
}

export function getRoutesByFamily(keywords: string[]): PantavionRoute[] {
  const lowered = keywords.map((item) => item.toLowerCase());
  return pantavionRoutes.filter((route) =>
    lowered.some((keyword) =>
      route.family.toLowerCase().includes(keyword) ||
      route.title.toLowerCase().includes(keyword) ||
      route.path.toLowerCase().includes(keyword)
    )
  );
}

export function statusLabel(status: PantavionStatus): string {
  switch (status) {
    case "live-foundation":
      return "Live Foundation";
    case "active-preview":
      return "Active Route";
    case "provider-required":
      return "Provider Required";
    case "regulated-required":
      return "Regulated Integration Required";
    default:
      return "Unknown";
  }
}
