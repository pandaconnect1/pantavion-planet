"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ElderHistoryItem = {
  id: string;
  mode: "sos" | "ai-note";
  text: string;
  createdAt: string;
};

const historyKey = "pantavion_elder_safety_history_v1";

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("el-GR", {
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

  useEffect(() => {
    setHistory(readHistory());
  }, []);

  function addHistoryItem(item: ElderHistoryItem) {
    const next = [item, ...history].slice(0, 12);
    setHistory(next);
    saveHistory(next);
  }

  function activateLocalSos() {
    const now = new Date().toISOString();

    if ("vibrate" in navigator) {
      navigator.vibrate?.([700, 200, 700]);
    }

    createSiren();

    addHistoryItem({
      id: `sos-${Date.now()}`,
      mode: "sos",
      text:
        "Πατήθηκε το κόκκινο SOS στην ειδική λειτουργία ηλικιωμένου. Άνοιξε το Live SOS για αποστολή/κοινοποίηση μέσω διαθέσιμων καναλιών.",
      createdAt: now,
    });

    setLastAction(
      "Τοπικό SOS ενεργοποιήθηκε: ήχος/δόνηση όπου επιτρέπεται και καταγραφή ώρας στη συσκευή."
    );
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
    setLastAction("Η σημείωση αποθηκεύτηκε τοπικά στη συσκευή με ημερομηνία και ώρα.");
  }

  function clearLocalHistory() {
    setHistory([]);
    saveHistory([]);
    setLastAction("Το τοπικό ιστορικό αυτής της οθόνης διαγράφηκε από τη συσκευή.");
  }

  return (
    <main className="min-h-screen bg-[#06111f] px-4 py-6 text-white">
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-5">
        <div className="rounded-[2rem] border border-white/15 bg-[#091a31] p-5 shadow-2xl">
          <p className="mb-3 text-sm font-black uppercase tracking-[0.35em] text-yellow-300">
            Pantavion Elder Safe Mode
          </p>
          <h1 className="text-4xl font-black leading-tight sm:text-5xl">
            Απλή οθόνη προστασίας.
          </h1>
          <p className="mt-4 text-lg leading-8 text-white/85">
            Για ηλικιωμένους, ανθρώπους που ζουν μόνοι και χρήστες που χρειάζονται
            μεγάλα κουμπιά, καθαρή φωνή, απλή βοήθεια και λιγότερη σύγχυση.
          </p>
          <div className="mt-5 rounded-2xl border border-yellow-300/40 bg-yellow-300/10 p-4 text-base font-bold leading-7 text-yellow-100">
            Το κόκκινο SOS είναι για άμεσο κίνδυνο. Δεν υπόσχεται αυτόματη κρατική
            αποστολή, ασθενοφόρο ή δορυφορική διάσωση χωρίς πιστοποιημένο πάροχο.
          </div>
        </div>

        <section className="rounded-[2rem] border-4 border-red-200 bg-red-700 p-5 shadow-2xl">
          <p className="text-lg font-black uppercase tracking-[0.18em] text-red-100">
            Κόκκινο = Άμεσος κίνδυνος
          </p>
          <button
            type="button"
            onClick={activateLocalSos}
            className="mt-4 w-full rounded-[2rem] bg-red-100 px-6 py-12 text-center text-7xl font-black text-red-800 shadow-2xl transition hover:scale-[1.01] focus:outline-none focus:ring-8 focus:ring-white"
            aria-label="SOS άμεση βοήθεια"
          >
            SOS
          </button>
          <p className="mt-4 text-2xl font-black leading-9 text-white">
            Ένα πάτημα: δυνατή ειδοποίηση στη συσκευή και καταγραφή ώρας.
          </p>
          <p className="mt-2 text-lg leading-8 text-red-50">
            Οι επαφές έκτακτης ανάγκης πρέπει να έχουν δηλωθεί από πριν. Για την
            πλήρη Live SOS ροή άνοιξε την κύρια σελίδα SOS.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Link
              href="/sos"
              className="rounded-2xl bg-white px-5 py-5 text-center text-2xl font-black text-red-800"
            >
              Άνοιγμα Live SOS
            </Link>
            <Link
              href="/sos/contacts"
              className="rounded-2xl border-2 border-white px-5 py-5 text-center text-2xl font-black text-white"
            >
              Κύκλος ανάγκης
            </Link>
          </div>
        </section>

        <section className="rounded-[2rem] border-4 border-orange-200 bg-orange-500 p-5 shadow-2xl">
          <p className="text-lg font-black uppercase tracking-[0.18em] text-orange-950">
            Πορτοκαλί = Βοήθεια / Μετάφραση
          </p>
          <h2 className="mt-3 text-4xl font-black leading-tight text-orange-950">
            Μίλα και κατάλαβε.
          </h2>
          <p className="mt-3 text-xl font-bold leading-9 text-orange-950">
            Για σπίτι, νοσοκομείο, δρόμο, ταξί, υπηρεσία ή άνθρωπο που μιλά άλλη
            γλώσσα. Δεν δίνει πρόσβαση στο πράσινο προσωπικό ιστορικό.
          </p>
          <Link
            href="/sos-interpreter"
            className="mt-5 block rounded-[2rem] bg-orange-950 px-6 py-8 text-center text-3xl font-black text-orange-100 shadow-xl"
          >
            ΒΟΗΘΕΙΑ / ΜΕΤΑΦΡΑΣΗ
          </Link>
        </section>

        <section className="rounded-[2rem] border-4 border-green-200 bg-green-600 p-5 shadow-2xl">
          <p className="text-lg font-black uppercase tracking-[0.18em] text-green-950">
            Πράσινο = AI Φίλος / Ημερολόγιο
          </p>
          <h2 className="mt-3 text-4xl font-black leading-tight text-green-950">
            Μίλησε ή γράψε ό,τι σε απασχολεί.
          </h2>
          <p className="mt-3 text-xl font-bold leading-9 text-green-950">
            Το πλήρες AI με φυσική φωνή θα έρθει με το PantaAI provider layer.
            Από τώρα κρατάμε το σωστό τοπικό ημερολόγιο με ημερομηνία και ώρα.
          </p>

          <label className="mt-5 block text-xl font-black text-green-950">
            Γράψε σημείωση για εσένα ή την οικογένεια που έχεις επιλέξει:
          </label>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Π.χ. σήμερα ζαλίστηκα, ένιωσα μόνος/η ή θέλω να μιλήσω στα παιδιά μου..."
            className="mt-3 min-h-36 w-full rounded-3xl border-4 border-green-200 bg-white p-5 text-2xl font-bold leading-9 text-green-950 outline-none focus:ring-8 focus:ring-green-200"
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={saveAiNote}
              className="rounded-2xl bg-green-950 px-5 py-6 text-2xl font-black text-green-100"
            >
              Αποθήκευση στο κινητό
            </button>
            <button
              type="button"
              disabled
              className="rounded-2xl border-2 border-green-950/40 px-5 py-6 text-2xl font-black text-green-950/70"
            >
              AI Φωνή: επόμενο στάδιο
            </button>
          </div>
          <p className="mt-4 text-lg font-bold leading-8 text-green-950">
            Ο AI Φίλος δεν είναι γιατρός, δεν κάνει διάγνωση και δεν αντικαθιστά
            επείγουσα βοήθεια. Θα ακούει, θα οργανώνει ανησυχίες και θα προτείνει
            να ζητηθεί ανθρώπινη ή ιατρική βοήθεια όταν χρειάζεται.
          </p>
        </section>

        <section className="rounded-[2rem] border border-white/15 bg-white/10 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-3xl font-black">Τοπικό ιστορικό</h2>
              <p className="mt-2 text-lg text-white/75">
                Αποθηκεύεται στη συσκευή με ημερομηνία και ώρα.
              </p>
            </div>
            <button
              type="button"
              onClick={clearLocalHistory}
              className="rounded-2xl border border-white/30 px-4 py-3 text-lg font-black text-white"
            >
              Διαγραφή ιστορικού
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
                    {item.mode === "sos" ? "SOS" : "Σημείωση"} ·{" "}
                    {formatDateTime(item.createdAt)}
                  </p>
                  <p className="mt-2 text-lg font-bold leading-8 text-white/90">
                    {item.text}
                  </p>
                </article>
              ))
            ) : (
              <p className="rounded-2xl border border-white/15 bg-[#071426] p-4 text-lg text-white/75">
                Δεν υπάρχει ακόμα τοπικό ιστορικό σε αυτή τη συσκευή.
              </p>
            )}
          </div>
        </section>

        <div className="rounded-[2rem] border border-white/15 bg-[#091a31] p-5">
          <h2 className="text-2xl font-black">Κανόνες προστασίας</h2>
          <ul className="mt-4 space-y-3 text-lg font-bold leading-8 text-white/85">
            <li>• Ο φροντιστής δεν παίρνει αυτόματη πρόσβαση στο πράσινο ιστορικό.</li>
            <li>• Η οικογένεια βλέπει μόνο ό,τι επιτρέψει ο χρήστης ή νόμιμος guardian κανόνας.</li>
            <li>• Το πορτοκαλί βοηθά στη ζωντανή συνεννόηση, όχι στην ανάγνωση προσωπικών αρχείων.</li>
            <li>• Το κόκκινο είναι για κίνδυνο, με ξεκάθαρα όρια provider/legal/infrastructure.</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
