import { getLiveBackendContract } from "../../core/pantavion/live-backend-contract";

export const dynamic = "force-dynamic";

export default function LiveCorePage() {
  const contract = getLiveBackendContract();

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "56px",
        background:
          "radial-gradient(circle at 70% 20%, rgba(211, 160, 86, 0.18), transparent 35%), linear-gradient(135deg, #050812, #07111f 45%, #02040a)",
        color: "#f6ead6",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      }}
    >
      <section style={{ maxWidth: 1120, margin: "0 auto" }}>
        <p style={{ color: "#d3a056", letterSpacing: 4, textTransform: "uppercase" }}>
          Pantavion Live Core
        </p>

        <h1 style={{ fontSize: 56, lineHeight: 1.02, margin: "18px 0" }}>
          Real backend spine is now separated from static surfaces.
        </h1>

        <p style={{ maxWidth: 820, color: "#cbbda5", fontSize: 18, lineHeight: 1.7 }}>
          This page verifies the Pantavion-owned live API foundation: health,
          kernel status, local PantaAI execution, guarded admission, SOS,
          contacts, and messaging routes.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 16,
            marginTop: 34,
          }}
        >
          <Card title="Backend Routes" value={`${contract.summary.backendConnectedRoutes}/${contract.summary.totalRoutes}`} />
          <Card title="Guarded Routes" value={String(contract.summary.guardedRoutes)} />
          <Card title="Third-party AI Visible" value={String(contract.summary.thirdPartyAiVisibleToUser)} />
          <Card title="Owned Kernel Execution" value={String(contract.summary.ownedKernelExecution)} />
        </div>

        <h2 style={{ marginTop: 44, color: "#d3a056" }}>Live Route Contract</h2>

        <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
          {contract.liveRoutes.map((route) => (
            <div
              key={route.id}
              style={{
                border: "1px solid rgba(211,160,86,0.24)",
                borderRadius: 18,
                padding: 18,
                background: "rgba(255,255,255,0.035)",
              }}
            >
              <strong>{route.method} {route.path}</strong>
              <p style={{ margin: "8px 0", color: "#cbbda5" }}>{route.description}</p>
              <small style={{ color: "#d3a056" }}>
                readiness: {route.readiness} | third-party: {route.thirdPartyDependency}
              </small>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function Card(props: { title: string; value: string }) {
  return (
    <div
      style={{
        border: "1px solid rgba(211,160,86,0.28)",
        borderRadius: 22,
        padding: 22,
        background: "rgba(255,255,255,0.045)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
      }}
    >
      <div style={{ color: "#cbbda5", fontSize: 13, letterSpacing: 2, textTransform: "uppercase" }}>
        {props.title}
      </div>
      <div style={{ color: "#f6ead6", fontSize: 28, fontWeight: 800, marginTop: 8 }}>
        {props.value}
      </div>
    </div>
  );
}
