import Link from "next/link";
import {
  pantavionDeviceCapabilities,
  pantavionUniversalDeviceDoctrine,
} from "@/core/emergency/lifeshield-device-support";
import DeviceCapabilityPanel from "./DeviceCapabilityPanel";

export default function PantavionDeviceSupportPage() {
  return (
    <main className="min-h-screen bg-[#050816] px-6 py-10 text-white">
      <section className="mx-auto flex max-w-7xl flex-col gap-8">
        <div className="rounded-[2rem] border border-yellow-400/25 bg-gradient-to-br from-[#081229] via-[#07101f] to-black p-8 shadow-2xl">
          <Link
            href="/pantavion/emergency"
            className="inline-flex rounded-full border border-yellow-300/40 px-4 py-2 text-sm font-semibold text-yellow-100 transition hover:bg-yellow-300/10"
          >
            ← Back to Emergency System
          </Link>

          <p className="mt-10 text-sm font-semibold uppercase tracking-[0.35em] text-yellow-300">
            Universal Device Layer
          </p>

          <h1 className="mt-4 max-w-5xl text-4xl font-bold leading-tight md:text-6xl">
            {pantavionUniversalDeviceDoctrine.title}
          </h1>

          <p className="mt-6 max-w-4xl text-lg leading-8 text-slate-200">
            {pantavionUniversalDeviceDoctrine.mission}
          </p>

          <div className="mt-8 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-5 text-yellow-100">
            <p className="text-sm font-semibold uppercase tracking-[0.25em]">
              Device Rule
            </p>
            <p className="mt-3 text-2xl font-semibold">
              {pantavionUniversalDeviceDoctrine.rule}
            </p>
          </div>
        </div>

        <DeviceCapabilityPanel />

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-2xl font-bold text-yellow-200">
            Target Devices
          </h2>

          <div className="mt-5 flex flex-wrap gap-3">
            {pantavionUniversalDeviceDoctrine.targetDevices.map((device) => (
              <span
                key={device}
                className="rounded-full border border-yellow-300/20 bg-black/30 px-4 py-2 text-sm text-yellow-100"
              >
                {device}
              </span>
            ))}
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {pantavionDeviceCapabilities.map((capability) => (
            <article
              key={capability.id}
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-xl"
            >
              <h2 className="text-2xl font-bold text-yellow-200">
                {capability.name}
              </h2>

              <p className="mt-4 leading-7 text-slate-200">
                {capability.emergencyUse}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {capability.worksOn.map((device) => (
                  <span
                    key={device}
                    className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200"
                  >
                    {device}
                  </span>
                ))}
              </div>

              <div className="mt-5 grid gap-2 text-sm text-slate-300">
                <p>
                  <span className="font-semibold text-white">
                    Browser dependent:
                  </span>{" "}
                  {capability.browserDependent ? "Yes" : "No"}
                </p>
                <p>
                  <span className="font-semibold text-white">
                    OS dependent:
                  </span>{" "}
                  {capability.osDependent ? "Yes" : "No"}
                </p>
                <p>
                  <span className="font-semibold text-white">
                    Hardware dependent:
                  </span>{" "}
                  {capability.hardwareDependent ? "Yes" : "No"}
                </p>
              </div>

              <div className="mt-5 rounded-2xl border border-red-300/20 bg-red-500/10 p-4">
                <p className="text-sm font-semibold text-red-100">
                  Truth Boundary
                </p>
                <p className="mt-2 text-sm leading-6 text-red-50">
                  {capability.truthBoundary}
                </p>
              </div>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
