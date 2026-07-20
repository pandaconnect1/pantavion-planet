"use client";

import Link from "next/link";
import { useState } from "react";

const DEVICE_ID_KEY = "pantavion.water.help.deviceId.v1";
const DEVICE_TOKEN_KEY = "pantavion.water.help.deviceToken.v1";

const CATEGORIES = [
  { value: "tool_request", label: "Χρειάζομαι εργαλείο" },
  { value: "material_request", label: "Χρειάζομαι υλικό" },
  { value: "work_blocker", label: "Δεν μπορώ να προχωρήσω την εργασία" },
  { value: "collaboration_problem", label: "Πρόβλημα συνεργασίας" },
  { value: "safety_problem", label: "Πρόβλημα ασφάλειας" },
  { value: "service_problem", label: "Πρόβλημα με υπηρεσία / διαδικασία" },
  { value: "analysis_request", label: "Ζητώ ανάλυση / στατιστικά / αναφορά" },
  { value: "improvement_proposal", label: "Πρόταση βελτίωσης" },
  { value: "other", label: "Άλλο" },
] as const;

const ROLES = [
  { value: "worker", label: "Εργάτης" },
  { value: "technician", label: "Τεχνίτης" },
  { value: "assistant_supervisor", label: "Βοηθός επιστάτη" },
  { value: "supervisor", label: "Επιστάτης" },
  { value: "chief_supervisor", label: "Αρχιεπιστάτης" },
  { value: "warehouse", label: "Αποθήκη" },
  { value: "accounting", label: "Λογιστήριο" },
  { value: "technical_services", label: "Τεχνικές υπηρεσίες" },
  { value: "general_manager", label: "Γενικός διευθυντής" },
  { value: "president", label: "Πρόεδρος" },
] as const;

const CATEGORY_REQUIREMENTS: Record<
  string,
  {
    guide: string;
    needsLocationDetails: boolean;
  }
> = {
  tool_request: {
    guide: "Αίτημα εργαλείου: δεν χρειάζεται οδός, περιοχή ή ζώνη. Γράψε καθαρά τι εργαλείο χρειάζεσαι, γιατί και πόσο επείγει.",
    needsLocationDetails: false,
  },
  material_request: {
    guide: "Αίτημα υλικού: δεν χρειάζεται πάντα οδός, περιοχή ή ζώνη. Γράψε υλικό, ποσότητα και αν αφορά συγκεκριμένη εργασία.",
    needsLocationDetails: false,
  },
  work_blocker: {
    guide: "Εμπόδιο εργασίας: βάλε περιοχή/οδό/ζώνη μόνο αν το πρόβλημα αφορά συγκεκριμένο σημείο.",
    needsLocationDetails: true,
  },
  collaboration_problem: {
    guide: "Πρόβλημα συνεργασίας: γράψε καθαρά τι συμβαίνει, ποιοι ρόλοι εμπλέκονται και τι λύση ζητάς. Δεν χρειάζεται χάρτης.",
    needsLocationDetails: false,
  },
  safety_problem: {
    guide: "Θέμα ασφάλειας: βάλε περιοχή/οδό/ζώνη αν υπάρχει κίνδυνος σε συγκεκριμένο σημείο.",
    needsLocationDetails: true,
  },
  service_problem: {
    guide: "Πρόβλημα υπηρεσίας ή διαδικασίας: γράψε ποια διαδικασία μπλοκάρει και σε ποιο τμήμα πρέπει να πάει.",
    needsLocationDetails: false,
  },
  analysis_request: {
    guide: "Αίτημα ανάλυσης: βάλε ζώνη, περιοχή ή χρονικό πλαίσιο μόνο αν χρειάζεται για στατιστικά ή ιστορικό.",
    needsLocationDetails: true,
  },
  improvement_proposal: {
    guide: "Πρόταση βελτίωσης: γράψε τι αλλάζει, ποιον βοηθά και τι αποτέλεσμα περιμένεις.",
    needsLocationDetails: false,
  },
  other: {
    guide: "Γράψε το αίτημα απλά. Το Pantavion θα το δρομολογήσει με βάση περιγραφή, ρόλο και προτεινόμενο υπεύθυνο.",
    needsLocationDetails: false,
  },
};

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `water-help-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getOrCreateDeviceClaim() {
  if (typeof window === "undefined") {
    return { deviceId: "", deviceToken: "" };
  }

  let deviceId = window.localStorage.getItem(DEVICE_ID_KEY) || "";
  let deviceToken = window.localStorage.getItem(DEVICE_TOKEN_KEY) || "";

  if (!deviceId) {
    deviceId = makeId();
    window.localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }

  if (!deviceToken) {
    deviceToken = makeId();
    window.localStorage.setItem(DEVICE_TOKEN_KEY, deviceToken);
  }

  return { deviceId, deviceToken };
}

export default function WaterHelpResolutionPage() {
  const [category, setCategory] = useState("tool_request");
  const [priority, setPriority] = useState("normal");
  const [role, setRole] = useState("worker");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requestedBy, setRequestedBy] = useState("");
  const [contact, setContact] = useState("");
  const [areaLabel, setAreaLabel] = useState("");
  const [roadLabel, setRoadLabel] = useState("");
  const [zoneLabel, setZoneLabel] = useState("");
  const [targetDepartment, setTargetDepartment] = useState("");
  const [suggestedAssignee, setSuggestedAssignee] = useState("");
  const [evidenceRefs, setEvidenceRefs] = useState("");
  const [message, setMessage] = useState("");
  const [aiHint, setAiHint] = useState("");
  const [loading, setLoading] = useState(false);

  const categoryGuide = CATEGORY_REQUIREMENTS[category] || CATEGORY_REQUIREMENTS.other;
  const needsLocationDetails = categoryGuide.needsLocationDetails;

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const { deviceId, deviceToken } = getOrCreateDeviceClaim();

    setLoading(true);
    setMessage("Καταχώρηση και δρομολόγηση αιτήματος...");
    setAiHint("");

    try {
      const response = await fetch("/api/professional/infrastructure/water/help/request", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          category,
          priority,
          title,
          description,
          requestedBy,
          role,
          contact,
          areaLabel: needsLocationDetails ? areaLabel : "",
          roadLabel: needsLocationDetails ? roadLabel : "",
          zoneLabel: needsLocationDetails ? zoneLabel : "",
          targetDepartment,
          suggestedAssignee,
          evidenceRefs: evidenceRefs
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean),
          deviceId,
          deviceToken,
          deviceLabel: "Pantavion Water Help Browser",
        }),
      });

      const json = (await response.json()) as {
        ok?: boolean;
        requestId?: string;
        aiRoutingHint?: string;
        aiFirstRecommendation?: string;
        routingMode?: string;
        deliveryStatus?: string;
        deliveryTargetLabel?: string;
        requiresManualForwarding?: boolean;
        error?: string;
      };

      if (!response.ok || !json.ok) {
        throw new Error(json.error || "help_request_failed");
      }

      setMessage(`Καταχωρήθηκε και δρομολογήθηκε. ID: ${json.requestId}. Προορισμός: ${json.deliveryTargetLabel || "Founder/Admin"}. Κατάσταση: ${json.deliveryStatus || "pending"}.`);
      setAiHint(json.aiFirstRecommendation || "");
      setTitle("");
      setDescription("");
      setEvidenceRefs("");
    } catch {
      setMessage("Δεν καταχωρήθηκε. Έλεγξε τίτλο και περιγραφή.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#06111f] px-4 py-5 text-white">
      <section className="mx-auto w-full max-w-4xl rounded-3xl border border-[#b89445]/50 bg-[#0d1a2d] p-5 shadow-2xl">
        <Link href="/professional/infrastructure/water" className="text-sm font-black text-[#f2c766]">
          ← Πίσω στην Ύδρευση
        </Link>

        <p className="mt-6 text-xs font-black uppercase tracking-[0.22em] text-[#f2c766]">
          PANTAVION WATER AI HELP
        </p>

        <h1 className="mt-3 text-3xl font-black">Αίτημα / πρόβλημα / λύση</h1>

        <p className="mt-3 text-sm font-bold leading-6 text-slate-300">
          Γράψε τι χρειάζεσαι ή τι πρόβλημα υπάρχει. Το Pantavion θα το καταχωρήσει,
          θα το δρομολογήσει με βάση υπεύθυνο, ανώτερο ή διαχειριστή και θα κρατήσει ιστορικό.
        </p>

        <div className="mt-5 grid gap-3">
          <Link
            href="/professional/infrastructure/water/help/inbox"
            className="rounded-2xl border border-[#f2c766]/50 bg-[#07111f] px-4 py-3 text-center font-black text-[#f2c766]"
          >
            Τα δικά μου αιτήματα
          </Link>
        </div>

        <form onSubmit={(event) => void submitForm(event)} className="mt-6 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="grid gap-2">
              <span className="text-sm font-black text-[#f2c766]">Κατηγορία</span>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white outline-none"
              >
                {CATEGORIES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black text-[#f2c766]">Ρόλος</span>
              <select
                value={role}
                onChange={(event) => setRole(event.target.value)}
                className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white outline-none"
              >
                {ROLES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black text-[#f2c766]">Προτεραιότητα</span>
              <select
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
                className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white outline-none"
              >
                <option value="normal">Κανονικό</option>
                <option value="urgent">Επείγον</option>
                <option value="critical">Κρίσιμο</option>
              </select>
            </label>
          </div>

          <p className="rounded-2xl border border-[#f2c766]/30 bg-[#f2c766]/10 p-4 text-sm font-black leading-6 text-[#f2c766]">
            {categoryGuide.guide}
          </p>

          <label className="grid gap-2">
            <span className="text-sm font-black text-[#f2c766]">Τίτλος</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              placeholder="π.χ. Χρειάζομαι τρυπάνι / Θέλω ανάλυση απωλειών / Υπάρχει πρόβλημα συνεργασίας"
              className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white outline-none"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-black text-[#f2c766]">Περιγραφή</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
              rows={5}
              placeholder="Γράψε απλά τι συμβαίνει και τι χρειάζεσαι."
              className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white outline-none"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-black text-[#f2c766]">Όνομα</span>
              <input
                value={requestedBy}
                onChange={(event) => setRequestedBy(event.target.value)}
                className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white outline-none"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black text-[#f2c766]">Τηλέφωνο / επικοινωνία</span>
              <input
                value={contact}
                onChange={(event) => setContact(event.target.value)}
                className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white outline-none"
              />
            </label>
          </div>

          {needsLocationDetails ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="grid gap-2">
                <span className="text-sm font-black text-[#f2c766]">Περιοχή</span>
                <input
                  value={areaLabel}
                  onChange={(event) => setAreaLabel(event.target.value)}
                  placeholder="Μόνο αν χρειάζεται για το συγκεκριμένο αίτημα"
                  className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white outline-none"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black text-[#f2c766]">Οδός</span>
                <input
                  value={roadLabel}
                  onChange={(event) => setRoadLabel(event.target.value)}
                  placeholder="Μόνο αν υπάρχει σημείο ή βλάβη"
                  className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white outline-none"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black text-[#f2c766]">Ζώνη</span>
                <input
                  value={zoneLabel}
                  onChange={(event) => setZoneLabel(event.target.value)}
                  placeholder="Μόνο αν αφορά ζώνη / δίκτυο"
                  className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white outline-none"
                />
              </label>
            </div>
          ) : (
            <p className="rounded-2xl border border-slate-700 bg-[#07111f] p-4 text-sm font-bold text-slate-300">
              Για αυτή την κατηγορία δεν ζητάμε οδό, περιοχή ή ζώνη για να μην φορτώνεται άδικα ο χρήστης.
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-black text-[#f2c766]">Προς υπηρεσία / τμήμα</span>
              <input
                value={targetDepartment}
                onChange={(event) => setTargetDepartment(event.target.value)}
                placeholder="π.χ. αποθήκη, επιστάτης, λογιστήριο, τεχνικές υπηρεσίες"
                className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white outline-none"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black text-[#f2c766]">Προτεινόμενος υπεύθυνος</span>
              <input
                value={suggestedAssignee}
                onChange={(event) => setSuggestedAssignee(event.target.value)}
                placeholder="Αν ξέρεις σε ποιον πρέπει να πάει."
                className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white outline-none"
              />
            </label>
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-black text-[#f2c766]">Τεκμήρια / refs</span>
            <textarea
              value={evidenceRefs}
              onChange={(event) => setEvidenceRefs(event.target.value)}
              rows={3}
              placeholder="Φωτογραφία, PDF, ηχητικό, αριθμός βλάβης ή άλλο στοιχείο. Ένα ανά γραμμή."
              className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white outline-none"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-[#f2c766] px-5 py-4 text-lg font-black text-black disabled:opacity-60"
          >
            Καταχώρηση και δρομολόγηση αιτήματος
          </button>

          {message ? (
            <p className="rounded-2xl border border-[#f2c766]/30 bg-[#f2c766]/10 p-4 text-sm font-black text-[#f2c766]">
              {message}
            </p>
          ) : null}

          {aiHint ? (
            <p className="rounded-2xl border border-emerald-400/30 bg-emerald-950/20 p-4 text-sm font-black text-emerald-100">
              AI πρώτη εισήγηση: {aiHint}
            </p>
          ) : null}
        </form>
      </section>
    </main>
  );
}
