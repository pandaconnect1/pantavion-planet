export type SosGapStatus =
  | "implemented-now"
  | "ready-next"
  | "blocked-provider"
  | "blocked-infrastructure"
  | "blocked-legal"
  | "blocked-cost";

export type SosGapPriority = "critical" | "high" | "medium" | "future";

export type SosGapCategory =
  | "trusted-contacts"
  | "sms"
  | "email"
  | "push"
  | "accounts"
  | "dispatch"
  | "satellite"
  | "legal"
  | "cost"
  | "native-app"
  | "evidence"
  | "admin";

export type SosGapItem = {
  id: string;
  title: string;
  category: SosGapCategory;
  status: SosGapStatus;
  priority: SosGapPriority;
  whatWeHaveNow: string;
  whyItMatters: string;
  whyBlocked: string;
  unlockCondition: string;
  nextAction: string;
};

export const PANTAVION_SOS_GREEK_REMINDER =
  "ΥΠΕΝΘΥΜΙΣΗ SOS: Ό,τι σώζει ζωές και μπορεί να υλοποιηθεί με χαμηλό κόστος μπαίνει όσο πιο νωρίς γίνεται. Ό,τι δεν μπορεί να γίνει σήμερα μένει σε gap ledger με λόγο, κόστος, ρίσκο και τι χρειάζεται για να ξεκλειδώσει.";

export const pantavionSosGapLedger: SosGapItem[] = [
  {
    id: "browser-pwa-sos",
    title: "Browser/PWA SOS actions",
    category: "trusted-contacts",
    status: "implemented-now",
    priority: "critical",
    whatWeHaveNow:
      "Live SOS page, local emergency profile, local trusted contacts, call, SMS link, email link, copy, share, map and offline queue foundations.",
    whyItMatters:
      "This gives immediate lifesaving value without waiting for servers, native apps or provider contracts.",
    whyBlocked: "Not blocked for basic browser/PWA usage.",
    unlockCondition: "Already active; continue hardening UX, language and safety copy.",
    nextAction: "Keep route tested in build and audit before every deployment."
  },
  {
    id: "backend-sms-alerts",
    title: "SOS-only backend SMS alerts to trusted contacts",
    category: "sms",
    status: "ready-next",
    priority: "critical",
    whatWeHaveNow:
      "Device SMS links can open the user's phone SMS app, but the server does not yet send SMS.",
    whyItMatters:
      "SMS can reach trusted contacts even when they do not have a Pantavion account, making it one of the nearest low-cost lifesaving layers.",
    whyBlocked:
      "Requires SMS provider account, environment secrets, spend limits, consent checks, rate limits and delivery logs.",
    unlockCondition:
      "Twilio/Vonage/MessageBird or equivalent provider selected, keys stored in Vercel secrets, SOS-only policy enabled by Founder.",
    nextAction:
      "Build disabled-by-default /api/sos/alert skeleton with PANTAVION_SOS_SMS_ENABLED=false and cost caps."
  },
  {
    id: "backend-email-alerts",
    title: "SOS email fallback to trusted contacts and Founder",
    category: "email",
    status: "ready-next",
    priority: "high",
    whatWeHaveNow:
      "mailto links and feedback email actions exist, but the server does not yet send emergency email alerts.",
    whyItMatters:
      "Email is low cost and can create a useful delivery trail before SMS/provider infrastructure is mature.",
    whyBlocked:
      "Requires email provider account, domain/sender verification, anti-abuse rules and delivery logs.",
    unlockCondition:
      "Resend/SendGrid/Postmark or equivalent provider selected and environment secrets configured.",
    nextAction:
      "Add disabled-by-default email provider adapter and SOS-only sending policy."
  },
  {
    id: "real-user-accounts",
    title: "Real user accounts and SOS cloud profile",
    category: "accounts",
    status: "blocked-infrastructure",
    priority: "critical",
    whatWeHaveNow:
      "SOS profile is stored locally on the device through browser storage.",
    whyItMatters:
      "Accounts are required to count real users, sync profiles, support verified contacts and create admin visibility.",
    whyBlocked:
      "Requires auth provider, database, schema, privacy policy, data retention rules and minor/guardian role policy.",
    unlockCondition:
      "Supabase/Firebase/Clerk or equivalent auth/database path selected and legally safe signup rules approved.",
    nextAction:
      "Create user registry schema and Founder admin dashboard after SOS ledger/policy hardening."
  },
  {
    id: "verified-trusted-contact-invites",
    title: "Verified trusted contact invite and accept flow",
    category: "trusted-contacts",
    status: "blocked-infrastructure",
    priority: "high",
    whatWeHaveNow:
      "Users can locally save contacts, but contacts have not accepted or verified the relationship.",
    whyItMatters:
      "Verified acceptance reduces abuse, wrong numbers and false expectations in emergencies.",
    whyBlocked:
      "Requires user accounts, database, invite tokens, notification provider and consent logs.",
    unlockCondition:
      "Real auth/database exists and email/SMS/push provider is configured.",
    nextAction:
      "Implement invite status: pending, accepted, declined, revoked."
  },
  {
    id: "push-notifications",
    title: "Web/PWA push notifications",
    category: "push",
    status: "blocked-infrastructure",
    priority: "high",
    whatWeHaveNow:
      "No push registration or push delivery backend exists yet.",
    whyItMatters:
      "Push can alert Pantavion users faster and cheaper than SMS when app/PWA permission exists.",
    whyBlocked:
      "Requires accounts, device tokens, permission UX, provider setup and abuse protection.",
    unlockCondition:
      "Auth/database and push provider selected; device registration table exists.",
    nextAction:
      "Add PWA push readiness after user registry."
  },
  {
    id: "certified-emergency-dispatch",
    title: "Certified emergency dispatch provider integration",
    category: "dispatch",
    status: "blocked-provider",
    priority: "future",
    whatWeHaveNow:
      "Pantavion clearly states trusted contacts and local emergency numbers first.",
    whyItMatters:
      "Official responder escalation requires authorized human/provider workflows.",
    whyBlocked:
      "Requires certified dispatch partner, contracts, country coverage, insurance, liability review and incident handling.",
    unlockCondition:
      "Provider agreement signed and legal/compliance approval completed per supported country.",
    nextAction:
      "Track provider candidates only; do not claim official dispatch before agreement."
  },
  {
    id: "satellite-provider-integration",
    title: "Satellite or off-grid provider integration",
    category: "satellite",
    status: "blocked-provider",
    priority: "future",
    whatWeHaveNow:
      "Pantavion can work over any available internet connection and can keep an offline/local SOS packet.",
    whyItMatters:
      "Remote maritime, aviation, mountain, island, disaster and no-signal cases need off-grid paths.",
    whyBlocked:
      "Requires satellite-capable device, provider agreement, country legality, hardware/subscription model and emergency response path.",
    unlockCondition:
      "Certified satellite/hardware/connectivity partner selected with legal and technical approval.",
    nextAction:
      "Keep satellite-aware wording; never claim satellite-rescue guarantee without provider."
  },
  {
    id: "evidence-capsule-cloud-vault",
    title: "Encrypted Evidence Capsule cloud vault",
    category: "evidence",
    status: "blocked-infrastructure",
    priority: "high",
    whatWeHaveNow:
      "SOS packet can include profile, location and device context; no encrypted cloud vault exists yet.",
    whyItMatters:
      "Evidence can help in violence, bullying, accident, theft or abuse cases, but it is sensitive data.",
    whyBlocked:
      "Requires storage, encryption, consent, retention rules, abuse reporting, legal review and admin audit trail.",
    unlockCondition:
      "Database/storage provider, encryption design and legal data-retention policy approved.",
    nextAction:
      "Design evidence schema after auth/database foundation."
  },
  {
    id: "native-crash-fall-background-location",
    title: "Native crash, fall and background location layer",
    category: "native-app",
    status: "blocked-infrastructure",
    priority: "future",
    whatWeHaveNow:
      "Browser location and sharing actions exist when the user grants permission.",
    whyItMatters:
      "Some emergencies happen when the user cannot operate the phone.",
    whyBlocked:
      "Requires iOS/Android native app, sensor permissions, battery strategy, app store review and safety policy.",
    unlockCondition:
      "Native app roadmap funded and approved after web/PWA traction.",
    nextAction:
      "Track as future native capability, not current web claim."
  },
  {
    id: "country-legal-emergency-review",
    title: "Country-by-country legal and emergency review",
    category: "legal",
    status: "blocked-legal",
    priority: "critical",
    whatWeHaveNow:
      "Current copy limits claims and points users to local emergency numbers.",
    whyItMatters:
      "Emergency, health, minors, privacy and telecom rules differ by country.",
    whyBlocked:
      "Requires legal counsel, country scope, provider contracts and liability review.",
    unlockCondition:
      "Priority countries selected and legal review completed.",
    nextAction:
      "Start with Greece/Cyprus/EU legal baseline before official emergency-provider claims."
  },
  {
    id: "sos-cost-control",
    title: "SOS provider cost control",
    category: "cost",
    status: "ready-next",
    priority: "critical",
    whatWeHaveNow:
      "Browser/PWA actions keep costs low; backend provider costs are not enabled yet.",
    whyItMatters:
      "SMS, email, push, AI and servers must not create uncontrolled costs.",
    whyBlocked:
      "Requires provider adapters, daily caps, per-user limits, logs and Founder enablement.",
    unlockCondition:
      "Cost environment flags and alert delivery logs implemented.",
    nextAction:
      "Add policy constants before enabling any paid provider."
  },
  {
    id: "age-role-sos-protection",
    title: "Age-based SOS protection for minors, adults, elders and guardians",
    category: "accounts",
    status: "blocked-infrastructure",
    priority: "critical",
    whatWeHaveNow:
      "Pantavion has local SOS profile and trusted contacts, but no real account age-role engine yet.",
    whyItMatters:
      "SOS must adapt automatically for minors, parents, adults, elders, guardians and vulnerable users. A child, an elder and an adult must not receive the same safety experience.",
    whyBlocked:
      "Requires real accounts, age-band policy, database, guardian consent rules, yearly age recalculation and legal review.",
    unlockCondition:
      "Auth/database exists, age-role schema is approved, and guardian/minor consent rules are implemented.",
    nextAction:
      "Create Pantavion age-role contract before public signup: minor, parent, adult, elder, guardian, institution."
  },
  {
    id: "minor-guardian-consent-sos",
    title: "Minor and guardian SOS consent model",
    category: "legal",
    status: "blocked-legal",
    priority: "critical",
    whatWeHaveNow:
      "SOS can be used locally, but there is no verified parent/guardian relationship yet.",
    whyItMatters:
      "Minors need stronger safety, privacy, guardian escalation and anti-abuse controls.",
    whyBlocked:
      "Requires parental/guardian consent rules, user accounts, verified relationship, data minimization and country-by-country legal review.",
    unlockCondition:
      "Legal policy and verified guardian/account system exist.",
    nextAction:
      "Add minor-safe signup and guardian relationship schema before real child accounts."
  },
  {
    id: "elder-simple-sos-mode",
    title: "Elder and low-cognition simple SOS mode",
    category: "trusted-contacts",
    status: "ready-next",
    priority: "critical",
    whatWeHaveNow:
      "Pantavion has SOS and trusted contacts, but the elder/low-cognition mode is not yet simplified enough.",
    whyItMatters:
      "Elders or injured users may have poor vision, panic, confusion, shaking hands or limited movement.",
    whyBlocked:
      "Not fully blocked; basic UI can be improved now. Advanced voice/haptic/native actions require later app/device permissions.",
    unlockCondition:
      "Add a simplified SOS mode with fewer choices, larger buttons, clear language and trusted contacts first.",
    nextAction:
      "Create elder-friendly quick SOS copy/UI path and test it on mobile."
  },
  {
    id: "violence-bullying-safe-exit-evidence",
    title: "Violence, bullying, robbery and abuse-safe SOS path",
    category: "evidence",
    status: "ready-next",
    priority: "critical",
    whatWeHaveNow:
      "Feedback and SOS packet exist, but no dedicated safe-exit/evidence path exists yet.",
    whyItMatters:
      "Victims of bullying, domestic violence, robbery or threats may need quiet help, quick exit, trusted contact alerts and evidence preservation.",
    whyBlocked:
      "Basic safe copy and routing can be added now. Encrypted cloud evidence vault requires storage, encryption, retention policy and legal review.",
    unlockCondition:
      "Add first safe-exit UI now; later unlock encrypted evidence vault after database/storage/legal foundation.",
    nextAction:
      "Add quiet SOS/evidence roadmap and avoid any feature that endangers a victim by being too visible."
  },
  {
    id: "family-guardian-safety-check",
    title: "Family, parent and guardian safety-check timers",
    category: "trusted-contacts",
    status: "ready-next",
    priority: "high",
    whatWeHaveNow:
      "Trusted contacts can be stored locally, but there is no timed safety-check flow yet.",
    whyItMatters:
      "A user should be able to say: check me in 15, 30 or 60 minutes; if I do not respond, alert trusted contacts.",
    whyBlocked:
      "Basic browser timer can start now. Reliable background escalation requires accounts, server jobs, push/SMS/email providers.",
    unlockCondition:
      "Implement local safety-check first; later server-backed escalation after auth/provider infrastructure.",
    nextAction:
      "Add Guardian/Safety Check route after SOS ledger hardening."
  },
  {
    id: "vulnerable-user-admin-dashboard",
    title: "Founder/admin visibility for vulnerable-user safety readiness",
    category: "admin",
    status: "blocked-infrastructure",
    priority: "high",
    whatWeHaveNow:
      "Founder can see site analytics, but not real registered users, SOS profiles, vulnerable role counts or safety readiness.",
    whyItMatters:
      "Pantavion must eventually show how many minors, elders, guardians and SOS-ready users exist without exposing private medical data unnecessarily.",
    whyBlocked:
      "Requires real accounts, database, privacy rules, admin authorization and data minimization.",
    unlockCondition:
      "Auth/database and Founder Admin Dashboard exist.",
    nextAction:
      "Track role counts and readiness metrics after signup/user registry is implemented."
  },
  {
    id: "one-tap-sos-auto-media-alert",
    title: "One-tap SOS with siren, camera/audio readiness and trusted-contact alert",
    category: "trusted-contacts",
    status: "ready-next",
    priority: "critical",
    whatWeHaveNow:
      "Pantavion has Live SOS, local trusted contacts, browser/PWA actions, local profile, SOS packet and safety boundaries.",
    whyItMatters:
      "For elders, minors and vulnerable users, SOS must be one obvious red action. The user should not think through many buttons during panic.",
    whyBlocked:
      "Basic one-tap UX can be improved now. Automatic backend alerts, persistent video/audio upload and delivery logs require accounts, permissions, storage and providers.",
    unlockCondition:
      "Simplified red SOS UI is implemented now; server SMS/email/push and evidence storage unlock after provider and database setup.",
    nextAction:
      "Replace complex SOS choices in elder mode with one large red SOS control and keep trusted contacts preconfigured."
  },
  {
    id: "orange-live-translation-no-history-access",
    title: "Orange live translation and help without private history access",
    category: "trusted-contacts",
    status: "ready-next",
    priority: "high",
    whatWeHaveNow:
      "Pantavion has language selection and emergency language foundations, but not yet a dedicated caregiver/interpreter route.",
    whyItMatters:
      "Elders may need to speak with a home helper, nurse, taxi, hospital or public service in another language without exposing private AI companion history.",
    whyBlocked:
      "Basic UI/spec can be added now. True live speech-to-speech translation requires AI/provider APIs, audio permissions and cost controls.",
    unlockCondition:
      "Add orange help/translation mode first; provider-powered speech translation comes after PantaAI/provider router and cost policy.",
    nextAction:
      "Define orange as live two-way help/translation only, with no access to stored green companion memory."
  },
  {
    id: "elder-ai-companion-local-voice-memory",
    title: "Elder AI companion with local voice, transcript, date and time memory",
    category: "evidence",
    status: "ready-next",
    priority: "critical",
    whatWeHaveNow:
      "Pantavion has SOS local storage foundations, but not yet AI companion voice/text memory sessions.",
    whyItMatters:
      "Lonely or elderly users need companionship, voice conversation, written fallback, and a dated history of concerns, health worries and life memories.",
    whyBlocked:
      "Basic spec and local-first design can be added now. Real voice AI, transcription, storage, sync and family visibility require AI provider, permissions, database and consent controls.",
    unlockCondition:
      "PantaAI voice/text layer, local session store, consent model and optional family-sharing rules are implemented.",
    nextAction:
      "Create green companion mode contract: voice plus text, local transcript, optional audio recording, date, time, duration and topic markers."
  },
  {
    id: "caregiver-no-auto-access",
    title: "Caregiver has no automatic access to AI companion history",
    category: "legal",
    status: "ready-next",
    priority: "critical",
    whatWeHaveNow:
      "Pantavion separates trusted contacts from general help, but no explicit caregiver-no-access rule existed before this ledger.",
    whyItMatters:
      "A caregiver or home helper may be part of the user's stress or abuse risk. Pantavion must not expose private voice/text history to the wrong person.",
    whyBlocked:
      "Policy can be enforced now. Technical access controls require accounts, roles, database and audit logs later.",
    unlockCondition:
      "Consent-based visibility rules exist: user, selected family/trusted person, legal guardian where valid. Caregiver access is never automatic.",
    nextAction:
      "Keep orange translation separate from green private AI companion memory."
  },
  {
    id: "ai-health-support-not-doctor",
    title: "AI health support without doctor or diagnosis claim",
    category: "legal",
    status: "ready-next",
    priority: "critical",
    whatWeHaveNow:
      "Pantavion has safety disclaimers. The AI companion health-support boundary must remain explicit.",
    whyItMatters:
      "The AI may provide general knowledge, emotional support, reminders and help organize concerns, but must not claim to be a doctor or replace emergency care.",
    whyBlocked:
      "Not blocked for policy. Medical-grade features require legal review, clinical governance and possibly regulated provider relationships.",
    unlockCondition:
      "All AI companion copy says support/knowledge/organization, not diagnosis or doctor replacement.",
    nextAction:
      "Audit public copy for doctor/diagnosis claims before PantaAI health-support features go live."
  },
  {
    id: "family-consent-summary-sharing",
    title: "Consent-based family summaries for important concerns",
    category: "accounts",
    status: "blocked-infrastructure",
    priority: "high",
    whatWeHaveNow:
      "Local storage can hold data on the device, but there is no account-based family-sharing control yet.",
    whyItMatters:
      "Children/family may need to know important health concerns, loneliness signals or repeated worries, but only with user permission or lawful guardian rules.",
    whyBlocked:
      "Requires accounts, trusted family roles, consent logs, privacy policy, summary generation and revocation controls.",
    unlockCondition:
      "Auth/database and trusted family sharing permissions exist.",
    nextAction:
      "After user registry, add family-visible summaries with opt-in, revoke, and no caregiver auto-access."
  },
];

export function getCriticalSosGaps() {
  return pantavionSosGapLedger.filter((gap) => gap.priority === "critical");
}

export function getReadyNextSosGaps() {
  return pantavionSosGapLedger.filter((gap) => gap.status === "ready-next");
}

