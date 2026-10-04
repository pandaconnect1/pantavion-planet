"use client";

import { useState } from "react";

const DEVICE_ID_KEY = "pantavion:water:device-id:v1";
const DEVICE_TOKEN_KEY = "pantavion:water:device-token:v1";

const REQUEST_TYPES = [
  ["tool_request", "Αίτηση εργαλείου"],
  ["material_request", "Αίτηση υλικών"],
  ["work_blocker", "Εμπόδιο εργασίας"],
  ["collaboration_problem", "Πρόβλημα συνεργασίας"],
  ["safety_problem", "Θέμα ασφάλειας"],
  ["service_problem", "Πρόβλημα υπηρεσίας"],
  ["analysis_request", "Αίτηση ανάλυσης / αναφοράς"],
  ["improvement_proposal", "Πρόταση βελτίωσης"],
  ["other", "Άλλη αίτηση"],
] as const;

function randomId(prefix: string) {
  if (typeof window !== "undefined" && window.crypto?.randomUUID) {
    return `${prefix}-${window.crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getOrCreateDeviceClaim() {
  let deviceId = window.localStorage.getItem(DEVICE_ID_KEY) || "";
  let deviceToken = window.localStorage.getItem(DEVICE_TOKEN_KEY) || "";

  if (!deviceId) {
    deviceId = randomId("water-device");
    window.localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }

  if (!deviceToken) {
    deviceToken = randomId("water-token");
    window.localStorage.setItem(DEVICE_TOKEN_KEY, deviceToken);
  }

  return { deviceId, deviceToken };
}

export default function WaterUserRequestsPanel() {
  const [category, setCategory] = useState("material_request");
  const [priority, setPriority] = useState("normal");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requestedBy, setRequestedBy] = useState("");
  const [contact, setContact] = useState("");
  const [areaLabel, setAreaLabel] = useState("");
  const [roadLabel, setRoadLabel] = useState("");
  const [zoneLabel, setZoneLabel] = useState("");
  const [targetDepartment, setTargetDepartment] = useState("");
  const [suggestedAssignee, setSuggestedAssignee] = useState("");
  const [message, setMessage] = useState("");
  const [requestId, setRequestId] = useState("");
  const [loading, setLoading] = useState(false);

  const [accessFirstName, setAccessFirstName] = useState("");
  const [accessLastName, setAccessLastName] = useState("");
  const [accessRoleTitle, setAccessRoleTitle] = useState("");
  const [accessOrganization, setAccessOrganization] = useState("");
  const [accessContact, setAccessContact] = useState("");
  const [accessMaps, setAccessMaps] = useState("Map A");
  const [accessReason, setAccessReason] = useState("");
  const [accessMessage, setAccessMessage] = useState("");
  const [accessRequestId, setAccessRequestId] = useState("");
  const [accessLoading, setAccessLoading] = useState(false);

  async function submitMapAccessRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAccessLoading(true);
    setAccessMessage("");
    setAccessRequestId("");

    try {
      const { deviceId, deviceToken } = getOrCreateDeviceClaim();
      const response = await fetch("/api/professional/infrastructure/water/access/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          firstName: accessFirstName,
          lastName: accessLastName,
          roleTitle: accessRoleTitle,
          organization: accessOrganization,
          emailOrPhone: accessContact,
          reason: [
            `Αίτηση πρόσβασης ως χρήστης στους χάρτες: ${accessMaps}.`,
            accessReason,
          ].filter(Boolean).join(" "),
          deviceId,
          deviceToken,
          deviceLabel: "Pantavion Water Map Access Request",
        }),
      });

      const json = (await response.json()) as {
        ok?: boolean;
        requestId?: string;
        error?: string;
      };

      if (!response.ok || !json.ok) {
        throw new Error(json.error || "access_request_failed");
      }

      setAccessRequestId(json.requestId || "");
      setAccessMessage("Η αίτηση πρόσβασης στάλθηκε για έγκριση Founder/Admin.");
    } catch {
      setAccessMessage("Η αίτηση πρόσβασης δεν στάλθηκε. Έλεγξε τα υποχρεωτικά στοιχεία.");
    } finally {
      setAccessLoading(false);
    }
  }

  async function submitRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setRequestId("");

    try {
      const { deviceId, deviceToken } = getOrCreateDeviceClaim();
      const response = await fetch("/api/professional/infrastructure/water/help/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          category,
          priority,
          title,
          description,
          requestedBy,
          role: "field_user",
          contact,
          areaLabel,
          roadLabel,
          zoneLabel,
          targetDepartment,
          suggestedAssignee,
          deviceId,
          deviceToken,
          deviceLabel: "Pantavion Water Map A",
        }),
      });

      const json = (await response.json()) as {
        ok?: boolean;
        requestId?: string;
        error?: string;
        deliveryTargetLabel?: string;
      };

      if (!response.ok || !json.ok) {
        throw new Error(json.error || "request_failed");
      }

      setRequestId(json.requestId || "");
      setMessage(
        json.deliveryTargetLabel
          ? `Η αίτηση στάλθηκε για έλεγχο: ${json.deliveryTargetLabel}.`
          : "Η αίτηση στάλθηκε για έλεγχο.",
      );
      setTitle("");
      setDescription("");
    } catch {
      setMessage("Η αίτηση δεν στάλθηκε. Έλεγξε τα στοιχεία και δοκίμασε ξανά.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="bg-[#06111f] px-4 pb-10 text-white">
      <div className="mx-auto w-full max-w-7xl rounded-3xl border border-[#b89445]/50 bg-[#0d1a2d] p-5 shadow-2xl sm:p-6">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#f2c766]">
          PANTAVION WATER · MAP A
        </p>
        <h2 className="mt-2 text-2xl font-black sm:text-3xl">Αιτήσεις Χρηστών</h2>
        <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-300">
          Στο τέλος του Map A ο χρήστης μπορεί να καταχωρεί αίτημα. Η αίτηση αποθηκεύεται ιδιωτικά,
          δρομολογείται στον αρμόδιο και παραμένει ορατή στο Founder/Admin για έλεγχο.
        </p>

        <div className="mt-6 rounded-3xl border border-emerald-400/35 bg-emerald-400/5 p-4 sm:p-5">
          <h3 className="text-xl font-black text-emerald-200">Αίτηση πρόσβασης στους χάρτες</h3>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">
            Για νέο χρήστη που θέλει να ανοίγει τους προστατευμένους χάρτες. Η πρόσβαση δίνεται μόνο μετά από έγκριση Founder/Admin και συνδέεται με τη συγκεκριμένη συσκευή.
          </p>

          <form onSubmit={(event) => void submitMapAccessRequest(event)} className="mt-4 grid gap-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <label className="grid gap-2">
                <span className="text-sm font-black text-emerald-200">Όνομα</span>
                <input required value={accessFirstName} onChange={(event) => setAccessFirstName(event.target.value)} className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white" />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-black text-emerald-200">Επίθετο</span>
                <input required value={accessLastName} onChange={(event) => setAccessLastName(event.target.value)} className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white" />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-black text-emerald-200">Ρόλος / Θέση</span>
                <input required value={accessRoleTitle} onChange={(event) => setAccessRoleTitle(event.target.value)} placeholder="π.χ. Εργάτης, Τεχνικός, Επιστάτης" className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white" />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-black text-emerald-200">Οργανισμός / Εταιρεία</span>
                <input value={accessOrganization} onChange={(event) => setAccessOrganization(event.target.value)} className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white" />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-black text-emerald-200">Τηλέφωνο ή email</span>
                <input required value={accessContact} onChange={(event) => setAccessContact(event.target.value)} className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white" />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-black text-emerald-200">Χάρτες που ζητά</span>
                <select value={accessMaps} onChange={(event) => setAccessMaps(event.target.value)} className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white">
                  <option value="Map A">Map A — Εργασίες πεδίου</option>
                  <option value="Map B">Map B — Τεχνικός / master reference</option>
                  <option value="Map C">Map C — Μηχανικός / ανάλυση</option>
                  <option value="Map A, Map B και Map C">Map A + B + C</option>
                </select>
              </label>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-black text-emerald-200">Λόγος πρόσβασης</span>
              <textarea rows={3} value={accessReason} onChange={(event) => setAccessReason(event.target.value)} placeholder="Γιατί χρειάζεται πρόσβαση στους χάρτες" className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white" />
            </label>

            <button type="submit" disabled={accessLoading} className="rounded-2xl bg-emerald-300 px-5 py-4 text-lg font-black text-black disabled:opacity-60">
              {accessLoading ? "Αποστολή..." : "Υποβολή αίτησης πρόσβασης"}
            </button>

            {accessMessage ? (
              <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm font-black text-emerald-100">
                {accessMessage}
                {accessRequestId ? <div className="mt-1 text-xs text-slate-300">Request ID: {accessRequestId}</div> : null}
              </div>
            ) : null}
          </form>
        </div>

        <div className="mt-7 border-t border-slate-700 pt-6">
          <h3 className="text-xl font-black text-[#f2c766]">Άλλες αιτήσεις χρήστη</h3>
        </div>

        <form onSubmit={(event) => void submitRequest(event)} className="mt-4 grid gap-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <label className="grid gap-2">
              <span className="text-sm font-black text-[#f2c766]">Είδος αίτησης</span>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white"
              >
                {REQUEST_TYPES.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black text-[#f2c766]">Προτεραιότητα</span>
              <select
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
                className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white"
              >
                <option value="normal">Κανονική</option>
                <option value="urgent">Επείγουσα</option>
                <option value="critical">Κρίσιμη</option>
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black text-[#f2c766]">Τμήμα / Υπηρεσία</span>
              <input
                value={targetDepartment}
                onChange={(event) => setTargetDepartment(event.target.value)}
                placeholder="π.χ. Αποθήκη, Ύδρευση, Τεχνική Υπηρεσία"
                className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white"
              />
            </label>
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-black text-[#f2c766]">Τίτλος αίτησης</span>
            <input
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Σύντομος τίτλος"
              className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-black text-[#f2c766]">Τι ζητάς / Περιγραφή</span>
            <textarea
              required
              rows={5}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Γράψε καθαρά τι χρειάζεσαι, ποσότητες, πρόβλημα ή πρόταση."
              className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <label className="grid gap-2">
              <span className="text-sm font-black text-[#f2c766]">Όνομα</span>
              <input
                value={requestedBy}
                onChange={(event) => setRequestedBy(event.target.value)}
                className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black text-[#f2c766]">Τηλέφωνο</span>
              <input
                value={contact}
                onChange={(event) => setContact(event.target.value)}
                className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black text-[#f2c766]">Περιοχή</span>
              <input
                value={areaLabel}
                onChange={(event) => setAreaLabel(event.target.value)}
                className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black text-[#f2c766]">Οδός</span>
              <input
                value={roadLabel}
                onChange={(event) => setRoadLabel(event.target.value)}
                className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-black text-[#f2c766]">Ζώνη</span>
              <input
                value={zoneLabel}
                onChange={(event) => setZoneLabel(event.target.value)}
                className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black text-[#f2c766]">Προς συγκεκριμένο υπεύθυνο</span>
              <input
                value={suggestedAssignee}
                onChange={(event) => setSuggestedAssignee(event.target.value)}
                placeholder="Προαιρετικό"
                className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-[#f2c766] px-5 py-4 text-lg font-black text-black disabled:opacity-60"
          >
            {loading ? "Αποστολή..." : "Υποβολή αίτησης"}
          </button>

          {message ? (
            <div className="rounded-2xl border border-[#f2c766]/35 bg-[#f2c766]/10 p-4 text-sm font-black text-[#f8e6ad]">
              {message}
              {requestId ? <div className="mt-1 text-xs text-slate-300">Request ID: {requestId}</div> : null}
            </div>
          ) : null}
        </form>
      </div>
    </section>
  );
}
