export type PantavionContinuitySource =
  | "conversation-thread"
  | "github-commit"
  | "github-file"
  | "audit-log"
  | "product-ledger"
  | "uploaded-file"
  | "manual-founder-note"
  | "future-database-record";

export type PantavionContinuityStatus =
  | "implemented-now"
  | "ready-next"
  | "blocked-connector"
  | "blocked-auth"
  | "blocked-database"
  | "blocked-privacy"
  | "blocked-cost";

export type PantavionContinuityRule = {
  id: string;
  title: string;
  greekRule: string;
  sourceTypes: PantavionContinuitySource[];
  status: PantavionContinuityStatus;
  whatItPrevents: string[];
  implementationRule: string;
  blockedUntil?: string[];
};

export const PANTAVION_CONTINUITY_THREAD_MEMORY_VERSION = "1.0.0";

export const PANTAVION_CONTINUITY_GREEK_REMINDER =
  "Το Pantavion δεν πρέπει να λειτουργεί σαν αποκομμένα νήματα που ξεχνιούνται. Κάθε ενότητα χρειάζεται μνήμη, ροή, συνέχεια, έλεγχο, σχετικές πηγές και καθαρό λόγο για το τι μένει πίσω.";

export const pantavionContinuityThreadMemoryRules: PantavionContinuityRule[] = [
  {
    id: "topic-thread-retrieval",
    title: "Retrieve related threads and records by topic",
    greekRule:
      "Όταν δουλεύουμε σε ένα θέμα, το Pantavion πρέπει να μπορεί να βρίσκει σχετικά νήματα, commits, αρχεία, ledgers και notes που συνδέονται με το ίδιο θέμα.",
    sourceTypes: [
      "conversation-thread",
      "github-commit",
      "github-file",
      "product-ledger",
      "manual-founder-note",
    ],
    status: "ready-next",
    whatItPrevents: [
      "lost decisions",
      "repeated architecture from zero",
      "missing language requirements",
      "forgotten protected-user rules",
      "forgotten provider/legal blockers",
    ],
    implementationRule:
      "Create topic keys and retrieval hooks before every major Pantavion patch: SOS, language, protected users, AI, auth, payments, marketplace, media and kernel.",
    blockedUntil: [
      "real source connectors are enabled",
      "database-backed memory exists",
      "privacy and founder-control policy exists",
    ],
  },
  {
    id: "continuity-before-build",
    title: "Continuity check before implementation",
    greekRule:
      "Πριν χτιστεί νέο feature, πρέπει να γίνεται έλεγχος: τι είπαμε, τι υλοποιήθηκε, τι έμεινε πίσω, ποια αρχεία επηρεάζονται και ποιο audit το φυλάει.",
    sourceTypes: ["github-commit", "github-file", "audit-log", "product-ledger"],
    status: "implemented-now",
    whatItPrevents: [
      "half patches",
      "dead buttons",
      "missing audit checks",
      "missing language selector",
      "false claims",
    ],
    implementationRule:
      "Every patch should have repo status, build, audit, scoped add, commit and Actions verification.",
  },
  {
    id: "language-never-forgotten",
    title: "Language selection must be treated as global product memory",
    greekRule:
      "Η επιλογή γλώσσας δεν είναι μικρή λεπτομέρεια. Πρέπει να είναι global μνήμη σε κάθε κρίσιμη οθόνη: SOS, elder mode, interpreter, AI φίλος και onboarding.",
    sourceTypes: ["github-file", "audit-log", "product-ledger"],
    status: "implemented-now",
    whatItPrevents: [
      "Greek-only screens",
      "elder confusion",
      "broken international promise",
      "non-global localStorage keys",
    ],
    implementationRule:
      "Use a global language key and audit required language selector markers in critical routes.",
  },
  {
    id: "section-closeout-ledger",
    title: "Every section needs closeout memory",
    greekRule:
      "Κάθε ενότητα πρέπει να κλείνει με τι κλειδώθηκε, τι είναι live, τι είναι μόνο policy, τι μπλοκάρεται και τι θα κάνουμε μετά.",
    sourceTypes: ["product-ledger", "github-commit", "audit-log"],
    status: "ready-next",
    whatItPrevents: [
      "unclear product state",
      "confusing roadmap",
      "forgotten blockers",
      "repeating the same discussion",
    ],
    implementationRule:
      "Add section closeout records for SOS, protected users, AI, auth, payments, translation and kernel.",
    blockedUntil: ["database-backed project ledger", "admin dashboard"],
  },
  {
    id: "founder-approval-before-automation",
    title: "Founder approval before self-upgrade or execution",
    greekRule:
      "Ο AI/kernel μπορεί να βρίσκει λάθη, κενά και αναβαθμίσεις, αλλά δεν πρέπει να εκτελεί επικίνδυνες αλλαγές χωρίς ενημέρωση και έγκριση του founder.",
    sourceTypes: ["conversation-thread", "github-file", "audit-log"],
    status: "ready-next",
    whatItPrevents: [
      "unsafe autonomous changes",
      "provider-cost surprises",
      "legal exposure",
      "unreviewed emergency claims",
    ],
    implementationRule:
      "Future PantaAI/kernel proposals must generate a plan, risk, cost, affected files and founder approval gate before execution.",
    blockedUntil: ["PantaAI orchestrator", "admin approval workflow", "auth"],
  },
];

export const pantavionContinuityTopicKeys = [
  "sos",
  "elder-safe-mode",
  "protected-users",
  "minors",
  "accessibility",
  "language",
  "translation",
  "ai-companion",
  "kernel",
  "provider-roadmap",
  "satellite-connectivity",
  "auth-database",
  "payments",
  "marketplace",
  "legal-safety",
] as const;

export const pantavionThreadReaderFutureContract = {
  greekPurpose:
    "Να μπορεί το Pantavion/PantaAI να διαβάζει σχετικά νήματα και πηγές για το θέμα που δουλεύουμε, όταν ο founder έχει δώσει πρόσβαση και υπάρχει νόμιμη/τεχνική σύνδεση.",
  allowedSources: [
    "current conversation summary",
    "repo commits",
    "repo files",
    "audit ledgers",
    "uploaded founder documents",
    "future internal project database",
    "future connected docs/messages with user permission",
  ],
  boundaries: [
    "no hidden surveillance",
    "no reading private sources without permission",
    "no unsupported claims from old/deprecated threads",
    "must cite or summarize source basis in admin/founder view",
    "must mark uncertainty when thread evidence is incomplete",
  ],
  firstPracticalStep:
    "Keep continuity rules in code and audit now; later connect real retrieval through PantaAI/kernel and admin approval.",
} as const;

export function getPantavionContinuityRulesByStatus(
  status: PantavionContinuityStatus
) {
  return pantavionContinuityThreadMemoryRules.filter(
    (rule) => rule.status === status
  );
}

export function getPantavionContinuityRulesForTopic(topic: string) {
  const normalized = topic.toLowerCase();

  return pantavionContinuityThreadMemoryRules.filter((rule) => {
    const text = `${rule.id} ${rule.title} ${rule.greekRule}`.toLowerCase();
    return text.includes(normalized);
  });
}
