export type PantaAIPublicSurfaceKey =
  | 'ask'
  | 'research'
  | 'write'
  | 'build'
  | 'create'
  | 'learn'
  | 'work'
  | 'memory'
  | 'voice-translate'
  | 'data-analysis'
  | 'design-media'
  | 'automation'
  | 'business-strategy'
  | 'safe-health-knowledge'
  | 'finance-aware-guidance'
  | 'security-defense';

export type PantaAIAccessMode =
  | 'public'
  | 'signed-in'
  | 'verified'
  | 'professional'
  | 'admin-only'
  | 'restricted';

export type PantaAITruthMode =
  | 'generative'
  | 'verified'
  | 'deterministic'
  | 'mixed';

export interface PantaAITaskExample {
  title: string;
  explanation: string;
  userCanAsk: string[];
  expectedResult: string;
}

export interface PantaAISafetyBoundary {
  title: string;
  explanation: string;
  accessMode: PantaAIAccessMode;
}

export interface PantaAIPublicSurfaceCard {
  key: PantaAIPublicSurfaceKey;
  title: string;
  subtitle: string;
  publicExplanation: string;
  whatItDoes: string[];
  whenToUseIt: string[];
  taskExamples: PantaAITaskExample[];
  internalCapabilityFamilies: string[];
  truthMode: PantaAITruthMode;
  accessMode: PantaAIAccessMode;
  safetyBoundaries: PantaAISafetyBoundary[];
}

export interface PantaAIPublicSurfaceSpec {
  title: string;
  subtitle: string;
  mission: string;
  publicDoctrine: string[];
  legalCapabilityDoctrine: string[];
  cards: PantaAIPublicSurfaceCard[];
}

export const PANTA_AI_PUBLIC_SURFACE_SPEC: PantaAIPublicSurfaceSpec = {
  title: 'PantaAI Center',
  subtitle:
    'Ένα ενιαίο κέντρο έξυπνων δυνατοτήτων για έρευνα, δημιουργία, εργασία, μάθηση, μετάφραση, μνήμη, ανάλυση και εκτέλεση.',
  mission:
    'Το PantaAI Center δεν εκθέτει χαοτική λίστα εργαλείων. Μεταφράζει την ανάγκη του χρήστη σε οργανωμένες Pantavion εργασίες, capabilities, workflows και ασφαλή αποτελέσματα.',
  publicDoctrine: [
    'Ο χρήστης βλέπει καθαρές ενότητες εργασίας, όχι άναρχο tool zoo.',
    'Οι δυνατότητες των παγκόσμιων AI, research, design, productivity και automation ecosystems απορροφώνται ως capability families με νόμιμο, ασφαλή και Pantavion-native τρόπο.',
    'Το Pantavion δεν αντιγράφει ανταγωνιστές. Μελετά τα δυνατά τους σημεία, αποφεύγει τα μειονεκτήματα και μετατρέπει τις underlying δυνατότητες σε ενιαία governed εμπειρία.',
    'Κάθε κουμπί πρέπει να εξηγεί τι κάνει, πότε χρησιμοποιείται, τι μπορεί να ζητήσει ο χρήστης και τι αποτέλεσμα θα πάρει.',
    'Οι public surfaces μένουν απλές, αλλά όχι φτωχές. Η εσωτερική πολυπλοκότητα μεταφέρεται από τον Prime Kernel.',
  ],
  legalCapabilityDoctrine: [
    'External tools and brands are treated as market references, benchmark signals or possible legal integrations, not as copied products.',
    'Where official APIs, partnerships, licenses or user-authorized connectors exist, Pantavion may route through lawful integration paths.',
    'Where no integration exists, Pantavion builds its own original capability inspired by the underlying user need, not by copying proprietary implementation.',
    'User data, memory, files and execution traces remain governed by Pantavion identity, consent, privacy, audit and retention policy.',
    'Security, cyber, health, finance and legal-sensitive capabilities require stronger boundaries, review, disclaimers or restricted/admin-only treatment.',
  ],
  cards: [
    {
      key: 'ask',
      title: 'Ask',
      subtitle: 'Ρώτα, εξήγησε, σύγκρινε, κατανόησε.',
      publicExplanation:
        'Ο χρήστης μπορεί να ρωτήσει οτιδήποτε και το PantaAI αποφασίζει αν χρειάζεται απλή απάντηση, βαθιά ανάλυση, verified research ή παραπομπή σε άλλο workspace.',
      whatItDoes: [
        'Καταλαβαίνει πρόθεση, όχι μόνο λέξεις.',
        'Δίνει απαντήσεις με σωστό βάθος ανά περίπτωση.',
        'Χωρίζει deterministic, verified και generative περιεχόμενο.',
        'Εξηγεί αβεβαιότητα όταν δεν υπάρχει πλήρης βεβαιότητα.',
      ],
      whenToUseIt: [
        'Όταν ο χρήστης θέλει άμεση απάντηση.',
        'Όταν χρειάζεται σύγκριση επιλογών.',
        'Όταν δεν ξέρει ποια ενότητα του Pantavion να χρησιμοποιήσει.',
      ],
      taskExamples: [
        {
          title: 'Εξήγηση θέματος',
          explanation: 'Μετατρέπει δύσκολο θέμα σε καθαρή, απλή ή επαγγελματική εξήγηση.',
          userCanAsk: [
            'Εξήγησέ μου αυτό απλά.',
            'Σύγκρινε αυτές τις δύο επιλογές.',
            'Πες μου τι σημαίνει αυτό για το Pantavion.',
          ],
          expectedResult: 'Καθαρή απάντηση, με συμπέρασμα και επόμενο βήμα.',
        },
      ],
      internalCapabilityFamilies: [
        'intent-resolution',
        'answer-strategy',
        'truth-zone-routing',
        'memory-aware-response',
      ],
      truthMode: 'mixed',
      accessMode: 'public',
      safetyBoundaries: [
        {
          title: 'Truth boundary',
          explanation:
            'Το PantaAI δεν παρουσιάζει generative απάντηση ως βέβαιη αλήθεια.',
          accessMode: 'public',
        },
      ],
    },
    {
      key: 'research',
      title: 'Research',
      subtitle: 'Βαθιά έρευνα, πηγές, σύγκριση και τεκμηρίωση.',
      publicExplanation:
        'Ενότητα για χρήστες που θέλουν σοβαρή έρευνα, όχι επιφανειακή απάντηση. Μπορεί να χρησιμοποιηθεί για αγορά, στρατηγική, τεχνολογία, σπουδές, αγορά εργασίας και διεθνή σύγκριση.',
      whatItDoes: [
        'Συλλέγει και οργανώνει πληροφορίες.',
        'Συγκρίνει πηγές και claims.',
        'Παράγει executive summary, report ή decision brief.',
        'Χωρίζει verified facts από εκτιμήσεις.',
      ],
      whenToUseIt: [
        'Όταν η ακρίβεια είναι κρίσιμη.',
        'Όταν χρειάζονται citations ή source review.',
        'Όταν πρέπει να συγκριθούν εταιρείες, τεχνολογίες ή αγορές.',
      ],
      taskExamples: [
        {
          title: 'Market intelligence',
          explanation:
            'Μελετά τι κάνουν παγκόσμιοι παίκτες όπως Google, Apple, Meta, OpenAI, Microsoft, X, Opera, Κίνα, Ινδία, Ρωσία και άλλοι, και μετατρέπει τα ευρήματα σε Pantavion capability gaps.',
          userCanAsk: [
            'Βρες τι έχουν οι ανταγωνιστές και τι λείπει από εμάς.',
            'Κάνε βαθιά έρευνα για AI tools και workflows.',
            'Φτιάξε gap matrix για το Pantavion.',
          ],
          expectedResult:
            'Research brief με strengths, weaknesses, opportunities και build implications.',
        },
      ],
      internalCapabilityFamilies: [
        'deep-research',
        'source-evaluation',
        'market-intelligence',
        'competitor-gap-analysis',
        'technology-radar',
      ],
      truthMode: 'verified',
      accessMode: 'signed-in',
      safetyBoundaries: [
        {
          title: 'Source quality',
          explanation:
            'Χαμηλής ποιότητας ή marketing-heavy πηγές δεν γίνονται canonical χωρίς έλεγχο.',
          accessMode: 'public',
        },
      ],
    },
    {
      key: 'write',
      title: 'Write',
      subtitle: 'Emails, άρθρα, αναφορές, κείμενα, scripts και επίσημο υλικό.',
      publicExplanation:
        'Ο χρήστης γράφει ή βελτιώνει κείμενα για προσωπική, επαγγελματική, δημιουργική ή θεσμική χρήση.',
      whatItDoes: [
        'Συντάσσει κείμενα σε διαφορετικό ύφος.',
        'Μεταφράζει και προσαρμόζει γλώσσα.',
        'Διορθώνει ασάφειες, λάθη και αδύναμη δομή.',
        'Παράγει εκδόσεις για email, social, report, landing page ή proposal.',
      ],
      whenToUseIt: [
        'Όταν χρειάζεται καθαρό κείμενο.',
        'Όταν πρέπει να γραφτεί επίσημο μήνυμα.',
        'Όταν ο χρήστης έχει πρόχειρες ιδέες και θέλει τελικό κείμενο.',
      ],
      taskExamples: [
        {
          title: 'Professional writing',
          explanation: 'Μετατρέπει ακατέργαστο κείμενο σε επαγγελματικό αποτέλεσμα.',
          userCanAsk: [
            'Κάν’ το πιο επαγγελματικό.',
            'Γράψε email για συνεργασία.',
            'Φτιάξε manifesto ή project summary.',
          ],
          expectedResult: 'Έτοιμο κείμενο με καθαρή δομή και σωστό ύφος.',
        },
      ],
      internalCapabilityFamilies: [
        'writing-assistance',
        'tone-control',
        'translation',
        'document-structuring',
      ],
      truthMode: 'generative',
      accessMode: 'public',
      safetyBoundaries: [
        {
          title: 'No false authority',
          explanation:
            'Το σύστημα δεν γράφει ψευδείς ισχυρισμούς ως δεδομένα γεγονότα.',
          accessMode: 'public',
        },
      ],
    },
    {
      key: 'build',
      title: 'Build',
      subtitle: 'Apps, websites, components, αρχιτεκτονική και workflows.',
      publicExplanation:
        'Η ενότητα Build μετατρέπει ιδέα σε τεχνικό σχέδιο, αρχεία, components, routes, data models και βήματα υλοποίησης.',
      whatItDoes: [
        'Δημιουργεί implementation plans.',
        'Παράγει code-ready artifacts.',
        'Οργανώνει architecture, folders και modules.',
        'Συνδέεται με kernel, runtime, protocol και workspace logic.',
      ],
      whenToUseIt: [
        'Όταν ο χρήστης θέλει εφαρμογή ή website.',
        'Όταν χρειάζεται τεχνικό αρχείο για VS Code.',
        'Όταν πρέπει να μετατραπεί ιδέα σε πραγματικό build path.',
      ],
      taskExamples: [
        {
          title: 'App builder',
          explanation:
            'Μετατρέπει requirement σε route, component, state, types και validation path.',
          userCanAsk: [
            'Φτιάξε μου αρχείο για VS Code.',
            'Χτίσε homepage section.',
            'Κάνε architecture για αυτό το module.',
          ],
          expectedResult: 'Πλήρες αρχείο ή πλήρες terminal-ready write block.',
        },
      ],
      internalCapabilityFamilies: [
        'code-generation',
        'architecture-planning',
        'implementation-sequencing',
        'repo-safety-validation',
      ],
      truthMode: 'deterministic',
      accessMode: 'signed-in',
      safetyBoundaries: [
        {
          title: 'No half patches',
          explanation:
            'Για serious repo work, το Pantavion δίνει full-file ή controlled full terminal block, όχι σπασμένα snippets.',
          accessMode: 'public',
        },
      ],
    },
    {
      key: 'create',
      title: 'Create',
      subtitle: 'Εικόνες, βίντεο, παρουσιάσεις, brand assets και media concepts.',
      publicExplanation:
        'Η ενότητα Create ενοποιεί creative AI δυνατότητες όπως εικόνα, video, audio, presentation, branding και content production.',
      whatItDoes: [
        'Φτιάχνει creative briefs.',
        'Παράγει brand concepts και visual directions.',
        'Οργανώνει video, image, audio και presentation workflows.',
        'Συνδέει δημιουργικό αποτέλεσμα με project στόχο.',
      ],
      whenToUseIt: [
        'Όταν χρειάζεται logo, εικόνα, video ή παρουσίαση.',
        'Όταν ο χρήστης θέλει campaign ή brand material.',
        'Όταν πρέπει να μετατραπεί ιδέα σε media package.',
      ],
      taskExamples: [
        {
          title: 'Presentation / visual creation',
          explanation:
            'Καλύπτει δυνατότητες τύπου Gamma, design suites, image/video generators και brand tools με Pantavion-native οργάνωση.',
          userCanAsk: [
            'Φτιάξε παρουσίαση για αυτό.',
            'Δημιούργησε visual concept.',
            'Κάνε brand guide.',
          ],
          expectedResult:
            'Creative plan, prompts, asset structure ή τελικό artifact όπου υποστηρίζεται.',
        },
      ],
      internalCapabilityFamilies: [
        'image-generation',
        'video-generation',
        'presentation-generation',
        'brand-design',
        'asset-planning',
      ],
      truthMode: 'generative',
      accessMode: 'signed-in',
      safetyBoundaries: [
        {
          title: 'IP and likeness safety',
          explanation:
            'Δεν αντιγράφει προστατευμένο στυλ/brand ή πραγματικά πρόσωπα χωρίς νόμιμη βάση και άδεια.',
          accessMode: 'public',
        },
      ],
    },
    {
      key: 'learn',
      title: 'Learn',
      subtitle: 'Μάθηση με διαδρομές, ασκήσεις, quizzes και mastery paths.',
      publicExplanation:
        'Δεν δίνει απλές λίστες. Χτίζει διαδρομή μάθησης από αρχάριο μέχρι προχωρημένο επίπεδο.',
      whatItDoes: [
        'Φτιάχνει learning paths.',
        'Εξηγεί έννοιες σταδιακά.',
        'Δίνει ασκήσεις και checkpoints.',
        'Παρακολουθεί πρόοδο όπου υπάρχει memory consent.',
      ],
      whenToUseIt: [
        'Όταν ο χρήστης θέλει να μάθει κάτι συστηματικά.',
        'Όταν χρειάζεται πρόγραμμα σπουδής ή επανάληψη.',
        'Όταν θέλει μετάβαση από γνώση σε πρακτική εφαρμογή.',
      ],
      taskExamples: [
        {
          title: 'Guided mastery',
          explanation:
            'Για domains όπως coding, cybersecurity defense, business, design, data, AI και γλώσσες.',
          userCanAsk: [
            'Μάθε με Python από την αρχή.',
            'Φτιάξε πρόγραμμα 30 ημερών.',
            'Κάνε quiz για να δω τι ξέρω.',
          ],
          expectedResult: 'Δομημένο πρόγραμμα μάθησης με επόμενο βήμα.',
        },
      ],
      internalCapabilityFamilies: [
        'guided-mastery',
        'curriculum-planning',
        'quiz-generation',
        'progress-memory',
      ],
      truthMode: 'mixed',
      accessMode: 'public',
      safetyBoundaries: [
        {
          title: 'Age-aware learning',
          explanation:
            'Περιεχόμενο και δυσκολία προσαρμόζονται σε ηλικία, ρόλο και safety profile.',
          accessMode: 'public',
        },
      ],
    },
    {
      key: 'work',
      title: 'Work',
      subtitle: 'Projects, meetings, tasks, documents, operations και productivity.',
      publicExplanation:
        'Οργανώνει επαγγελματική εργασία: meetings, notes, tasks, summaries, project plans, reports και execution follow-up.',
      whatItDoes: [
        'Συνοψίζει συναντήσεις και συνομιλίες.',
        'Βγάζει action items.',
        'Οργανώνει project state.',
        'Ετοιμάζει executive briefs.',
      ],
      whenToUseIt: [
        'Όταν υπάρχει project ή ομάδα.',
        'Όταν χρειάζεται σύνοψη ή task extraction.',
        'Όταν πρέπει να οργανωθεί επαγγελματική ροή.',
      ],
      taskExamples: [
        {
          title: 'Meeting intelligence',
          explanation:
            'Καλύπτει ανάγκες τύπου executive assistant, meeting summarizer και task tracker.',
          userCanAsk: [
            'Κάνε περίληψη αυτής της συζήτησης.',
            'Βγάλε tasks και deadlines.',
            'Φτιάξε executive update.',
          ],
          expectedResult: 'Σύνοψη, αποφάσεις, ενέργειες και επόμενα βήματα.',
        },
      ],
      internalCapabilityFamilies: [
        'meeting-intelligence',
        'task-extraction',
        'project-memory',
        'operations-summary',
      ],
      truthMode: 'mixed',
      accessMode: 'signed-in',
      safetyBoundaries: [
        {
          title: 'Workspace privacy',
          explanation:
            'Τα workspace δεδομένα δεν αναμιγνύονται χωρίς scoped identity, consent και access control.',
          accessMode: 'signed-in',
        },
      ],
    },
    {
      key: 'memory',
      title: 'Memory',
      subtitle: 'Συνέχεια, αποφάσεις, σημειώσεις, project context και recall.',
      publicExplanation:
        'Η μνήμη δεν είναι απλό ιστορικό chat. Είναι οργανωμένη συνέχεια: αποφάσεις, στόχοι, projects, αρχεία, σχέσεις και επόμενα βήματα.',
      whatItDoes: [
        'Κρατά σημαντικές αποφάσεις.',
        'Συνδέει συνομιλίες με projects.',
        'Βοηθά να μη ξαναλέγονται τα ίδια.',
        'Διαχωρίζει session, project, profile και governed long-term memory.',
      ],
      whenToUseIt: [
        'Όταν ο χρήστης χτίζει μεγάλο project.',
        'Όταν χρειάζεται recall προηγούμενων αποφάσεων.',
        'Όταν θέλει συνέχεια μεταξύ συσκευών και χρόνου.',
      ],
      taskExamples: [
        {
          title: 'Project continuity',
          explanation:
            'Κρατά το Pantavion ή άλλο project σε σταθερή γραμμή χωρίς να ξανανοίγει το όραμα από την αρχή.',
          userCanAsk: [
            'Τι αποφασίσαμε μέχρι τώρα;',
            'Συνέχισε από το τελευταίο checkpoint.',
            'Βρες κενά και overlaps.',
          ],
          expectedResult: 'Recovery summary, canonical baseline και επόμενο build step.',
        },
      ],
      internalCapabilityFamilies: [
        'memory-thread-kernel',
        'semantic-memory',
        'episodic-memory',
        'project-continuity',
        'cross-device-continuity',
      ],
      truthMode: 'verified',
      accessMode: 'signed-in',
      safetyBoundaries: [
        {
          title: 'Memory sovereignty',
          explanation:
            'Η μνήμη πρέπει να είναι consent-aware, scope-aware, explainable και διαγράψιμη όπου απαιτείται.',
          accessMode: 'signed-in',
        },
      ],
    },
    {
      key: 'voice-translate',
      title: 'Voice / Translate',
      subtitle: 'Φωνή, μετάφραση, διερμηνεία και multilingual communication.',
      publicExplanation:
        'Ζωντανή γλωσσική υποστήριξη για ταξίδια, εργασία, οικογένεια, κρίσεις και καθημερινή επικοινωνία.',
      whatItDoes: [
        'Ανιχνεύει γλώσσα όπου υποστηρίζεται.',
        'Μετατρέπει ομιλία σε κείμενο και κείμενο σε φωνή.',
        'Υποστηρίζει επίσημη και φυσική μετάφραση ανά περίπτωση.',
        'Μπορεί να λειτουργεί με offline packs στο μέλλον.',
      ],
      whenToUseIt: [
        'Όταν δύο άνθρωποι δεν μιλούν την ίδια γλώσσα.',
        'Σε ταξίδια, υπηρεσίες, meetings και επείγουσες ανάγκες.',
        'Όταν χρειάζεται γρήγορη show-to-person μετάφραση.',
      ],
      taskExamples: [
        {
          title: 'Live interpreter',
          explanation:
            'Ο χρήστης μιλά και το Pantavion βοηθά την αμφίδρομη επικοινωνία.',
          userCanAsk: [
            'Μετάφρασε αυτό στα Αγγλικά.',
            'Βοήθησέ με να μιλήσω με οδηγό ταξί.',
            'Κάνε επίσημη διατύπωση στα Ελληνικά και Αγγλικά.',
          ],
          expectedResult: 'Καθαρή μετάφραση ή voice-ready output.',
        },
      ],
      internalCapabilityFamilies: [
        'speech-to-text',
        'text-to-speech',
        'translation',
        'locale-policy',
        'voice-runtime',
      ],
      truthMode: 'mixed',
      accessMode: 'public',
      safetyBoundaries: [
        {
          title: 'Critical translation caution',
          explanation:
            'Ιατρικές, νομικές ή επείγουσες μεταφράσεις χρειάζονται υψηλότερη προσοχή και disclaimers.',
          accessMode: 'public',
        },
      ],
    },
    {
      key: 'data-analysis',
      title: 'Data / Analysis',
      subtitle: 'Πίνακες, trends, reports, insights και αποφάσεις.',
      publicExplanation:
        'Ανάλυση αρχείων, αριθμών, τάσεων και επιχειρησιακών δεδομένων με καθαρά συμπεράσματα.',
      whatItDoes: [
        'Καθαρίζει και εξηγεί δεδομένα.',
        'Βρίσκει trends και outliers.',
        'Παράγει reports και charts όπου χρειάζεται.',
        'Μετατρέπει raw data σε απόφαση.',
      ],
      whenToUseIt: [
        'Όταν υπάρχει spreadsheet ή dataset.',
        'Όταν χρειάζεται επιχειρησιακή εικόνα.',
        'Όταν πρέπει να παρθεί απόφαση από αριθμούς.',
      ],
      taskExamples: [
        {
          title: 'Business analytics',
          explanation:
            'Καλύπτει ανάγκες τύπου BI, analytics, reporting και decision support.',
          userCanAsk: [
            'Ανάλυσε αυτό το αρχείο.',
            'Βρες τα σημαντικότερα trends.',
            'Φτιάξε report για διοίκηση.',
          ],
          expectedResult: 'Συμπέρασμα, πίνακας, report ή chart-ready ανάλυση.',
        },
      ],
      internalCapabilityFamilies: [
        'data-analysis',
        'spreadsheet-intelligence',
        'report-generation',
        'trend-detection',
      ],
      truthMode: 'verified',
      accessMode: 'signed-in',
      safetyBoundaries: [
        {
          title: 'Data privacy',
          explanation:
            'Τα δεδομένα αναλύονται με tenant isolation, access control και retention policy.',
          accessMode: 'signed-in',
        },
      ],
    },
    {
      key: 'design-media',
      title: 'Design / Media',
      subtitle: 'Design, εικόνες, video, audio, layouts και creative production.',
      publicExplanation:
        'Ενοποιημένο creative workspace που καλύπτει δυνατότητες τύπου design suites, video tools, image tools και presentation tools με Pantavion-native τρόπο.',
      whatItDoes: [
        'Οργανώνει design briefs.',
        'Παράγει layout ideas και visual directions.',
        'Βοηθά σε image, video, audio και presentation workflows.',
        'Συνδέει δημιουργία με brand και χρήση.',
      ],
      whenToUseIt: [
        'Όταν χρειάζεται social asset, brand asset ή media project.',
        'Όταν ο χρήστης θέλει οπτική ταυτότητα.',
        'Όταν πρέπει να γίνει παραγωγή περιεχομένου.',
      ],
      taskExamples: [
        {
          title: 'Creative production',
          explanation:
            'Απορροφά νόμιμα capability patterns από εργαλεία όπως Affinity-like design, Gamma-like presentation, Higgsfield-like video concepts και άλλα, χωρίς αντιγραφή.',
          userCanAsk: [
            'Σχεδίασε visual direction.',
            'Φτιάξε presentation concept.',
            'Οργάνωσε video campaign.',
          ],
          expectedResult: 'Creative package, production plan ή asset-ready οδηγίες.',
        },
      ],
      internalCapabilityFamilies: [
        'design-workspace',
        'media-generation',
        'presentation-workspace',
        'creative-asset-registry',
      ],
      truthMode: 'generative',
      accessMode: 'signed-in',
      safetyBoundaries: [
        {
          title: 'Brand/IP protection',
          explanation:
            'Δεν γίνεται αντιγραφή λογότυπων, proprietary layouts ή protected brand systems.',
          accessMode: 'public',
        },
      ],
    },
    {
      key: 'automation',
      title: 'Automation',
      subtitle: 'Ροές εργασίας, agents, tasks, triggers, retries και execution.',
      publicExplanation:
        'Μετατρέπει επαναλαμβανόμενες εργασίες σε ασφαλείς workflows με state, retries, fallback και έλεγχο.',
      whatItDoes: [
        'Σπάει εργασία σε βήματα.',
        'Εκτελεί ή προτείνει workflow.',
        'Παρακολουθεί κατάσταση και αποτυχίες.',
        'Συνδέεται με approval όταν υπάρχει ρίσκο.',
      ],
      whenToUseIt: [
        'Όταν ο χρήστης θέλει να αυτοματοποιήσει εργασία.',
        'Όταν υπάρχουν πολλά βήματα και εξαρτήσεις.',
        'Όταν χρειάζεται recurring process.',
      ],
      taskExamples: [
        {
          title: 'Workflow execution',
          explanation:
            'Αντί να δίνει μόνο συμβουλή, οργανώνει Intent → Plan → Capability → Orchestration → Execution → Result.',
          userCanAsk: [
            'Κάνε workflow για αυτό.',
            'Οργάνωσε τα βήματα και τις εξαρτήσεις.',
            'Βάλε fallback αν αποτύχει.',
          ],
          expectedResult: 'Execution plan με state machine και επόμενο action.',
        },
      ],
      internalCapabilityFamilies: [
        'workflow-orchestration',
        'agent-routing',
        'durable-execution',
        'fallback-control',
      ],
      truthMode: 'deterministic',
      accessMode: 'verified',
      safetyBoundaries: [
        {
          title: 'Approval gates',
          explanation:
            'Δεν εκτελούνται high-risk ή irreversible actions χωρίς explicit approval.',
          accessMode: 'verified',
        },
      ],
    },
    {
      key: 'business-strategy',
      title: 'Business / Strategy',
      subtitle: 'Business plans, market positioning, operations και growth.',
      publicExplanation:
        'Βοηθά τον χρήστη να χτίσει επιχείρηση, προϊόν, strategy, pricing, positioning και execution plan.',
      whatItDoes: [
        'Φτιάχνει business plans.',
        'Συγκρίνει αγορές και ανταγωνιστές.',
        'Προτείνει go-to-market paths.',
        'Μετατρέπει όραμα σε execution roadmap.',
      ],
      whenToUseIt: [
        'Όταν υπάρχει startup ή project.',
        'Όταν χρειάζεται επιχειρησιακή στρατηγική.',
        'Όταν πρέπει να βγει positioning ή pricing.',
      ],
      taskExamples: [
        {
          title: 'Strategic planning',
          explanation:
            'Ενώνει research, writing, finance-aware guidance, market intelligence και execution planning.',
          userCanAsk: [
            'Φτιάξε business plan.',
            'Βρες ανταγωνιστικά πλεονεκτήματα.',
            'Πες μου τι λείπει για launch.',
          ],
          expectedResult: 'Στρατηγικό report με προτεραιότητες και επόμενα βήματα.',
        },
      ],
      internalCapabilityFamilies: [
        'strategy-planning',
        'market-intelligence',
        'pricing-modeling',
        'operations-planning',
      ],
      truthMode: 'mixed',
      accessMode: 'signed-in',
      safetyBoundaries: [
        {
          title: 'No guaranteed outcomes',
          explanation:
            'Το Pantavion μπορεί να προτείνει στρατηγική, όχι να εγγυηθεί οικονομικό αποτέλεσμα.',
          accessMode: 'public',
        },
      ],
    },
    {
      key: 'safe-health-knowledge',
      title: 'Health Knowledge',
      subtitle: 'Πληροφοριακή υγεία, σύνοψη γνώσης και ασφαλής καθοδήγηση.',
      publicExplanation:
        'Παρέχει εκπαιδευτική και πληροφοριακή υγεία με ισχυρά safety boundaries. Δεν αντικαθιστά γιατρό.',
      whatItDoes: [
        'Εξηγεί ιατρικούς όρους απλά.',
        'Συνοψίζει πληροφοριακό υλικό.',
        'Προτείνει τι να συζητηθεί με επαγγελματία υγείας.',
        'Επισημαίνει επείγουσες καταστάσεις όταν χρειάζεται.',
      ],
      whenToUseIt: [
        'Όταν ο χρήστης θέλει να καταλάβει πληροφορίες υγείας.',
        'Όταν χρειάζεται προετοιμασία για ραντεβού.',
        'Όταν πρέπει να οργανωθούν συμπτώματα ή ερωτήσεις.',
      ],
      taskExamples: [
        {
          title: 'Medical information support',
          explanation:
            'Υποστηρίζει κατανόηση, όχι διάγνωση ή θεραπευτική εντολή.',
          userCanAsk: [
            'Εξήγησε μου αυτό το αποτέλεσμα.',
            'Τι ερωτήσεις να κάνω στον γιατρό;',
            'Πότε είναι επείγον;',
          ],
          expectedResult: 'Πληροφοριακή σύνοψη με σαφή προειδοποίηση για επαγγελματική φροντίδα.',
        },
      ],
      internalCapabilityFamilies: [
        'health-knowledge-compression',
        'safe-medical-explanation',
        'urgent-care-signposting',
      ],
      truthMode: 'verified',
      accessMode: 'public',
      safetyBoundaries: [
        {
          title: 'Medical safety',
          explanation:
            'Δεν παρέχεται διάγνωση, θεραπεία ή αντικατάσταση επαγγελματία υγείας.',
          accessMode: 'public',
        },
      ],
    },
    {
      key: 'finance-aware-guidance',
      title: 'Finance-Aware Guidance',
      subtitle: 'Οικονομική κατανόηση, προϋπολογισμός, αγορά και business context.',
      publicExplanation:
        'Βοηθά σε οικονομική κατανόηση, budget, σύγκριση επιλογών και επιχειρησιακή σκέψη. Δεν αντικαθιστά αδειοδοτημένο οικονομικό σύμβουλο.',
      whatItDoes: [
        'Οργανώνει budgets.',
        'Συγκρίνει κόστη και επιλογές.',
        'Εξηγεί οικονομικούς όρους.',
        'Βοηθά σε business planning και pricing.',
      ],
      whenToUseIt: [
        'Όταν ο χρήστης θέλει οικονομική οργάνωση.',
        'Όταν χρειάζεται σύγκριση κόστους.',
        'Όταν σχεδιάζει προϊόν ή υπηρεσία.',
      ],
      taskExamples: [
        {
          title: 'Budget and pricing support',
          explanation:
            'Μετατρέπει αριθμούς και στόχους σε καθαρό οικονομικό πλάνο.',
          userCanAsk: [
            'Φτιάξε budget.',
            'Σύγκρινε αυτά τα κόστη.',
            'Πρότεινε pricing model.',
          ],
          expectedResult: 'Πρακτική οικονομική ανάλυση με σαφή όρια.',
        },
      ],
      internalCapabilityFamilies: [
        'budget-planning',
        'pricing-support',
        'market-cost-analysis',
        'finance-aware-reasoning',
      ],
      truthMode: 'mixed',
      accessMode: 'signed-in',
      safetyBoundaries: [
        {
          title: 'Financial safety',
          explanation:
            'Δεν δίνει εξατομικευμένη επενδυτική, φορολογική ή νομική οδηγία χωρίς κατάλληλο πλαίσιο και ειδικό.',
          accessMode: 'public',
        },
      ],
    },
    {
      key: 'security-defense',
      title: 'Security / Defense',
      subtitle: 'Αμυντική κυβερνοασφάλεια, προστασία, audit και ασφαλής λειτουργία.',
      publicExplanation:
        'Καλύπτει αμυντική ασφάλεια, έλεγχο κινδύνων, προστασία λογαριασμών, logs, πολιτικές και incident readiness.',
      whatItDoes: [
        'Εξηγεί αμυντικές πρακτικές.',
        'Βοηθά σε security checklists.',
        'Οργανώνει incident response.',
        'Συνδέεται με admin-only δυνατότητες όπου υπάρχει ρίσκο.',
      ],
      whenToUseIt: [
        'Όταν χρειάζεται προστασία λογαριασμού ή συστήματος.',
        'Όταν υπάρχει ύποπτη δραστηριότητα.',
        'Όταν πρέπει να ελεγχθεί security posture.',
      ],
      taskExamples: [
        {
          title: 'Defensive cyber support',
          explanation:
            'Η ενότητα είναι defensive-first, audit-logged και restricted όπου χρειάζεται.',
          userCanAsk: [
            'Φτιάξε security checklist.',
            'Πώς προστατεύω τον λογαριασμό μου;',
            'Οργάνωσε incident response plan.',
          ],
          expectedResult: 'Αμυντικό πλάνο, checklist ή safe incident workflow.',
        },
      ],
      internalCapabilityFamilies: [
        'defensive-security',
        'audit-logging',
        'risk-evaluation',
        'incident-response',
        'restricted-admin-security',
      ],
      truthMode: 'verified',
      accessMode: 'restricted',
      safetyBoundaries: [
        {
          title: 'No offensive misuse',
          explanation:
            'Δεν παρέχεται ανοιχτή επιθετική ή καταχρηστική cyber δυνατότητα σε γενικούς χρήστες.',
          accessMode: 'restricted',
        },
      ],
    },
  ],
};

export function listPantaAIPublicSurfaceCards(): PantaAIPublicSurfaceCard[] {
  return PANTA_AI_PUBLIC_SURFACE_SPEC.cards.map((card) => cloneValue(card));
}

export function getPantaAIPublicSurfaceCard(
  key: PantaAIPublicSurfaceKey,
): PantaAIPublicSurfaceCard | null {
  const card = PANTA_AI_PUBLIC_SURFACE_SPEC.cards.find((item) => item.key === key);
  return card ? cloneValue(card) : null;
}

export function getPantaAIPublicSurfaceSummary(): {
  title: string;
  subtitle: string;
  cardCount: number;
  publicCount: number;
  signedInCount: number;
  restrictedCount: number;
  capabilityFamilies: string[];
} {
  const cards = PANTA_AI_PUBLIC_SURFACE_SPEC.cards;
  const capabilityFamilies = Array.from(
    new Set(cards.flatMap((card) => card.internalCapabilityFamilies)),
  ).sort();

  return {
    title: PANTA_AI_PUBLIC_SURFACE_SPEC.title,
    subtitle: PANTA_AI_PUBLIC_SURFACE_SPEC.subtitle,
    cardCount: cards.length,
    publicCount: cards.filter((card) => card.accessMode === 'public').length,
    signedInCount: cards.filter((card) => card.accessMode === 'signed-in').length,
    restrictedCount: cards.filter(
      (card) => card.accessMode === 'restricted' || card.accessMode === 'admin-only',
    ).length,
    capabilityFamilies,
  };
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
