export default function PantavionPage() {
  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold">Pantavion</h1>
        <p className="mt-3 text-slate-300">
          Pantavion unified app layer is now active.
        </p>

        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950/70 p-6">
          <h2 className="text-xl font-semibold">Compact Build Mode</h2>
          <p className="mt-2 text-slate-400">
            This route is the new Pantavion entry point. Next step is connecting
            core, state, and workspace engine.
          </p>
        </div>
      </div>
    </main>
  );
}
