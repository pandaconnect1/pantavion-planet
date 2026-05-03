
export type PantavionActionState =
  | "worksNow"
  | "opensRoute"
  | "needsPermission"
  | "needsSetup"
  | "needsContact"
  | "needsInstitution"
  | "comingSoon"
  | "disabled";

export type PantavionActionSpec = {
  id: string;
  label: string;
  state: PantavionActionState;
  href?: string;
  permission?: "location" | "camera" | "microphone" | "contacts" | "notifications";
  institutionRequired?: boolean;
  explanation: {
    el: string;
    en: string;
  };
};

export const actionStateLabels: Record<PantavionActionState, { el: string; en: string }> = {
  worksNow: { el: "Λειτουργεί τώρα", en: "Works now" },
  opensRoute: { el: "Ανοίγει πραγματική σελίδα", en: "Opens real page" },
  needsPermission: { el: "Χρειάζεται άδεια", en: "Needs permission" },
  needsSetup: { el: "Χρειάζεται ρύθμιση", en: "Needs setup" },
  needsContact: { el: "Χρειάζεται trusted contact", en: "Needs trusted contact" },
  needsInstitution: { el: "Χρειάζεται θεσμική συμφωνία", en: "Institution required" },
  comingSoon: { el: "Έρχεται σύντομα", en: "Coming soon" },
  disabled: { el: "Ανενεργό", en: "Disabled" },
};

export function explainActionState(state: PantavionActionState, lang = "el") {
  const text = actionStateLabels[state] ?? actionStateLabels.disabled;
  return lang === "el" ? text.el : text.en;
}

export function isActionAllowedNow(action: PantavionActionSpec): boolean {
  return action.state === "worksNow" || action.state === "opensRoute" || action.state === "needsPermission";
}

export const pantavionButtonLaw = {
  el: "Κάθε κουμπί πρέπει να λειτουργεί, να ανοίγει πραγματική σελίδα, να ζητά άδεια, να εξηγεί τι λείπει ή να είναι καθαρά ανενεργό.",
  en: "Every button must work, open a real route, request permission, explain what is missing, or be clearly disabled.",
} as const;
