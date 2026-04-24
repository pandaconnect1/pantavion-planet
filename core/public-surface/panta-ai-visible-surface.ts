// core/public-surface/panta-ai-visible-surface.ts

export type PantaAIAccessMode =
  | "public"
  | "signed-in"
  | "restricted"
  | "admin-only";

export type PantaAITruthMode =
  | "deterministic"
  | "verified"
  | "assisted"
  | "creative"
  | "restricted";

export interface PantaAIWorkAction {
  title: string;
  userCanAsk: string;
  explanation: string;
  expectedResult: string;
}

export interface PantaAIVisibleCard {
  key: string;
  title: string;
  subtitle: string;
  publicExplanation: string;
  whatItDoes: string[];
  whenToUseIt: string[];
  workActions: PantaAIWorkAction[];
  referenceSignals: string[];
  internalCapabilityFamilies: string[];
  safetyBoundaries: string[];
  expectedResult: string[];
  accessMode: PantaAIAccessMode;
  truthMode: PantaAITruthMode;
  kernelRole: string;
  route: string;
}

export interface PantaAIVisibleSurfaceSummary {
  title: string;
  subtitle: string;
  mission: string;
  doctrine: string[];
  cardCount: number;
  publicCount: number;
  signedInCount: number;
  restrictedCount: number;
  adminOnlyCount: number;
  capabilityFamilies: string[];
}

const PANTAAI_VISIBLE_CARDS: PantaAIVisibleCard[] = [
  {
    key: "ai-assistant",
    title: "AI Assistant",
    subtitle: "Κεντρικός βοηθός σκέψης, απάντησης, οργάνωσης και εκτέλεσης.",
    publicExplanation:
      "Ο χρήστης δεν χρειάζεται να ψάχνει ποιο εργαλείο να ανοίξει. Γράφει τι θέλει και το PantaAI μετατρέπει την πρόθεση σε καθαρή απάντηση, σχέδιο ή επόμενο βήμα.",
    whatItDoes: [
      "Καταλαβαίνει πρόθεση, στόχο, περιορισμούς και επίπεδο χρήστη.",
      "Δίνει απάντηση, πλάνο, λίστα ενεργειών ή οργανωμένο workflow.",
      "Συνδέει την ερώτηση με μνήμη, γνώση, έρευνα, δημιουργία ή εκτέλεση.",
      "Μειώνει τη σύγχυση από πολλά διαφορετικά AI εργαλεία."
    ],
    whenToUseIt: [
      "Όταν ο χρήστης δεν ξέρει από πού να αρχίσει.",
      "Όταν χρειάζεται άμεση καθοδήγηση.",
      "Όταν θέλει να μετατρέψει μια ιδέα σε πρακτικό πλάνο."
    ],
    workActions: [
      {
        title: "Μετέτρεψε ιδέα σε πλάνο",
        userCanAsk: "Θέλω να ξεκινήσω μια online υπηρεσία αλλά δεν ξέρω από πού.",
        explanation: "Το PantaAI σπάει την ιδέα σε στόχο, κοινό, βήματα, εργαλεία, κόστος και προτεραιότητες.",
        expectedResult: "Καθαρό action plan με βήματα πρώτης εβδομάδας."
      },
      {
        title: "Εξήγησε δύσκολο θέμα",
        userCanAsk: "Εξήγησέ μου απλά τι είναι knowledge graph.",
        explanation: "Προσαρμόζει την απάντηση στο επίπεδο του χρήστη.",
        expectedResult: "Κατανοητή εξήγηση με παραδείγματα."
      },
      {
        title: "Οργάνωσε απόφαση",
        userCanAsk: "Να πάω σε Vercel ή AWS για το project;",
        explanation: "Συγκρίνει επιλογές, ρίσκα, κόστος και τεχνική δυσκολία.",
        expectedResult: "Σύσταση με λόγους και tradeoffs."
      }
    ],
    referenceSignals: [
      "ChatGPT-style assistants",
      "Claude-style long-context reasoning",
      "Gemini-style multimodal assistance"
    ],
    internalCapabilityFamilies: [
      "intent-resolution",
      "answer-planning",
      "memory-aware-response",
      "workflow-suggestion",
      "kernel-routing"
    ],
    safetyBoundaries: [
      "Δεν αποφασίζει μόνο του για legal, billing, identity, age, security ή restricted actions.",
      "Δηλώνει αβεβαιότητα όταν δεν υπάρχει αρκετή πληροφορία.",
      "Δεν παρουσιάζει generative output σαν verified truth."
    ],
    expectedResult: [
      "Γρήγορη κατανόηση.",
      "Καθαρό πλάνο.",
      "Σωστό επόμενο βήμα."
    ],
    accessMode: "public",
    truthMode: "assisted",
    kernelRole: "Prime Kernel routes simple questions to answer mode and complex goals to workflow mode.",
    route: "/intelligence"
  },
  {
    key: "deep-research",
    title: "Deep Research",
    subtitle: "Έρευνα με πηγές, σύγκριση, τεκμηρίωση και συμπέρασμα.",
    publicExplanation:
      "Ενότητα για σοβαρή έρευνα όπου ο χρήστης χρειάζεται όχι απλή απάντηση, αλλά πηγές, αντιπαραβολή, αμφιβολίες και καθαρή τελική εικόνα.",
    whatItDoes: [
      "Συλλέγει και οργανώνει πληροφορίες από αξιόπιστες πηγές.",
      "Ξεχωρίζει επίσημες, υψηλής ποιότητας, αδύναμες και χαμηλής εμπιστοσύνης πηγές.",
      "Δίνει συμπέρασμα με επιφυλάξεις όπου χρειάζεται.",
      "Μπορεί να τροφοδοτήσει Mind, Learn, Business, Health Knowledge και Strategy."
    ],
    whenToUseIt: [
      "Όταν η απάντηση πρέπει να είναι τεκμηριωμένη.",
      "Όταν υπάρχουν πολλές απόψεις ή ανταγωνιστικές πληροφορίες.",
      "Όταν ο χρήστης παίρνει σοβαρή απόφαση."
    ],
    workActions: [
      {
        title: "Έρευνα αγοράς",
        userCanAsk: "Βρες τι κάνουν οι μεγάλες AI πλατφόρμες και πού έχουν κενά.",
        explanation: "Οργανώνει εταιρείες, δυνατότητες, πλεονεκτήματα, αδυναμίες και ευκαιρίες για Pantavion.",
        expectedResult: "Research brief με πίνακα ανταγωνισμού και gap analysis."
      },
      {
        title: "Evidence pack",
        userCanAsk: "Μάζεψε πηγές για αυτό το θέμα και βγάλε συμπέρασμα.",
        explanation: "Διαχωρίζει facts, claims, sources και uncertainty.",
        expectedResult: "Τεκμηριωμένη αναφορά με καθαρές ενδείξεις."
      },
      {
        title: "Σύγκριση λύσεων",
        userCanAsk: "Σύγκρινε NotebookLM, Obsidian και δικό μας memory model.",
        explanation: "Μετατρέπει εξωτερικά παραδείγματα σε capability families.",
        expectedResult: "Ανάλυση build / integrate / ignore / improve."
      }
    ],
    referenceSignals: [
      "NotebookLM-style source notebooks",
      "Perplexity-style answer with sources",
      "academic search and citation tools"
    ],
    internalCapabilityFamilies: [
      "source-evaluation",
      "evidence-comparison",
      "research-synthesis",
      "citation-awareness",
      "trust-scoring"
    ],
    safetyBoundaries: [
      "Χρειάζεται web/source verification για πρόσφατα ή μεταβλητά facts.",
      "Δεν εμφανίζει αβέβαιες πληροφορίες σαν βεβαιότητα.",
      "Δεν αντιγράφει copyrighted material."
    ],
    expectedResult: [
      "Έρευνα με ποιότητα.",
      "Πηγές και συμπέρασμα.",
      "Ανταγωνιστική κατανόηση."
    ],
    accessMode: "signed-in",
    truthMode: "verified",
    kernelRole: "Prime Kernel upgrades this route from answer mode to verified research mode when evidence is required.",
    route: "/intelligence"
  },
  {
    key: "writing-content",
    title: "Writing / Content",
    subtitle: "Κείμενα, άρθρα, posts, emails, scripts και structured documents.",
    publicExplanation:
      "Ο χρήστης γράφει τι θέλει να πετύχει και το PantaAI δημιουργεί κείμενο με στόχο, ύφος, κοινό και δομή.",
    whatItDoes: [
      "Γράφει ή βελτιώνει κείμενα.",
      "Μετατρέπει πρόχειρες ιδέες σε καθαρό κείμενο.",
      "Προσαρμόζει ύφος για επαγγελματικό, δημόσιο, δημιουργικό ή απλό λόγο.",
      "Μπορεί να παράγει outline, draft, rewrite, summary και final copy."
    ],
    whenToUseIt: [
      "Για άρθρα, posts, emails, proposals, scripts, landing copy.",
      "Όταν ο χρήστης έχει ιδέα αλλά όχι καθαρή διατύπωση.",
      "Όταν χρειάζεται μετάφραση ή επαγγελματικό polish."
    ],
    workActions: [
      {
        title: "Γράψε επαγγελματικό κείμενο",
        userCanAsk: "Γράψε μου παρουσίαση για το Pantavion.",
        explanation: "Οργανώνει κεντρικό μήνυμα, κοινό, ύφος και call to action.",
        expectedResult: "Καθαρό επαγγελματικό draft."
      },
      {
        title: "Βελτίωσε υπάρχον κείμενο",
        userCanAsk: "Κάνε αυτό πιο δυνατό και πιο καθαρό.",
        explanation: "Κρατά την πρόθεση αλλά διορθώνει δομή, ακρίβεια και ροή.",
        expectedResult: "Πιο καθαρό και ισχυρό κείμενο."
      },
      {
        title: "Πολυγλωσσικό content",
        userCanAsk: "Κάνε το στα ελληνικά και αγγλικά.",
        explanation: "Μεταφράζει με προσαρμογή νοήματος, όχι μηχανική λέξη προς λέξη.",
        expectedResult: "Δίγλωσσο περιεχόμενο έτοιμο για χρήση."
      }
    ],
    referenceSignals: [
      "AI writing assistants",
      "copywriting tools",
      "document editors"
    ],
    internalCapabilityFamilies: [
      "draft-generation",
      "rewrite-polish",
      "tone-control",
      "translation-adaptation",
      "document-structuring"
    ],
    safetyBoundaries: [
      "Δεν παράγει παραπλανητικό ή ψεύτικο περιεχόμενο ως γεγονός.",
      "Σε legal, medical, financial κείμενα κρατά σαφή όρια.",
      "Δεν υποκαθιστά επίσημη επαγγελματική ευθύνη."
    ],
    expectedResult: [
      "Κείμενο με καθαρό σκοπό.",
      "Σωστό ύφος.",
      "Έτοιμη χρήση ή επεξεργασία."
    ],
    accessMode: "public",
    truthMode: "creative",
    kernelRole: "Prime Kernel routes writing to creative mode unless factual verification is requested.",
    route: "/intelligence"
  },
  {
    key: "coding-build",
    title: "Coding / Build",
    subtitle: "Κώδικας, αρχιτεκτονική, debugging, refactor και implementation plans.",
    publicExplanation:
      "Ενότητα για ανάπτυξη λογισμικού με καθαρές οδηγίες, πλήρη αρχεία, ασφαλές patching και τεχνική συνέπεια.",
    whatItDoes: [
      "Γράφει πλήρη αρχεία και όχι αποσπασματικά snippets όταν ζητείται.",
      "Δίνει file-by-file implementation plan.",
      "Βοηθά σε TypeScript, React, Next.js, APIs, schemas, state και testing.",
      "Προστατεύει από terminal paste errors με full write blocks."
    ],
    whenToUseIt: [
      "Όταν χτίζεται νέο feature.",
      "Όταν υπάρχουν errors σε build ή typecheck.",
      "Όταν χρειάζεται ασφαλές patch χωρίς να χαλάσει το repo."
    ],
    workActions: [
      {
        title: "Διόρθωση build errors",
        userCanAsk: "Έχω κόκκινα errors στο TypeScript.",
        explanation: "Αναλύει error output, εντοπίζει αιτία και δίνει ασφαλές patch.",
        expectedResult: "Πράσινο tsc και build."
      },
      {
        title: "Full-file implementation",
        userCanAsk: "Δώσε μου ολόκληρο το αρχείο σωστά.",
        explanation: "Παράγει πλήρες αρχείο ή ένα terminal-ready write block.",
        expectedResult: "Copy-paste ασφαλής υλοποίηση."
      },
      {
        title: "Architecture refactor",
        userCanAsk: "Πώς να το δέσω σωστά με Kernel;",
        explanation: "Συνδέει types, runtime, registry, policy και UI.",
        expectedResult: "Σταθερή αρχιτεκτονική χωρίς σκόρπια modules."
      }
    ],
    referenceSignals: [
      "GitHub Copilot-style coding help",
      "Cursor-style coding workflows",
      "agentic coding tools"
    ],
    internalCapabilityFamilies: [
      "code-generation",
      "repo-triage",
      "typecheck-debugging",
      "patch-planning",
      "safe-terminal-blocks"
    ],
    safetyBoundaries: [
      "Δεν προτείνει τυφλά half-patches.",
      "Δεν γράφει raw TypeScript line-by-line στο terminal.",
      "Δεν αλλάζει security-critical code χωρίς review path."
    ],
    expectedResult: [
      "Καθαρός κώδικας.",
      "Buildable patch.",
      "Ελάχιστο ρίσκο σπασίματος."
    ],
    accessMode: "signed-in",
    truthMode: "deterministic",
    kernelRole: "Prime Kernel routes code work through build mode, validation gates and repository safety rules.",
    route: "/intelligence"
  },
  {
    key: "app-website-builder",
    title: "App / Website Builder",
    subtitle: "Μετατροπή ανάγκης σε app, site, module ή workflow.",
    publicExplanation:
      "Ο χρήστης περιγράφει τι θέλει να φτιάξει και το Pantavion το μετατρέπει σε blueprint, σελίδες, components, flows και τεχνική ακολουθία.",
    whatItDoes: [
      "Παίρνει μια ιδέα και την κάνει product blueprint.",
      "Ορίζει pages, components, user flows, data model και acceptance criteria.",
      "Μπορεί να δημιουργήσει landing page, dashboard, service page ή app skeleton.",
      "Συνδέεται με Create, Business, Coding και Automation."
    ],
    whenToUseIt: [
      "Όταν ο χρήστης θέλει app ή website αλλά δεν ξέρει τεχνικά.",
      "Όταν μια επιχείρηση χρειάζεται online παρουσία.",
      "Όταν μια ιδέα πρέπει να γίνει υλοποιήσιμο προϊόν."
    ],
    workActions: [
      {
        title: "Φτιάξε website plan",
        userCanAsk: "Θέλω ιστοσελίδα για την επιχείρησή μου.",
        explanation: "Ορίζει δομή, σελίδες, περιεχόμενο, design και launch checklist.",
        expectedResult: "Website blueprint και πρώτο implementation plan."
      },
      {
        title: "Φτιάξε app module",
        userCanAsk: "Θέλω module για κρατήσεις.",
        explanation: "Ορίζει actors, states, data, UI και integration boundaries.",
        expectedResult: "Module spec έτοιμο για build."
      },
      {
        title: "Μετέτρεψε τίτλο σε σύστημα",
        userCanAsk: "Φτιάξε service marketplace.",
        explanation: "Σπάει τον τίτλο σε capabilities, workflows και governance.",
        expectedResult: "Σοβαρό product/system blueprint."
      }
    ],
    referenceSignals: [
      "no-code builders",
      "AI app generators",
      "website builders"
    ],
    internalCapabilityFamilies: [
      "blueprint-generation",
      "page-architecture",
      "flow-design",
      "component-planning",
      "acceptance-criteria"
    ],
    safetyBoundaries: [
      "Δεν υπόσχεται production-ready backend χωρίς validation.",
      "Δεν παρακάμπτει privacy, payments, age gates ή legal rules.",
      "Δεν εκθέτει internal tools σαν ανεξέλεγκτο marketplace."
    ],
    expectedResult: [
      "Blueprint.",
      "Σελίδες και flows.",
      "Build-ready direction."
    ],
    accessMode: "signed-in",
    truthMode: "assisted",
    kernelRole: "Prime Kernel converts user intent into blueprint object and build sequence.",
    route: "/intelligence"
  },
  {
    key: "design-image",
    title: "Design / Image",
    subtitle: "Brand, UI, εικόνες, οπτική ταυτότητα και δημιουργικά assets.",
    publicExplanation:
      "Ενότητα για σχεδιασμό εικόνας, brand direction, UI concepts και visual production χωρίς να χαθεί η ταυτότητα του Pantavion.",
    whatItDoes: [
      "Ορίζει design direction, χρώματα, ύφος και visual hierarchy.",
      "Δημιουργεί image prompts, UI mockup logic και brand usage rules.",
      "Βοηθά σε logos, icons, hero sections, banners, social assets.",
      "Συνδέει αισθητική με product identity."
    ],
    whenToUseIt: [
      "Όταν χρειάζεται brand ή visual direction.",
      "Όταν ο χρήστης θέλει εικόνα ή mockup.",
      "Όταν πρέπει να κρατηθεί consistent design system."
    ],
    workActions: [
      {
        title: "Brand direction",
        userCanAsk: "Φτιάξε premium blue-gold identity.",
        explanation: "Ορίζει χρώματα, σχήματα, χρήση, απαγορεύσεις και layout logic.",
        expectedResult: "Brand guide direction."
      },
      {
        title: "Image generation brief",
        userCanAsk: "Θέλω 3D orb logo για Pantavion.",
        explanation: "Μετατρέπει την ανάγκη σε ακριβές visual prompt και constraints.",
        expectedResult: "Καθαρή εικόνα/brief για generation."
      },
      {
        title: "UI polish",
        userCanAsk: "Κάνε αυτή τη σελίδα πιο premium.",
        explanation: "Προτείνει spacing, typography, contrast, hierarchy και card structure.",
        expectedResult: "Πιο επαγγελματικό UI."
      }
    ],
    referenceSignals: [
      "Affinity-style professional design",
      "AI image tools",
      "UI design systems"
    ],
    internalCapabilityFamilies: [
      "brand-system",
      "prompt-to-image-brief",
      "ui-polish",
      "asset-generation",
      "visual-consistency"
    ],
    safetyBoundaries: [
      "Δεν αντιγράφει ξένο brand ή λογότυπο.",
      "Δεν χρησιμοποιεί protected likeness χωρίς άδεια.",
      "Κρατά ξεκάθαρα Pantavion-owned design language."
    ],
    expectedResult: [
      "Καθαρή visual direction.",
      "Χρήσιμα assets.",
      "Συνεπής ταυτότητα."
    ],
    accessMode: "public",
    truthMode: "creative",
    kernelRole: "Prime Kernel routes visual work to creative capability families with brand constraints.",
    route: "/intelligence"
  },
  {
    key: "video-audio",
    title: "Video / Audio",
    subtitle: "Σενάρια, voice, clips, παρουσιάσεις, audio identity και media workflows.",
    publicExplanation:
      "Ενότητα για παραγωγή multimedia με οργανωμένο τρόπο: ιδέα, script, storyboard, voice, cut, distribution.",
    whatItDoes: [
      "Φτιάχνει scripts για βίντεο, reels, explainers και promos.",
      "Οργανώνει audio, voiceover, TTS direction και spoken summaries.",
      "Σχεδιάζει video workflow από ιδέα μέχρι export.",
      "Συνδέει Create, Marketing, Learning και Audio."
    ],
    whenToUseIt: [
      "Όταν ο χρήστης θέλει video ή audio περιεχόμενο.",
      "Όταν χρειάζεται script ή storyboard.",
      "Όταν πρέπει να επαναχρησιμοποιηθεί υλικό σε πολλά formats."
    ],
    workActions: [
      {
        title: "Video script",
        userCanAsk: "Γράψε μου script για παρουσίαση Pantavion.",
        explanation: "Δημιουργεί hook, δομή, σκηνές, voiceover και CTA.",
        expectedResult: "Έτοιμο script."
      },
      {
        title: "Clip repurposing",
        userCanAsk: "Κάνε αυτό το κείμενο σε 5 μικρά reels.",
        explanation: "Σπάει περιεχόμενο σε μικρά format με τίτλους και captions.",
        expectedResult: "Πλάνο μικρών clips."
      },
      {
        title: "Audio bulletin",
        userCanAsk: "Κάνε το σαν ραδιοφωνική περίληψη.",
        explanation: "Μετατρέπει κείμενο σε spoken format.",
        expectedResult: "Audio-ready κείμενο."
      }
    ],
    referenceSignals: [
      "Higgsfield-style video generation signals",
      "TTS and voice platforms",
      "clip repurposing tools"
    ],
    internalCapabilityFamilies: [
      "script-generation",
      "storyboarding",
      "voice-direction",
      "audio-summary",
      "media-workflow"
    ],
    safetyBoundaries: [
      "Δεν δημιουργεί παραπλανητικά deepfakes.",
      "Δεν μιμείται πραγματικό πρόσωπο χωρίς άδεια.",
      "Κρατά watermark/provenance rules όπου χρειάζεται."
    ],
    expectedResult: [
      "Script.",
      "Storyboard.",
      "Media production path."
    ],
    accessMode: "signed-in",
    truthMode: "creative",
    kernelRole: "Prime Kernel routes media work through Create and media safety boundaries.",
    route: "/intelligence"
  },
  {
    key: "presentations",
    title: "Presentations",
    subtitle: "Decks, pitch, reports, slides και executive summaries.",
    publicExplanation:
      "Ο χρήστης δίνει θέμα και στόχο και παίρνει δομή παρουσίασης με slides, headlines, narrative και speaking notes.",
    whatItDoes: [
      "Δημιουργεί pitch decks, reports και executive summaries.",
      "Ορίζει slide order, message hierarchy και visual direction.",
      "Συμπυκνώνει έρευνα ή στρατηγική σε παρουσιάσιμη μορφή.",
      "Συνδέεται με Business, Research, Design και Writing."
    ],
    whenToUseIt: [
      "Για επενδυτές, συνεργάτες, δημόσια παρουσίαση ή εσωτερικό report.",
      "Όταν μια ιδέα πρέπει να παρουσιαστεί καθαρά.",
      "Όταν χρειάζεται γρήγορο structured deck."
    ],
    workActions: [
      {
        title: "Pitch deck outline",
        userCanAsk: "Φτιάξε pitch deck για Pantavion.",
        explanation: "Ορίζει πρόβλημα, λύση, αγορά, προϊόν, moat, roadmap και ask.",
        expectedResult: "Deck outline 10-12 slides."
      },
      {
        title: "Executive summary",
        userCanAsk: "Κάνε αυτή την ανάλυση σε executive summary.",
        explanation: "Κρατά μόνο τα κρίσιμα για απόφαση.",
        expectedResult: "Σύντομη και καθαρή σύνοψη."
      },
      {
        title: "Slide narrative",
        userCanAsk: "Βάλε τη σωστή σειρά στα slides.",
        explanation: "Φτιάχνει narrative arc και sequence.",
        expectedResult: "Παρουσίαση με ροή."
      }
    ],
    referenceSignals: [
      "Gamma-style presentation generation",
      "deck builders",
      "business reporting tools"
    ],
    internalCapabilityFamilies: [
      "deck-structure",
      "slide-narrative",
      "executive-summary",
      "visual-brief",
      "speaking-notes"
    ],
    safetyBoundaries: [
      "Δεν παρουσιάζει projections σαν εγγυημένα facts.",
      "Χρειάζεται verification για market, financial ή legal claims.",
      "Δεν αντιγράφει copyrighted deck templates."
    ],
    expectedResult: [
      "Deck structure.",
      "Slide titles.",
      "Speaking notes."
    ],
    accessMode: "signed-in",
    truthMode: "assisted",
    kernelRole: "Prime Kernel converts research or strategy into presentation workflow.",
    route: "/intelligence"
  },
  {
    key: "automation-workflows",
    title: "Automation / Workflows",
    subtitle: "Από πρόθεση σε βήματα, tasks, triggers και monitored execution.",
    publicExplanation:
      "Ενότητα για να σταματήσει ο χρήστης να κάνει τα ίδια χειροκίνητα. Το Pantavion οργανώνει επαναλαμβανόμενες εργασίες σε workflow.",
    whatItDoes: [
      "Μετατρέπει διαδικασίες σε βήματα.",
      "Ορίζει triggers, inputs, outputs, retries και failure handling.",
      "Σχεδιάζει automation χωρίς χαοτικό tool exposure.",
      "Συνδέεται με execution state machine και Prime Kernel."
    ],
    whenToUseIt: [
      "Όταν μια εργασία επαναλαμβάνεται.",
      "Όταν χρειάζεται συντονισμός πολλών βημάτων.",
      "Όταν ο χρήστης θέλει αποτέλεσμα, όχι λίστα εργαλείων."
    ],
    workActions: [
      {
        title: "Workflow design",
        userCanAsk: "Κάνε μου workflow για leads.",
        explanation: "Ορίζει capture, qualification, follow-up και tracking.",
        expectedResult: "Workflow blueprint."
      },
      {
        title: "Task sequence",
        userCanAsk: "Σπάσε αυτό σε βήματα εκτέλεσης.",
        explanation: "Μετατρέπει στόχο σε executable task chain.",
        expectedResult: "Task list με dependencies."
      },
      {
        title: "Failure handling",
        userCanAsk: "Τι γίνεται αν αποτύχει ένα βήμα;",
        explanation: "Προσθέτει fallback, retry, manual review και rollback.",
        expectedResult: "Ανθεκτικό workflow."
      }
    ],
    referenceSignals: [
      "Zapier-style automation",
      "agent workflows",
      "task orchestration systems"
    ],
    internalCapabilityFamilies: [
      "workflow-modeling",
      "trigger-design",
      "state-machine",
      "retry-fallback",
      "execution-tracking"
    ],
    safetyBoundaries: [
      "Δεν εκτελεί χρήματα, νομικές πράξεις, identity changes ή destructive actions χωρίς approval.",
      "Κάθε automation πρέπει να έχει audit και rollback όπου χρειάζεται.",
      "High-risk workflows μπαίνουν σε restricted review."
    ],
    expectedResult: [
      "Workflow.",
      "Execution states.",
      "Fallback logic."
    ],
    accessMode: "signed-in",
    truthMode: "deterministic",
    kernelRole: "Prime Kernel turns intent into plan, plan into capability sequence, and sequence into governed execution.",
    route: "/intelligence"
  },
  {
    key: "notes-memory",
    title: "Notes / Memory",
    subtitle: "Σημειώσεις, meeting intelligence, project memory και continuity.",
    publicExplanation:
      "Ενότητα που κρατά οργανωμένη συνέχεια. Δεν πετά απλά σημειώσεις σε λίστα, τις συνδέει με projects, αποφάσεις και επόμενες κινήσεις.",
    whatItDoes: [
      "Συνοψίζει σημειώσεις, meetings και νήματα.",
      "Βγάζει αποφάσεις, εκκρεμότητες, risks και next steps.",
      "Συνδέει μνήμη με project, χρήστη, workflow και timeline.",
      "Προστατεύει sensitive memory με retention και scope."
    ],
    whenToUseIt: [
      "Όταν δεν πρέπει να χαθεί συνέχεια.",
      "Για meetings, project notes, research notes και προσωπική οργάνωση.",
      "Όταν ο χρήστης θέλει δεύτερο εγκέφαλο."
    ],
    workActions: [
      {
        title: "Meeting summary",
        userCanAsk: "Κάνε σύνοψη της συνάντησης.",
        explanation: "Εντοπίζει αποφάσεις, tasks, owners και deadlines.",
        expectedResult: "Meeting brief."
      },
      {
        title: "Project memory",
        userCanAsk: "Θύμισε μου τι έχουμε κλειδώσει για Pantavion.",
        explanation: "Φέρνει continuity από decisions, doctrines και architecture.",
        expectedResult: "Project recovery summary."
      },
      {
        title: "Action extraction",
        userCanAsk: "Βγάλε τι πρέπει να κάνω μετά.",
        explanation: "Μετατρέπει σημειώσεις σε next steps.",
        expectedResult: "Λίστα ενεργειών."
      }
    ],
    referenceSignals: [
      "Obsidian-style knowledge base",
      "meeting assistants",
      "personal memory systems"
    ],
    internalCapabilityFamilies: [
      "memory-classification",
      "thread-summary",
      "decision-extraction",
      "continuity-recall",
      "retention-policy"
    ],
    safetyBoundaries: [
      "Sensitive memory δεν γίνεται public.",
      "Long-term memory θέλει σαφή κλάση, provenance και retention.",
      "Ο χρήστης πρέπει να μπορεί να διορθώσει ή να διαγράψει."
    ],
    expectedResult: [
      "Συνέχεια.",
      "Οργανωμένη μνήμη.",
      "Recoverable decisions."
    ],
    accessMode: "signed-in",
    truthMode: "verified",
    kernelRole: "Prime Kernel governs what becomes memory, what stays session-only and what requires review.",
    route: "/intelligence"
  },
  {
    key: "data-analytics",
    title: "Data / Analytics",
    subtitle: "Πίνακες, καθαρισμός, insights, charts, BI και data reasoning.",
    publicExplanation:
      "Ενότητα για δεδομένα. Ο χρήστης ανεβάζει ή περιγράφει δεδομένα και παίρνει καθαρισμό, ανάλυση, ερμηνεία και επόμενες αποφάσεις.",
    whatItDoes: [
      "Καθαρίζει και οργανώνει datasets.",
      "Βρίσκει patterns, outliers, trends και risks.",
      "Δημιουργεί πίνακες, charts, summaries και BI-style insights.",
      "Συνδέεται με Business, Research και Finance guidance."
    ],
    whenToUseIt: [
      "Όταν υπάρχουν αριθμοί ή πίνακες.",
      "Όταν ο χρήστης θέλει απόφαση από δεδομένα.",
      "Όταν χρειάζεται report ή dashboard logic."
    ],
    workActions: [
      {
        title: "Analyze data",
        userCanAsk: "Ανάλυσε αυτόν τον πίνακα πωλήσεων.",
        explanation: "Βγάζει τάσεις, κενά και σημαντικές μετρήσεις.",
        expectedResult: "Data summary με insights."
      },
      {
        title: "Create chart plan",
        userCanAsk: "Τι γραφήματα χρειάζονται εδώ;",
        explanation: "Επιλέγει σωστή απεικόνιση για κάθε ερώτηση.",
        expectedResult: "Chart plan."
      },
      {
        title: "BI report",
        userCanAsk: "Κάνε executive report από αυτά τα δεδομένα.",
        explanation: "Συμπυκνώνει μετρήσεις σε decision-ready report.",
        expectedResult: "BI-style summary."
      }
    ],
    referenceSignals: [
      "Rose AI-style data analysis signals",
      "BI tools",
      "notebook analytics"
    ],
    internalCapabilityFamilies: [
      "data-cleaning",
      "analytics-reasoning",
      "chart-planning",
      "bi-summary",
      "dataset-quality-check"
    ],
    safetyBoundaries: [
      "Δεν επινοεί δεδομένα που δεν υπάρχουν.",
      "Δηλώνει sample limits και uncertainty.",
      "Sensitive datasets χρειάζονται privacy handling."
    ],
    expectedResult: [
      "Καθαρή ανάλυση.",
      "Insights.",
      "Decision-ready report."
    ],
    accessMode: "signed-in",
    truthMode: "verified",
    kernelRole: "Prime Kernel routes data tasks to deterministic or verified analysis mode depending on source quality.",
    route: "/intelligence"
  },
  {
    key: "learning-mastery",
    title: "Learning / Mastery",
    subtitle: "Μάθηση με επίπεδα, practice, quizzes και πραγματική πρόοδο.",
    publicExplanation:
      "Δεν δίνει απλώς λίστα με links. Χτίζει path από αρχάριο σε προχωρημένο με πρακτική, έλεγχο και επανάληψη.",
    whatItDoes: [
      "Ορίζει learning path ανά στόχο και επίπεδο.",
      "Δίνει μαθήματα, πρακτική, drills, quizzes και progress checkpoints.",
      "Συνδέει μάθηση με πραγματικές εφαρμογές.",
      "Προσαρμόζεται σε γλώσσα, ηλικία και ρυθμό χρήστη."
    ],
    whenToUseIt: [
      "Όταν ο χρήστης θέλει να μάθει δεξιότητα.",
      "Όταν χρειάζεται structured path αντί για τυχαία videos.",
      "Για σχολείο, καριέρα, τεχνικά skills, γλώσσες και mastery."
    ],
    workActions: [
      {
        title: "Learning path",
        userCanAsk: "Θέλω να μάθω cybersecurity από το μηδέν.",
        explanation: "Ορίζει beginner, intermediate, advanced path με ασφαλή όρια.",
        expectedResult: "Study roadmap."
      },
      {
        title: "Practice drills",
        userCanAsk: "Δώσε μου ασκήσεις για να εξασκηθώ.",
        explanation: "Παράγει ασκήσεις ανά επίπεδο.",
        expectedResult: "Practice set."
      },
      {
        title: "Quiz me",
        userCanAsk: "Κάνε μου τεστ σε αυτά που έμαθα.",
        explanation: "Ελέγχει κατανόηση και προτείνει επανάληψη.",
        expectedResult: "Quiz και feedback."
      }
    ],
    referenceSignals: [
      "learning platforms",
      "roadmap systems",
      "AI tutor tools"
    ],
    internalCapabilityFamilies: [
      "mastery-path",
      "lesson-generation",
      "practice-drills",
      "quiz-feedback",
      "progress-memory"
    ],
    safetyBoundaries: [
      "High-risk domains έχουν safe curriculum.",
      "Δεν παρέχει οδηγίες επιβλαβούς χρήσης.",
      "Για minors εφαρμόζονται age-safe defaults."
    ],
    expectedResult: [
      "Learning roadmap.",
      "Practice.",
      "Progress tracking."
    ],
    accessMode: "public",
    truthMode: "assisted",
    kernelRole: "Prime Kernel routes learning into Guided Mastery with memory-aware progress.",
    route: "/intelligence"
  },
  {
    key: "business-strategy",
    title: "Business / Strategy",
    subtitle: "Σχέδια, positioning, operations, pricing, execution και growth.",
    publicExplanation:
      "Ενότητα για επιχειρηματική καθαρότητα. Ο χρήστης παίρνει στρατηγική, business plan, execution steps και risk analysis.",
    whatItDoes: [
      "Διαμορφώνει business model, positioning και go-to-market.",
      "Ορίζει pricing, operations, workflows και growth paths.",
      "Συγκρίνει επιλογές με κόστος, ρίσκο και δυσκολία.",
      "Συνδέεται με Create, Data, Finance και Automation."
    ],
    whenToUseIt: [
      "Όταν ο χρήστης θέλει να ξεκινήσει ή να βελτιώσει επιχείρηση.",
      "Όταν χρειάζεται πλάνο εκτέλεσης.",
      "Όταν πρέπει να ληφθεί επιχειρηματική απόφαση."
    ],
    workActions: [
      {
        title: "Business plan",
        userCanAsk: "Φτιάξε business plan για αυτό.",
        explanation: "Ορίζει αγορά, πελάτη, προσφορά, κόστος, κανάλια και βήματα.",
        expectedResult: "Business plan v1."
      },
      {
        title: "Pricing support",
        userCanAsk: "Τι τιμές να βάλω;",
        explanation: "Συγκρίνει value, cost, tiers και market logic.",
        expectedResult: "Pricing model."
      },
      {
        title: "Execution plan",
        userCanAsk: "Τι κάνω τις επόμενες 30 μέρες;",
        explanation: "Μετατρέπει στρατηγική σε weekly execution.",
        expectedResult: "30-day action plan."
      }
    ],
    referenceSignals: [
      "strategy frameworks",
      "business planning tools",
      "operations playbooks"
    ],
    internalCapabilityFamilies: [
      "business-modeling",
      "pricing-support",
      "market-positioning",
      "execution-planning",
      "operations-workflow"
    ],
    safetyBoundaries: [
      "Δεν υπόσχεται έσοδα.",
      "Finance/legal/tax topics χρειάζονται επαγγελματικό έλεγχο.",
      "Δεν κάνει deceptive marketing."
    ],
    expectedResult: [
      "Στρατηγική.",
      "Πλάνο εκτέλεσης.",
      "Καθαρή απόφαση."
    ],
    accessMode: "signed-in",
    truthMode: "assisted",
    kernelRole: "Prime Kernel turns business intent into plan, capability needs and execution sequence.",
    route: "/intelligence"
  },
  {
    key: "finance-guidance",
    title: "Finance-Aware Guidance",
    subtitle: "Budget, κόστος, επιλογές, σύγκριση και οικονομική οργάνωση.",
    publicExplanation:
      "Βοηθά τον χρήστη να σκέφτεται οικονομικά πιο καθαρά χωρίς να παριστάνει τον οικονομικό σύμβουλο.",
    whatItDoes: [
      "Οργανώνει budget και κόστος.",
      "Συγκρίνει επιλογές με οικονομική επίπτωση.",
      "Βοηθά σε business pricing, savings logic και planning.",
      "Επισημαίνει ρίσκα και σημεία που θέλουν ειδικό."
    ],
    whenToUseIt: [
      "Όταν ο χρήστης θέλει να υπολογίσει κόστος.",
      "Όταν πρέπει να διαλέξει οικονομική διαδρομή.",
      "Όταν χρειάζεται budget για project ή επιχείρηση."
    ],
    workActions: [
      {
        title: "Project budget",
        userCanAsk: "Πόσο μπορεί να κοστίσει αυτό το project;",
        explanation: "Σπάει το κόστος σε hosting, tools, development, operations και maintenance.",
        expectedResult: "Budget estimate με assumptions."
      },
      {
        title: "Cost comparison",
        userCanAsk: "Σύγκρινε Vercel, AWS και άλλες επιλογές κόστους.",
        explanation: "Συγκρίνει αρχικό κόστος, scaling και complexity.",
        expectedResult: "Decision table."
      },
      {
        title: "Pricing model",
        userCanAsk: "Πώς να τιμολογήσω το προϊόν;",
        explanation: "Προτείνει tiers, quotas και value framing.",
        expectedResult: "Pricing draft."
      }
    ],
    referenceSignals: [
      "budget planners",
      "financial modeling tools",
      "market cost estimators"
    ],
    internalCapabilityFamilies: [
      "budget-planning",
      "cost-comparison",
      "pricing-support",
      "financial-risk-flags",
      "usage-cost-modeling"
    ],
    safetyBoundaries: [
      "Δεν δίνει προσωπική επενδυτική συμβουλή.",
      "Δεν υπόσχεται αποδόσεις.",
      "Υψηλού ρίσκου οικονομικές αποφάσεις θέλουν ειδικό."
    ],
    expectedResult: [
      "Οικονομική καθαρότητα.",
      "Κόστος και tradeoffs.",
      "Ασφαλέστερη απόφαση."
    ],
    accessMode: "signed-in",
    truthMode: "assisted",
    kernelRole: "Prime Kernel routes finance-aware tasks through caution and assumption tracking.",
    route: "/intelligence"
  },
  {
    key: "health-knowledge",
    title: "Health Knowledge",
    subtitle: "Κατανόηση υγείας, συμπύκνωση γνώσης και προετοιμασία ερωτήσεων.",
    publicExplanation:
      "Βοηθά τον χρήστη να καταλάβει πληροφορίες υγείας και να προετοιμαστεί για συζήτηση με ειδικό. Δεν κάνει διάγνωση.",
    whatItDoes: [
      "Εξηγεί ιατρικούς όρους σε απλή γλώσσα.",
      "Συνοψίζει πληροφορίες και οργανώνει ερωτήσεις για γιατρό.",
      "Ξεχωρίζει γενική γνώση από προσωπική ιατρική απόφαση.",
      "Μπορεί να υποστηρίξει health knowledge libraries με αυστηρά όρια."
    ],
    whenToUseIt: [
      "Όταν ο χρήστης θέλει να καταλάβει ένα ιατρικό θέμα.",
      "Όταν πρέπει να οργανώσει ερωτήσεις πριν από ραντεβού.",
      "Όταν χρειάζεται health education, όχι διάγνωση."
    ],
    workActions: [
      {
        title: "Explain medical term",
        userCanAsk: "Τι σημαίνει αυτός ο όρος;",
        explanation: "Εξηγεί με απλά λόγια και δηλώνει όρια.",
        expectedResult: "Κατανοητή γενική εξήγηση."
      },
      {
        title: "Doctor questions",
        userCanAsk: "Τι να ρωτήσω τον γιατρό μου;",
        explanation: "Οργανώνει ερωτήσεις, συμπτώματα και ιστορικό προς συζήτηση.",
        expectedResult: "Λίστα ερωτήσεων."
      },
      {
        title: "Health article summary",
        userCanAsk: "Σύνοψη αυτού του άρθρου υγείας.",
        explanation: "Συνοψίζει χωρίς να μετατρέπει τη σύνοψη σε διάγνωση.",
        expectedResult: "Ασφαλής περίληψη."
      }
    ],
    referenceSignals: [
      "medical knowledge bases",
      "health education tools",
      "research summarizers"
    ],
    internalCapabilityFamilies: [
      "health-explanation",
      "medical-summary",
      "question-preparation",
      "risk-escalation",
      "source-sensitive-answering"
    ],
    safetyBoundaries: [
      "Δεν κάνει διάγνωση.",
      "Δεν αντικαθιστά γιατρό.",
      "Σε επείγοντα περιστατικά οδηγεί σε άμεση επαγγελματική βοήθεια."
    ],
    expectedResult: [
      "Κατανόηση.",
      "Σωστές ερωτήσεις.",
      "Ασφαλή όρια."
    ],
    accessMode: "public",
    truthMode: "verified",
    kernelRole: "Prime Kernel treats health as high-sensitivity knowledge with strict safety language.",
    route: "/intelligence"
  },
  {
    key: "security-defense",
    title: "Security / Defense",
    subtitle: "Αμυντική ασφάλεια, audits, checklists και incident readiness.",
    publicExplanation:
      "Η ασφάλεια στο Pantavion είναι defensive-first. Ο απλός χρήστης παίρνει προστασία, awareness και checklists. Ευαίσθητες δυνατότητες μένουν restricted ή admin-only.",
    whatItDoes: [
      "Δίνει αμυντικά security checklists.",
      "Βοηθά σε privacy, account safety, phishing awareness και incident preparation.",
      "Υποστηρίζει internal/admin defensive workflows.",
      "Καταγράφει audit, policy και restricted boundaries."
    ],
    whenToUseIt: [
      "Όταν ο χρήστης θέλει να προστατεύσει λογαριασμό ή project.",
      "Όταν μια ομάδα χρειάζεται readiness checklist.",
      "Όταν υπάρχει security concern που πρέπει να δρομολογηθεί σωστά."
    ],
    workActions: [
      {
        title: "Account safety",
        userCanAsk: "Πώς προστατεύω τον λογαριασμό μου;",
        explanation: "Δίνει πρακτικά defensive steps.",
        expectedResult: "Security checklist."
      },
      {
        title: "Project security review",
        userCanAsk: "Έλεγξε τι λείπει από την ασφάλεια του project.",
        explanation: "Εντοπίζει auth, secrets, logging, permissions και deployment risks.",
        expectedResult: "Security gap report."
      },
      {
        title: "Incident readiness",
        userCanAsk: "Τι κάνω αν γίνει breach;",
        explanation: "Δίνει containment, communication, evidence and recovery steps.",
        expectedResult: "Incident response outline."
      }
    ],
    referenceSignals: [
      "defensive cyber tools",
      "SIEM/logging systems",
      "security audit frameworks"
    ],
    internalCapabilityFamilies: [
      "defensive-security",
      "risk-evaluation",
      "audit-logging",
      "incident-response",
      "restricted-admin-security"
    ],
    safetyBoundaries: [
      "No offensive misuse.",
      "Restricted tools are not exposed casually.",
      "Admin-only security actions require audit and approval."
    ],
    expectedResult: [
      "Προστασία.",
      "Audit readiness.",
      "Clear defensive path."
    ],
    accessMode: "restricted",
    truthMode: "restricted",
    kernelRole: "Prime Kernel gates cyber/security capabilities through defensive, restricted and admin-only policy.",
    route: "/intelligence"
  },
  {
    key: "voice-translation",
    title: "Voice / Translation",
    subtitle: "Ζωντανή γλωσσική γέφυρα για ανθρώπους, ταξίδια, εργασία και βοήθεια.",
    publicExplanation:
      "Το Pantavion πρέπει να σπάει τα γλωσσικά σύνορα. Η ενότητα οργανώνει spoken translation, text translation και show-to-human communication surfaces.",
    whatItDoes: [
      "Μεταφράζει νόημα σε άλλη γλώσσα.",
      "Υποστηρίζει ταξίδι, εργασία, εξυπηρέτηση και καθημερινή επικοινωνία.",
      "Συνδέεται με Voice runtime, locale policy και accessibility.",
      "Μπορεί να λειτουργεί ως πρακτικός διερμηνέας."
    ],
    whenToUseIt: [
      "Όταν δύο άνθρωποι δεν μιλούν την ίδια γλώσσα.",
      "Σε ταξίδι, γιατρό, δημόσια υπηρεσία ή εργασία.",
      "Όταν χρειάζεται άμεση κατανόηση."
    ],
    workActions: [
      {
        title: "Translate phrase",
        userCanAsk: "Πες αυτό στα αγγλικά.",
        explanation: "Μεταφράζει με σωστό νόημα και ύφος.",
        expectedResult: "Καθαρή μετάφραση."
      },
      {
        title: "Show-to-driver",
        userCanAsk: "Γράψε αυτό για να το δείξω σε ταξιτζή.",
        explanation: "Δημιουργεί πρακτική φράση για πραγματική χρήση.",
        expectedResult: "Έτοιμο μήνυμα."
      },
      {
        title: "Meeting translation plan",
        userCanAsk: "Πώς να οργανώσω πολύγλωσσο meeting;",
        explanation: "Ορίζει γλώσσες, ροή, summaries και notes.",
        expectedResult: "Multilingual communication plan."
      }
    ],
    referenceSignals: [
      "speech-to-text systems",
      "text-to-speech systems",
      "translation engines"
    ],
    internalCapabilityFamilies: [
      "language-detection",
      "translation-adaptation",
      "voice-runtime",
      "locale-policy",
      "accessibility"
    ],
    safetyBoundaries: [
      "Δεν υπόσχεται τέλεια μετάφραση σε legal/medical contexts χωρίς review.",
      "Ευαίσθητα δεδομένα φωνής έχουν retention limits.",
      "Raw audio δεν κρατιέται by default."
    ],
    expectedResult: [
      "Κατανόηση.",
      "Άμεση χρήση.",
      "Πολυγλωσσική γέφυρα."
    ],
    accessMode: "public",
    truthMode: "assisted",
    kernelRole: "Prime Kernel routes language tasks to voice/runtime and locale policy layers.",
    route: "/intelligence"
  }
];

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function cloneCard(card: PantaAIVisibleCard): PantaAIVisibleCard {
  return cloneValue(card);
}

export function getPantaAIVisibleSurfaceCards(): PantaAIVisibleCard[] {
  return PANTAAI_VISIBLE_CARDS.map((card) => cloneCard(card));
}

export function getPantaAIVisibleSurfaceCard(
  key: string
): PantaAIVisibleCard | null {
  const card = PANTAAI_VISIBLE_CARDS.find((item) => item.key === key);
  return card ? cloneCard(card) : null;
}

export function getPantaAIVisibleSurfaceSummary(): PantaAIVisibleSurfaceSummary {
  const cards = getPantaAIVisibleSurfaceCards();
  const capabilityFamilies = Array.from(
    new Set(cards.flatMap((card) => card.internalCapabilityFamilies))
  ).sort();

  return {
    title: "PantaAI Center",
    subtitle:
      "One organized place for AI, creation, research, work, learning, automation and execution.",
    mission:
      "The PantaAI Center prevents tool chaos by turning scattered AI tools and services into governed Pantavion capability families.",
    doctrine: [
      "Public simplicity, internal complexity.",
      "Capabilities, not tool chaos.",
      "Legal inspiration and evaluation, not cloning.",
      "Result-first: intent to plan to capability to orchestration to execution.",
      "Truth zoning, memory sovereignty and safety boundaries stay active.",
      "Public cards explain what the user can do; Prime Kernel decides how it is routed internally."
    ],
    cardCount: cards.length,
    publicCount: cards.filter((card) => card.accessMode === "public").length,
    signedInCount: cards.filter((card) => card.accessMode === "signed-in").length,
    restrictedCount: cards.filter((card) => card.accessMode === "restricted").length,
    adminOnlyCount: cards.filter((card) => card.accessMode === "admin-only").length,
    capabilityFamilies
  };
}
