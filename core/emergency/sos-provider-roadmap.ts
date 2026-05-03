export type SosProviderCategory =
  | "sms-provider"
  | "email-provider"
  | "push-provider"
  | "auth-database"
  | "dispatch-provider"
  | "satellite-provider"
  | "location-provider";

export type SosProviderReadiness =
  | "candidate"
  | "research-required"
  | "agreement-required"
  | "blocked-until-company"
  | "ready-after-keys";

export type SosProviderRoadmapItem = {
  id: string;
  category: SosProviderCategory;
  examples: string[];
  roleInPantavion: string;
  canStartNow: boolean;
  costRisk: "low" | "medium" | "high" | "enterprise";
  requiredBeforeActivation: string[];
  currentPantavionPosition: string;
};

export const pantavionSosProviderRoadmap: SosProviderRoadmapItem[] = [
  {
    id: "sms-trusted-contact-provider",
    category: "sms-provider",
    examples: ["Twilio", "Vonage", "MessageBird"],
    roleInPantavion:
      "Send SOS-only SMS alerts to 1-3 trusted contacts when Founder enables provider keys and cost caps.",
    canStartNow: true,
    costRisk: "medium",
    requiredBeforeActivation: [
      "Provider account",
      "Vercel environment secrets",
      "SOS-only consent policy",
      "daily spend cap",
      "per-user rate limit",
      "delivery logs",
      "abuse protection"
    ],
    currentPantavionPosition:
      "Browser SMS links exist now. Backend SMS is next, disabled by default until provider keys and Founder approval exist."
  },
  {
    id: "email-alert-provider",
    category: "email-provider",
    examples: ["Resend", "SendGrid", "Postmark"],
    roleInPantavion:
      "Send low-cost SOS email fallback and Founder/internal emergency notifications.",
    canStartNow: true,
    costRisk: "low",
    requiredBeforeActivation: [
      "Provider account",
      "sender/domain verification",
      "environment secrets",
      "anti-abuse limits",
      "delivery logs"
    ],
    currentPantavionPosition:
      "mailto links exist now. Backend email can be added before SMS or together with SMS."
  },
  {
    id: "push-provider",
    category: "push-provider",
    examples: ["Firebase Cloud Messaging", "Web Push"],
    roleInPantavion:
      "Alert Pantavion users and trusted contacts who have installed/enabled Pantavion PWA/app notifications.",
    canStartNow: false,
    costRisk: "low",
    requiredBeforeActivation: [
      "real user accounts",
      "device token registry",
      "notification permission UX",
      "unsubscribe/revoke flow",
      "abuse protection"
    ],
    currentPantavionPosition:
      "Good near-future layer after auth/database and trusted contact acceptance."
  },
  {
    id: "auth-database-provider",
    category: "auth-database",
    examples: ["Supabase", "Firebase", "Clerk plus database"],
    roleInPantavion:
      "Create real user accounts, count registered users, sync SOS profiles, support verified invites and admin dashboard.",
    canStartNow: true,
    costRisk: "medium",
    requiredBeforeActivation: [
      "provider decision",
      "schema",
      "privacy terms",
      "age-role policy",
      "admin access rules",
      "backup/export plan"
    ],
    currentPantavionPosition:
      "Required before real registered user counts, verified invites, cloud SOS profile and push notifications."
  },
  {
    id: "dispatch-provider",
    category: "dispatch-provider",
    examples: ["Noonlight-style dispatch partner", "country-specific monitoring center"],
    roleInPantavion:
      "Future official emergency escalation through authorized human/provider workflows.",
    canStartNow: false,
    costRisk: "enterprise",
    requiredBeforeActivation: [
      "company/legal entity",
      "provider agreement",
      "country coverage",
      "insurance",
      "incident process",
      "human review",
      "legal approval"
    ],
    currentPantavionPosition:
      "Tracked as future partnership. Pantavion must not claim official authority dispatch before agreement."
  },
  {
    id: "satellite-connectivity-provider",
    category: "satellite-provider",
    examples: ["Starlink/business connectivity", "satellite communicator ecosystem", "mobile operator direct-to-cell partnerships"],
    roleInPantavion:
      "Future off-grid or remote-area connectivity path where compatible hardware, network and legal coverage exist.",
    canStartNow: false,
    costRisk: "enterprise",
    requiredBeforeActivation: [
      "provider agreement",
      "hardware or mobile operator path",
      "country legality",
      "subscription model",
      "emergency response path",
      "liability review"
    ],
    currentPantavionPosition:
      "Pantavion can run over any available internet today and keeps offline packets locally, but no satellite-rescue guarantee is claimed."
  },
  {
    id: "location-provider",
    category: "location-provider",
    examples: ["Google Maps links", "future precise-location adapters"],
    roleInPantavion:
      "Represent SOS location in multiple formats: GPS, map links, future precise addressing and offline display.",
    canStartNow: true,
    costRisk: "low",
    requiredBeforeActivation: [
      "browser location permission",
      "fallback when permission denied",
      "privacy language",
      "provider terms review for advanced APIs"
    ],
    currentPantavionPosition:
      "Basic GPS and map-link pattern exists; future adapters can be added after provider review."
  }
];

export function getProvidersThatCanStartNow() {
  return pantavionSosProviderRoadmap.filter((provider) => provider.canStartNow);
}

