import Link from "next/link";
import {
  getPantavionCloudCronStatus,
  readLocalLedgerEvents,
} from "@/core/intelligence/pantavion-intelligence-ledger";

export const dynamic = "force-dynamic";

export default async function PantavionIntelligenceCloudPage() {
  const status = getPantavionCloudCronStatus();
  const events = await readLocalLedgerEvents(20);

  return (
    <main style={{ minHeight: "100vh", padding: "40px", background: "#060914", color: "#f8e7b0" }}>
      <section style={{ maxWidth: "1180px", margin: "0 auto" }}>
        <p style={{ letterSpacing: "0.16em", textTransform: "uppercase", color: "#d6b45c" }}>
          Pantavion Cloud Runtime
        </p>

        <h1 style={{ fontSize: "42px", lineHeight: 1.1, margin: "12px 0" }}>
          24/365 Intelligence Scheduler and Tick Ledger
        </h1>

        <p style={{ maxWidth: "920px", color: "#d7d7df", fontSize: "18px" }}>
          This page verifies the cloud scheduler contract, cron endpoint, ledger mode,
          health route, and intelligence tick runtime. It does not claim autonomous deployment
          without approval, audit, build, push, and production verification.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginTop: "28px" }}>
          <Card title="Cron route" value={status.cronRoute} />
          <Card title="Schedule" value={status.cronSchedule} />
          <Card title="Cron secret" value={status.hasCronSecret ? "configured" : "missing"} />
          <Card title="Durable ledger" value={status.hasExternalLedgerEndpoint ? "configured" : "pending"} />
        </div>

        <h2 style={{ marginTop: "40px" }}>Live cloud routes</h2>
        <div style={{ display: "grid", gap: "10px", marginTop: "14px" }}>
          <RouteLink href="/api/pantavion/intelligence/cron" />
          <RouteLink href="/api/pantavion/intelligence/ledger" />
          <RouteLink href="/api/pantavion/intelligence/health" />
          <RouteLink href="/api/pantavion/intelligence/tick" />
        </div>

        <h2 style={{ marginTop: "40px" }}>Storage truth</h2>
        <article style={{ border: "1px solid rgba(214,180,92,0.35)", borderRadius: "16px", padding: "18px", background: "rgba(255,255,255,0.04)" }}>
          <p style={{ color: "#d7d7df" }}>{status.storageTruth}</p>
          <ul style={{ color: "#aeb3c2" }}>
            {status.requirementsToBecomeFull24x365.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <h2 style={{ marginTop: "40px" }}>Recent tick ledger</h2>
        <div style={{ display: "grid", gap: "14px", marginTop: "14px" }}>
          {events.length === 0 ? (
            <article style={{ border: "1px solid rgba(214,180,92,0.25)", borderRadius: "16px", padding: "18px", background: "rgba(255,255,255,0.035)" }}>
              <p style={{ color: "#d7d7df" }}>
                No tick events recorded in the visible runtime ledger yet. Open the cron route or wait for the cloud scheduler after deployment.
              </p>
            </article>
          ) : (
            events.map((event) => (
              <article key={event.id} style={{ border: "1px solid rgba(214,180,92,0.25)", borderRadius: "16px", padding: "18px", background: "rgba(255,255,255,0.035)" }}>
                <h3 style={{ margin: 0, color: "#ffd86b" }}>{event.id}</h3>
                <p style={{ color: "#d7d7df" }}>{event.summary}</p>
                <p style={{ color: "#aeb3c2", fontSize: "14px" }}>Created: {event.createdAt}</p>
                <p style={{ color: "#aeb3c2", fontSize: "14px" }}>Storage: {event.storageMode}</p>
                <p style={{ color: "#aeb3c2", fontSize: "14px" }}>Status: {event.status}</p>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div style={{ border: "1px solid rgba(214,180,92,0.35)", borderRadius: "18px", padding: "20px", background: "rgba(255,255,255,0.05)" }}>
      <div style={{ color: "#aeb3c2", fontSize: "14px" }}>{title}</div>
      <div style={{ fontSize: "20px", color: "#ffd86b", fontWeight: 700, overflowWrap: "anywhere" }}>{value}</div>
    </div>
  );
}

function RouteLink({ href }: { href: string }) {
  return (
    <Link href={href} style={{ color: "#ffd86b", border: "1px solid rgba(214,180,92,0.28)", borderRadius: "12px", padding: "12px 14px", textDecoration: "none", background: "rgba(255,255,255,0.04)" }}>
      {href}
    </Link>
  );
}

