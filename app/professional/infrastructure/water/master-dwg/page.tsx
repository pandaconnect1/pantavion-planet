"use client";

import { useState } from "react";

const FILE_NAME = "2026_ANDREASPAP-01-02-014.dwg";

function t(value: string) {
  return value;
}

export default function WaterMasterDwgPage() {
  const [founderCode, setFounderCode] = useState("");
  const [status, setStatus] = useState("ready");
  const [details, setDetails] = useState("");

  async function downloadMaster() {
    setStatus("loading");
    setDetails("");

    try {
      const response = await fetch("/api/professional/infrastructure/water/master-dwg", {
        cache: "no-store",
        headers: {
          "x-pantavion-water-founder-code": founderCode.trim(),
        },
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || `HTTP_${response.status}`);
      }

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = objectUrl;
      link.download = FILE_NAME;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => {
        window.URL.revokeObjectURL(objectUrl);
      }, 15000);

      setStatus("ok");
      setDetails("DOWNLOAD_OK");
    } catch (error) {
      setStatus("error");
      setDetails(error instanceof Error ? error.message : "UNKNOWN_ERROR");
    }
  }

  return (
    <main className="min-h-screen bg-[#061120] px-5 py-8 text-white">
      <section className="mx-auto max-w-5xl rounded-3xl border border-[#f2c766]/40 bg-[#0b1728] p-6 shadow-2xl">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-[#f2c766]">
          PANTAVION WATER
        </p>

        <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">
          {"\u03a7\u03ac\u03c1\u03c4\u03b7\u03c2 \u0392 - \u0393\u03bd\u03ae\u03c3\u03b9\u03bf\u03c2 DWG Master"}
        </h1>

        <p className="mt-4 max-w-3xl text-sm font-semibold leading-6 text-slate-300">
          {"\u0391\u03c5\u03c4\u03cc\u03c2 \u03b5\u03af\u03bd\u03b1\u03b9 \u03bf \u03b3\u03bd\u03ae\u03c3\u03b9\u03bf\u03c2 \u03c4\u03b5\u03c7\u03bd\u03b9\u03ba\u03cc\u03c2 master \u03c7\u03ac\u03c1\u03c4\u03b7\u03c2. \u0394\u03b5\u03bd \u03bc\u03b5\u03c4\u03b1\u03c4\u03c1\u03ad\u03c0\u03b5\u03c4\u03b1\u03b9, \u03b4\u03b5\u03bd \u03c6\u03b9\u03bb\u03c4\u03c1\u03ac\u03c1\u03b5\u03c4\u03b1\u03b9, \u03b4\u03b5\u03bd \u03b1\u03c0\u03bb\u03bf\u03c0\u03bf\u03b9\u03b5\u03af\u03c4\u03b1\u03b9."}
        </p>

        <div className="mt-6 rounded-2xl border border-slate-700 bg-black/25 p-4">
          <p className="text-sm font-black text-[#f2c766]">MASTER FILE</p>
          <p className="mt-2 break-all text-lg font-black">{FILE_NAME}</p>
          <p className="mt-2 text-xs font-semibold text-slate-400">
            BLOB_PATH: water/private/maps/dwg/2026_ANDREASPAP-01-02-014.dwg
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto]">
          <input
            value={founderCode}
            onChange={(event) => setFounderCode(event.target.value)}
            type="password"
            placeholder="Founder access code"
            className="rounded-2xl border border-slate-600 bg-[#07111f] px-4 py-4 text-sm font-bold text-white outline-none focus:border-[#f2c766]"
          />

          <button
            type="button"
            onClick={() => void downloadMaster()}
            disabled={status === "loading"}
            className="rounded-2xl border border-[#f2c766] bg-[#f2c766]/15 px-6 py-4 text-sm font-black uppercase tracking-[0.16em] text-[#f8e6ad] transition hover:bg-[#f2c766]/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "loading" ? "LOADING" : "DOWNLOAD DWG MASTER"}
          </button>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-700 bg-[#07111f] p-4">
          <p className="text-sm font-black">
            STATUS: <span className="text-[#f2c766]">{status}</span>
          </p>
          {details ? (
            <p className="mt-2 break-all text-xs font-semibold text-slate-300">
              {details}
            </p>
          ) : null}
        </div>

        <div className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4">
          <p className="text-sm font-black text-emerald-200">
            {"\u039a\u03b1\u03bd\u03cc\u03bd\u03b1\u03c2 \u03b1\u03c3\u03c6\u03b1\u03bb\u03b5\u03af\u03b1\u03c2"}
          </p>
          <p className="mt-2 text-xs font-semibold leading-5 text-emerald-100/90">
            {"\u039f \u03a7\u03ac\u03c1\u03c4\u03b7\u03c2 \u0392 \u03bc\u03ad\u03bd\u03b5\u03b9 \u03b3\u03bd\u03ae\u03c3\u03b9\u03bf\u03c2. \u039f \u03a7\u03ac\u03c1\u03c4\u03b7\u03c2 \u0391 \u03b4\u03b5\u03bd \u03b1\u03bb\u03bb\u03ac\u03b6\u03b5\u03b9. \u039f \u03a7\u03ac\u03c1\u03c4\u03b7\u03c2 \u0393 \u03b8\u03b1 \u03bc\u03c0\u03b5\u03b9 \u03bc\u03b5\u03c4\u03ac \u03b1\u03c0\u03cc Google Earth / KMZ."}
          </p>
        </div>
      </section>
    </main>
  );
}
