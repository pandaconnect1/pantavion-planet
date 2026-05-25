"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function MasterBViewerPage() {
  const [status, setStatus] = useState("loading");
  const [details, setDetails] = useState("");
  const [renderUrl, setRenderUrl] = useState("");
  const [marker, setMarker] = useState<{ x: number; y: number } | null>(null);
  const frameWrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    let objectUrl = "";

    async function loadRender() {
      try {
        setStatus("loading");
        setDetails("");

        const response = await fetch("/api/professional/infrastructure/water/master-b-render", {
          cache: "no-store",
          credentials: "same-origin",
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.error || `HTTP_${response.status}`);
        }

        const blob = await response.blob();
        objectUrl = window.URL.createObjectURL(blob);

        if (!cancelled) {
          setRenderUrl(objectUrl);
          setStatus("ready");
          setDetails("MASTER_B_RENDER_READY");
        }
      } catch (error) {
        if (!cancelled) {
          setStatus("error");
          setDetails(error instanceof Error ? error.message : "MASTER_B_RENDER_FAILED");
        }
      }
    }

    void loadRender();

    return () => {
      cancelled = true;

      if (objectUrl) {
        window.URL.revokeObjectURL(objectUrl);
      }
    };
  }, []);

  function moveMarker(event: React.PointerEvent<HTMLDivElement>) {
    const element = frameWrapRef.current;

    if (!element) return;

    const rect = element.getBoundingClientRect();

    setMarker({
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    });
  }

  return (
    <main className="min-h-screen bg-[#061120] px-4 py-5 text-white">
      <section className="mx-auto max-w-7xl rounded-3xl border border-[#f2c766]/40 bg-[#0b1728] p-4 shadow-2xl md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#f2c766]">
              PANTAVION WATER
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">
              Master B Viewer
            </h1>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-300">
              Internal Pantavion view of Master B. The original DWG remains protected and unchanged.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/professional/infrastructure/water/live"
              className="rounded-xl border border-slate-600 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-200"
            >
              Map A
            </Link>
            <Link
              href="/professional/infrastructure/water/master-dwg"
              className="rounded-xl border border-slate-600 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-200"
            >
              A / B
            </Link>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-700 bg-black/25 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#f2c766]">
              Status
            </p>
            <p className="mt-2 text-sm font-black">{status}</p>
            <p className="mt-2 break-all text-xs font-semibold text-slate-300">{details}</p>
          </div>

          <button
            type="button"
            onClick={() => setMarker(null)}
            className="rounded-2xl border border-slate-700 bg-black/25 p-4 text-left text-sm font-black text-slate-200"
          >
            Clear marker
          </button>

          <div className="rounded-2xl border border-slate-700 bg-black/25 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#f2c766]">
              Marker
            </p>
            <p className="mt-2 text-xs font-semibold text-slate-300">
              {marker ? `${marker.x.toFixed(2)}%, ${marker.y.toFixed(2)}%` : "No marker"}
            </p>
          </div>
        </div>

        <div
          ref={frameWrapRef}
          className="relative mt-5 h-[72vh] overflow-hidden rounded-2xl border border-slate-700 bg-[#07111f]"
          onPointerDown={moveMarker}
          onPointerMove={(event) => {
            if (event.buttons === 1) {
              moveMarker(event);
            }
          }}
        >
          {renderUrl ? (
            <iframe
              title="Pantavion Master B Render"
              src={renderUrl}
              className="h-full w-full bg-white"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm font-black text-slate-300">
              Loading Master B...
            </div>
          )}

          {marker ? (
            <div
              className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#f2c766] shadow-2xl"
              style={{
                left: `${marker.x}%`,
                top: `${marker.y}%`,
              }}
            />
          ) : null}
        </div>
      </section>
    </main>
  );
}
