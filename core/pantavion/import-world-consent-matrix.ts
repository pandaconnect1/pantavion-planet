export const importWorldConsentMatrix = {
  id: "import-world-consent-matrix",
  title: "Pantavion Import World Consent and Connector Matrix",
  status: "mandatory-deep-audit-foundation",
  priority: "critical",
  summary:
    "Pantavion may help users bring their contacts, messages and digital world together only through lawful consent, exports, APIs, OAuth, device permissions or official connectors.",
  sources: [
    {
      source: "device_contacts",
      allowedPath: "explicit_device_permission",
      status: "allowed_with_consent",
      blocked: "silent harvesting"
    },
    {
      source: "csv_vcard",
      allowedPath: "user_uploaded_file",
      status: "allowed_with_user_action",
      blocked: "uploading other people's data without rights"
    },
    {
      source: "email",
      allowedPath: "OAuth with limited scopes",
      status: "future_connector",
      blocked: "password collection or unrestricted mailbox access"
    },
    {
      source: "sms_mms",
      allowedPath: "OS-permitted export or permission where lawful",
      status: "restricted_by_platform_and_law",
      blocked: "silent extraction"
    },
    {
      source: "whatsapp_viber_telegram_signal_line_wechat",
      allowedPath: "official API, user export or partner connector where allowed",
      status: "official_or_export_only",
      blocked: "scraping, password collection, bypassing platform rules"
    },
    {
      source: "social_profiles",
      allowedPath: "public handle entry or official OAuth where allowed",
      status: "limited",
      blocked: "credential capture or private scraping"
    },
    {
      source: "business_contacts",
      allowedPath: "CSV/import with lawful basis and consent/accountability",
      status: "allowed_with_policy",
      blocked: "spam invitations or undisclosed marketing use"
    }
  ],
  consentRequirements: [
    "clear import purpose",
    "explicit user action",
    "scope explanation",
    "delete/disconnect option",
    "export/delete rights",
    "third-party rights warning",
    "no hidden harvesting",
    "no password collection"
  ],
  gates: [
    "No import feature without consent copy.",
    "No third-party message import without official path.",
    "No contact invites without opt-in and anti-spam rules.",
    "No background sync without clear settings.",
    "No growth campaign using imported contacts without explicit permission."
  ],
  motto:
    "Bring your world legally. No scraping. No tricks. No hidden harvesting."
} as const;
