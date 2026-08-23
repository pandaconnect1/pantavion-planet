"use client";

import { useState, useRef } from "react";

// Πλήρες πακέτο γλωσσών / διαλέκτων για Pantavion Voice
const LANGS = [
  // Αγγλικά / Ελληνικά
  { code: "en-GB", label: "Αγγλικά (Ην. Βασίλειο)", voiceLang: "en-GB" },
  { code: "en-US", label: "Αγγλικά (ΗΠΑ)", voiceLang: "en-US" },
  { code: "el-GR", label: "Ελληνικά", voiceLang: "el-GR" },

  // Αραβικά - διάλεκτοι / περιοχές
  {
    code: "ar-levant",
    label: "Αραβικά (Συρία / Παλαιστίνη / Λίβανος / Ιορδανία)",
    voiceLang: "ar-SY",
  },
  {
    code: "ar-gulf",
    label: "Αραβικά (Σαουδική Αραβία / Κόλπος)",
    voiceLang: "ar-SA",
  },
  {
    code: "ar-egypt",
    label: "Αραβικά (Αίγυπτος)",
    voiceLang: "ar-EG",
  },
  {
    code: "ar-MA",
    label: "Αραβικά (Μαγκρέμπ / Μαρόκο)",
    voiceLang: "ar-MA",
  },

  // Τουρκικά, Πέρσικα, Κουρδικά, Εβραϊκά
  { code: "tr-TR", label: "Τουρκικά", voiceLang: "tr-TR" },
  { code: "fa-IR", label: "Περσικά (Ιράν)", voiceLang: "fa-IR" },
  { code: "ku-TR", label: "Κουρδικά (Kurmanji)", voiceLang: "ku-TR" },
  { code: "ku-IQ", label: "Κουρδικά (Sorani)", voiceLang: "ku-IQ" },
  { code: "he-IL", label: "Εβραϊκά", voiceLang: "he-IL" },

  // Κύριες ευρωπαϊκές
  { code: "fr-FR", label: "Γαλλικά (Γαλλία)", voiceLang: "fr-FR" },
  { code: "fr-CA", label: "Γαλλικά (Καναδάς)", voiceLang: "fr-CA" },
  { code: "es-ES", label: "Ισπανικά (Ισπανία)", voiceLang: "es-ES" },
  { code: "es-MX", label: "Ισπανικά (Μεξικό)", voiceLang: "es-MX" },
  { code: "es-AR", label: "Ισπανικά (Αργεντινή)", voiceLang: "es-AR" },
  { code: "es-CO", label: "Ισπανικά (Κολομβία)", voiceLang: "es-CO" },
  { code: "de-DE", label: "Γερμανικά", voiceLang: "de-DE" },
  { code: "it-IT", label: "Ιταλικά", voiceLang: "it-IT" },
  { code: "pt-PT", label: "Πορτογαλικά (Πορτογαλία)", voiceLang: "pt-PT" },
  { code: "pt-BR", label: "Πορτογαλικά (Βραζιλία)", voiceLang: "pt-BR" },
  { code: "nl-NL", label: "Ολλανδικά", voiceLang: "nl-NL" },
  { code: "sv-SE", label: "Σουηδικά", voiceLang: "sv-SE" },
  { code: "no-NO", label: "Νορβηγικά", voiceLang: "no-NO" },
  { code: "da-DK", label: "Δανέζικα", voiceLang: "da-DK" },
  { code: "fi-FI", label: "Φινλανδικά", voiceLang: "fi-FI" },
  { code: "is-IS", label: "Ισλανδικά", voiceLang: "is-IS" },
  { code: "pl-PL", label: "Πολωνικά", voiceLang: "pl-PL" },
  { code: "cs-CZ", label: "Τσέχικα", voiceLang: "cs-CZ" },
  { code: "sk-SK", label: "Σλοβακικά", voiceLang: "sk-SK" },
  { code: "sl-SI", label: "Σλοβενικά", voiceLang: "sl-SI" },
  { code: "hr-HR", label: "Κροατικά", voiceLang: "hr-HR" },
  { code: "sr-RS", label: "Σερβικά", voiceLang: "sr-RS" },
  { code: "bs-BA", label: "Βοσνιακά", voiceLang: "bs-BA" },
  { code: "mk-MK", label: "Σλαβομακεδονικά", voiceLang: "mk-MK" },
  { code: "ro-RO", label: "Ρουμανικά", voiceLang: "ro-RO" },
  { code: "bg-BG", label: "Βουλγαρικά", voiceLang: "bg-BG" },
  { code: "hu-HU", label: "Ουγγρικά", voiceLang: "hu-HU" },
  { code: "uk-UA", label: "Ουκρανικά", voiceLang: "uk-UA" },
  { code: "ru-RU", label: "Ρωσικά", voiceLang: "ru-RU" },
  { code: "be-BY", label: "Λευκορωσικά", voiceLang: "be-BY" },
  { code: "et-EE", label: "Εσθονικά", voiceLang: "et-EE" },
  { code: "lv-LV", label: "Λετονικά", voiceLang: "lv-LV" },
  { code: "lt-LT", label: "Λιθουανικά", voiceLang: "lt-LT" },
  { code: "ga-IE", label: "Ιρλανδικά", voiceLang: "ga-IE" },
  { code: "cy-GB", label: "Ουαλικά", voiceLang: "cy-GB" },

  // Ασία – Νότια Ασία
  { code: "hi-IN", label: "Χίντι", voiceLang: "hi-IN" },
  { code: "ur-PK", label: "Ούρντου", voiceLang: "ur-PK" },
  { code: "bn-BD", label: "Βεγγαλικά", voiceLang: "bn-BD" },
  { code: "ta-IN", label: "Ταμίλ", voiceLang: "ta-IN" },
  { code: "te-IN", label: "Τελούγκου", voiceLang: "te-IN" },
  { code: "ml-IN", label: "Μαλαγιαλάμ", voiceLang: "ml-IN" },
  { code: "kn-IN", label: "Κανάντα", voiceLang: "kn-IN" },
  { code: "si-LK", label: "Σινχαλέζικα", voiceLang: "si-LK" },
  { code: "ne-NP", label: "Νεπαλέζικα", voiceLang: "ne-NP" },

  // Ασία – Ανατολική / Νοτιοανατολική
  { code: "zh-CN", label: "Κινέζικα (Απλοποιημένα)", voiceLang: "zh-CN" },
  { code: "zh-TW", label: "Κινέζικα (Παραδοσιακά)", voiceLang: "zh-TW" },
  { code: "ja-JP", label: "Ιαπωνικά", voiceLang: "ja-JP" },
  { code: "ko-KR", label: "Κορεατικά", voiceLang: "ko-KR" },
  { code: "th-TH", label: "Ταϊλανδέζικα", voiceLang: "th-TH" },
  { code: "vi-VN", label: "Βιετναμέζικα", voiceLang: "vi-VN" },
  { code: "id-ID", label: "Ινδονησιακά", voiceLang: "id-ID" },
  { code: "ms-MY", label: "Μαλεϊκά", voiceLang: "ms-MY" },
  { code: "fil-PH", label: "Φιλιππινέζικα (Tagalog)", voiceLang: "fil-PH" },
  { code: "km-KH", label: "Χμερ (Καμπότζη)", voiceLang: "km-KH" },
  { code: "lo-LA", label: "Λαοτινά", voiceLang: "lo-LA" },
  { code: "my-MM", label: "Βιρμανικά", voiceLang: "my-MM" },

  // Αφρική – Ανατολική / Κεντρική
  { code: "am-ET", label: "Αμαρικά (Αιθιοπία)", voiceLang: "am-ET" },
  { code: "ti-ER", label: "Τιγκρινυα (Ερυθραία)", voiceLang: "ti-ER" },
  { code: "so-SO", label: "Σομαλικά", voiceLang: "so-SO" },
  { code: "sw-KE", label: "Σουαχίλι", voiceLang: "sw-KE" },
  { code: "rw-RW", label: "Κινιαρουάντα", voiceLang: "rw-RW" },
  { code: "rn-BI", label: "Kirundi", voiceLang: "rn-BI" },

  // Αφρική – Δυτική / Νιγηρία κ.λπ.
  { code: "ha-NE", label: "Χάουσα", voiceLang: "ha-NE" },
  { code: "yo-NG", label: "Γιορούμπα", voiceLang: "yo-NG" },
  { code: "ig-NG", label: "Ίγκμπο", voiceLang: "ig-NG" },

  // Αφρική – Νότια
  { code: "zu-ZA", label: "Ζουλού", voiceLang: "zu-ZA" },
  { code: "xh-ZA", label: "Κόσα", voiceLang: "xh-ZA" },
  { code: "st-ZA", label: "Σόθο", voiceLang: "st-ZA" },
];

// Βρίσκουμε ποια γλώσσα φωνής (TTS) θα χρησιμοποιηθεί
function getVoiceLangFromCode(code: string) {
  const found = LANGS.find((l) => l.code === code);
  return found?.voiceLang || "en-GB";
}

// Κωδικός που στέλνουμε στο translation API
function getApiLangFromCode(code: string) {
  // Όλες οι αραβικές διάλεκτοι -> "ar"
  if (code.startsWith("ar-")) return "ar";

  // Κινέζικα κρατάμε ολόκληρο (zh-CN / zh-TW)
  if (code.startsWith("zh-")) return code;

  // Αν έχει παύλα (en-GB) στέλνουμε μόνο το βασικό (en)
  if (code.includes("-")) return code.split("-")[0];

  return code;
}

export default function VoicePage() {
  const [inputText, setInputText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [targetLang, setTargetLang] = useState<string>("en-GB");

  const recognitionRef = useRef<any>(null);

  const startListening = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Το πρόγραμμα περιήγησης δεν υποστηρίζει μικρόφωνο.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "auto";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let text = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      setInputText(text);
    };

    recognition.onerror = (event: any) => {
      console.error("STT error:", event.error);
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const speak = (text: string) => {
    if (!text) return;
    if (typeof window === "undefined") return;

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = getVoiceLangFromCode(targetLang);
    window.speechSynthesis.speak(utter);
  };

  const translate = async () => {
    if (!inputText) return;

    const apiLang = getApiLangFromCode(targetLang);

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputText,
          targetLang: apiLang,
        }),
      });

      const data = await res.json();
      setTranslatedText(data.translation || "");
    } catch (err) {
      console.error(err);
      setTranslatedText("");
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-800/80 bg-slate-900/80 shadow-xl p-6 md:p-8 space-y-6">
        <header className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Pantavion Voice – Real Interpreter
          </h1>
          <p className="text-sm md:text-base text-slate-300">
            Αληθινός διερμηνέας φωνής σε πραγματικό χρόνο, για όλες τις χώρες.
          </p>
        </header>

        <section className="grid md:grid-cols-2 gap-4 md:gap-6">
          {/* ΑΡΙΣΤΕΡΑ: Εσύ μιλάς */}
          <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <h2 className="text-sm font-medium text-slate-200">Εσύ μιλάς</h2>

            <div className="space-y-2">
              <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-3 min-h-[60px] text-sm">
                {inputText || "Μίλα στο μικρόφωνο ή γράψε από κάτω..."}
              </div>

              <textarea
                className="w-full rounded-lg bg-slate-900/80 border border-slate-700 px-3 py-2 text-sm"
                rows={3}
                placeholder="Γράψε εδώ (π.χ. από κινητό, αν δεν δουλεύει το μικρόφωνο)..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
            </div>

            <button
              onClick={startListening}
              className="w-full rounded-full border border-emerald-500 bg-emerald-600/20 py-2 text-sm"
            >
              🎙️ Ξεκίνα εγγραφή
            </button>

            <button
              onClick={stopListening}
              className="w-full rounded-full border border-red-500 bg-red-600/20 py-2 text-sm"
            >
              ⛔ Σταμάτα
            </button>
          </div>

          {/* ΔΕΞΙΑ: Μετάφραση */}
          <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <h2 className="text-sm font-medium text-slate-200">
              Μετάφραση στη γλώσσα του άλλου
            </h2>

            <div className="space-y-2 text-xs text-slate-300">
              <span>Γλώσσα προορισμού:</span>
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="w-full rounded-lg bg-slate-900/80 border border-slate-700 px-3 py-2 text-xs"
              >
                {LANGS.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-3 min-h-[60px] text-sm">
              {translatedText || "Θα εμφανιστεί εδώ η μετάφραση..."}
            </div>

            <button
              onClick={translate}
              className="w-full rounded-full border border-purple-500 bg-purple-600/20 py-2 text-sm"
            >
              🌐 Μετάφραση
            </button>

            <button
              onClick={() => speak(translatedText)}
              className="w-full rounded-full border border-sky-500 bg-sky-600/20 py-2 text-sm"
            >
              🔊 Παίξε με ήχο
            </button>
          </div>
        </section>

        <footer className="pt-2 text-center text-[11px] text-slate-500">
          Pantavion One — Here We Are One. For All Humanity.
        </footer>
      </div>
    </main>
  );
}
