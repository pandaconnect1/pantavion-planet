"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type WaterAccessRequest = {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  organization?: string;
  emailOrPhone: string;
  reason?: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  attemptCount?: number;
  deviceId?: string;
  deviceLabel?: string;
  hasDeviceToken?: boolean;
};

type ApprovedUserRecord = {
  id?: string;
  deviceId?: string;
  requestId?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  roleTitle?: string;
  status?: string;
  approvedAt?: string;
  updatedAt?: string;
  revokedAt?: string;
  revoked?: boolean;
};

type RequestSummary = {
  newPendingCount?: number;
  rawPendingAttemptCount?: number;
  historicalAttemptCount?: number;
  uniqueHistoricalPeopleCount?: number;
  duplicateHistoricalAttemptCount?: number;
};

type WaterFieldSubmission = {
  id: string;
  source: string;
  type: string;
  status: string;
  truthLabel: string;
  title: string;
  description: string;
  submittedBy: string;
  contact: string;
  role: string;
  areaLabel: string;
  roadLabel: string;
  zoneLabel: string;
  latitude: number | null;
  longitude: number | null;
  evidenceRefs: string[];
  visibleToFounder: boolean;
  visibleToApprovedUsers: boolean;
  rawSensitiveDataHiddenFromUsers: boolean;
  aiEstimateIsVerifiedTruth: boolean;
  createdAt: string;
  updatedAt: string;
  deviceId: string;
  deviceLabel: string;
};

type InboxSectionId =
  | "access-requests"
  | "approved-users"
  | "blocked-users"
  | "field-submissions";

function typeLabel(type: string) {
  const labels: Record<string, string> = {
    note: "Σημείωση",
    fault_report: "Νέα βλάβη",
    possible_valve: "Πιθανή βάνα",
    new_road: "Νέα οδός",
    new_area: "Νέα περιοχή",
    pipe_depth_observation: "Βάθος σωλήνα",
    pipe_material_observation: "Υλικό σωλήνα",
    underground_service_observation: "Άλλη υπόγεια υπηρεσία",
    photo_reference: "Φωτογραφία",
    voice_reference: "Ηχητική σημείωση",
  };

  return labels[type] || type || "Καταχώρηση";
}

export default function WaterApprovalInboxPage() {
  const [requests, setRequests] = useState<WaterAccessRequest[]>([]);
  const [requestSummary, setRequestSummary] = useState<RequestSummary>({});
  const [approvedUsers, setApprovedUsers] = useState<ApprovedUserRecord[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<ApprovedUserRecord[]>([]);
  const [fieldSubmissions, setFieldSubmissions] = useState<WaterFieldSubmission[]>([]);
  const [managedUserKey, setManagedUserKey] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [activeSection, setActiveSection] = useState<InboxSectionId>("approved-users");
  const [message, setMessage] = useState("");
  const [approvedMessage, setApprovedMessage] = useState("");
  const [fieldMessage, setFieldMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function openSection(sectionId: InboxSectionId) {
    setActiveSection(sectionId);

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        document.getElementById(sectionId)?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    });
  }

  async function loadAccessRequests() {
    const response = await fetch("/api/professional/infrastructure/water/access/admin/requests", {
      method: "POST",
      credentials: "include",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({}),
    });

    const json = (await response.json()) as {
      ok?: boolean;
      requests?: WaterAccessRequest[];
      summary?: RequestSummary;
      error?: string;
    };

    if (!response.ok || !json.ok) {
      throw new Error(json.error || "requests_failed");
    }

    return {
      requests: json.requests || [],
      summary: json.summary || {},
    };
  }

  async function loadApprovedUsers() {
    const response = await fetch("/api/professional/infrastructure/water/access/admin/approved", {
      method: "POST",
      credentials: "include",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({}),
    });

    const json = (await response.json()) as {
      ok?: boolean;
      approvedUsers?: ApprovedUserRecord[];
      blockedUsers?: ApprovedUserRecord[];
      error?: string;
    };

    if (!response.ok || !json.ok) {
      throw new Error(json.error || "approved_users_failed");
    }

    return {
      approvedUsers: json.approvedUsers || [],
      blockedUsers: json.blockedUsers || [],
    };
  }

  async function loadFieldSubmissions() {
    const response = await fetch("/api/professional/infrastructure/water/field/admin/submissions", {
      method: "POST",
      credentials: "include",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({}),
    });

    const json = (await response.json()) as {
      ok?: boolean;
      submissions?: WaterFieldSubmission[];
      error?: string;
    };

    if (!response.ok || !json.ok) {
      throw new Error(json.error || "field_submissions_failed");
    }

    return json.submissions || [];
  }

  async function loadInbox() {
    setLoading(true);
    setMessage("Φόρτωση αιτημάτων πρόσβασης...");
    setApprovedMessage("Φόρτωση εγκεκριμένων Users...");
    setFieldMessage("Φόρτωση καταχωρήσεων πεδίου...");

    try {
      const [requestResult, approvedResult, fieldResult] = await Promise.allSettled([
        loadAccessRequests(),
        loadApprovedUsers(),
        loadFieldSubmissions(),
      ]);

      if (requestResult.status === "fulfilled") {
        setRequests(requestResult.value.requests);
        setRequestSummary(requestResult.value.summary);
        setMessage(`Φορτώθηκαν ${requestResult.value.requests.length} νέα pending αιτήματα.`);
      } else {
        setRequests([]);
        setRequestSummary({});
        setMessage("Τα αιτήματα πρόσβασης δεν φορτώθηκαν.");
      }

      if (approvedResult.status === "fulfilled") {
        setApprovedUsers(approvedResult.value.approvedUsers);
        setBlockedUsers(approvedResult.value.blockedUsers);
        setApprovedMessage(
          `Φορτώθηκαν ${approvedResult.value.approvedUsers.length} ενεργοί και ${approvedResult.value.blockedUsers.length} μπλοκαρισμένοι Users.`,
        );
      } else {
        setApprovedUsers([]);
        setBlockedUsers([]);
        setApprovedMessage("Οι εγκεκριμένοι Users δεν φορτώθηκαν.");
      }

      if (fieldResult.status === "fulfilled") {
        setFieldSubmissions(fieldResult.value);
        setFieldMessage(`Φορτώθηκαν ${fieldResult.value.length} καταχωρήσεις πεδίου.`);
      } else {
        setFieldSubmissions([]);
        setFieldMessage("Οι καταχωρήσεις πεδίου δεν φορτώθηκαν.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function decide(request: WaterAccessRequest, decision: "approve" | "reject") {
    if (decision === "approve" && !request.hasDeviceToken) {
      setMessage("Παλιά αίτηση χωρίς device token. Ζήτησε νέα αίτηση από τη συσκευή του χρήστη.");
      return;
    }

    setLoading(true);
    setMessage(decision === "approve" ? "Έγκριση συσκευής..." : "Απόρριψη αιτήματος...");

    try {
      const response = await fetch("/api/professional/infrastructure/water/access/admin/decision", {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          requestId: request.id,
          decision,
        }),
      });

      const json = (await response.json()) as {
        ok?: boolean;
        error?: string;
      };

      if (!response.ok || !json.ok) {
        throw new Error(json.error || "decision_failed");
      }

      await loadInbox();
      setMessage(decision === "approve" ? "Εγκρίθηκε η συσκευή." : "Απορρίφθηκε το αίτημα.");
    } catch {
      setMessage("Η απόφαση δεν αποθηκεύτηκε.");
    } finally {
      setLoading(false);
    }
  }

  function openDeleteUser(user: ApprovedUserRecord) {
    const userKey = user.deviceId || user.id || user.requestId || "";

    if (!userKey || !user.deviceId) {
      setApprovedMessage("Δεν υπάρχει device ID για ασφαλές block αυτού του User.");
      return;
    }

    setManagedUserKey(userKey);
    setDeleteConfirmation("");
    setApprovedMessage("Επιβεβαίωσε τον σωστό User πριν από το προσωρινό Delete / Block.");
  }

  function cancelDeleteUser() {
    setManagedUserKey("");
    setDeleteConfirmation("");
    setApprovedMessage("Η διαγραφή ακυρώθηκε. Δεν άλλαξε καμία πρόσβαση.");
  }

  async function deleteUser(user: ApprovedUserRecord) {
    const deviceId = user.deviceId?.trim() || "";

    if (!deviceId) {
      setApprovedMessage("Δεν υπάρχει device ID για ασφαλές block αυτού του User.");
      return;
    }

    const userLabel = `${user.firstName || ""} ${user.lastName || ""}`.trim() || deviceId;

    if (deleteConfirmation.trim().toUpperCase() !== "DELETE") {
      setApprovedMessage(`Γράψε DELETE για να μπλοκάρεις προσωρινά τον User ${userLabel}.`);
      return;
    }

    setLoading(true);
    setApprovedMessage(`Delete / Block πρόσβασης για ${userLabel}...`);

    try {
      const response = await fetch("/api/professional/infrastructure/water/access/admin/decision", {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          decision: "revoke",
          deviceId,
          requestId: user.requestId || "",
          revokeConfirmation: "REVOKE",
        }),
      });

      const json = (await response.json()) as {
        ok?: boolean;
        error?: string;
        message?: string;
      };

      if (!response.ok || !json.ok) {
        throw new Error(json.message || json.error || "revoke_failed");
      }

      setManagedUserKey("");
      setDeleteConfirmation("");
      await loadInbox();
      setApprovedMessage(
        `Ο User ${userLabel} διαγράφηκε από τους ενεργούς Users και η συσκευή του μπλοκαρίστηκε. Μπορεί αργότερα να κάνει νέα αίτηση.`,
      );
    } catch (error) {
      setApprovedMessage(
        error instanceof Error ? error.message : "Το Delete / Block του User δεν ολοκληρώθηκε.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadInbox();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fieldCounts = useMemo(() => {
    return {
      total: fieldSubmissions.length,
      withEvidence: fieldSubmissions.filter((item) => item.evidenceRefs.length > 0).length,
    };
  }, [fieldSubmissions]);

  return (
    <main className="min-h-screen bg-[#06111f] px-4 py-6 text-white">
      <section className="mx-auto w-full max-w-6xl rounded-3xl border border-[#b89445]/50 bg-[#0d1a2d] p-5 shadow-2xl">
        <div className="flex flex-wrap gap-3">
          <Link href="/professional/infrastructure/water" className="text-sm font-black text-[#f2c766]">
            ← Πίσω στην Ύδρευση
          </Link>
          <Link
            href="/professional/infrastructure/water/admin/faults"
            className="text-sm font-black text-[#f2c766]"
          >
            Βλάβες προς έγκριση
          </Link>
        </div>

        <p className="mt-6 text-xs font-black uppercase tracking-[0.24em] text-[#f2c766]">
          ΚΕΝΤΡΟ ΕΓΚΡΙΣΕΩΝ ΥΔΡΕΥΣΗΣ
        </p>

        <h1 className="mt-3 text-3xl font-black">Users / Approvals</h1>

        <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">
          Πάτησε μία από τις πραγματικές ενότητες πιο κάτω για να ανοίξει η αντίστοιχη λίστα και οι
          διαθέσιμες ενέργειες.
        </p>

        <div className="mt-6 grid gap-3 rounded-3xl border border-slate-700 bg-[#07111f] p-4">
          <button
            type="button"
            onClick={() => void loadInbox()}
            disabled={loading}
            className="rounded-2xl bg-[#f2c766] px-5 py-3 font-black text-black disabled:opacity-60"
          >
            Φόρτωση Κέντρου Εγκρίσεων
          </button>

          {message ? <p className="text-sm font-bold text-[#f2c766]">{message}</p> : null}
          {approvedMessage ? <p className="text-sm font-bold text-[#f2c766]">{approvedMessage}</p> : null}
          {fieldMessage ? <p className="text-sm font-bold text-[#f2c766]">{fieldMessage}</p> : null}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <button
            type="button"
            onClick={() => openSection("access-requests")}
            aria-pressed={activeSection === "access-requests"}
            className="rounded-2xl border border-[#f2c766]/60 bg-[#07111f] p-4 text-left transition hover:border-[#f2c766] hover:bg-[#f2c766]/10 active:scale-[0.99]"
          >
            <span className="block text-xs text-slate-400">Νέα Pending αιτήματα</span>
            <span className="mt-1 block text-3xl font-black text-[#f2c766]">{requests.length}</span>
            <span className="mt-2 block text-sm font-black text-[#f2c766]">Άνοιγμα για απόφαση →</span>
          </button>

          <button
            type="button"
            onClick={() => openSection("approved-users")}
            aria-pressed={activeSection === "approved-users"}
            className="rounded-2xl border border-emerald-500/60 bg-emerald-950/20 p-4 text-left transition hover:border-emerald-300 hover:bg-emerald-900/30 active:scale-[0.99]"
          >
            <span className="block text-xs text-emerald-100/70">Ενεργοί Users / συσκευές</span>
            <span className="mt-1 block text-3xl font-black text-emerald-100">{approvedUsers.length}</span>
            <span className="mt-2 block text-sm font-black text-emerald-200">Άνοιγμα ενεργών →</span>
          </button>

          <button
            type="button"
            onClick={() => openSection("blocked-users")}
            aria-pressed={activeSection === "blocked-users"}
            className="rounded-2xl border border-red-500/60 bg-red-950/20 p-4 text-left transition hover:border-red-300 hover:bg-red-900/30 active:scale-[0.99]"
          >
            <span className="block text-xs text-red-100/70">Μπλοκαρισμένοι Users / συσκευές</span>
            <span className="mt-1 block text-3xl font-black text-red-100">{blockedUsers.length}</span>
            <span className="mt-2 block text-sm font-black text-red-200">Άνοιγμα μπλοκαρισμένων →</span>
          </button>

          <button
            type="button"
            onClick={() => openSection("field-submissions")}
            aria-pressed={activeSection === "field-submissions"}
            className="rounded-2xl border border-amber-500/60 bg-amber-950/20 p-4 text-left transition hover:border-amber-300 hover:bg-amber-900/30 active:scale-[0.99]"
          >
            <span className="block text-xs text-amber-100/70">Καταχωρήσεις πεδίου</span>
            <span className="mt-1 block text-3xl font-black text-amber-100">{fieldCounts.total}</span>
            <span className="mt-2 block text-sm font-black text-amber-200">
              Άνοιγμα καταχωρήσεων → Τεκμήρια: {fieldCounts.withEvidence}
            </span>
          </button>
        </div>

        {(requestSummary.historicalAttemptCount || 0) > 0 ? (
          <div className="mt-4 rounded-2xl border border-slate-700 bg-[#07111f] p-4 text-sm leading-6 text-slate-300">
            <p className="font-black text-white">Ιστορικό αιτημάτων — δεν είναι νέα αιτήματα</p>
            <p className="mt-1">
              Υπάρχουν {requestSummary.historicalAttemptCount || 0} αποθηκευμένες προσπάθειες από περίπου{" "}
              {requestSummary.uniqueHistoricalPeopleCount || 0} πρόσωπα/ταυτότητες. Οι{" "}
              {requestSummary.duplicateHistoricalAttemptCount || 0} επαναλήψεις ομαδοποιήθηκαν και δεν
              εμφανίζονται στην ουρά έγκρισης.
            </p>
          </div>
        ) : null}

        {activeSection === "approved-users" ? (
          <section id="approved-users" className="mt-8 grid scroll-mt-28 gap-4">
          <div>
            <h2 className="text-2xl font-black">Ενεργοί εγκεκριμένοι Users / συσκευές</h2>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-300">
              Το Delete / Block αφαιρεί αμέσως τον User από τους ενεργούς Users και μπλοκάρει τη
              συγκεκριμένη συσκευή. Αργότερα μπορεί να κάνει νέα αίτηση για να τον εγκρίνεις ξανά.
            </p>
          </div>

          {approvedUsers.map((user) => {
            const userKey = user.deviceId || user.id || user.requestId || `${user.firstName}-${user.lastName}`;
            const isManaged = managedUserKey === userKey;
            const userLabel = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "αυτόν τον User";

            return (
              <article key={userKey} className="rounded-3xl border border-emerald-700/50 bg-emerald-950/15 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="grid gap-1">
                    <p className="text-xl font-black">
                      {user.firstName || "—"} {user.lastName || ""}
                    </p>
                    <p className="text-sm text-slate-300">Ρόλος: {user.roleTitle || "—"}</p>
                    <p className="text-sm text-slate-300">Τηλέφωνο: {user.phone || "—"}</p>
                    <p className="text-sm text-slate-300">Συσκευή: {user.deviceId || "—"}</p>
                    <p className="text-xs text-slate-500">Εγκρίθηκε: {user.approvedAt || user.updatedAt || "—"}</p>
                  </div>

                  {user.deviceId ? (
                    <button
                      type="button"
                      onClick={() => openDeleteUser(user)}
                      disabled={loading}
                      className="rounded-2xl border border-red-500 bg-red-950/40 px-5 py-3 font-black text-red-100 disabled:opacity-50"
                    >
                      Delete / Block User
                    </button>
                  ) : (
                    <p className="rounded-2xl border border-slate-700 px-4 py-3 text-sm font-bold text-slate-300">
                      Δεν υπάρχει δεμένη συσκευή για ασφαλές block.
                    </p>
                  )}
                </div>

                {isManaged ? (
                  <div className="mt-5 rounded-2xl border border-red-500/60 bg-red-950/40 p-4">
                    <p className="font-black text-red-100">Προσωρινό Delete / Block: {userLabel}</p>
                    <p className="mt-2 text-sm leading-6 text-red-100/80">
                      Έλεγξε το όνομα και το τηλέφωνο. Γράψε DELETE για να αφαιρεθεί από τους
                      ενεργούς Users και να μπλοκαριστεί αυτή η συσκευή.
                    </p>

                    <input
                      value={deleteConfirmation}
                      onChange={(event) => setDeleteConfirmation(event.target.value)}
                      autoCapitalize="characters"
                      autoComplete="off"
                      placeholder="Γράψε DELETE"
                      className="mt-4 w-full rounded-2xl border border-red-400/50 bg-[#07111f] px-4 py-3 font-black text-white outline-none focus:border-red-300"
                    />

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={cancelDeleteUser}
                        disabled={loading}
                        className="rounded-2xl border border-slate-500 px-5 py-3 font-black text-white disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteUser(user)}
                        disabled={loading || deleteConfirmation.trim().toUpperCase() !== "DELETE"}
                        className="rounded-2xl bg-red-500 px-5 py-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Confirm Delete / Block
                      </button>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}

          {approvedUsers.length === 0 ? (
            <p className="rounded-3xl border border-slate-700 bg-[#07111f] p-4 text-slate-300">
              Δεν υπάρχουν ενεργοί εγκεκριμένοι Users.
            </p>
          ) : null}
          </section>
        ) : null}

        {activeSection === "blocked-users" ? (
          <section id="blocked-users" className="mt-8 grid scroll-mt-28 gap-4">
            <div>
              <h2 className="text-2xl font-black">Μπλοκαρισμένοι Users / συσκευές</h2>
              <p className="mt-2 text-sm font-bold leading-6 text-slate-300">
                Αυτές οι συσκευές δεν έχουν ενεργή πρόσβαση. Για να επιστρέψει κάποιος User, πρέπει να
                στείλει νέο αίτημα και να τον εγκρίνεις ξανά από τα Νέα Pending αιτήματα.
              </p>
            </div>

            {blockedUsers.map((user) => {
              const userKey =
                user.deviceId ||
                user.id ||
                user.requestId ||
                `${user.firstName}-${user.lastName}-${user.revokedAt || user.updatedAt || "blocked"}`;

              return (
                <article key={userKey} className="rounded-3xl border border-red-700/50 bg-red-950/15 p-4">
                  <div className="grid gap-1">
                    <p className="text-xl font-black">
                      {user.firstName || "—"} {user.lastName || ""}
                    </p>
                    <p className="text-sm text-slate-300">Ρόλος: {user.roleTitle || "—"}</p>
                    <p className="text-sm text-slate-300">Τηλέφωνο: {user.phone || "—"}</p>
                    <p className="text-sm text-slate-300">Συσκευή: {user.deviceId || "—"}</p>
                    <p className="text-sm font-black text-red-200">Κατάσταση: Μπλοκαρισμένο</p>
                    <p className="text-xs text-slate-500">
                      Μπλοκαρίστηκε: {user.revokedAt || user.updatedAt || "—"}
                    </p>
                  </div>
                </article>
              );
            })}

            {blockedUsers.length === 0 ? (
              <p className="rounded-3xl border border-slate-700 bg-[#07111f] p-4 text-slate-300">
                Δεν υπάρχουν μπλοκαρισμένοι Users.
              </p>
            ) : null}
          </section>
        ) : null}

        {activeSection === "field-submissions" ? (
          <section id="field-submissions" className="mt-8 grid scroll-mt-28 gap-4">
          <h2 className="text-2xl font-black">Καταχωρήσεις πεδίου εργάτη / τεχνίτη</h2>

          {fieldSubmissions.map((item) => (
            <article key={item.id} className="rounded-3xl border border-amber-500/40 bg-amber-950/10 p-4">
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="rounded-full border border-[#f2c766]/40 bg-[#f2c766]/10 px-3 py-1 text-xs font-black text-[#f2c766]">
                    {typeLabel(item.type)}
                  </p>
                  <p className="rounded-full border border-amber-500/40 px-3 py-1 text-xs font-black text-amber-100">
                    {item.status}
                  </p>
                </div>

                <h3 className="text-xl font-black">{item.title}</h3>
                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-300">{item.description}</p>

                <div className="grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
                  <p>Όνομα: {item.submittedBy || "—"}</p>
                  <p>Τηλέφωνο: {item.contact || "—"}</p>
                  <p>Περιοχή: {item.areaLabel || "—"}</p>
                  <p>Οδός: {item.roadLabel || "—"}</p>
                  <p>Ζώνη: {item.zoneLabel || "—"}</p>
                  <p>Συσκευή: {item.deviceLabel || item.deviceId || "—"}</p>
                </div>

                {item.evidenceRefs.length > 0 ? (
                  <div className="mt-3 rounded-2xl border border-slate-700 bg-[#07111f] p-3">
                    <p className="text-sm font-black text-[#f2c766]">Τεκμήρια / refs</p>
                    <ul className="mt-2 grid gap-1 text-sm text-slate-300">
                      {item.evidenceRefs.map((ref) => (
                        <li key={ref}>• {ref}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <p className="text-xs text-slate-500">{item.createdAt}</p>
              </div>
            </article>
          ))}

          {fieldSubmissions.length === 0 ? (
            <p className="rounded-3xl border border-slate-700 bg-[#07111f] p-4 text-slate-300">
              Δεν υπάρχουν ακόμη καταχωρήσεις πεδίου.
            </p>
          ) : null}
          </section>
        ) : null}

        {activeSection === "access-requests" ? (
          <section id="access-requests" className="mt-8 grid scroll-mt-28 gap-4">
            <div>
              <h2 className="text-2xl font-black">Νέα Pending αιτήματα</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Εδώ εμφανίζονται μόνο μοναδικά αιτήματα που δεν έχουν ακόμη εγκριθεί ή απορριφθεί.
                Οι παλιές επαναλήψεις, οι ενεργοί και οι μπλοκαρισμένοι Users δεν μπαίνουν σε αυτή την
                ουρά.
              </p>
            </div>

            {requests.map((item) => {
              const canApprove = item.hasDeviceToken === true;

              return (
                <article key={item.id} className="rounded-3xl border border-slate-700 bg-[#07111f] p-4">
                  <div className="flex flex-col gap-2">
                    <p className="text-xl font-black">
                      {item.firstName} {item.lastName}
                    </p>
                    <p className="text-sm text-slate-300">Ρόλος: {item.title || "—"}</p>
                    <p className="text-sm text-slate-300">Τηλέφωνο: {item.emailOrPhone || "—"}</p>
                    {item.organization ? (
                      <p className="text-sm text-slate-300">Οργανισμός: {item.organization}</p>
                    ) : null}
                    {item.reason ? <p className="text-sm text-slate-300">Αιτιολογία: {item.reason}</p> : null}
                    <p className="text-sm font-black text-[#f2c766]">Κατάσταση: Pending για απόφαση</p>
                    <p className="text-sm text-slate-300">
                      Συσκευή:{" "}
                      {canApprove
                        ? item.deviceLabel || item.deviceId || "δεμένη συσκευή"
                        : "παλιό αίτημα χωρίς ασφαλές device token"}
                    </p>
                    {(item.attemptCount || 0) > 1 ? (
                      <p className="text-sm font-bold text-amber-200">
                        Προσπάθειες ίδιας συσκευής: {item.attemptCount} — ομαδοποιημένες σε ένα αίτημα.
                      </p>
                    ) : null}
                    <p className="text-xs text-slate-500">{item.updatedAt || item.createdAt}</p>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {canApprove ? (
                      <button
                        type="button"
                        onClick={() => void decide(item, "approve")}
                        disabled={loading}
                        className="rounded-2xl border border-emerald-500 bg-emerald-950/40 px-5 py-3 font-black text-emerald-100 disabled:opacity-50"
                      >
                        Approve User / Συσκευή
                      </button>
                    ) : (
                      <p className="rounded-2xl border border-amber-500/40 bg-amber-950/20 px-4 py-3 text-sm font-bold text-amber-100">
                        Χωρίς ασφαλές device token μπορεί μόνο να απορριφθεί. Ο User μπορεί μετά να
                        στείλει νέο αίτημα από τη συσκευή του.
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() => void decide(item, "reject")}
                      disabled={loading}
                      className="rounded-2xl border border-red-500 bg-red-950/40 px-5 py-3 font-black text-red-100 disabled:opacity-50"
                    >
                      Reject / Διαγραφή αιτήματος
                    </button>
                  </div>
                </article>
              );
            })}

            {requests.length === 0 ? (
              <p className="rounded-3xl border border-slate-700 bg-[#07111f] p-4 text-slate-300">
                Δεν υπάρχουν νέα pending αιτήματα πρόσβασης.
              </p>
            ) : null}
          </section>
        ) : null}
      </section>
    </main>
  );
}
