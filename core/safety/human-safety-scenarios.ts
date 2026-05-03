
import type { PantavionActionState } from "@/core/actions/pantavion-action-state";
import type { PantavionAgeBand } from "@/core/identity/age-role-engine";

export type HumanSafetyScenario = {
  id: string;
  category:
    | "minor"
    | "elder"
    | "violence"
    | "robbery"
    | "bullying"
    | "medical"
    | "travel"
    | "offgrid"
    | "home"
    | "disaster";
  title: { el: string; en: string };
  description: { el: string; en: string };
  primaryAction: PantavionActionState;
  trustedContactFirst: boolean;
  silentOption: boolean;
  audience: PantavionAgeBand[];
};

export const humanSafetyScenarios: HumanSafetyScenario[] = [
  {
    id: "child-afraid",
    category: "minor",
    title: { el: "Παιδί: Φοβάμαι", en: "Child: I am afraid" },
    description: {
      el: "Απλό SOS για ανήλικο με γονέα/κηδεμόνα και trusted contacts πρώτα.",
      en: "Simple minor SOS with guardian and trusted contacts first.",
    },
    primaryAction: "needsSetup",
    trustedContactFirst: true,
    silentOption: true,
    audience: ["guardianManagedChild", "child", "youngTeen", "olderTeen"],
  },
  {
    id: "bullying-threat",
    category: "bullying",
    title: { el: "Bullying / απειλή", en: "Bullying / threat" },
    description: {
      el: "Ασφαλής ειδοποίηση trusted adult χωρίς περίπλοκη διαδικασία.",
      en: "Safe trusted-adult alert without a complicated process.",
    },
    primaryAction: "needsContact",
    trustedContactFirst: true,
    silentOption: true,
    audience: ["child", "youngTeen", "olderTeen"],
  },
  {
    id: "elder-fall",
    category: "elder",
    title: { el: "Ηλικιωμένος: Έπεσα", en: "Elder: I fell" },
    description: {
      el: "Μεγάλα κουμπιά, οικογένεια πρώτη, δυνατότητα SOS χωρίς πολλά βήματα.",
      en: "Large buttons, family first, SOS without many steps.",
    },
    primaryAction: "needsContact",
    trustedContactFirst: true,
    silentOption: false,
    audience: ["elderOptional"],
  },
  {
    id: "silent-violence",
    category: "violence",
    title: { el: "Silent SOS για βία", en: "Silent SOS for violence" },
    description: {
      el: "Σιωπηλό SOS όταν ο χρήστης δεν μπορεί ή δεν πρέπει να μιλήσει.",
      en: "Silent SOS when the user cannot or should not speak.",
    },
    primaryAction: "needsContact",
    trustedContactFirst: true,
    silentOption: true,
    audience: ["youngTeen", "olderTeen", "adult", "elderOptional"],
  },
  {
    id: "home-robbery",
    category: "robbery",
    title: { el: "Ληστεία / εισβολή", en: "Robbery / intrusion" },
    description: {
      el: "Προτεραιότητα σε σιωπηλή ειδοποίηση και τελευταία γνωστή τοποθεσία.",
      en: "Prioritizes silent alert and last known location.",
    },
    primaryAction: "needsContact",
    trustedContactFirst: true,
    silentOption: true,
    audience: ["adult", "elderOptional", "olderTeen"],
  },
  {
    id: "remote-no-signal",
    category: "offgrid",
    title: { el: "Χωρίς σήμα / απομόνωση", en: "No signal / isolation" },
    description: {
      el: "Offline queue, emergency profile και αποστολή όταν επιστρέψει σύνδεση.",
      en: "Offline queue, emergency profile and send when connection returns.",
    },
    primaryAction: "worksNow",
    trustedContactFirst: true,
    silentOption: false,
    audience: ["adult", "olderTeen", "elderOptional"],
  },
  {
    id: "earthquake-collapse",
    category: "disaster",
    title: { el: "Σεισμός / κατάρρευση", en: "Earthquake / collapse" },
    description: {
      el: "Γρήγορη ταυτότητα ανάγκης, φράσεις βοήθειας και τελευταία γνωστή τοποθεσία.",
      en: "Fast emergency identity, help phrases and last known location.",
    },
    primaryAction: "worksNow",
    trustedContactFirst: true,
    silentOption: false,
    audience: ["child", "youngTeen", "olderTeen", "adult", "elderOptional"],
  },
];

export function getHumanSafetyScenariosForAgeBand(ageBand: PantavionAgeBand) {
  return humanSafetyScenarios.filter((scenario) => scenario.audience.includes(ageBand));
}
