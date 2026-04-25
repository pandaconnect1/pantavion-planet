export const abuseReportingFlows = {
  id: "abuse-reporting-flows",
  title: "Abuse and Reporting Flows",
  status: "foundation",
  priority: "critical",
  summary:
    "Pantavion needs report, block, review, escalation and appeal flows across social, marketplace, media, adult restricted, minors and AI execution.",
  gates: [
    "Report button required for user-generated content.",
    "Block user required for messaging/social.",
    "Marketplace scam/fraud report required.",
    "Adult restricted abuse report required before any adult launch.",
    "Minors safety escalation required.",
    "Copyright takedown path required.",
    "Impersonation report required.",
    "Emergency harm escalation required.",
    "Appeal and correction path required.",
    "Audit log required for enforcement actions."
  ],
  reportTypes: [
    "abuse",
    "harassment",
    "minor safety",
    "illegal content",
    "scam/fraud",
    "copyright",
    "impersonation",
    "non-consensual media",
    "health/finance misinformation",
    "marketplace prohibited item",
    "emergency/public alert abuse"
  ]
} as const;
