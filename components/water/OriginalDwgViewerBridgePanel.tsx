import type { PantavionOriginalDwgViewerBridgeAssessment } from "@/core/water/original-dwg-viewer-bridge";

type Props = {
  bridge: PantavionOriginalDwgViewerBridgeAssessment;
};

function StatusBadge({ value }: { value: string }) {
  return (
    <span className="rounded-full border border-[#f6d37a]/40 bg-[#f6d37a]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#f6d37a]">
      {value}
    </span>
  );
}

export function OriginalDwgViewerBridgePanel({ bridge }: Props) {
  return (
    <section className="rounded-3xl border border-[#f6d37a]/25 bg-[#050814] p-6 text-white shadow-2xl">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-[#f6d37a]">
            Pantavion Water Surface {bridge.surface}
          </p>
          <h1 className="mt-2 text-3xl font-semibold">
            Original DWG Source Bridge
          </h1>
        </div>
        <StatusBadge value={bridge.status} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-white/50">
            Original file
          </p>
          <p className="mt-2 break-all font-mono text-sm text-[#f6d37a]">
            {bridge.originalFilename}
          </p>
          <p className="mt-3 text-sm text-white/70">
            Size: {bridge.expectedSizeBytes} bytes
          </p>
          <p className="mt-1 break-all text-xs text-white/50">
            SHA256: {bridge.expectedSha256}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-white/50">
            Execution status
          </p>
          <div className="mt-3 space-y-2 text-sm text-white/75">
            <p>Source truth: {bridge.sourceTruth ? "locked" : "not locked"}</p>
            <p>Read only: {bridge.readOnly ? "yes" : "no"}</p>
            <p>Immutable: {bridge.immutable ? "yes" : "no"}</p>
            <p>Automatic render: blocked</p>
            <p>CAD adapter: {bridge.cadAdapterStatus}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-[#f6d37a]/20 bg-[#f6d37a]/10 p-4 text-sm text-[#f7e5ad]">
        This page is connected to the protected original DWG binding. It does not
        show a fake map and it does not convert the DWG to GeoJSON, PDF, image,
        screenshot, or tiles. Real embedded rendering requires a licensed CAD/DWG
        viewer adapter.
      </div>

      <ul className="mt-5 space-y-2 text-sm text-white/65">
        {bridge.notes.slice(0, 5).map((note) => (
          <li key={note}>- {note}</li>
        ))}
      </ul>
    </section>
  );
}
