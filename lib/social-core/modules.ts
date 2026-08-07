import type { SocialCoreModule } from "./contracts";

export const SOCIAL_CORE_MODULES: readonly SocialCoreModule[] = [
  { id: "identity", name: "Universal Identity", capabilities: [] },
  { id: "relationships", name: "Relationship Graph", capabilities: ["relationships.connect"] },
  { id: "feed", name: "Social Feed", capabilities: ["social.feed.read", "social.post.create", "social.story.create", "social.live.create"] },
  { id: "communities", name: "Communities & Groups", capabilities: ["communities.join", "communities.create"] },
  { id: "secure-circles", name: "Secure Circles", capabilities: ["circles.secure.create", "circles.secure.join"] },
  { id: "messaging", name: "Unified Inbox", capabilities: ["messaging.direct", "messaging.group"] },
  { id: "voice-video", name: "Voice & Video", capabilities: ["calling.voice", "calling.video"] },
  { id: "dating", name: "Adult Dating", capabilities: ["dating.discover", "dating.match"] },
  { id: "teen-world", name: "Teen World", capabilities: [] },
  { id: "search", name: "Universal Search", capabilities: ["search.global", "nearby.discover"] },
  { id: "contacts-migration", name: "Contacts & Migration", capabilities: ["contacts.import", "messages.import"] },
  { id: "translation", name: "Universal Translation", capabilities: [] },
  { id: "ai", name: "Pantavion AI", capabilities: [] },
  { id: "business", name: "Business Social", capabilities: ["business.manage"] },
  { id: "events", name: "Events", capabilities: ["events.create", "events.join"] },
  { id: "marketplace", name: "Marketplace", capabilities: ["marketplace.buy", "marketplace.sell"] },
  { id: "ads-center", name: "Pantavion Ads Center", capabilities: ["ads.create", "ads.manage", "ads.purchase"] },
  { id: "trust-safety", name: "Trust & Safety", capabilities: [] },
  { id: "governance", name: "Policy & Governance", capabilities: [] },
] as const;

export function getSocialCoreModule(id: SocialCoreModule["id"]): SocialCoreModule {
  const module = SOCIAL_CORE_MODULES.find((entry) => entry.id === id);
  if (!module) throw new Error(`Unknown Pantavion Social Core module: ${id}`);
  return module;
}
