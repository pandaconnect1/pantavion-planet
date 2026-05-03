export const extremeSosDoctrine = {
  title: "Pantavion Extreme SOS Doctrine",
  mission:
    "Help a human prepare, signal, identify, translate, and reconnect under accidents, disasters, isolation, violence, war, and degraded or absent network conditions.",
  truthBoundary:
    "Pantavion does not claim guaranteed rescue, guaranteed radio transmission, satellite dispatch, police dispatch, ambulance dispatch, fire dispatch, maritime dispatch, or state emergency integration without certified hardware, provider support, and verified institutional agreements.",
  operatingLaw:
    "Phone-first. Trusted-contact-first. Offline-ready. Signal-opportunistic. Hardware-expandable. Satellite-aware. Institution-compatible. Truth-governed.",
} as const;

export const guardianUseCases = [
  {
    id: "travel",
    title: "Before travel",
    whenToUse:
      "Activate Guardian Mode before a trip, border crossing, remote drive, ferry, hiking route, or travel to a place where contacts may not know your exact plan.",
    whatHappens:
      "Pantavion stores your plan, deadline, trusted contacts, last known location, emergency profile, and creates an escalation timer if you miss check-in.",
  },
  {
    id: "car-accident",
    title: "Car accident",
    whenToUse:
      "Use before long drives, night drives, mountain roads, rural roads, bad weather, or unsafe areas.",
    whatHappens:
      "If you do not check in by the deadline, Pantavion can queue an SOS packet with last known location, emergency profile, contacts, and device state. A future native app can add crash/fall sensors and deeper background triggers.",
  },
  {
    id: "hunter-remote",
    title: "Hunter / remote terrain",
    whenToUse:
      "Use before hunting, forest travel, mountain travel, fields, caves, cliffs, isolated farm work, or areas with weak signal.",
    whatHappens:
      "Pantavion stores your plan and can trigger a missed-check-in SOS. If no signal exists, it keeps an offline queue and can show rescue QR, beacon, sound, flash, and evidence tools where the device allows.",
  },
  {
    id: "earthquake-disaster",
    title: "Earthquake / disaster / collapse",
    whenToUse:
      "Use during high-risk events, after warnings, or before entering damaged infrastructure.",
    whatHappens:
      "Pantavion prioritizes identity, language, medical data, last known location, offline queue, visible beacon, and rescue-readable information.",
  },
  {
    id: "war-risk",
    title: "War / civil unrest / danger area",
    whenToUse:
      "Use before moving through conflict, unrest, blackout, evacuation, or unsafe areas.",
    whatHappens:
      "Pantavion helps preserve a minimal survival identity, trusted contacts, route intent, local evidence capsule, and delayed dispatch when communication returns.",
  },
  {
    id: "sea-remote",
    title: "Sea / remote coast / boat",
    whenToUse:
      "Use before small boat travel, remote coast travel, fishing, island travel, or maritime work.",
    whatHappens:
      "Pantavion can help with profile, location, contacts, beacon, offline queue, and future satellite / maritime partner integrations. It is not an EPIRB without certified hardware.",
  },
] as const;

export const sosCapabilityTruth = [
  {
    layer: "Works now on normal phone/browser",
    items: [
      "Emergency profile",
      "Trusted contacts",
      "Location permission where available",
      "Call handler",
      "SMS handler",
      "Share packet",
      "Copy packet",
      "Download packet",
      "Offline local queue",
      "Visual beacon",
      "Audio alert",
      "Vibration where supported",
      "Guardian timer while page/PWA is active",
    ],
  },
  {
    layer: "Requires user permission",
    items: [
      "Location",
      "Camera",
      "Microphone",
      "Notifications",
      "Motion/sensor access where supported",
    ],
  },
  {
    layer: "Requires native app / OS support",
    items: [
      "Reliable background monitoring",
      "Crash/fall detection",
      "Lock-screen emergency shortcut",
      "Deep sensor access",
      "Long-running no-touch detection",
      "Background evidence capture under platform rules",
    ],
  },
  {
    layer: "Requires hardware / provider",
    items: [
      "Satellite messaging where the phone or device supports it",
      "LoRa / radio transmission",
      "406 MHz beacon / PLB / EPIRB / ELT",
      "Maritime or aviation certified distress hardware",
      "Wearable SOS band",
    ],
  },
  {
    layer: "Requires official agreement",
    items: [
      "Police dispatch",
      "Ambulance dispatch",
      "Fire service dispatch",
      "Civil protection dispatch",
      "Coast guard / maritime rescue dispatch",
      "Government emergency system integration",
      "Hospital / SAR dashboard integration",
    ],
  },
] as const;
