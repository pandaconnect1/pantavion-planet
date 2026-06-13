export type ChinaSuperAppCapability = {
  id: string;
  sourceSignal: string;
  westernComparison: string;
  chinesePattern: string;
  pantavionKernel: string;
  pantavionOwnedExecution: string[];
  legalBoundary: string[];
};

export const CHINA_SUPERAPP_CAPABILITY_MAP: ChinaSuperAppCapability[] = [
  {
    id: "wechat_superapp",
    sourceSignal: "WeChat",
    westernComparison: "WhatsApp / Messenger / services / wallet",
    chinesePattern:
      "One app combines messaging, identity, payments, mini-programs, groups, public accounts, commerce and services.",
    pantavionKernel: "communication_identity_services_kernel",
    pantavionOwnedExecution: [
      "Universal communication hub",
      "Mini capability surfaces inside Pantavion",
      "Service marketplace",
      "Wallet/payment abstraction through compliant providers",
      "Profile and identity-scoped permissions",
    ],
    legalBoundary: [
      "No copying UI or brand",
      "No hidden data harvesting",
      "Region-specific payment and privacy compliance",
    ],
  },
  {
    id: "weibo_public_pulse",
    sourceSignal: "Weibo",
    westernComparison: "X / Twitter",
    chinesePattern:
      "Public posting, trends, hashtags, social broadcasting and public discussion.",
    pantavionKernel: "planet_pulse_kernel",
    pantavionOwnedExecution: [
      "Planet Pulse",
      "Public posts",
      "Trend graph",
      "Moderation lanes",
      "Civic and culture-aware feeds",
    ],
    legalBoundary: ["Moderation", "Defamation controls", "Misinformation controls"],
  },
  {
    id: "rednote_discovery_commerce",
    sourceSignal: "RedNote",
    westernComparison: "Instagram / Pinterest / lifestyle commerce",
    chinesePattern:
      "Creator lifestyle posts, discovery, reviews, social shopping and recommendations.",
    pantavionKernel: "culture_creator_commerce_kernel",
    pantavionOwnedExecution: [
      "Local culture discovery",
      "Creator posts",
      "Product/service recommendations",
      "Travel/city guides",
      "Affiliate disclosure controls",
    ],
    legalBoundary: ["Ad disclosure", "Consumer protection", "Content moderation"],
  },
  {
    id: "qq_groups_identity",
    sourceSignal: "QQ",
    westernComparison: "Messenger / Discord / communities",
    chinesePattern: "Messaging, groups, profiles, entertainment and community identity.",
    pantavionKernel: "community_identity_kernel",
    pantavionOwnedExecution: [
      "Groups",
      "Community rooms",
      "Role-based identity",
      "Age-safe spaces",
      "Translation inside chat",
    ],
    legalBoundary: ["Minor safety", "Privacy", "Anti-abuse"],
  },
  {
    id: "qzone_profile_worlds",
    sourceSignal: "Qzone",
    westernComparison: "Facebook profile / personal page",
    chinesePattern: "Personal profile spaces, posts, albums and social updates.",
    pantavionKernel: "personal_world_kernel",
    pantavionOwnedExecution: [
      "Personal world/profile",
      "Albums",
      "Stories",
      "Relationship-based visibility",
      "Profile memory",
    ],
    legalBoundary: ["Consent", "Privacy", "User control"],
  },
  {
    id: "bilibili_media_learning",
    sourceSignal: "Bilibili",
    westernComparison: "YouTube / learning communities",
    chinesePattern: "Video platform with communities, education, entertainment and fandom.",
    pantavionKernel: "media_learning_kernel",
    pantavionOwnedExecution: [
      "Video channels",
      "Learning videos",
      "Creator communities",
      "Subtitles and translation",
      "Knowledge-to-income paths",
    ],
    legalBoundary: ["Copyright", "Creator rights", "Age suitability"],
  },
  {
    id: "alipay_wallet_services",
    sourceSignal: "Alipay",
    westernComparison: "PayPal / wallet / merchant services",
    chinesePattern: "Wallet, payments, merchant tools, financial services and service access.",
    pantavionKernel: "payments_compliance_kernel",
    pantavionOwnedExecution: [
      "Payment abstraction",
      "Invoices",
      "Merchant access",
      "Subscriptions",
      "Compliance-ready payment provider routing",
    ],
    legalBoundary: ["KYC/AML", "Tax", "Merchant-of-record", "No financial guarantees"],
  },
  {
    id: "baidu_search_ai",
    sourceSignal: "Baidu",
    westernComparison: "Google / search / maps / AI",
    chinesePattern: "Search, AI, maps, cloud and local knowledge.",
    pantavionKernel: "search_research_kernel",
    pantavionOwnedExecution: [
      "Source Atlas",
      "Regional search",
      "Knowledge graph",
      "AI research",
      "Citation ranking",
    ],
    legalBoundary: ["Source licensing", "Search compliance", "Privacy"],
  },
  {
    id: "amap_navigation_local",
    sourceSignal: "AMAP",
    westernComparison: "Google Maps",
    chinesePattern: "Navigation, maps, local POI, routing and mobility.",
    pantavionKernel: "maps_field_kernel",
    pantavionOwnedExecution: [
      "Maps",
      "Routing",
      "Local places",
      "Field assistant",
      "Water/infrastructure protected map lanes",
    ],
    legalBoundary: ["Location consent", "Sensitive infrastructure protection"],
  },
  {
    id: "didi_mobility",
    sourceSignal: "Didi",
    westernComparison: "Uber",
    chinesePattern: "Ride hailing and mobility services.",
    pantavionKernel: "mobility_services_kernel",
    pantavionOwnedExecution: [
      "Service matching",
      "Transport request",
      "Driver/provider verification",
      "Local mobility workflows",
    ],
    legalBoundary: ["Licensing", "Insurance", "Identity", "Payments"],
  },
  {
    id: "dianping_local_reviews",
    sourceSignal: "Dianping",
    westernComparison: "Yelp",
    chinesePattern: "Local business discovery, ratings, reviews and city commerce.",
    pantavionKernel: "local_services_kernel",
    pantavionOwnedExecution: [
      "Local directory",
      "Ratings",
      "Bookings",
      "City discovery",
      "Service reputation",
    ],
    legalBoundary: ["Review abuse", "Consumer protection", "Business claims"],
  },
  {
    id: "douyin_short_video",
    sourceSignal: "Douyin",
    westernComparison: "TikTok",
    chinesePattern: "Short video, creator feed, recommendations, commerce and live culture.",
    pantavionKernel: "short_video_creator_kernel",
    pantavionOwnedExecution: [
      "Short video",
      "Creator feed",
      "AI captions",
      "Translation",
      "Creator commerce with disclosure",
    ],
    legalBoundary: ["Minors", "Copyright", "Moderation", "Ad disclosure"],
  },
  {
    id: "tantan_safe_matching",
    sourceSignal: "Tantan",
    westernComparison: "Tinder",
    chinesePattern: "Dating and social matching.",
    pantavionKernel: "relationship_safety_kernel",
    pantavionOwnedExecution: [
      "Age-gated matching",
      "Consent-first interaction",
      "Safety reports",
      "Identity verification",
    ],
    legalBoundary: ["18+ gates where required", "Consent", "Anti-harassment", "Jurisdiction"],
  },
];

export const pantavion_china_superapp_marker_v1 =
  "pantavion_china_superapp_capability_map_c1_v1";
