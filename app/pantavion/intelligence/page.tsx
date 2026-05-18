import Link from "next/link";
import {
  getPantavionBuildQueue,
  getPantavionOpportunities,
  getPantavionSovereignIntelligenceFabric,
} from "@/core/intelligence/pantavion-sovereign-intelligence-fabric";

export const dynamic = "force-dynamic";

export default function PantavionIntelligencePage() {
  const fabric = getPantavionSovereignIntelligenceFabric();
  const opportunities = getPantavionOpportunities();
  const buildQueue = getPantavionBuildQueue();

  return (
    <main style={{ minHeight: "100vh", padding: "40px", background: "#070b16", color: "#f7e7b4" }}>
      <section style={{ maxWidth: "1180px", margin: "0 auto" }}>
        <p style={{ letterSpacing: "0.16em", textTransform: "uppercase", color: "#d6b45c" }}>
          Pantavion Intelligence
        </p>
        <h1 style={{ fontSize: "42px", lineHeight: 1.1, margin: "12px 0" }}>
          Sovereign Multi-Brain Intelligence Fabric
        </h1>
        <p style={{ maxWidth: "900px", color: "#d7d7df", fontSize: "18px" }}>
          Internal live runtime surface for Pantavion brains, agents, six-continent watch,
          legal transformation, invention, product absorption, build queue, and cloud 24/365 readiness.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginTop: "28px" }}>
          <Card title="Brains" value={String(fabric.brainLayers.length)} />
          <Card title="Agent Roles" value={String(fabric.agentRoles.length)} />
          <Card title="Continent Watches" value={String(fabric.continentWatch.length)} />
          <Card title="Build Orders" value={String(buildQueue.length)} />
        </div>

        <h2 style={{ marginTop: "40px" }}>Live API routes</h2>
        <div style={{ display: "grid", gap: "10px", marginTop: "14px" }}>
          <RouteLink href="/api/pantavion/intelligence/status" />
          <RouteLink href="/api/pantavion/intelligence/tick" />
          <RouteLink href="/api/pantavion/intelligence/opportunities" />
          <RouteLink href="/api/pantavion/intelligence/build-queue" />
        </div>

        <h2 style={{ marginTop: "40px" }}>Brain layers</h2>
        <div style={{ display: "grid", gap: "14px", marginTop: "14px" }}>
          {fabric.brainLayers.map((brain) => (
            <article key={brain.id} style={{ border: "1px solid rgba(214,180,92,0.35)", borderRadius: "16px", padding: "18px", background: "rgba(255,255,255,0.04)" }}>
              <h3 style={{ margin: 0, color: "#ffd86b" }}>{brain.name}</h3>
              <p style={{ color: "#d7d7df" }}>{brain.purpose}</p>
              <p style={{ color: "#aeb3c2", fontSize: "14px" }}>
                Responsibilities: {brain.responsibilities.join(", ")}
              </p>
            </article>
          ))}
        </div>

        <h2 style={{ marginTop: "40px" }}>Six-continent watch</h2>
        <div style={{ display: "grid", gap: "14px", marginTop: "14px" }}>
          {fabric.continentWatch.map((watch) => (
            <article key={watch.continent} style={{ border: "1px solid rgba(214,180,92,0.25)", borderRadius: "16px", padding: "18px", background: "rgba(255,255,255,0.035)" }}>
              <h3 style={{ margin: 0, color: "#ffd86b" }}>{watch.continent.replace("_", " ")}</h3>
              <p style={{ color: "#d7d7df" }}>{watch.purpose}</p>
              <p style={{ color: "#aeb3c2", fontSize: "14px" }}>Targets: {watch.watchTargets.join(", ")}</p>
            </article>
          ))}
        </div>

        <h2 style={{ marginTop: "40px" }}>Opportunities</h2>
        <div style={{ display: "grid", gap: "14px", marginTop: "14px" }}>
          {opportunities.map((opportunity) => (
            <article key={opportunity.id} style={{ border: "1px solid rgba(214,180,92,0.25)", borderRadius: "16px", padding: "18px", background: "rgba(255,255,255,0.035)" }}>
              <h3 style={{ margin: 0, color: "#ffd86b" }}>{opportunity.title}</h3>
              <p style={{ color: "#d7d7df" }}>{opportunity.whyItMatters}</p>
              <p style={{ color: "#aeb3c2", fontSize: "14px" }}>Pantavion-owned move: {opportunity.pantavionOwnedMove}</p>
              <p style={{ color: "#aeb3c2", fontSize: "14px" }}>Status: {opportunity.buildStatus}</p>
            </article>
          ))}
        </div>

        <h2 style={{ marginTop: "40px" }}>Build queue</h2>
        <div style={{ display: "grid", gap: "14px", marginTop: "14px" }}>
          {buildQueue.map((item) => (
            <article key={item.id} style={{ border: "1px solid rgba(214,180,92,0.25)", borderRadius: "16px", padding: "18px", background: "rgba(255,255,255,0.035)" }}>
              <h3 style={{ margin: 0, color: "#ffd86b" }}>{item.title}</h3>
              <p style={{ color: "#d7d7df" }}>Target module: {item.targetModule}</p>
              <p style={{ color: "#aeb3c2", fontSize: "14px" }}>Routes: {item.routeTargets.join(", ")}</p>
              <p style={{ color: "#aeb3c2", fontSize: "14px" }}>Status: {item.status}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div style={{ border: "1px solid rgba(214,180,92,0.35)", borderRadius: "18px", padding: "20px", background: "rgba(255,255,255,0.05)" }}>
      <div style={{ color: "#aeb3c2", fontSize: "14px" }}>{title}</div>
      <div style={{ fontSize: "34px", color: "#ffd86b", fontWeight: 700 }}>{value}</div>
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

