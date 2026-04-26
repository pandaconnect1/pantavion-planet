import {
  KERNEL_HARDENING_LEDGER,
  KERNEL_HARDENING_STATUS_LABELS,
  getKernelHardeningSummary,
} from "@/core/pantavion/kernel-hardening-ledger";

export default function KernelHardeningPage() {
  const summary = getKernelHardeningSummary();

  return (
    <main style={{ minHeight: "100vh", background: "#050711", color: "#f6e7b8", padding: "48px 20px" }}>
      <section style={{ maxWidth: "1180px", margin: "0 auto" }}>
        <p style={{ margin: "0 0 12px", color: "#d6ad60", letterSpacing: "0.16em", textTransform: "uppercase", fontSize: "12px" }}>
          Pantavion Kernel Control Room
        </p>

        <h1 style={{ margin: "0 0 16px", fontSize: "clamp(36px, 6vw, 72px)", lineHeight: 0.95 }}>
          Kernel Real-World Hardening Ledger
        </h1>

        <p style={{ maxWidth: "960px", color: "#c9d3e7", fontSize: "18px", lineHeight: 1.7 }}>
          Pantavion must survive real users, broken routes, dead buttons, false claims, payment gates,
          SOS boundaries, translation limits, third-party lock-in attempts and recovery pressure.
          The Kernel does not claim impossible zero failure. It enforces zero uncontrolled risk.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px", marginTop: "28px" }}>
          <Metric label="Hardening records" value={summary.total} />
          <Metric label="Critical" value={summary.critical} />
          <Metric label="Active foundation" value={summary.activeFoundation} />
          <Metric label="Required next" value={summary.requiredNext} />
          <Metric label="Blocked gates" value={summary.blockedUntilGate} />
        </div>

        <div style={{ marginTop: "28px", border: "1px solid rgba(255,96,96,0.45)", borderRadius: "22px", padding: "20px", background: "rgba(255,96,96,0.08)" }}>
          <strong style={{ color: "#ffd1d1" }}>Kernel rule: zero uncontrolled risk.</strong>
          <p style={{ margin: "8px 0 0", color: "#f3c7c7", lineHeight: 1.6 }}>
            The Kernel must block fake-live claims, dead surfaces, uncontrolled provider dependency, unsafe payment activation,
            false emergency promises and unsupported production claims.
          </p>
        </div>

        <div style={{ marginTop: "34px", display: "grid", gap: "16px" }}>
          {KERNEL_HARDENING_LEDGER.map((record) => (
            <article
              key={record.id}
              style={{
                border: "1px solid rgba(214,173,96,0.28)",
                borderRadius: "22px",
                padding: "22px",
                background: "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
                boxShadow: "0 18px 60px rgba(0,0,0,0.25)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: "24px", color: "#fff7da" }}>{record.name}</h2>
                  <p style={{ margin: "8px 0 0", color: "#94a3b8" }}>{record.plane}</p>
                </div>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <Badge text={KERNEL_HARDENING_STATUS_LABELS[record.status]} />
                  <Badge text={`${record.risk.toUpperCase()} RISK`} />
                </div>
              </div>

              <GridBlock title="Kernel duty" text={record.kernelDuty} />
              <GridBlock title="Failure if missing" text={record.failureIfMissing} />
              <GridBlock title="Automatic action" text={record.automaticAction} />
              <GridBlock title="Human action required" text={record.humanActionRequired} />
              <GridBlock title="Live claim allowed" text={record.liveClaimAllowed} />
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ border: "1px solid rgba(214,173,96,0.26)", borderRadius: "20px", padding: "18px", background: "rgba(255,255,255,0.045)" }}>
      <p style={{ margin: 0, color: "#94a3b8", fontSize: "13px" }}>{label}</p>
      <strong style={{ display: "block", marginTop: "8px", color: "#fff7da", fontSize: "32px" }}>{value}</strong>
    </div>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <span style={{ border: "1px solid rgba(214,173,96,0.35)", borderRadius: "999px", padding: "7px 10px", color: "#f6e7b8", background: "rgba(214,173,96,0.1)", fontSize: "12px", whiteSpace: "nowrap" }}>
      {text}
    </span>
  );
}

function GridBlock({ title, text }: { title: string; text: string }) {
  return (
    <div style={{ marginTop: "16px" }}>
      <h3 style={{ margin: "0 0 6px", color: "#d6ad60", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.12em" }}>
        {title}
      </h3>
      <p style={{ margin: 0, color: "#c9d3e7", lineHeight: 1.7 }}>{text}</p>
    </div>
  );
}
