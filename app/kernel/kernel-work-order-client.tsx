"use client";

import { useMemo, useState } from "react";

const TARGETS = [
  { id: "pantaai_center", label: "PantaAI / Guardian" },
  { id: "pantavion_internal", label: "Pantavion core" },
  { id: "translation", label: "Two-way translation" },
  { id: "social_universe", label: "Social / Chat / People" },
  { id: "marketplace", label: "Marketplace / Ads" },
  { id: "api_integration", label: "Internal system integration" },
  { id: "admin_tool", label: "Founder / admin tool" },
  { id: "safety_system", label: "Safety system (separate approval)" },
  { id: "water_infrastructure", label: "Water infrastructure (separate approval)" },
  { id: "sos_elder", label: "SOS / elder (separate approval)" },
] as const;

type StoredWorkOrder = {
  execution: {
    executionId: string;
    status: string;
    updatedAt: string;
  };
  workOrder: {
    mode: string;
    founderApprovalRequired: boolean;
  };
  agentSecurity: {
    mode: string;
    blockers: string[];
  };
  agentFleet: {
    ownership: "pantavion_owned";
    agents: Array<{ id: string; role: string; state: string }>;
  };
  ecosystemCell: {
    ownership: "pantavion_owned";
    services: Array<{ id: string; need: string }>;
  };
  moduleDeliveryCells: Array<{ moduleId: string; displayName: string }>;
  workloadPlan: {
    kind: string;
    unitCount: number;
    partitionContract: { batchCount: number; batchSize: number };
  };
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asStoredWorkOrder(value: unknown): StoredWorkOrder | null {
  const root = asRecord(value);
  const execution = asRecord(root?.execution);
  const workOrder = asRecord(root?.workOrder);
  const agentSecurity = asRecord(root?.agentSecurity);
  const agentFleet = asRecord(root?.agentFleet);
  const ecosystemCell = asRecord(root?.ecosystemCell);
  const moduleDeliveryCandidate = root?.moduleDeliveryCells;
  const moduleDeliveryCells: unknown[] = Array.isArray(moduleDeliveryCandidate)
    ? moduleDeliveryCandidate
    : [];
  const workloadPlan = asRecord(root?.workloadPlan);
  const partitionContract = asRecord(workloadPlan?.partitionContract);

  if (
    typeof execution?.executionId !== "string" ||
    typeof execution?.status !== "string" ||
    typeof execution?.updatedAt !== "string" ||
    typeof workOrder?.mode !== "string" ||
    typeof workOrder?.founderApprovalRequired !== "boolean" ||
    typeof agentSecurity?.mode !== "string" ||
    !Array.isArray(agentSecurity?.blockers) ||
    !agentSecurity.blockers.every((item) => typeof item === "string") ||
    agentFleet?.ownership !== "pantavion_owned" ||
    !Array.isArray(agentFleet.agents) ||
    ecosystemCell?.ownership !== "pantavion_owned" ||
    !Array.isArray(ecosystemCell.services) ||
    typeof workloadPlan?.kind !== "string" ||
    typeof workloadPlan?.unitCount !== "number" ||
    typeof partitionContract?.batchCount !== "number" ||
    typeof partitionContract?.batchSize !== "number"
  ) {
    return null;
  }

  return {
    execution: {
      executionId: execution.executionId,
      status: execution.status,
      updatedAt: execution.updatedAt,
    },
    workOrder: {
      mode: workOrder.mode,
      founderApprovalRequired: workOrder.founderApprovalRequired,
    },
    agentSecurity: {
      mode: agentSecurity.mode,
      blockers: agentSecurity.blockers,
    },
    agentFleet: {
      ownership: "pantavion_owned",
      agents: agentFleet.agents
        .map((agent) => {
          const item = asRecord(agent);
          return typeof item?.id === "string" && typeof item?.role === "string" && typeof item?.state === "string"
            ? { id: item.id, role: item.role, state: item.state }
            : null;
        })
        .filter((agent): agent is { id: string; role: string; state: string } => Boolean(agent)),
    },
    ecosystemCell: {
      ownership: "pantavion_owned",
      services: ecosystemCell.services
        .map((service) => {
          const item = asRecord(service);
          return typeof item?.id === "string" && typeof item?.need === "string"
            ? { id: item.id, need: item.need }
            : null;
        })
        .filter((service): service is { id: string; need: string } => Boolean(service)),
    },
    moduleDeliveryCells: moduleDeliveryCells
      .map((cell) => {
        const item = asRecord(cell);
        return typeof item?.moduleId === "string" && typeof item?.displayName === "string"
          ? { moduleId: item.moduleId, displayName: item.displayName }
          : null;
      })
      .filter((cell): cell is { moduleId: string; displayName: string } => Boolean(cell)),
    workloadPlan: {
      kind: workloadPlan.kind,
      unitCount: workloadPlan.unitCount,
      partitionContract: {
        batchCount: partitionContract.batchCount,
        batchSize: partitionContract.batchSize,
      },
    },
  };
}

function createIdempotencyKey(): string {
  if (typeof window !== "undefined" && window.crypto?.randomUUID) {
    return `founder:${window.crypto.randomUUID()}`;
  }

  return `founder:${Date.now()}:${Math.random().toString(36).slice(2, 12)}`;
}

function splitFiles(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function KernelWorkOrderClient() {
  const [founderIntent, setFounderIntent] = useState("");
  const [target, setTarget] = useState<(typeof TARGETS)[number]["id"]>("pantaai_center");
  const [draftPatch, setDraftPatch] = useState(false);
  const [targetFilesText, setTargetFilesText] = useState("");
  const [recoveryExcavation, setRecoveryExcavation] = useState(false);
  const [recoveryUnitCount, setRecoveryUnitCount] = useState("28000");
  const [intakeReference, setIntakeReference] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workOrders, setWorkOrders] = useState<StoredWorkOrder[]>([]);

  const targetFiles = useMemo(() => splitFiles(targetFilesText), [targetFilesText]);
  const selectedTarget = TARGETS.find((item) => item.id === target) ?? TARGETS[0];

  async function readJson(response: Response): Promise<unknown> {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  function responseMessage(data: unknown, fallback: string): string {
    const root = asRecord(data);
    return typeof root?.message === "string"
      ? root.message
      : typeof root?.requiredAction === "string"
        ? root.requiredAction
        : fallback;
  }

  async function loadWorkOrders() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/kernel/work-orders?limit=20", {
        cache: "no-store",
        credentials: "same-origin",
      });
      const data = await readJson(response);
      const root = asRecord(data);

      if (!response.ok || !root?.ok || !Array.isArray(root.workOrders)) {
        throw new Error(responseMessage(data, "Δεν ήταν δυνατή η ανάγνωση της μόνιμης ουράς."));
      }

      setWorkOrders(
        root.workOrders
          .map(asStoredWorkOrder)
          .filter((item): item is StoredWorkOrder => Boolean(item)),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Αποτυχία ανάγνωσης της ουράς εργασιών.");
    } finally {
      setLoading(false);
    }
  }

  async function createWorkOrder() {
    if (founderIntent.trim().length < 12) {
      setError("Γράψε καθαρά τι θέλεις να λυθεί (τουλάχιστον 12 χαρακτήρες). ");
      return;
    }

    if (draftPatch && targetFiles.length === 0) {
      setError("Για draft κώδικα χρειάζονται τα ακριβή αρχεία που επιτρέπεται να αγγίξει.");
      return;
    }

    const parsedRecoveryUnitCount = Number.parseInt(recoveryUnitCount, 10);
    if (
      recoveryExcavation &&
      (!Number.isInteger(parsedRecoveryUnitCount) || parsedRecoveryUnitCount < 1 || parsedRecoveryUnitCount > 100_000)
    ) {
      setError("Οι μονάδες ανάκτησης πρέπει να είναι ακέραιος αριθμός από 1 έως 100.000.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/kernel/work-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          idempotencyKey: createIdempotencyKey(),
          founderIntent: founderIntent.trim(),
          target,
          capabilities: ["repo_truth", "code_audit", "verification", "founder_approval_gate"],
          targetFiles,
          approvalScope: draftPatch ? "scoped_draft_patch" : "proposal_only",
          ...(recoveryExcavation ? {
            workload: {
              kind: "recovery_excavation",
              unitCount: parsedRecoveryUnitCount,
              batchSize: 100,
              ...(intakeReference.trim() ? { intakeReference: intakeReference.trim() } : {}),
            },
          } : {}),
        }),
      });
      const data = await readJson(response);
      const root = asRecord(data);
      const persisted = asStoredWorkOrder(root?.workOrder);

      if (!response.ok || !root?.ok || !persisted) {
        throw new Error(responseMessage(data, "Δεν δημιουργήθηκε μόνιμη εντολή εργασίας."));
      }

      setWorkOrders((current) => [persisted, ...current.filter(
        (item) => item.execution.executionId !== persisted.execution.executionId,
      )]);
      setFounderIntent("");
      setTargetFilesText("");
      setRecoveryExcavation(false);
      setRecoveryUnitCount("28000");
      setIntakeReference("");
      setDraftPatch(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Αποτυχία δημιουργίας εντολής εργασίας.");
    } finally {
      setSubmitting(false);
    }
  }

  async function cancelWorkOrder(executionId: string) {
    setError(null);

    try {
      const response = await fetch("/api/kernel/work-orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          action: "cancel",
          executionId,
          reason: "founder_requested_stop_from_kernel_panel",
        }),
      });
      const data = await readJson(response);
      const root = asRecord(data);
      const persisted = asStoredWorkOrder(root?.workOrder);

      if (!response.ok || !root?.ok || !persisted) {
        throw new Error(responseMessage(data, "Η διακοπή δεν ολοκληρώθηκε."));
      }

      setWorkOrders((current) => current.map((item) => (
        item.execution.executionId === persisted.execution.executionId ? persisted : item
      )));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Αποτυχία διακοπής εντολής εργασίας.");
    }
  }

  return (
    <section className="mx-auto mt-8 max-w-7xl rounded-[2rem] border border-cyan-300/25 bg-slate-950/80 p-6 shadow-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.4em] text-cyan-200">
        Founder work order runtime
      </p>

      <h2 className="mt-3 text-3xl font-black">Εντολή προς τον πυρήνα</h2>
      <p className="mt-3 max-w-4xl leading-7 text-slate-200">
        Αυτή η φόρμα καλεί founder-only API. Στο αναπτυγμένο control plane αποθηκεύει την εντολή με
        checkpoints, module delivery cells και λογικούς, εσωτερικούς Pantavion specialists. Δεν χρησιμοποιεί
        άλλες cloud μηχανές, δεν κάνει merge/deploy και δεν αγγίζει ευαίσθητο σύστημα χωρίς ξεχωριστή έγκριση.
      </p>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <label className="block text-sm font-bold text-sky-100">
            Τι θέλεις να λύσει;
            <textarea
              value={founderIntent}
              onChange={(event) => setFounderIntent(event.target.value)}
              placeholder="Π.χ. Έλεγξε το πραγματικό μονοπάτι της αμφίδρομης μετάφρασης και ετοίμασε ασφαλές patch."
              className="mt-2 min-h-32 w-full rounded-2xl border border-white/20 bg-black/30 px-4 py-3 text-base text-white outline-none focus:border-cyan-200"
            />
          </label>

          <label className="block text-sm font-bold text-sky-100">
            Πεδίο
            <select
              value={target}
              onChange={(event) => setTarget(event.target.value as (typeof TARGETS)[number]["id"])}
              className="mt-2 w-full rounded-2xl border border-white/20 bg-black/30 px-4 py-3 text-white outline-none focus:border-cyan-200"
            >
              {TARGETS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/15 bg-black/20 p-4">
            <input
              type="checkbox"
              checked={draftPatch}
              onChange={(event) => setDraftPatch(event.target.checked)}
              className="mt-1 h-4 w-4"
            />
            <span>
              <span className="block font-bold text-white">Εγκρίνω μόνο draft σε απομονωμένο branch</span>
              <span className="mt-1 block text-sm leading-6 text-slate-300">
                Επιτρέπει μόνο scoped draft μετά από repo truth και audits — ποτέ αυτόματο merge ή production deploy.
              </span>
            </span>
          </label>

          {draftPatch ? (
            <label className="block text-sm font-bold text-sky-100">
              Ακριβή αρχεία που επιτρέπονται (ένα ανά γραμμή)
              <textarea
                value={targetFilesText}
                onChange={(event) => setTargetFilesText(event.target.value)}
                placeholder={"app/api/translate/route.ts\ncore/translation/provider-router.ts"}
                className="mt-2 min-h-24 w-full rounded-2xl border border-white/20 bg-black/30 px-4 py-3 font-mono text-sm text-white outline-none focus:border-cyan-200"
              />
            </label>
          ) : null}

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-cyan-200/30 bg-cyan-300/5 p-4">
            <input
              type="checkbox"
              checked={recoveryExcavation}
              onChange={(event) => setRecoveryExcavation(event.target.checked)}
              className="mt-1 h-4 w-4"
            />
            <span>
              <span className="block font-bold text-white">Χώρισε ανάκτηση/ταξινόμηση σε εσωτερικές παρτίδες</span>
              <span className="mt-1 block text-sm leading-6 text-slate-300">
                Ο πυρήνας δημιουργεί deterministic plan για όλες τις μονάδες, με 10 εσωτερικούς ρόλους και
                no-loss checkpoints — όχι εξωτερικούς workers.
              </span>
            </span>
          </label>

          {recoveryExcavation ? (
            <div className="grid gap-4 rounded-2xl border border-cyan-200/20 bg-black/20 p-4 md:grid-cols-2">
              <label className="block text-sm font-bold text-sky-100">
                Μονάδες προς ανάκτηση
                <input
                  type="number"
                  min="1"
                  max="100000"
                  value={recoveryUnitCount}
                  onChange={(event) => setRecoveryUnitCount(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-white outline-none focus:border-cyan-200"
                />
              </label>
              <label className="block text-sm font-bold text-sky-100">
                Αναφορά intake (προαιρετική, χωρίς δεδομένα)
                <input
                  value={intakeReference}
                  onChange={(event) => setIntakeReference(event.target.value)}
                  placeholder="recovery-archive-2026-08"
                  className="mt-2 w-full rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-white outline-none focus:border-cyan-200"
                />
              </label>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={createWorkOrder}
              disabled={submitting}
              className="rounded-2xl bg-cyan-300 px-5 py-3 font-black text-slate-950 disabled:opacity-60"
            >
              {submitting ? "Αποθήκευση…" : "Δημιούργησε μόνιμη εντολή"}
            </button>
            <button
              type="button"
              onClick={loadWorkOrders}
              disabled={loading}
              className="rounded-2xl border border-white/30 px-5 py-3 font-bold text-white disabled:opacity-60"
            >
              {loading ? "Φόρτωση…" : "Δες την πραγματική ουρά"}
            </button>
          </div>
        </div>

        <aside className="rounded-3xl border border-cyan-300/20 bg-cyan-300/5 p-5">
          <p className="text-sm font-bold text-cyan-100">Ενεργό πεδίο: {selectedTarget.label}</p>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-200">
            <li>• Κάθε εντολή έχει idempotency, checkpoint και audit trail.</li>
            <li>• Κάθε Pantavion Agent ξεκινά με deny-by-default για secrets και προσωπικά δεδομένα.</li>
            <li>• Ο orchestrator χωρίζει μόνο τις καταγεγραμμένες παρτίδες· δεν γεννά ανεξέλεγκτους agents.</li>
            <li>• Κανένας εξωτερικός cloud worker δεν συμμετέχει στην εκτέλεση.</li>
            <li>• Κάθε blocker δημιουργεί αποδεικτικό, ασφαλή εσωτερική λύση ή συγκεκριμένη founder απόφαση — δεν χάνεται στην ουρά.</li>
            <li>• Νερό, SOS και Safety μένουν proposal-only μέχρι ξεχωριστή έγκριση.</li>
            <li>• Η διακοπή είναι πραγματική αλλαγή κατάστασης στην ουρά.</li>
          </ul>
        </aside>
      </div>

      {error ? (
        <div className="mt-5 rounded-2xl border border-rose-400/40 bg-rose-950/40 p-4 text-rose-100">
          {error}
        </div>
      ) : null}

      <div className="mt-8 space-y-3">
        <h3 className="text-xl font-black">Μόνιμες εντολές εργασίας</h3>
        {workOrders.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
            Δεν έχει φορτωθεί ακόμη αποτέλεσμα. Πάτησε «Δες την πραγματική ουρά» — αν λείπει η βάση,
            θα εμφανιστεί καθαρό production blocker, όχι ψεύτικη κατάσταση.
          </p>
        ) : workOrders.map((item) => (
          <article key={item.execution.executionId} className="rounded-2xl border border-white/15 bg-black/20 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs text-cyan-200">{item.execution.executionId}</p>
                <p className="mt-2 font-bold text-white">
                  κατάσταση: {item.execution.status} · agent: {item.agentSecurity.mode} · plan: {item.workOrder.mode}
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  Pantavion agents: {item.agentFleet.agents.length} · modules: {item.moduleDeliveryCells.length} · παρτίδες: {item.workloadPlan.partitionContract.batchCount} × {item.workloadPlan.partitionContract.batchSize} · ecosystem services: {item.ecosystemCell.services.length}
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  Workload: {item.workloadPlan.kind} · μονάδες: {item.workloadPlan.unitCount}
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  Ενημερώθηκε: {new Date(item.execution.updatedAt).toLocaleString("el-GR")}
                </p>
              </div>
              {item.execution.status !== "cancelled" ? (
                <button
                  type="button"
                  onClick={() => cancelWorkOrder(item.execution.executionId)}
                  className="rounded-xl border border-rose-300/60 px-4 py-2 text-sm font-bold text-rose-100"
                >
                  Stop
                </button>
              ) : null}
            </div>
            {item.agentSecurity.blockers.length > 0 ? (
              <p className="mt-3 text-sm text-amber-200">Blockers: {item.agentSecurity.blockers.join(", ")}</p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
