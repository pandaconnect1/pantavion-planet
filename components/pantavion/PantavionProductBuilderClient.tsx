"use client";

import { useEffect, useMemo, useState } from "react";

type MissionRisk = "Z1" | "Z2" | "Z3" | "Z4";
type MissionStatus =
  | "ready"
  | "running"
  | "approval_required"
  | "approval_requested"
  | "approved"
  | "completed"
  | "blocked";

type MissionAction =
  | "select"
  | "start"
  | "request_approval"
  | "approve"
  | "complete"
  | "block"
  | "reset";

type Mission = {
  id: string;
  title: string;
  domain: string;
  description: string;
  risk: MissionRisk;
  status: MissionStatus;
  founderApprovalRequired: boolean;
  targetRoutes: string[];
  targetFiles: string[];
  truthRule: string;
  lastDecision?: string;
  updatedAt: string;
};

type BuilderState = {
  ok: boolean;
  route: string;
  generatedAt: string;
  selectedMissionId: string | null;
  nextExecutableMission: Mission | null;
  approvalQueue: Mission[];
  missions: Mission[];
  auditTail: {
    id: string;
    at: string;
    missionId: string;
    action: string;
    result: string;
    actor: string;
  }[];
  truthRule: string;
};

const PANTAVION_PRODUCT_BUILDER_CLIENT = "pantavion_product_builder_client_v1";
const API_ROUTE = "/api/pantavion/product-builder/missions";

function statusLabel(status: MissionStatus) {
  const labels: Record<MissionStatus, string> = {
    ready: "Ready",
    running: "Running",
    approval_required: "Approval required",
    approval_requested: "Approval requested",
    approved: "Approved",
    completed: "Completed",
    blocked: "Blocked"
  };

  return labels[status];
}

function riskTone(risk: MissionRisk) {
  if (risk === "Z1") return "text-emerald-300 border-emerald-400/35";
  if (risk === "Z2") return "text-sky-300 border-sky-400/35";
  if (risk === "Z3") return "text-amber-300 border-amber-400/35";
  return "text-red-300 border-red-400/35";
}

export default function PantavionProductBuilderClient() {
  const [state, setState] = useState<BuilderState | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  async function load() {
    const response = await fetch(API_ROUTE, { cache: "no-store" });
    const data = (await response.json()) as BuilderState;
    setState(data);
    setSelectedId(data.selectedMissionId || data.missions[0]?.id || null);
  }

  async function act(action: MissionAction, missionId?: string) {
    const targetMissionId = missionId || selectedId;
    if (!targetMissionId) return;

    setBusy(true);
    setNotice("");

    try {
      const response = await fetch(API_ROUTE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action,
          missionId: targetMissionId
        })
      });

      const data = (await response.json()) as BuilderState & { error?: string };

      if (!response.ok) {
        setNotice(data.error || "Action failed.");
        return;
      }

      setState(data);
      setSelectedId(data.selectedMissionId || targetMissionId);
      setNotice(`Action completed: ${action}`);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const selectedMission = useMemo(() => {
    if (!state) return null;
    return state.missions.find((mission) => mission.id === selectedId) || state.missions[0] || null;
  }, [state, selectedId]);

  return (
    <main className="min-h-screen bg-[#050814] text-white">
      <section className="mx-auto max-w-[1180px] px-5 py-8 lg:px-8">
        <div className="mb-6 rounded-[28px] border border-[#f6d37a]/30 bg-black/25 p-6 shadow-2xl">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.34em] text-[#f6d37a]">
            Pantavion Product Builder
          </p>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight md:text-5xl">
                Mission Queue
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 md:text-base">
                Real queue for Pantavion modules. Buttons below write runtime state through API.
                Risky missions require founder approval before execution.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void load()}
              className="rounded-2xl border border-[#f6d37a]/40 px-5 py-3 text-sm font-black text-[#f6d37a] transition hover:bg-[#f6d37a] hover:text-black"
            >
              Refresh runtime
            </button>
          </div>
        </div>

        {!state ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-slate-300">
            Loading real builder state...
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
            <aside className="rounded-[28px] border border-white/10 bg-white/[0.035] p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-black">Modules</h2>
                <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-slate-300">
                  {state.missions.length} missions
                </span>
              </div>

              <div className="space-y-3">
                {state.missions.map((mission) => (
                  <button
                    key={mission.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(mission.id);
                      void act("select", mission.id);
                    }}
                    className={[
                      "w-full rounded-2xl border p-4 text-left transition",
                      selectedMission?.id === mission.id
                        ? "border-[#f6d37a]/70 bg-[#f6d37a]/10"
                        : "border-white/10 bg-black/20 hover:border-[#f6d37a]/35"
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black">{mission.title}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                          {mission.domain}
                        </p>
                      </div>
                      <span className={`rounded-full border px-2 py-1 text-xs font-black ${riskTone(mission.risk)}`}>
                        {mission.risk}
                      </span>
                    </div>

                    <p className="mt-3 text-xs font-bold text-[#f6d37a]">
                      {statusLabel(mission.status)}
                    </p>
                  </button>
                ))}
              </div>
            </aside>

            <section className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5">
              {selectedMission && (
                <>
                  <div className="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.3em] text-[#f6d37a]">
                        Selected Mission
                      </p>
                      <h2 className="mt-2 text-2xl font-black md:text-3xl">
                        {selectedMission.title}
                      </h2>
                      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
                        {selectedMission.description}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm">
                      <p className="text-slate-400">Status</p>
                      <p className="mt-1 font-black text-[#f6d37a]">
                        {statusLabel(selectedMission.status)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <h3 className="font-black">Target routes</h3>
                      <div className="mt-3 space-y-2">
                        {selectedMission.targetRoutes.map((route) => (
                          <code key={route} className="block rounded-xl bg-black/35 px-3 py-2 text-xs text-sky-200">
                            {route}
                          </code>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <h3 className="font-black">Target files</h3>
                      <div className="mt-3 space-y-2">
                        {selectedMission.targetFiles.map((file) => (
                          <code key={file} className="block rounded-xl bg-black/35 px-3 py-2 text-xs text-emerald-200">
                            {file}
                          </code>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-[#f6d37a]/25 bg-[#f6d37a]/10 p-4">
                    <h3 className="font-black text-[#f6d37a]">Truth rule</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-200">
                      {selectedMission.truthRule}
                    </p>
                  </div>

                  {selectedMission.lastDecision && (
                    <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
                      <span className="font-black text-white">Last decision: </span>
                      {selectedMission.lastDecision}
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void act("start")}
                      className="rounded-2xl bg-[#f6d37a] px-5 py-3 text-sm font-black text-black disabled:opacity-50"
                    >
                      Start controlled build
                    </button>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void act("request_approval")}
                      className="rounded-2xl border border-amber-300/40 px-5 py-3 text-sm font-black text-amber-200 disabled:opacity-50"
                    >
                      Request founder approval
                    </button>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void act("approve")}
                      className="rounded-2xl border border-emerald-300/40 px-5 py-3 text-sm font-black text-emerald-200 disabled:opacity-50"
                    >
                      Founder approve
                    </button>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void act("complete")}
                      className="rounded-2xl border border-sky-300/40 px-5 py-3 text-sm font-black text-sky-200 disabled:opacity-50"
                    >
                      Mark completed
                    </button>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void act("block")}
                      className="rounded-2xl border border-red-300/40 px-5 py-3 text-sm font-black text-red-200 disabled:opacity-50"
                    >
                      Block
                    </button>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void act("reset")}
                      className="rounded-2xl border border-white/20 px-5 py-3 text-sm font-black text-white disabled:opacity-50"
                    >
                      Reset
                    </button>
                  </div>

                  {notice && (
                    <p className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-slate-300">
                      {notice}
                    </p>
                  )}

                  <div className="mt-6 rounded-2xl border border-white/10 bg-black/25 p-4">
                    <h3 className="font-black">Runtime audit tail</h3>
                    <div className="mt-3 max-h-[280px] overflow-auto space-y-2">
                      {state.auditTail.length === 0 ? (
                        <p className="text-sm text-slate-400">No audit entries yet.</p>
                      ) : (
                        state.auditTail.slice().reverse().map((item) => (
                          <div key={item.id} className="rounded-xl bg-white/[0.04] px-3 py-2 text-xs text-slate-300">
                            <span className="font-black text-[#f6d37a]">{item.action}</span>
                            {" · "}
                            {item.result}
                            {" · "}
                            {item.missionId}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <p className="mt-5 text-xs text-slate-500">
                    {PANTAVION_PRODUCT_BUILDER_CLIENT} · {state.truthRule}
                  </p>
                </>
              )}
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
