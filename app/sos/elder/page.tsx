"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ElderHistoryMode = "sos" | "ai-note" | "language";

type ElderHistoryItem = {
  id: string;
  mode: ElderHistoryMode;
  text: string;
  createdAt: string;
};

type ElderTranslationMode = "auto" | "manual";

type ElderLanguageCode =
  | "el"
  | "en"
  | "tr"
  | "ar"
  | "fr"
  | "de"
  | "es"
  | "it"
  | "ro"
  | "ru";

type ElderLanguage = {
  code: ElderLanguageCode;
  label: string;
  nativeLabel: string;
  direction: "ltr" | "rtl";
};

type ElderTranslation = {
  pageBadge: string;
  pageTitle: string;
  pageIntro: string;
  languageLabel: string;
  languageHelp: string;
  emergencyBoundary: string;

  redKicker: string;
  sosButton: string;
  redTitle: string;
  redBody: string;
  openLiveSos: string;
  emergencyCircle: string;

  orangeKicker: string;
  orangeTitle: string;
  orangeBody: string;
  orangeButton: string;

  greenKicker: string;
  greenTitle: string;
  greenBody: string;
  greenNoteLabel: string;
  greenPlaceholder: string;
  saveToPhone: string;
  aiVoiceNext: string;
  aiBoundary: string;

  historyTitle: string;
  historyBody: string;
  deleteHistory: string;
  noHistory: string;
  sosHistoryLabel: string;
  languageHistoryLabel: string;
  noteHistoryLabel: string;

  rulesTitle: string;
  rules: string[];

  sosHistoryText: string;
  languageSavedPrefix: string;
  languageSavedSuffix: string;
  languageHistoryPrefix: string;
  localSosActivated: string;
  noteSaved: string;
  historyCleared: string;
};

const historyKey = "pantavion_elder_safety_history_v1";
const globalLanguageKey = "pantavion_global_language_v1";
const translationModeKey = "pantavion_elder_translation_mode_v1";
const helperLanguageKey = "pantavion_helper_language_v1";

const languageOptions: ElderLanguage[] = [
  { code: "el", label: "Greek", nativeLabel: "Ελληνικά", direction: "ltr" },
  { code: "en", label: "English", nativeLabel: "English", direction: "ltr" },
  { code: "tr", label: "Turkish", nativeLabel: "Türkçe", direction: "ltr" },
  { code: "ar", label: "Arabic", nativeLabel: "العربية", direction: "rtl" },
  { code: "fr", label: "French", nativeLabel: "Français", direction: "ltr" },
  { code: "de", label: "German", nativeLabel: "Deutsch", direction: "ltr" },
  { code: "es", label: "Spanish", nativeLabel: "Español", direction: "ltr" },
  { code: "it", label: "Italian", nativeLabel: "Italiano", direction: "ltr" },
  { code: "ro", label: "Romanian", nativeLabel: "Română", direction: "ltr" },
  { code: "ru", label: "Russian", nativeLabel: "Русский", direction: "ltr" },
];

const elderTranslations: Record<ElderLanguageCode, ElderTranslation> = {
  el: {
    pageBadge: "Pantavion Elder Safe Mode",
    pageTitle: "Απλή οθόνη προστασίας.",
    pageIntro:
      "Για ηλικιωμένους, ανθρώπους που ζουν μόνοι και χρήστες που χρειάζονται μεγάλα κουμπιά, καθαρή φωνή, απλή βοήθεια, επιλογή γλώσσας και λιγότερη σύγχυση.",
    languageLabel: "Γλώσσα / Language",
    languageHelp:
      "Η επιλογή αποθηκεύεται με global Pantavion key, ώστε να μην ξαναχάνεται ανάμεσα σε SOS / μετάφραση / AI φίλο.",
    emergencyBoundary:
      "Το κόκκινο SOS είναι για άμεσο κίνδυνο. Δεν υπόσχεται αυτόματη κρατική αποστολή, ασθενοφόρο ή δορυφορική διάσωση χωρίς πιστοποιημένο πάροχο.",

    redKicker: "Κόκκινο = Άμεσος κίνδυνος",
    sosButton: "SOS",
    redTitle: "Ένα πάτημα: δυνατή ειδοποίηση στη συσκευή και καταγραφή ώρας.",
    redBody:
      "Οι επαφές έκτακτης ανάγκης πρέπει να έχουν δηλωθεί από πριν. Για την πλήρη Live SOS ροή άνοιξε την κύρια σελίδα SOS.",
    openLiveSos: "Άνοιγμα Live SOS",
    emergencyCircle: "Κύκλος ανάγκης",

    orangeKicker: "Πορτοκαλί = Βοήθεια / Μετάφραση",
    orangeTitle: "Μίλα και κατάλαβε.",
    orangeBody:
      "Για σπίτι, νοσοκομείο, δρόμο, ταξί, υπηρεσία ή άνθρωπο που μιλά άλλη γλώσσα. Δεν δίνει πρόσβαση στο πράσινο προσωπικό ιστορικό.",
    orangeButton: "Βοήθεια / Μετάφραση",

    greenKicker: "Πράσινο = AI Φίλος / Ημερολόγιο",
    greenTitle: "Μίλησε ή γράψε ό,τι σε απασχολεί.",
    greenBody:
      "Το πλήρες AI με φυσική φωνή θα έρθει με το PantaAI provider layer. Από τώρα κρατάμε το σωστό τοπικό ημερολόγιο με ημερομηνία και ώρα.",
    greenNoteLabel: "Γράψε σημείωση για εσένα ή την οικογένεια που έχεις επιλέξει:",
    greenPlaceholder:
      "Π.χ. σήμερα ζαλίστηκα, ένιωσα μόνος/η ή θέλω να μιλήσω στα παιδιά μου...",
    saveToPhone: "Αποθήκευση στο κινητό",
    aiVoiceNext: "AI Φίλος: επόμενο στάδιο",
    aiBoundary:
      "Ο AI Φίλος δεν είναι γιατρός, δεν κάνει διάγνωση και δεν αντικαθιστά επείγουσα βοήθεια. Θα ακούει, θα οργανώνει ανησυχίες και θα προτείνει να ζητηθεί ανθρώπινη ή ιατρική βοήθεια όταν χρειάζεται.",

    historyTitle: "Τοπικό ιστορικό",
    historyBody: "Αποθηκεύεται στη συσκευή με ημερομηνία, ώρα και συνέχεια ροής.",
    deleteHistory: "Διαγραφή ιστορικού",
    noHistory: "Δεν υπάρχει ακόμα τοπικό ιστορικό σε αυτή τη συσκευή.",
    sosHistoryLabel: "SOS",
    languageHistoryLabel: "Γλώσσα",
    noteHistoryLabel: "Σημείωση",

    rulesTitle: "Κανόνες προστασίας και συνέχειας",
    rules: [
      "Ο φροντιστής δεν παίρνει αυτόματη πρόσβαση στο πράσινο ιστορικό.",
      "Η οικογένεια βλέπει μόνο ό,τι επιτρέψει ο χρήστης ή νόμιμος guardian κανόνας.",
      "Το πορτοκαλί βοηθά στη ζωντανή συνεννόηση, όχι στην ανάγνωση προσωπικών αρχείων.",
      "Η γλώσσα, τοπικό ιστορικό και οι σημειώσεις κρατούν συνέχεια μέσα στη συσκευή.",
      "Το Pantavion θα χτίζεται με μνήμη ροής, όχι με ξεχασμένα αποκομμένα νήματα.",
    ],

    sosHistoryText:
      "Πατήθηκε το κόκκινο SOS στην ειδική λειτουργία ηλικιωμένου. Άνοιξε το Live SOS για αποστολή/κοινοποίηση μέσω διαθέσιμων καναλιών.",
    languageSavedPrefix: "Η γλώσσα αποθηκεύτηκε ως",
    languageSavedSuffix: ".",
    languageHistoryPrefix: "Η γλώσσα της ειδικής οθόνης άλλαξε σε",
    localSosActivated:
      "Τοπικό SOS ενεργοποιήθηκε: ήχος/δόνηση όπου επιτρέπεται και καταγραφή ώρας στη συσκευή.",
    noteSaved: "Η σημείωση αποθηκεύτηκε τοπικά στη συσκευή με ημερομηνία και ώρα.",
    historyCleared: "Το τοπικό ιστορικό αυτής της οθόνης διαγράφηκε από τη συσκευή.",
  },

  en: {
    pageBadge: "Pantavion Elder Safe Mode",
    pageTitle: "A simple protection screen.",
    pageIntro:
      "For elders, people living alone, and users who need large buttons, clear voice support, simple help, language choice, and less confusion.",
    languageLabel: "Language",
    languageHelp:
      "Your choice is stored with the global Pantavion key so it is not lost between SOS, translation, and AI friend flows.",
    emergencyBoundary:
      "The red SOS is for immediate danger. It does not promise automatic government dispatch, ambulance dispatch, or satellite rescue without a certified provider.",

    redKicker: "Red = Immediate danger",
    sosButton: "SOS",
    redTitle: "One tap: strong device alert and time record.",
    redBody:
      "Emergency contacts must be set in advance. For the full Live SOS flow, open the main SOS page.",
    openLiveSos: "Open Live SOS",
    emergencyCircle: "Emergency Circle",

    orangeKicker: "Orange = Help / Translation",
    orangeTitle: "Speak and understand.",
    orangeBody:
      "For home, hospital, street, taxi, public service, or a person speaking another language. It does not access the green private history.",
    orangeButton: "Help / Translation",

    greenKicker: "Green = AI Friend / Journal",
    greenTitle: "Speak or write what worries you.",
    greenBody:
      "Full natural voice AI will come with the PantaAI provider layer. For now, we keep the right local journal with date and time.",
    greenNoteLabel: "Write a note for yourself or the family you have chosen:",
    greenPlaceholder:
      "Example: today I felt dizzy, lonely, or I want to speak with my family...",
    saveToPhone: "Save to phone",
    aiVoiceNext: "AI Friend: next stage",
    aiBoundary:
      "The AI Friend is not a doctor, does not diagnose, and does not replace emergency help. It will listen, organize concerns, and suggest human or medical help when needed.",

    historyTitle: "Local history",
    historyBody: "Stored on this device with date, time, and continuity.",
    deleteHistory: "Delete history",
    noHistory: "There is no local history on this device yet.",
    sosHistoryLabel: "SOS",
    languageHistoryLabel: "Language",
    noteHistoryLabel: "Note",

    rulesTitle: "Protection and continuity rules",
    rules: [
      "The caregiver does not get automatic access to the green history.",
      "Family sees only what the user allows or what a lawful guardian rule permits.",
      "Orange helps live communication, not reading private files.",
      "Language, local history, and notes keep continuity on the device.",
      "Pantavion will be built with flow memory, not forgotten isolated threads.",
    ],

    sosHistoryText:
      "The red SOS was pressed in Elder Safe Mode. Live SOS was opened for sending/sharing through available channels.",
    languageSavedPrefix: "Language saved as",
    languageSavedSuffix: ".",
    languageHistoryPrefix: "The special screen language changed to",
    localSosActivated:
      "Local SOS activated: sound/vibration where allowed and time recorded on the device.",
    noteSaved: "The note was saved locally on the device with date and time.",
    historyCleared: "The local history of this screen was deleted from the device.",
  },

  tr: {
    pageBadge: "Pantavion Yaşlı Güvenli Modu",
    pageTitle: "Basit bir koruma ekranı.",
    pageIntro:
      "Yaşlılar, yalnız yaşayan kişiler ve büyük düğmeler, net ses, basit yardım, dil seçimi ve daha az karmaşa isteyen kullanıcılar için.",
    languageLabel: "Dil",
    languageHelp:
      "Seçim, SOS, çeviri ve AI arkadaş akışları arasında kaybolmaması için global Pantavion anahtarıyla saklanır.",
    emergencyBoundary:
      "Kırmızı SOS acil tehlike içindir. Sertifikalı sağlayıcı olmadan otomatik resmi sevk, ambulans veya uydu kurtarma sözü vermez.",

    redKicker: "Kırmızı = Acil tehlike",
    sosButton: "SOS",
    redTitle: "Tek dokunuş: cihazda güçlü uyarı ve zaman kaydı.",
    redBody:
      "Acil kişiler önceden ayarlanmış olmalıdır. Tam Live SOS akışı için ana SOS sayfasını açın.",
    openLiveSos: "Live SOS'u aç",
    emergencyCircle: "Acil Çevre",

    orangeKicker: "Turuncu = Yardım / Çeviri",
    orangeTitle: "Konuş ve anla.",
    orangeBody:
      "Ev, hastane, sokak, taksi, kamu hizmeti veya başka dil konuşan biri için. Yeşil özel geçmişe erişmez.",
    orangeButton: "Yardım / Çeviri",

    greenKicker: "Yeşil = AI Arkadaş / Günlük",
    greenTitle: "Seni endişelendiren şeyi konuş veya yaz.",
    greenBody:
      "Doğal sesli tam AI, PantaAI sağlayıcı katmanıyla gelecek. Şimdilik doğru yerel günlüğü tarih ve saatle tutuyoruz.",
    greenNoteLabel: "Kendin veya seçtiğin aile için bir not yaz:",
    greenPlaceholder:
      "Örn. bugün başım döndü, yalnız hissettim veya ailemle konuşmak istiyorum...",
    saveToPhone: "Telefona kaydet",
    aiVoiceNext: "AI Arkadaş: sonraki aşama",
    aiBoundary:
      "AI Arkadaş doktor değildir, tanı koymaz ve acil yardımın yerini almaz. Dinler, endişeleri düzenler ve gerektiğinde insan veya tıbbi yardım önerir.",

    historyTitle: "Yerel geçmiş",
    historyBody: "Bu cihazda tarih, saat ve süreklilikle saklanır.",
    deleteHistory: "Geçmişi sil",
    noHistory: "Bu cihazda henüz yerel geçmiş yok.",
    sosHistoryLabel: "SOS",
    languageHistoryLabel: "Dil",
    noteHistoryLabel: "Not",

    rulesTitle: "Koruma ve süreklilik kuralları",
    rules: [
      "Bakıcı yeşil geçmişe otomatik erişim almaz.",
      "Aile yalnızca kullanıcının izin verdiğini veya yasal guardian kuralının izin verdiğini görür.",
      "Turuncu canlı iletişime yardım eder, özel dosyaları okumaz.",
      "Dil, yerel geçmiş ve notlar cihazda süreklilik sağlar.",
      "Pantavion, unutulan kopuk konularla değil akış hafızasıyla inşa edilecektir.",
    ],

    sosHistoryText:
      "Yaşlı Güvenli Modunda kırmızı SOS'a basıldı. Live SOS mevcut kanallardan gönderme/paylaşma için açıldı.",
    languageSavedPrefix: "Dil kaydedildi:",
    languageSavedSuffix: ".",
    languageHistoryPrefix: "Özel ekran dili değiştirildi:",
    localSosActivated:
      "Yerel SOS etkinleştirildi: izin verilen yerde ses/titreşim ve cihazda zaman kaydı.",
    noteSaved: "Not, tarih ve saatle cihazda yerel olarak kaydedildi.",
    historyCleared: "Bu ekranın yerel geçmişi cihazdan silindi.",
  },

  ar: {
    pageBadge: "وضع Pantavion الآمن لكبار السن",
    pageTitle: "شاشة حماية بسيطة.",
    pageIntro:
      "لكبار السن، والأشخاص الذين يعيشون وحدهم، والمستخدمين الذين يحتاجون إلى أزرار كبيرة، وصوت واضح، ومساعدة بسيطة، واختيار اللغة، وتقليل الارتباك.",
    languageLabel: "اللغة",
    languageHelp:
      "يتم حفظ اختيارك بمفتاح Pantavion عالمي حتى لا يضيع بين SOS والترجمة وصديق AI.",
    emergencyBoundary:
      "زر SOS الأحمر مخصص للخطر الفوري. لا يعد بإرسال حكومي أو إسعاف أو إنقاذ عبر الأقمار الصناعية بدون مزود معتمد.",

    redKicker: "الأحمر = خطر فوري",
    sosButton: "SOS",
    redTitle: "ضغطة واحدة: تنبيه قوي على الجهاز وتسجيل الوقت.",
    redBody:
      "يجب تحديد جهات الطوارئ مسبقًا. لفتح تدفق Live SOS الكامل، افتح صفحة SOS الرئيسية.",
    openLiveSos: "فتح Live SOS",
    emergencyCircle: "دائرة الطوارئ",

    orangeKicker: "البرتقالي = مساعدة / ترجمة",
    orangeTitle: "تحدث وافهم.",
    orangeBody:
      "للمنزل، المستشفى، الشارع، التاكسي، الخدمة العامة، أو شخص يتحدث لغة أخرى. لا يصل إلى التاريخ الخاص الأخضر.",
    orangeButton: "مساعدة / ترجمة",

    greenKicker: "الأخضر = صديق AI / يوميات",
    greenTitle: "تحدث أو اكتب ما يقلقك.",
    greenBody:
      "سيأتي الذكاء الاصطناعي الصوتي الكامل مع طبقة مزود PantaAI. الآن نحفظ اليوميات المحلية الصحيحة بالتاريخ والوقت.",
    greenNoteLabel: "اكتب ملاحظة لنفسك أو للعائلة التي اخترتها:",
    greenPlaceholder:
      "مثال: شعرت اليوم بالدوار أو الوحدة أو أريد التحدث مع عائلتي...",
    saveToPhone: "حفظ على الهاتف",
    aiVoiceNext: "صديق AI: المرحلة التالية",
    aiBoundary:
      "صديق AI ليس طبيبًا، ولا يشخص، ولا يستبدل المساعدة الطارئة. سيستمع، وينظم المخاوف، ويقترح مساعدة بشرية أو طبية عند الحاجة.",

    historyTitle: "السجل المحلي",
    historyBody: "يتم حفظه على هذا الجهاز مع التاريخ والوقت والاستمرارية.",
    deleteHistory: "حذف السجل",
    noHistory: "لا يوجد سجل محلي على هذا الجهاز بعد.",
    sosHistoryLabel: "SOS",
    languageHistoryLabel: "اللغة",
    noteHistoryLabel: "ملاحظة",

    rulesTitle: "قواعد الحماية والاستمرارية",
    rules: [
      "لا يحصل مقدم الرعاية على وصول تلقائي إلى السجل الأخضر.",
      "ترى العائلة فقط ما يسمح به المستخدم أو ما تسمح به قاعدة الوصي القانونية.",
      "البرتقالي يساعد على التواصل المباشر، وليس قراءة الملفات الخاصة.",
      "اللغة والسجل المحلي والملاحظات تحفظ الاستمرارية داخل الجهاز.",
      "سيتم بناء Pantavion بذاكرة تدفق، وليس بخيوط منفصلة منسية.",
    ],

    sosHistoryText:
      "تم الضغط على زر SOS الأحمر في وضع كبار السن الآمن. تم فتح Live SOS للإرسال/المشاركة عبر القنوات المتاحة.",
    languageSavedPrefix: "تم حفظ اللغة كـ",
    languageSavedSuffix: ".",
    languageHistoryPrefix: "تم تغيير لغة الشاشة الخاصة إلى",
    localSosActivated:
      "تم تفعيل SOS المحلي: صوت/اهتزاز حيثما يُسمح، وتسجيل الوقت على الجهاز.",
    noteSaved: "تم حفظ الملاحظة محليًا على الجهاز مع التاريخ والوقت.",
    historyCleared: "تم حذف السجل المحلي لهذه الشاشة من الجهاز.",
  },

  fr: {
    pageBadge: "Mode sécurité senior Pantavion",
    pageTitle: "Un écran de protection simple.",
    pageIntro:
      "Pour les personnes âgées, les personnes vivant seules et les utilisateurs qui ont besoin de grands boutons, d'une voix claire, d'une aide simple, d'un choix de langue et de moins de confusion.",
    languageLabel: "Langue",
    languageHelp:
      "Le choix est enregistré avec la clé globale Pantavion afin de ne pas être perdu entre SOS, traduction et ami AI.",
    emergencyBoundary:
      "Le SOS rouge est réservé au danger immédiat. Il ne promet pas d'envoi officiel, d'ambulance ou de secours satellite sans fournisseur certifié.",

    redKicker: "Rouge = Danger immédiat",
    sosButton: "SOS",
    redTitle: "Un appui : alerte forte sur l'appareil et heure enregistrée.",
    redBody:
      "Les contacts d'urgence doivent être définis à l'avance. Pour le flux Live SOS complet, ouvrez la page SOS principale.",
    openLiveSos: "Ouvrir Live SOS",
    emergencyCircle: "Cercle d'urgence",

    orangeKicker: "Orange = Aide / Traduction",
    orangeTitle: "Parlez et comprenez.",
    orangeBody:
      "Pour la maison, l'hôpital, la rue, le taxi, un service public ou une personne parlant une autre langue. Cela n'accède pas à l'historique privé vert.",
    orangeButton: "Aide / Traduction",

    greenKicker: "Vert = Ami AI / Journal",
    greenTitle: "Parlez ou écrivez ce qui vous préoccupe.",
    greenBody:
      "L'AI avec voix naturelle complète arrivera avec la couche fournisseur PantaAI. Pour l'instant, nous gardons le bon journal local avec date et heure.",
    greenNoteLabel: "Écrivez une note pour vous-même ou la famille choisie :",
    greenPlaceholder:
      "Exemple : aujourd'hui j'ai eu des vertiges, je me suis senti seul ou je veux parler à ma famille...",
    saveToPhone: "Enregistrer sur le téléphone",
    aiVoiceNext: "Ami AI : prochaine étape",
    aiBoundary:
      "L'Ami AI n'est pas médecin, ne diagnostique pas et ne remplace pas l'aide d'urgence. Il écoutera, organisera les inquiétudes et proposera une aide humaine ou médicale si nécessaire.",

    historyTitle: "Historique local",
    historyBody: "Stocké sur cet appareil avec date, heure et continuité.",
    deleteHistory: "Supprimer l'historique",
    noHistory: "Il n'y a pas encore d'historique local sur cet appareil.",
    sosHistoryLabel: "SOS",
    languageHistoryLabel: "Langue",
    noteHistoryLabel: "Note",

    rulesTitle: "Règles de protection et de continuité",
    rules: [
      "L'aidant n'obtient pas un accès automatique à l'historique vert.",
      "La famille voit seulement ce que l'utilisateur autorise ou ce qu'une règle légale de tuteur permet.",
      "L'orange aide la communication en direct, pas la lecture de fichiers privés.",
      "La langue, l'historique local et les notes gardent la continuité sur l'appareil.",
      "Pantavion sera construit avec une mémoire de flux, pas avec des fils isolés oubliés.",
    ],

    sosHistoryText:
      "Le SOS rouge a été pressé en mode sécurité senior. Live SOS a été ouvert pour envoyer/partager via les canaux disponibles.",
    languageSavedPrefix: "Langue enregistrée :",
    languageSavedSuffix: ".",
    languageHistoryPrefix: "La langue de l'écran spécial est passée à",
    localSosActivated:
      "SOS local activé : son/vibration si autorisé et heure enregistrée sur l'appareil.",
    noteSaved: "La note a été enregistrée localement sur l'appareil avec date et heure.",
    historyCleared: "L'historique local de cet écran a été supprimé de l'appareil.",
  },

  de: {
    pageBadge: "Pantavion Senioren-Sicherheitsmodus",
    pageTitle: "Ein einfacher Schutzbildschirm.",
    pageIntro:
      "Für ältere Menschen, allein lebende Personen und Nutzer, die große Tasten, klare Stimme, einfache Hilfe, Sprachauswahl und weniger Verwirrung brauchen.",
    languageLabel: "Sprache",
    languageHelp:
      "Die Auswahl wird mit dem globalen Pantavion-Schlüssel gespeichert, damit sie zwischen SOS, Übersetzung und AI-Freund nicht verloren geht.",
    emergencyBoundary:
      "Das rote SOS ist für unmittelbare Gefahr. Es verspricht keinen automatischen staatlichen Einsatz, Krankenwagen oder Satellitenrettung ohne zertifizierten Anbieter.",

    redKicker: "Rot = Unmittelbare Gefahr",
    sosButton: "SOS",
    redTitle: "Ein Tastendruck: starke Gerätewarnung und Zeitaufzeichnung.",
    redBody:
      "Notfallkontakte müssen vorher eingerichtet sein. Für den vollständigen Live-SOS-Ablauf öffnen Sie die Haupt-SOS-Seite.",
    openLiveSos: "Live SOS öffnen",
    emergencyCircle: "Notfallkreis",

    orangeKicker: "Orange = Hilfe / Übersetzung",
    orangeTitle: "Sprechen und verstehen.",
    orangeBody:
      "Für Zuhause, Krankenhaus, Straße, Taxi, Behörde oder eine Person mit anderer Sprache. Es greift nicht auf den grünen privaten Verlauf zu.",
    orangeButton: "Hilfe / Übersetzung",

    greenKicker: "Grün = AI-Freund / Tagebuch",
    greenTitle: "Sprechen oder schreiben Sie, was Sie beschäftigt.",
    greenBody:
      "Vollständige natürliche Sprach-AI kommt mit der PantaAI-Anbieterschicht. Vorerst speichern wir das richtige lokale Tagebuch mit Datum und Uhrzeit.",
    greenNoteLabel: "Schreiben Sie eine Notiz für sich oder die ausgewählte Familie:",
    greenPlaceholder:
      "Beispiel: Heute war mir schwindlig, ich fühlte mich allein oder möchte mit meiner Familie sprechen...",
    saveToPhone: "Auf Telefon speichern",
    aiVoiceNext: "AI-Freund: nächste Stufe",
    aiBoundary:
      "Der AI-Freund ist kein Arzt, stellt keine Diagnose und ersetzt keine Notfallhilfe. Er hört zu, ordnet Sorgen und empfiehlt bei Bedarf menschliche oder medizinische Hilfe.",

    historyTitle: "Lokaler Verlauf",
    historyBody: "Auf diesem Gerät mit Datum, Uhrzeit und Kontinuität gespeichert.",
    deleteHistory: "Verlauf löschen",
    noHistory: "Auf diesem Gerät gibt es noch keinen lokalen Verlauf.",
    sosHistoryLabel: "SOS",
    languageHistoryLabel: "Sprache",
    noteHistoryLabel: "Notiz",

    rulesTitle: "Schutz- und Kontinuitätsregeln",
    rules: [
      "Die Pflegeperson erhält keinen automatischen Zugriff auf den grünen Verlauf.",
      "Die Familie sieht nur, was der Nutzer erlaubt oder was eine rechtmäßige Vormund-Regel erlaubt.",
      "Orange hilft bei Live-Kommunikation, nicht beim Lesen privater Dateien.",
      "Sprache, lokaler Verlauf und Notizen behalten Kontinuität auf dem Gerät.",
      "Pantavion wird mit Flussgedächtnis gebaut, nicht mit vergessenen getrennten Threads.",
    ],

    sosHistoryText:
      "Das rote SOS wurde im Senioren-Sicherheitsmodus gedrückt. Live SOS wurde zum Senden/Teilen über verfügbare Kanäle geöffnet.",
    languageSavedPrefix: "Sprache gespeichert als",
    languageSavedSuffix: ".",
    languageHistoryPrefix: "Die Sprache des Spezialbildschirms wurde geändert zu",
    localSosActivated:
      "Lokales SOS aktiviert: Ton/Vibration, wo erlaubt, und Zeit auf dem Gerät gespeichert.",
    noteSaved: "Die Notiz wurde lokal auf dem Gerät mit Datum und Uhrzeit gespeichert.",
    historyCleared: "Der lokale Verlauf dieses Bildschirms wurde vom Gerät gelöscht.",
  },

  es: {
    pageBadge: "Modo seguro para mayores Pantavion",
    pageTitle: "Una pantalla simple de protección.",
    pageIntro:
      "Para personas mayores, personas que viven solas y usuarios que necesitan botones grandes, voz clara, ayuda simple, elección de idioma y menos confusión.",
    languageLabel: "Idioma",
    languageHelp:
      "La elección se guarda con la clave global de Pantavion para que no se pierda entre SOS, traducción y amigo AI.",
    emergencyBoundary:
      "El SOS rojo es para peligro inmediato. No promete despacho oficial, ambulancia o rescate satelital sin proveedor certificado.",

    redKicker: "Rojo = Peligro inmediato",
    sosButton: "SOS",
    redTitle: "Un toque: alerta fuerte en el dispositivo y registro de hora.",
    redBody:
      "Los contactos de emergencia deben configurarse antes. Para el flujo Live SOS completo, abre la página principal de SOS.",
    openLiveSos: "Abrir Live SOS",
    emergencyCircle: "Círculo de emergencia",

    orangeKicker: "Naranja = Ayuda / Traducción",
    orangeTitle: "Habla y entiende.",
    orangeBody:
      "Para casa, hospital, calle, taxi, servicio público o una persona que habla otro idioma. No accede al historial privado verde.",
    orangeButton: "Ayuda / Traducción",

    greenKicker: "Verde = Amigo AI / Diario",
    greenTitle: "Habla o escribe lo que te preocupa.",
    greenBody:
      "La AI completa con voz natural llegará con la capa de proveedor PantaAI. Por ahora guardamos el diario local correcto con fecha y hora.",
    greenNoteLabel: "Escribe una nota para ti o para la familia que elegiste:",
    greenPlaceholder:
      "Ejemplo: hoy me sentí mareado, solo, o quiero hablar con mi familia...",
    saveToPhone: "Guardar en el teléfono",
    aiVoiceNext: "Amigo AI: siguiente etapa",
    aiBoundary:
      "El Amigo AI no es médico, no diagnostica y no reemplaza la ayuda de emergencia. Escuchará, organizará preocupaciones y sugerirá ayuda humana o médica cuando sea necesario.",

    historyTitle: "Historial local",
    historyBody: "Guardado en este dispositivo con fecha, hora y continuidad.",
    deleteHistory: "Eliminar historial",
    noHistory: "Aún no hay historial local en este dispositivo.",
    sosHistoryLabel: "SOS",
    languageHistoryLabel: "Idioma",
    noteHistoryLabel: "Nota",

    rulesTitle: "Reglas de protección y continuidad",
    rules: [
      "El cuidador no obtiene acceso automático al historial verde.",
      "La familia ve solo lo que el usuario permite o lo que permite una regla legal de tutor.",
      "El naranja ayuda a la comunicación en vivo, no a leer archivos privados.",
      "El idioma, historial local y notas mantienen continuidad en el dispositivo.",
      "Pantavion se construirá con memoria de flujo, no con hilos aislados olvidados.",
    ],

    sosHistoryText:
      "Se presionó el SOS rojo en el Modo seguro para mayores. Live SOS se abrió para enviar/compartir por canales disponibles.",
    languageSavedPrefix: "Idioma guardado como",
    languageSavedSuffix: ".",
    languageHistoryPrefix: "El idioma de la pantalla especial cambió a",
    localSosActivated:
      "SOS local activado: sonido/vibración donde se permita y hora registrada en el dispositivo.",
    noteSaved: "La nota se guardó localmente en el dispositivo con fecha y hora.",
    historyCleared: "El historial local de esta pantalla fue eliminado del dispositivo.",
  },

  it: {
    pageBadge: "Modalità sicura anziani Pantavion",
    pageTitle: "Una schermata semplice di protezione.",
    pageIntro:
      "Per anziani, persone che vivono sole e utenti che hanno bisogno di pulsanti grandi, voce chiara, aiuto semplice, scelta lingua e meno confusione.",
    languageLabel: "Lingua",
    languageHelp:
      "La scelta viene salvata con la chiave globale Pantavion così non si perde tra SOS, traduzione e amico AI.",
    emergencyBoundary:
      "Il SOS rosso è per pericolo immediato. Non promette invio ufficiale, ambulanza o soccorso satellitare senza provider certificato.",

    redKicker: "Rosso = Pericolo immediato",
    sosButton: "SOS",
    redTitle: "Un tocco: forte avviso sul dispositivo e registrazione dell'ora.",
    redBody:
      "I contatti di emergenza devono essere impostati prima. Per il flusso Live SOS completo, apri la pagina SOS principale.",
    openLiveSos: "Apri Live SOS",
    emergencyCircle: "Cerchia emergenza",

    orangeKicker: "Arancione = Aiuto / Traduzione",
    orangeTitle: "Parla e capisci.",
    orangeBody:
      "Per casa, ospedale, strada, taxi, servizio pubblico o una persona che parla un'altra lingua. Non accede alla cronologia privata verde.",
    orangeButton: "Aiuto / Traduzione",

    greenKicker: "Verde = Amico AI / Diario",
    greenTitle: "Parla o scrivi ciò che ti preoccupa.",
    greenBody:
      "L'AI completa con voce naturale arriverà con il layer provider PantaAI. Per ora manteniamo il diario locale corretto con data e ora.",
    greenNoteLabel: "Scrivi una nota per te o per la famiglia scelta:",
    greenPlaceholder:
      "Esempio: oggi mi sono sentito stordito, solo, o voglio parlare con la mia famiglia...",
    saveToPhone: "Salva sul telefono",
    aiVoiceNext: "Amico AI: fase successiva",
    aiBoundary:
      "L'Amico AI non è un medico, non fa diagnosi e non sostituisce l'aiuto di emergenza. Ascolterà, organizzerà le preoccupazioni e suggerirà aiuto umano o medico quando serve.",

    historyTitle: "Cronologia locale",
    historyBody: "Salvata su questo dispositivo con data, ora e continuità.",
    deleteHistory: "Elimina cronologia",
    noHistory: "Non c'è ancora cronologia locale su questo dispositivo.",
    sosHistoryLabel: "SOS",
    languageHistoryLabel: "Lingua",
    noteHistoryLabel: "Nota",

    rulesTitle: "Regole di protezione e continuità",
    rules: [
      "Il caregiver non ottiene accesso automatico alla cronologia verde.",
      "La famiglia vede solo ciò che l'utente consente o ciò che permette una regola legale di tutore.",
      "L'arancione aiuta la comunicazione live, non la lettura di file privati.",
      "Lingua, cronologia locale e note mantengono continuità sul dispositivo.",
      "Pantavion sarà costruito con memoria di flusso, non con thread isolati dimenticati.",
    ],

    sosHistoryText:
      "Il SOS rosso è stato premuto in Modalità sicura anziani. Live SOS è stato aperto per inviare/condividere tramite canali disponibili.",
    languageSavedPrefix: "Lingua salvata come",
    languageSavedSuffix: ".",
    languageHistoryPrefix: "La lingua della schermata speciale è cambiata in",
    localSosActivated:
      "SOS locale attivato: suono/vibrazione dove consentito e ora registrata sul dispositivo.",
    noteSaved: "La nota è stata salvata localmente sul dispositivo con data e ora.",
    historyCleared: "La cronologia locale di questa schermata è stata eliminata dal dispositivo.",
  },

  ro: {
    pageBadge: "Mod sigur pentru vârstnici Pantavion",
    pageTitle: "Un ecran simplu de protecție.",
    pageIntro:
      "Pentru vârstnici, persoane care locuiesc singure și utilizatori care au nevoie de butoane mari, voce clară, ajutor simplu, alegerea limbii și mai puțină confuzie.",
    languageLabel: "Limbă",
    languageHelp:
      "Alegerea este salvată cu cheia globală Pantavion, ca să nu se piardă între SOS, traducere și prietenul AI.",
    emergencyBoundary:
      "SOS-ul roșu este pentru pericol imediat. Nu promite intervenție oficială, ambulanță sau salvare prin satelit fără furnizor certificat.",

    redKicker: "Roșu = Pericol imediat",
    sosButton: "SOS",
    redTitle: "O apăsare: alertă puternică pe dispozitiv și înregistrarea orei.",
    redBody:
      "Contactele de urgență trebuie setate dinainte. Pentru fluxul complet Live SOS, deschide pagina principală SOS.",
    openLiveSos: "Deschide Live SOS",
    emergencyCircle: "Cercul de urgență",

    orangeKicker: "Portocaliu = Ajutor / Traducere",
    orangeTitle: "Vorbește și înțelege.",
    orangeBody:
      "Pentru casă, spital, stradă, taxi, serviciu public sau o persoană care vorbește altă limbă. Nu accesează istoricul privat verde.",
    orangeButton: "Ajutor / Traducere",

    greenKicker: "Verde = Prieten AI / Jurnal",
    greenTitle: "Vorbește sau scrie ce te preocupă.",
    greenBody:
      "AI complet cu voce naturală va veni cu layerul de provider PantaAI. Deocamdată păstrăm jurnalul local corect cu dată și oră.",
    greenNoteLabel: "Scrie o notă pentru tine sau familia pe care ai ales-o:",
    greenPlaceholder:
      "Exemplu: astăzi m-am simțit amețit, singur sau vreau să vorbesc cu familia mea...",
    saveToPhone: "Salvează pe telefon",
    aiVoiceNext: "Prieten AI: etapa următoare",
    aiBoundary:
      "Prietenul AI nu este medic, nu pune diagnostic și nu înlocuiește ajutorul de urgență. Va asculta, va organiza îngrijorările și va sugera ajutor uman sau medical când este nevoie.",

    historyTitle: "Istoric local",
    historyBody: "Salvat pe acest dispozitiv cu dată, oră și continuitate.",
    deleteHistory: "Șterge istoricul",
    noHistory: "Nu există încă istoric local pe acest dispozitiv.",
    sosHistoryLabel: "SOS",
    languageHistoryLabel: "Limbă",
    noteHistoryLabel: "Notă",

    rulesTitle: "Reguli de protecție și continuitate",
    rules: [
      "Îngrijitorul nu primește acces automat la istoricul verde.",
      "Familia vede doar ce permite utilizatorul sau ce permite o regulă legală de tutore.",
      "Portocaliul ajută comunicarea live, nu citirea fișierelor private.",
      "Limba, istoricul local și notele păstrează continuitatea pe dispozitiv.",
      "Pantavion va fi construit cu memorie de flux, nu cu fire izolate uitate.",
    ],

    sosHistoryText:
      "SOS-ul roșu a fost apăsat în Modul sigur pentru vârstnici. Live SOS a fost deschis pentru trimitere/distribuire prin canale disponibile.",
    languageSavedPrefix: "Limba salvată ca",
    languageSavedSuffix: ".",
    languageHistoryPrefix: "Limba ecranului special a fost schimbată în",
    localSosActivated:
      "SOS local activat: sunet/vibrație unde este permis și ora înregistrată pe dispozitiv.",
    noteSaved: "Nota a fost salvată local pe dispozitiv cu dată și oră.",
    historyCleared: "Istoricul local al acestui ecran a fost șters de pe dispozitiv.",
  },

  ru: {
    pageBadge: "Безопасный режим для пожилых Pantavion",
    pageTitle: "Простой экран защиты.",
    pageIntro:
      "Для пожилых людей, людей, живущих одних, и пользователей, которым нужны большие кнопки, понятная голосовая помощь, простой интерфейс, выбор языка и меньше путаницы.",
    languageLabel: "Язык",
    languageHelp:
      "Выбор сохраняется глобальным ключом Pantavion, чтобы он не терялся между SOS, переводом и AI-другом.",
    emergencyBoundary:
      "Красный SOS предназначен для непосредственной опасности. Он не обещает автоматическую официальную отправку служб, скорую помощь или спутниковое спасение без сертифицированного провайдера.",

    redKicker: "Красный = Немедленная опасность",
    sosButton: "SOS",
    redTitle: "Одно нажатие: сильное оповещение на устройстве и запись времени.",
    redBody:
      "Экстренные контакты должны быть указаны заранее. Для полного потока Live SOS откройте основную страницу SOS.",
    openLiveSos: "Открыть Live SOS",
    emergencyCircle: "Экстренный круг",

    orangeKicker: "Оранжевый = Помощь / Перевод",
    orangeTitle: "Говорите и понимайте.",
    orangeBody:
      "Для дома, больницы, улицы, такси, госслужбы или человека, говорящего на другом языке. Не имеет доступа к зеленой приватной истории.",
    orangeButton: "Помощь / Перевод",

    greenKicker: "Зеленый = AI-друг / Журнал",
    greenTitle: "Говорите или пишите о том, что вас беспокоит.",
    greenBody:
      "Полный AI с естественным голосом появится с PantaAI provider layer. Пока мы ведем правильный локальный журнал с датой и временем.",
    greenNoteLabel: "Напишите заметку для себя или выбранной семьи:",
    greenPlaceholder:
      "Например: сегодня у меня кружилась голова, я чувствовал себя одиноко или хочу поговорить с семьей...",
    saveToPhone: "Сохранить на телефон",
    aiVoiceNext: "AI-друг: следующий этап",
    aiBoundary:
      "AI-друг не является врачом, не ставит диагноз и не заменяет экстренную помощь. Он будет слушать, упорядочивать тревоги и предлагать человеческую или медицинскую помощь при необходимости.",

    historyTitle: "Локальная история",
    historyBody: "Сохраняется на этом устройстве с датой, временем и непрерывностью.",
    deleteHistory: "Удалить историю",
    noHistory: "На этом устройстве пока нет локальной истории.",
    sosHistoryLabel: "SOS",
    languageHistoryLabel: "Язык",
    noteHistoryLabel: "Заметка",

    rulesTitle: "Правила защиты и непрерывности",
    rules: [
      "Опекун/сиделка не получает автоматический доступ к зеленой истории.",
      "Семья видит только то, что разрешил пользователь или законное правило опекуна.",
      "Оранжевый помогает живому общению, а не чтению личных файлов.",
      "Язык, локальная история и заметки сохраняют непрерывность на устройстве.",
      "Pantavion будет строиться с памятью потока, а не с забытыми отдельными ветками.",
    ],

    sosHistoryText:
      "Красная кнопка SOS была нажата в безопасном режиме для пожилых. Live SOS открыт для отправки/передачи через доступные каналы.",
    languageSavedPrefix: "Язык сохранен как",
    languageSavedSuffix: ".",
    languageHistoryPrefix: "Язык специального экрана изменен на",
    localSosActivated:
      "Локальный SOS активирован: звук/вибрация, где разрешено, и запись времени на устройстве.",
    noteSaved: "Заметка сохранена локально на устройстве с датой и временем.",
    historyCleared: "Локальная история этого экрана удалена с устройства.",
  },
};

function formatDateTime(value: string, languageCode: ElderLanguageCode) {
  return new Date(value).toLocaleString(languageCode, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function readHistory(): ElderHistoryItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(historyKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 8) : [];
  } catch {
    return [];
  }
}

function saveHistory(items: ElderHistoryItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(historyKey, JSON.stringify(items.slice(0, 12)));
}

function isSupportedLanguage(code: string): code is ElderLanguageCode {
  return languageOptions.some((language) => language.code === code);
}

function readLanguageCode(): ElderLanguageCode {
  if (typeof window === "undefined") return "el";

  const saved = window.localStorage.getItem(globalLanguageKey);
  if (saved && isSupportedLanguage(saved)) {
    return saved;
  }

  const browserLanguage = window.navigator.language?.slice(0, 2).toLowerCase();
  if (browserLanguage && isSupportedLanguage(browserLanguage)) {
    return browserLanguage;
  }

  return "el";
}

function readHelperLanguageCode(): ElderLanguageCode {
  if (typeof window === "undefined") return "en";

  const saved = window.localStorage.getItem(helperLanguageKey);
  if (saved && isSupportedLanguage(saved)) {
    return saved;
  }

  return "en";
}

function readTranslationMode(): ElderTranslationMode {
  if (typeof window === "undefined") return "auto";

  const saved = window.localStorage.getItem(translationModeKey);
  return saved === "manual" ? "manual" : "auto";
}

function createSiren() {
  if (typeof window === "undefined") return;

  try {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(720, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      1180,
      audioContext.currentTime + 0.35
    );
    oscillator.frequency.exponentialRampToValueAtTime(
      720,
      audioContext.currentTime + 0.7
    );

    gain.gain.setValueAtTime(0.001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.22, audioContext.currentTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1.8);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 1.85);
  } catch {
    // Browser/audio permission may block sound. The visual state still updates.
  }
}

export default function ElderSafeModePage() {
  const [history, setHistory] = useState<ElderHistoryItem[]>([]);
  const [note, setNote] = useState("");
  const [lastAction, setLastAction] = useState("");
  const [languageCode, setLanguageCode] = useState<ElderLanguageCode>("el");
  const [helperLanguageCode, setHelperLanguageCode] =
    useState<ElderLanguageCode>("en");
  const [translationMode, setTranslationMode] =
    useState<ElderTranslationMode>("auto");
  const [helperLanguageCode, setHelperLanguageCode] =
    useState<ElderLanguageCode>("en");

  const selectedLanguage = useMemo(
    () =>
      languageOptions.find((language) => language.code === languageCode) ??
      languageOptions[0],
    [languageCode]
  );

  const selectedHelperLanguage = useMemo(
    () =>
      languageOptions.find((language) => language.code === helperLanguageCode) ??
      languageOptions[1],
    [helperLanguageCode]
  );

  const t = elderTranslations[languageCode];

  useEffect(() => {
    setHistory(readHistory());
    setLanguageCode(readLanguageCode());
    setHelperLanguageCode(readHelperLanguageCode());
    setTranslationMode(readTranslationMode());
    setHelperLanguageCode(readHelperLanguageCode());
  }, []);

  function addHistoryItem(item: ElderHistoryItem) {
    const next = [item, ...history].slice(0, 12);
    setHistory(next);
    saveHistory(next);
  }

  function changeLanguage(nextCode: string) {
    const nextLanguage = isSupportedLanguage(nextCode) ? nextCode : "el";
    const nextLanguageMeta =
      languageOptions.find((language) => language.code === nextLanguage) ??
      languageOptions[0];
    const nextTranslation = elderTranslations[nextLanguage];

    setLanguageCode(nextLanguage);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(globalLanguageKey, nextLanguage);
    }

    addHistoryItem({
      id: `language-${Date.now()}`,
      mode: "language",
      text: `${nextTranslation.languageHistoryPrefix} ${nextLanguageMeta.nativeLabel}.`,
      createdAt: new Date().toISOString(),
    });

    setLastAction(
      `${nextTranslation.languageSavedPrefix} ${nextLanguageMeta.nativeLabel}${nextTranslation.languageSavedSuffix}`
    );
  }

  function changeHelperLanguage(nextCode: string) {
    const nextLanguage = isSupportedLanguage(nextCode) ? nextCode : "en";
    const nextLanguageMeta =
      languageOptions.find((language) => language.code === nextLanguage) ??
      languageOptions[1];

    setHelperLanguageCode(nextLanguage);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(helperLanguageKey, nextLanguage);
    }

    addHistoryItem({
      id: `helper-language-${Date.now()}`,
      mode: "language",
      text: `Η γλώσσα συνομιλητή / οικιακής βοηθού άλλαξε σε ${nextLanguageMeta.nativeLabel}.`,
      createdAt: new Date().toISOString(),
    });

    setLastAction(
      `Η δεύτερη γλώσσα αποθηκεύτηκε ως ${nextLanguageMeta.nativeLabel}.`
    );
  }

  function changeTranslationMode(nextMode: ElderTranslationMode) {
    setTranslationMode(nextMode);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(translationModeKey, nextMode);
    }

    setLastAction(
      nextMode === "auto"
        ? "Η πορτοκαλί μετάφραση θα ανοίγει με αυτόματη αναγνώριση ομιλίας."
        : "Η πορτοκαλί μετάφραση θα χρησιμοποιεί χειροκίνητη δεύτερη γλώσσα."
    );
  }

  function changeHelperLanguage(nextCode: string) {
    const nextLanguage = isSupportedLanguage(nextCode) ? nextCode : "en";
    const nextLanguageMeta =
      languageOptions.find((language) => language.code === nextLanguage) ??
      languageOptions[1];

    setHelperLanguageCode(nextLanguage);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(helperLanguageKey, nextLanguage);
    }

    addHistoryItem({
      id: `helper-language-${Date.now()}`,
      mode: "language",
      text: `Helper/counterparty language changed to ${nextLanguageMeta.nativeLabel}.`,
      createdAt: new Date().toISOString(),
    });

    setLastAction(`Η δεύτερη γλώσσα αποθηκεύτηκε ως ${nextLanguageMeta.nativeLabel}.`);
  }

  function activateLocalSos() {
    if ("vibrate" in navigator) {
      navigator.vibrate?.([700, 200, 700]);
    }

    createSiren();

    addHistoryItem({
      id: `sos-${Date.now()}`,
      mode: "sos",
      text: t.sosHistoryText,
      createdAt: new Date().toISOString(),
    });

    setLastAction(t.localSosActivated);
  }

  function saveAiNote() {
    const clean = note.trim();
    if (!clean) return;

    addHistoryItem({
      id: `note-${Date.now()}`,
      mode: "ai-note",
      text: clean,
      createdAt: new Date().toISOString(),
    });

    setNote("");
    setLastAction(t.noteSaved);
  }

  function clearLocalHistory() {
    setHistory([]);
    saveHistory([]);
    setLastAction(t.historyCleared);
  }

  return (
    <main
      className="min-h-screen bg-[#06111f] px-4 py-6 text-white"
      dir={selectedLanguage.direction}
      lang={selectedLanguage.code}
    >
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-5">
        <div className="rounded-[2rem] border border-white/15 bg-[#091a31] p-5 shadow-2xl">
          <p className="mb-3 text-sm font-black uppercase tracking-[0.35em] text-yellow-300">
            {t.pageBadge}
          </p>
          <h1 className="text-4xl font-black leading-tight sm:text-5xl">
            {t.pageTitle}
          </h1>
          <p className="mt-4 text-lg leading-8 text-white/85">{t.pageIntro}</p>

          <div className="mt-5 rounded-3xl border border-yellow-300/40 bg-yellow-300/10 p-4">
            <label
              htmlFor="elder-language"
              className="block text-xl font-black text-yellow-100"
            >
              {t.languageLabel}
            </label>
            <select
              id="elder-language"
              value={languageCode}
              onChange={(event) => changeLanguage(event.target.value)}
              className="mt-3 w-full rounded-2xl border-4 border-yellow-200 bg-white px-4 py-5 text-2xl font-black text-[#091a31] outline-none focus:ring-8 focus:ring-yellow-300"
            >
              {languageOptions.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.nativeLabel} - {language.label}
                </option>
              ))}
            </select>

            <div className="mt-5 rounded-2xl border border-orange-300/40 bg-orange-300/10 p-4">
              <label
                htmlFor="elder-helper-language"
                className="block text-xl font-black text-orange-100"
              >
                Γλώσσα οικιακής βοηθού / συνομιλητή
              </label>
              <select
                id="elder-helper-language"
                value={helperLanguageCode}
                onChange={(event) => changeHelperLanguage(event.target.value)}
                className="mt-3 w-full rounded-2xl border-4 border-orange-200 bg-white px-4 py-5 text-2xl font-black text-[#091a31] outline-none focus:ring-8 focus:ring-orange-300"
              >
                {languageOptions.map((language) => (
                  <option key={language.code} value={language.code}>
                    {language.nativeLabel} - {language.label}
                  </option>
                ))}
              </select>
              <p className="mt-3 text-base font-bold leading-7 text-orange-100">
                Αυτή είναι η δεύτερη γλώσσα για την πορτοκαλί βοήθεια /
                μετάφραση με οικιακή βοηθό, νοσηλευτή, γιατρό, ταξί,
                υπηρεσία ή άλλο άνθρωπο.
              </p>
            </div>

            <p className="mt-3 text-base font-bold leading-7 text-yellow-100">
              {t.languageHelp}
            </p>
          </div>

          <div className="mt-5 rounded-2xl border border-yellow-300/40 bg-yellow-300/10 p-4 text-base font-bold leading-7 text-yellow-100">
            {t.emergencyBoundary}
          </div>
        </div>

        <section className="rounded-[2rem] border-4 border-red-200 bg-red-700 p-5 shadow-2xl">
          <p className="text-lg font-black uppercase tracking-[0.18em] text-red-100">
            {t.redKicker}
          </p>
          <button
            type="button"
            onClick={activateLocalSos}
            className="mt-4 w-full rounded-[2rem] bg-red-100 px-6 py-12 text-center text-7xl font-black text-red-800 shadow-2xl transition hover:scale-[1.01] focus:outline-none focus:ring-8 focus:ring-white"
            aria-label={t.sosButton}
          >
            {t.sosButton}
          </button>
          <p className="mt-4 text-2xl font-black leading-9 text-white">
            {t.redTitle}
          </p>
          <p className="mt-2 text-lg leading-8 text-red-50">{t.redBody}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Link
              href="/sos"
              className="rounded-2xl bg-white px-5 py-5 text-center text-2xl font-black text-red-800"
            >
              {t.openLiveSos}
            </Link>
            <Link
              href="/sos/contacts"
              className="rounded-2xl border-2 border-white px-5 py-5 text-center text-2xl font-black text-white"
            >
              {t.emergencyCircle}
            </Link>
          </div>
        </section>

        <section className="rounded-[2rem] border-4 border-orange-200 bg-orange-500 p-5 shadow-2xl">
          <p className="text-lg font-black uppercase tracking-[0.18em] text-orange-950">
            {t.orangeKicker}
          </p>
          <h2 className="mt-3 text-4xl font-black leading-tight text-orange-950">
            {t.orangeTitle}
          </h2>
          <p className="mt-3 text-xl font-bold leading-9 text-orange-950">
            {t.orangeBody}
          </p>

          <div
            data-pantavion-elder-auto-speech-mode="true"
            className="mt-4 rounded-2xl border-4 border-orange-100 bg-white/85 p-4 text-orange-950"
          >
            <p className="text-lg font-black">Translation mode</p>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => changeTranslationMode("auto")}
                className={`rounded-2xl px-4 py-5 text-xl font-black ${
                  translationMode === "auto"
                    ? "bg-orange-950 text-orange-100"
                    : "border-4 border-orange-300 bg-white text-orange-950"
                }`}
              >
                Auto speech language detection
              </button>

              <button
                type="button"
                onClick={() => changeTranslationMode("manual")}
                className={`rounded-2xl px-4 py-5 text-xl font-black ${
                  translationMode === "manual"
                    ? "bg-orange-950 text-orange-100"
                    : "border-4 border-orange-300 bg-white text-orange-950"
                }`}
              >
                Manual second language backup
              </button>
            </div>

            {translationMode === "auto" ? (
              <div className="mt-4 rounded-2xl border-4 border-green-300 bg-green-50 p-4">
                <p className="text-2xl font-black">
                  {selectedLanguage.nativeLabel} ↔ auto-detect speech
                </p>
                <p className="mt-2 text-base font-bold leading-7">
                  Default mode: the elder speaks naturally. The other person
                  speaks naturally. Real live recognition requires a future
                  speech/translation provider, microphone consent and privacy controls.
                </p>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border-4 border-orange-300 bg-orange-50 p-4">
                <label
                  htmlFor="elder-helper-language"
                  className="block text-xl font-black"
                >
                  Helper / counterparty language
                </label>

                <select
                  id="elder-helper-language"
                  value={helperLanguageCode}
                  onChange={(event) => changeHelperLanguage(event.target.value)}
                  className="mt-3 w-full rounded-2xl border-4 border-orange-300 bg-white px-4 py-5 text-2xl font-black text-[#091a31] outline-none focus:ring-8 focus:ring-orange-300"
                >
                  {languageOptions.map((language) => (
                    <option key={language.code} value={language.code}>
                      {language.nativeLabel} - {language.label}
                    </option>
                  ))}
                </select>

                <p className="mt-3 text-2xl font-black">
                  {selectedLanguage.nativeLabel} → {selectedHelperLanguage.nativeLabel}
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 rounded-2xl border-4 border-orange-100 bg-white/80 p-4 text-orange-950">
            <p className="text-lg font-black">Γλώσσες συνομιλίας</p>
            <p className="mt-2 text-3xl font-black">
              {selectedLanguage.nativeLabel} → {selectedHelperLanguage.nativeLabel}
            </p>
            <p className="mt-2 text-base font-bold leading-7">
              Η πρώτη είναι του χρήστη. Η δεύτερη είναι του ανθρώπου που μιλά
              μαζί του.
            </p>
          </div>

          <Link
            href={`/sos-interpreter?from=${languageCode}&to=${helperLanguageCode}`}
            className="mt-5 block rounded-[2rem] bg-orange-950 px-6 py-8 text-center text-3xl font-black text-orange-100 shadow-xl"
          >
            {t.orangeButton}
          </Link>
        </section>

        <section className="rounded-[2rem] border-4 border-green-200 bg-green-600 p-5 shadow-2xl">
          <p className="text-lg font-black uppercase tracking-[0.18em] text-green-950">
            {t.greenKicker}
          </p>
          <h2 className="mt-3 text-4xl font-black leading-tight text-green-950">
            {t.greenTitle}
          </h2>
          <p className="mt-3 text-xl font-bold leading-9 text-green-950">
            {t.greenBody}
          </p>

          <label className="mt-5 block text-xl font-black text-green-950">
            {t.greenNoteLabel}
          </label>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={t.greenPlaceholder}
            className="mt-3 min-h-36 w-full rounded-3xl border-4 border-green-200 bg-white p-5 text-2xl font-bold leading-9 text-green-950 outline-none focus:ring-8 focus:ring-green-200"
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={saveAiNote}
              className="rounded-2xl bg-green-950 px-5 py-6 text-2xl font-black text-green-100"
            >
              {t.saveToPhone}
            </button>
            <button
              type="button"
              disabled
              className="rounded-2xl border-2 border-green-950/40 px-5 py-6 text-2xl font-black text-green-950/70"
            >
              {t.aiVoiceNext}
            </button>
          </div>
          <p className="mt-4 text-lg font-bold leading-8 text-green-950">
            {t.aiBoundary}
          </p>
        </section>

        <section className="rounded-[2rem] border border-white/15 bg-white/10 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-3xl font-black">{t.historyTitle}</h2>
              <p className="mt-2 text-lg text-white/75">{t.historyBody}</p>
            </div>
            <button
              type="button"
              onClick={clearLocalHistory}
              className="rounded-2xl border border-white/30 px-4 py-3 text-lg font-black text-white"
            >
              {t.deleteHistory}
            </button>
          </div>

          {lastAction ? (
            <div className="mt-4 rounded-2xl border border-yellow-300/50 bg-yellow-300/10 p-4 text-lg font-bold text-yellow-100">
              {lastAction}
            </div>
          ) : null}

          <div className="mt-5 grid gap-3">
            {history.length ? (
              history.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-white/15 bg-[#071426] p-4"
                >
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-yellow-300">
                    {item.mode === "sos"
                      ? t.sosHistoryLabel
                      : item.mode === "language"
                        ? t.languageHistoryLabel
                        : t.noteHistoryLabel}{" "}
                    · {formatDateTime(item.createdAt, languageCode)}
                  </p>
                  <p className="mt-2 text-lg font-bold leading-8 text-white/90">
                    {item.text}
                  </p>
                </article>
              ))
            ) : (
              <p className="rounded-2xl border border-white/15 bg-[#071426] p-4 text-lg text-white/75">
                {t.noHistory}
              </p>
            )}
          </div>
        </section>

        <div className="rounded-[2rem] border border-white/15 bg-[#091a31] p-5">
          <h2 className="text-2xl font-black">{t.rulesTitle}</h2>
          <ul className="mt-4 space-y-3 text-lg font-bold leading-8 text-white/85">
            {t.rules.map((rule) => (
              <li key={rule}>• {rule}</li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
