export const marketplaceTaxonomy = {
  id: "marketplace-taxonomy",
  title: "Pantavion Marketplace Taxonomy",
  status: "foundation",
  priority: "critical",
  summary:
    "Pantavion Market must become a global commercial surface: classified listings, services, business pages, local economy and non-intrusive paid visibility.",
  gates: [
    "No intrusive ads inside private messages or protected youth areas.",
    "Every sponsored placement must be labeled.",
    "Every listing must have lifecycle state: active, sold, rented, paused, closed, expired, under review.",
    "Country, region, city, parish/neighborhood and category must be supported.",
    "Illegal goods, scams, fake income claims and unsafe health/finance claims are prohibited.",
    "Seller and trader rules must be prepared before marketplace scale."
  ],
  geography: ["continent", "country", "region/state/province", "district/county", "city/municipality", "community/village", "parish/neighborhood", "category", "subcategory"],
  categories: [
    "For sale",
    "For rent",
    "Wanted",
    "Services",
    "Jobs",
    "Business",
    "Property",
    "Vehicles",
    "Tourism",
    "Events",
    "Education",
    "Digital services",
    "AI services",
    "Media promotion",
    "Professional profiles"
  ]
} as const;
