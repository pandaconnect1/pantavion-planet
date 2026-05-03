export const institutionalEmergencyPartnership = {
  title: "Pantavion Institutional Emergency Partnership Gateway",
  currentMode:
    "Pantavion currently supports personal emergency preparation, trusted contacts, local SOS actions, offline queue, multilingual identity, and rescue-readable data.",
  futureMode:
    "Official dispatch or state/institutional routing will only operate after verified legal agreements, technical integration, audit rules, consent controls, and jurisdiction approval.",
  invitation:
    "Countries, municipalities, public emergency services, civil protection agencies, rescue teams, humanitarian organizations, telecom providers, satellite providers, certified beacon providers, hospitals, and NGOs may request official integration review.",
  hardBoundary:
    "Pantavion does not dispatch police, ambulance, fire, maritime, aviation, military, or state emergency services unless a verified institutional agreement and technical integration exist.",
} as const;

export const partnerTypes = [
  "Country / government agency",
  "Municipality / city authority",
  "Police service",
  "Fire service",
  "Ambulance / EMS",
  "Civil protection",
  "Coast guard / maritime rescue",
  "Mountain rescue / SAR",
  "Hospital / health system",
  "Humanitarian organization / NGO",
  "Telecom provider",
  "Satellite provider",
  "Certified beacon / rescue hardware provider",
  "University / research institution",
] as const;
