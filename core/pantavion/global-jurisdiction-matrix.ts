export type JurisdictionStatus =
  | "foundation"
  | "allowed_with_controls"
  | "legal_review_required"
  | "blocked_until_review";

export type JurisdictionRegion =
  | "GlobalBaseline"
  | "EuropeanUnion"
  | "UnitedStates"
  | "UnitedKingdom"
  | "Canada"
  | "Australia"
  | "India"
  | "China"
  | "Japan"
  | "AfricaRegional"
  | "MiddleEastRegional"
  | "LatinAmericaRegional";

export type JurisdictionMatrixEntry = {
  readonly region: JurisdictionRegion;
  readonly privacy: string;
  readonly minors: string;
  readonly adultRestricted: string;
  readonly marketplace: string;
  readonly payments: string;
  readonly mediaRadio: string;
  readonly emergencyAlerts: string;
  readonly contactImport: string;
  readonly aiTranslation: string;
  readonly dataTransfer: string;
  readonly status: JurisdictionStatus;
  readonly requiredBeforeLaunch: readonly string[];
};

export const globalJurisdictionMatrix = [
  {
    region: "GlobalBaseline",
    privacy: "Privacy-by-default, consent-first data handling, minimal collection, export/delete controls required.",
    minors: "Protected minors model required. No child exploitation, grooming, unsafe contact, or targeted adult advertising.",
    adultRestricted: "Adult or restricted zones are blocked until age verification, provider approval, and jurisdiction review exist.",
    marketplace: "Restricted goods blocked. Fraud, scams, weapons, drugs, counterfeit, stolen goods, hazardous items and illegal services prohibited.",
    payments: "Live charging blocked until commercial policy, refund policy, tax/invoice responsibility and provider readiness are complete.",
    mediaRadio: "News, opinion, advertisement, user submission, AI voice, human presenter and official alert content must be labeled separately.",
    emergencyAlerts: "Official interruptive alerts only from verified institutional accounts through opt-in authority program.",
    contactImport: "Contacts require explicit user permission. Third-party scraping, password collection and unauthorized message access are blocked.",
    aiTranslation: "Assistive translation only. No claim of perfect, certified, legal, medical, or emergency-grade accuracy without review.",
    dataTransfer: "Cross-border data transfer must be reviewed by region before scale.",
    status: "foundation",
    requiredBeforeLaunch: [
      "Master legal terms",
      "Privacy policy",
      "Security control ledger",
      "No-dead-surface audit",
      "Backend claims registry",
      "Translation safety model"
    ]
  },
  {
    region: "EuropeanUnion",
    privacy: "GDPR review required, including lawful basis, consent, data minimization, rights handling and transfer safeguards.",
    minors: "DSA/GDPR-K style minors protection review required. No targeted advertising to children.",
    adultRestricted: "Restricted until jurisdiction, age assurance and payment-provider approval.",
    marketplace: "Consumer protection, restricted goods, platform liability and seller responsibility review required.",
    payments: "VAT/invoice/refund/subscription lifecycle review required before live charging.",
    mediaRadio: "Copyright, source labeling, misinformation and AI-generated media disclosure review required.",
    emergencyAlerts: "Authority opt-in only. Pantavion must not claim to replace emergency services.",
    contactImport: "Explicit permission and data minimization required. No unauthorized import or scraping.",
    aiTranslation: "Assistive translation with confidence and disclaimer required.",
    dataTransfer: "EU transfer safeguards review required.",
    status: "legal_review_required",
    requiredBeforeLaunch: [
      "GDPR consent model",
      "DSA/minors review",
      "EU consumer/refund review",
      "EU data transfer review"
    ]
  },
  {
    region: "UnitedStates",
    privacy: "State privacy review required, including California-style privacy rights where applicable.",
    minors: "COPPA/child safety review required before minors features.",
    adultRestricted: "Restricted until age verification, payment-provider approval and legal review.",
    marketplace: "Fraud, restricted goods, seller responsibility and consumer complaint process required.",
    payments: "Sales tax, refund, subscription, chargeback and processor policy review required.",
    mediaRadio: "Copyright, defamation, misinformation and emergency alert authority review required.",
    emergencyAlerts: "Verified authority/institutional opt-in only. No fake 911/112 replacement claim.",
    contactImport: "Consent-based import only. No scraping or credential collection.",
    aiTranslation: "Assistive translation only with clear limitations.",
    dataTransfer: "Data sharing and state privacy review required.",
    status: "legal_review_required",
    requiredBeforeLaunch: [
      "US privacy review",
      "COPPA/minors review",
      "Payments and tax review",
      "Marketplace restricted goods review"
    ]
  },
  {
    region: "UnitedKingdom",
    privacy: "UK GDPR and Data Protection Act review required.",
    minors: "Age Appropriate Design Code review required.",
    adultRestricted: "Restricted until age assurance, legal review and provider approval.",
    marketplace: "Consumer protection, fraud and restricted goods review required.",
    payments: "Subscription, refund and payment-provider review required.",
    mediaRadio: "Copyright, online safety and media labeling review required.",
    emergencyAlerts: "Authority opt-in only.",
    contactImport: "Explicit permission only.",
    aiTranslation: "Assistive translation only.",
    dataTransfer: "International transfer review required.",
    status: "legal_review_required",
    requiredBeforeLaunch: [
      "UK privacy review",
      "Age appropriate design review",
      "Online safety review"
    ]
  },
  {
    region: "Canada",
    privacy: "PIPEDA/provincial privacy review required.",
    minors: "Youth protection review required.",
    adultRestricted: "Restricted until review.",
    marketplace: "Fraud and restricted goods review required.",
    payments: "Tax/refund/subscription review required.",
    mediaRadio: "Copyright/source labeling review required.",
    emergencyAlerts: "Authority opt-in only.",
    contactImport: "Explicit permission only.",
    aiTranslation: "Assistive translation only.",
    dataTransfer: "Transfer review required.",
    status: "legal_review_required",
    requiredBeforeLaunch: [
      "Canadian privacy review",
      "Commercial policy review"
    ]
  },
  {
    region: "Australia",
    privacy: "Australian Privacy Act review required.",
    minors: "Youth protection and online safety review required.",
    adultRestricted: "Restricted until review.",
    marketplace: "Restricted goods and consumer law review required.",
    payments: "Tax/refund/subscription review required.",
    mediaRadio: "Copyright/source labeling review required.",
    emergencyAlerts: "Authority opt-in only.",
    contactImport: "Explicit permission only.",
    aiTranslation: "Assistive translation only.",
    dataTransfer: "Transfer review required.",
    status: "legal_review_required",
    requiredBeforeLaunch: [
      "Australian privacy review",
      "Online safety review"
    ]
  },
  {
    region: "India",
    privacy: "DPDP-style privacy and consent review required.",
    minors: "Child safety review required.",
    adultRestricted: "Restricted until local legal review.",
    marketplace: "Restricted goods, fraud and local commerce review required.",
    payments: "Local payment, tax, invoice and refund review required.",
    mediaRadio: "Copyright, content and misinformation review required.",
    emergencyAlerts: "Authority opt-in only.",
    contactImport: "Explicit permission only.",
    aiTranslation: "Assistive translation only.",
    dataTransfer: "Localization/transfer review required.",
    status: "legal_review_required",
    requiredBeforeLaunch: [
      "India privacy review",
      "Payments review",
      "Content policy review"
    ]
  },
  {
    region: "China",
    privacy: "PIPL, cybersecurity and data localization review required.",
    minors: "Minors protection review required.",
    adultRestricted: "Blocked until full country-specific legal review.",
    marketplace: "Blocked until full commerce and restricted goods review.",
    payments: "Blocked until local payment/legal review.",
    mediaRadio: "Blocked until content, licensing and regulatory review.",
    emergencyAlerts: "Authority opt-in only after institutional/legal approval.",
    contactImport: "Blocked until consent, API and local data review.",
    aiTranslation: "Assistive only; local AI/content rules review required.",
    dataTransfer: "Localization/transfer review required.",
    status: "blocked_until_review",
    requiredBeforeLaunch: [
      "China legal counsel review",
      "Data localization review",
      "Content regulation review",
      "Payments review"
    ]
  },
  {
    region: "Japan",
    privacy: "APPI privacy review required.",
    minors: "Youth protection review required.",
    adultRestricted: "Restricted until review.",
    marketplace: "Consumer, fraud and restricted goods review required.",
    payments: "Tax/refund/payment-provider review required.",
    mediaRadio: "Copyright/source labeling review required.",
    emergencyAlerts: "Authority opt-in only.",
    contactImport: "Explicit permission only.",
    aiTranslation: "Assistive translation only.",
    dataTransfer: "Transfer review required.",
    status: "legal_review_required",
    requiredBeforeLaunch: [
      "Japan privacy review",
      "Commercial review"
    ]
  },
  {
    region: "AfricaRegional",
    privacy: "Country-by-country privacy review required.",
    minors: "Protection rules required.",
    adultRestricted: "Country-by-country review required.",
    marketplace: "Restricted goods, fraud and local commerce review required.",
    payments: "Local payment, tax and mobile-money review required.",
    mediaRadio: "Copyright/source labeling review required.",
    emergencyAlerts: "Authority opt-in only.",
    contactImport: "Explicit permission only.",
    aiTranslation: "Assistive translation only.",
    dataTransfer: "Transfer rules review required.",
    status: "legal_review_required",
    requiredBeforeLaunch: [
      "Country-by-country privacy matrix",
      "Regional payment review",
      "Safety escalation rules"
    ]
  },
  {
    region: "MiddleEastRegional",
    privacy: "Country-by-country privacy and content review required.",
    minors: "Protection rules required.",
    adultRestricted: "Blocked until country-specific legal review.",
    marketplace: "Restricted goods, fraud and local commerce review required.",
    payments: "Local payment/tax review required.",
    mediaRadio: "Content, licensing, copyright and misinformation review required.",
    emergencyAlerts: "Authority opt-in only.",
    contactImport: "Explicit permission only.",
    aiTranslation: "Assistive translation only.",
    dataTransfer: "Transfer/localization review required.",
    status: "legal_review_required",
    requiredBeforeLaunch: [
      "Regional legal counsel review",
      "Content policy review",
      "Payments review"
    ]
  },
  {
    region: "LatinAmericaRegional",
    privacy: "Country-by-country privacy review required.",
    minors: "Protection rules required.",
    adultRestricted: "Restricted until review.",
    marketplace: "Restricted goods, fraud and local commerce review required.",
    payments: "Local tax/refund/payment review required.",
    mediaRadio: "Copyright/source labeling review required.",
    emergencyAlerts: "Authority opt-in only.",
    contactImport: "Explicit permission only.",
    aiTranslation: "Assistive translation only.",
    dataTransfer: "Transfer rules review required.",
    status: "legal_review_required",
    requiredBeforeLaunch: [
      "Country-by-country legal matrix",
      "Commercial policy review",
      "Safety policy review"
    ]
  }
] as const satisfies readonly JurisdictionMatrixEntry[];

export const globalJurisdictionMatrixSummary = {
  id: "global-jurisdiction-matrix",
  title: "Pantavion Global Jurisdiction Matrix",
  status: "foundation",
  priority: "critical",
  summary:
    "Pantavion cannot launch high-risk, payment, marketplace, minors, emergency, media, contact-import or regulated features globally without jurisdiction-aware review.",
  hardRules: [
    "No claim of zero legal risk.",
    "Use zero uncontrolled risk as the operating doctrine.",
    "No live payments before commercial and legal readiness gates.",
    "No emergency authority routing without verified institutional opt-in.",
    "No contact scraping or password collection.",
    "No adult or restricted zones before age, jurisdiction and payment-provider approval.",
    "No perfect translation claim.",
    "Every public surface must declare whether it is doctrine, foundation, prototype, backend-connected or production-operational."
  ],
  requiredNextGates: [
    "Security Control Ledger",
    "No Dead Surface Audit",
    "Translation Safety Ledger",
    "Import World Consent Matrix",
    "Real Backend Claims Registry",
    "Stripe Readiness Gate"
  ]
} as const;

export default globalJurisdictionMatrix;
