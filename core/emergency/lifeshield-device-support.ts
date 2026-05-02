export type PantavionDeviceClass =
  | "mobile-phone"
  | "tablet"
  | "desktop"
  | "laptop"
  | "wearable"
  | "vehicle-console"
  | "rescue-terminal"
  | "unknown";

export type PantavionDeviceCapability = {
  id: string;
  name: string;
  worksOn: PantavionDeviceClass[];
  browserDependent: boolean;
  osDependent: boolean;
  hardwareDependent: boolean;
  emergencyUse: string;
  truthBoundary: string;
};

export const pantavionUniversalDeviceDoctrine = {
  title: "Pantavion Universal Device Support",
  mission:
    "Pantavion must run first as a universal web and PWA emergency surface across phones, tablets, laptops, desktops, and rescue terminals.",
  rule:
    "Every emergency feature must degrade safely: if a device cannot support a function, Pantavion must show what works, what is limited, and what hardware or permission is required.",
  targetDevices: [
    "iPhone",
    "Android phone",
    "iPad",
    "Android tablet",
    "Windows tablet",
    "Windows laptop",
    "MacBook",
    "desktop browser",
    "public rescue terminal",
    "future wearable",
    "future vehicle console",
  ],
};

export const pantavionDeviceCapabilities: PantavionDeviceCapability[] = [
  {
    id: "responsive-emergency-ui",
    name: "Responsive Emergency UI",
    worksOn: ["mobile-phone", "tablet", "desktop", "laptop", "rescue-terminal"],
    browserDependent: false,
    osDependent: false,
    hardwareDependent: false,
    emergencyUse:
      "Shows emergency identity, SOS actions, safety doctrine, and rescue instructions on every screen size.",
    truthBoundary:
      "UI can run everywhere, but rescue transmission depends on network, OS permissions, and available hardware.",
  },
  {
    id: "pwa-install",
    name: "Installable PWA",
    worksOn: ["mobile-phone", "tablet", "desktop", "laptop"],
    browserDependent: true,
    osDependent: true,
    hardwareDependent: false,
    emergencyUse:
      "Allows Pantavion to be opened like an app from the device home screen where PWA install is supported.",
    truthBoundary:
      "PWA behavior differs across iOS, Android, Chrome, Edge, Safari, and desktop browsers.",
  },
  {
    id: "offline-emergency-cache",
    name: "Offline Emergency Cache",
    worksOn: ["mobile-phone", "tablet", "desktop", "laptop", "rescue-terminal"],
    browserDependent: true,
    osDependent: true,
    hardwareDependent: false,
    emergencyUse:
      "Keeps emergency profile, survival phrases, and last-known rescue context available when internet is weak or unavailable.",
    truthBoundary:
      "Offline cache requires prior loading, storage permission, and browser support. It cannot send messages without a signal path.",
  },
  {
    id: "local-screen-rescue-card",
    name: "Local Screen Rescue Card",
    worksOn: ["mobile-phone", "tablet", "desktop", "laptop", "rescue-terminal"],
    browserDependent: false,
    osDependent: false,
    hardwareDependent: false,
    emergencyUse:
      "Displays identity, language, medical basics, allergies, and trusted contacts for rescuers.",
    truthBoundary:
      "Requires the user to create and consent to emergency data in advance.",
  },
  {
    id: "qr-rescue-card",
    name: "QR Rescue Card",
    worksOn: ["mobile-phone", "tablet", "desktop", "laptop", "rescue-terminal"],
    browserDependent: false,
    osDependent: false,
    hardwareDependent: false,
    emergencyUse:
      "Lets another device scan emergency identity or rescue instructions.",
    truthBoundary:
      "QR is visual only. It does not transmit radio signals by itself.",
  },
  {
    id: "nfc-rescue-card",
    name: "NFC Rescue Card",
    worksOn: ["mobile-phone", "tablet"],
    browserDependent: true,
    osDependent: true,
    hardwareDependent: true,
    emergencyUse:
      "Can expose emergency identity through NFC where the device and OS permit it.",
    truthBoundary:
      "NFC support varies strongly by device, browser, OS, and permissions.",
  },
  {
    id: "flash-siren-haptic",
    name: "Flash, Siren, and Haptic Alert",
    worksOn: ["mobile-phone", "tablet"],
    browserDependent: true,
    osDependent: true,
    hardwareDependent: true,
    emergencyUse:
      "Helps rescuers notice a person nearby through light, sound, or vibration.",
    truthBoundary:
      "Flashlight, audio autoplay, vibration, and haptics depend on device APIs and user permissions.",
  },
  {
    id: "location-sharing",
    name: "Emergency Location Sharing",
    worksOn: ["mobile-phone", "tablet", "desktop", "laptop"],
    browserDependent: true,
    osDependent: true,
    hardwareDependent: true,
    emergencyUse:
      "Captures or displays last-known location when permission and hardware are available.",
    truthBoundary:
      "GPS/location is not guaranteed indoors, underground, underwater, under rubble, or without permission.",
  },
  {
    id: "bluetooth-nearby-discovery",
    name: "Bluetooth Nearby Discovery",
    worksOn: ["mobile-phone", "tablet", "desktop", "laptop"],
    browserDependent: true,
    osDependent: true,
    hardwareDependent: true,
    emergencyUse:
      "Future nearby-device rescue discovery where the OS and browser allow Bluetooth access.",
    truthBoundary:
      "Web Bluetooth/BLE availability differs by platform and may be blocked on some iOS/browser combinations.",
  },
  {
    id: "device-satellite-handoff",
    name: "Device Satellite Handoff",
    worksOn: ["mobile-phone"],
    browserDependent: false,
    osDependent: true,
    hardwareDependent: true,
    emergencyUse:
      "Hands the user toward native satellite SOS where supported by the phone and region.",
    truthBoundary:
      "Pantavion cannot create satellite hardware inside a phone. It can only guide or integrate where the device/provider supports it.",
  },
  {
    id: "external-rescue-hardware",
    name: "External Rescue Hardware",
    worksOn: ["mobile-phone", "tablet", "rescue-terminal"],
    browserDependent: true,
    osDependent: true,
    hardwareDependent: true,
    emergencyUse:
      "Connects future LoRa nodes, rescue gateways, maritime kits, mountain kits, and certified rescue devices.",
    truthBoundary:
      "LoRa, VHF, UHF, HF, EPIRB, PLB, ELT, GMDSS, and SAR integrations require certified hardware and legal authority.",
  },
];

export function getDeviceCapabilitiesFor(deviceClass: PantavionDeviceClass) {
  return pantavionDeviceCapabilities.filter((capability) =>
    capability.worksOn.includes(deviceClass)
  );
}
