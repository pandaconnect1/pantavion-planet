import Link from "next/link";
import type { CSSProperties } from "react";

export const metadata = {
  title: "PantaAI Routing | Pantavion One",
  description:
    "PantaAI routing foundation for intent, capability families, kernel routes and execution lanes.",
};

type RouteStatus = "live-foundation" | "active-preview" | "provider-required";

type RoutingDecision = {
  id: string;
  title: string;
  query: string;
  kernelRoute: string;
  visibleRoute: string;
  status: RouteStatus;
  internalCapabilityFamilies: string[];
  worksNow: string[];
  next: string[];
};

const routingDecisions: RoutingDecision[] = [
  {
    id: "language-bridge",
    title: "Universal Language Bridge",
    query: "Translate, voice, subtitles, multilingual rooms, cross-language communication.",
    kernelRoute: "voice.multilingual.runtime",
    visibleRoute: "/language",
    status: "live-foundation",
    internalCapabilityFamilies: [
      "Text translation",
      "Voice interpretation",
      "Subtitles",
      "Group translation",
      "Cross-language rooms",
    ],
    worksNow: [
      "Routing page is real",
      "Language capability is represented",
      "Visible route is connected",
      "Provider requirement is explicit",
    ],
    next: [
      "Connect translation provider",
      "Add speech-to-text",
      "Add text-to-speech",
      "Add live captions",
    ],
  },
  {
    id: "planet-screen",
    title: "Planet / World Screen",
    query: "Countries, cultures, cities, world signals, global problems and solutions.",
    kernelRoute: "planet.signal.runtime",
    visibleRoute: "/planet",
    status: "active-preview",
    internalCapabilityFamilies: [
      "World feed",
      "Country matrix",
      "Culture graph",
      "Global signal routing",
      "Problem-solution mapping",
    ],
    worksNow: [
      "Route exists as Pantavion capability surface",
      "Planetary concept is visible",
      "No fake live-data claim",
    ],
    next: [
      "Add country/culture database",
      "Add map provider",
      "Add verified signal sources",
      "Add region filters",
    ],
  },
  {
    id: "people-social",
    title: "People / Social Universe",
    query: "Profiles, friends, followers, communities, dating, relationships, creators.",
    kernelRoute: "people.social.graph",
    visibleRoute: "/people",
    status: "active-preview",
    internalCapabilityFamilies: [
      "Profiles",
      "Social graph",
      "Communities",
      "Dating safety",
      "Creator identity",
    ],
    worksNow: [
      "Social surface is reachable",
      "People capability is mapped",
      "Privacy scope requirement is explicit",
    ],
    next: [
      "Add database",
      "Add profile model",
      "Add friend/follow graph",
      "Add privacy scopes",
    ],
  },
  {
    id: "pantaai-execution",
    title: "PantaAI Execution Center",
    query: "Intent, plan, capability selection, orchestration, result, memory candidate.",
    kernelRoute: "intelligence.intent.execution",
    visibleRoute: "/intelligence/execute",
    status: "live-foundation",
    internalCapabilityFamilies: [
      "Intent parser",
      "Plan generator",
      "Capability registry",
      "Execution packet",
      "Memory candidate",
    ],
    worksNow: [
      "PantaAI route exists",
      "Execution doctrine is visible",
      "Kernel routing concept is represented",
    ],
    next: [
      "Connect model router",
      "Connect tool providers",
      "Connect memory store",
      "Add workspace execution",
    ],
  },
  {
    id: "work-commerce",
    title: "Work / Services / Income",
    query: "Jobs, services, marketplace, earnings, business profiles, subscriptions.",
    kernelRoute: "commercial.execution.runtime",
    visibleRoute: "/work",
    status: "provider-required",
    internalCapabilityFamilies: [
      "Jobs",
      "Services",
      "Marketplace",
      "Business profiles",
      "Earnings",
    ],
    worksNow: [
      "Commercial surface is mapped",
      "Regulated/payment boundary is explicit",
      "No fake banking claim",
    ],
    next: [
      "Connect payments provider",
      "Add listings database",
      "Add invoices",
      "Add payouts after compliance review",
    ],
  },
  {
    id: "safety-identity",
    title: "Safety / Law / Identity",
    query: "Age gate, minors, legal, privacy, reports, moderation, lawful escalation.",
    kernelRoute: "security.identity.governance",
    visibleRoute: "/safety",
    status: "live-foundation",
    internalCapabilityFamilies: [
      "Age gate",
      "Minors protection",
      "Terms and privacy",
      "Reports",
      "Audit logs",
    ],
    worksNow: [
      "Safety surface is reachable",
      "Legal boundaries are explicit",
      "Hidden admin behavior is not used",
    ],
    next: [
      "Add report database",
      "Add moderation queue",
      "Add audit logs",
      "Add country-specific rules",
    ],
  },
];

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at 18% 12%, rgba(57,214,255,.14), transparent 28%), radial-gradient(circle at 84% 6%, rgba(214,168,74,.14), transparent 26%), linear-gradient(135deg, #03060B 0%, #071426 52%, #0B1E3A 100%)",
  color: "#F5F1E7",
  padding: "48px 20px",
};

const containerStyle: CSSProperties = {
  width: "min(1180px, 100%)",
  margin: "0 auto",
};

const headerStyle: CSSProperties = {
  border: "1px solid rgba(214,168,74,.22)",
  borderRadius: 28,
  padding: 28,
  background: "rgba(3,6,11,.64)",
  boxShadow: "0 0 70px rgba(57,214,255,.10)",
  marginBottom: 22,
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 18,
};

const cardStyle: CSSProperties = {
  border: "1px solid rgba(245,241,231,.13)",
  borderRadius: 24,
  padding: 20,
  background: "rgba(255,255,255,.04)",
};

const badgeStyle: Record<RouteStatus, CSSProperties> = {
  "live-foundation": {
    display: "inline-flex",
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(57,214,255,.36)",
    color: "#39D6FF",
    fontSize: 12,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: ".08em",
  },
  "active-preview": {
    display: "inline-flex",
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(214,168,74,.42)",
    color: "#D6A84A",
    fontSize: 12,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: ".08em",
  },
  "provider-required": {
    display: "inline-flex",
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(217,83,79,.42)",
    color: "#FF9B97",
    fontSize: 12,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: ".08em",
  },
};

const buttonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 42,
  padding: "0 14px",
  borderRadius: 999,
  border: "1px solid rgba(214,168,74,.44)",
  color: "#F5F1E7",
  textDecoration: "none",
  fontWeight: 800,
  marginTop: 10,
};

export default function PantaAIRoutingPage() {
  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <section style={headerStyle}>
          <p
            style={{
              color: "#D6A84A",
              letterSpacing: ".22em",
              textTransform: "uppercase",
              fontSize: 12,
              fontWeight: 900,
              margin: 0,
            }}
          >
            Pantavion One / PantaAI Routing
          </p>

          <h1
            style={{
              fontSize: "clamp(38px, 7vw, 76px)",
              lineHeight: ".94",
              letterSpacing: "-.055em",
              margin: "14px 0",
            }}
          >
            Intent becomes route. Route becomes capability. Capability becomes execution.
          </h1>

          <p style={{ color: "rgba(245,241,231,.74)", fontSize: 18, lineHeight: 1.65, maxWidth: 880 }}>
            This page is a compatibility-safe routing surface. It does not depend on the older
            PantaAIRouteDecision shape that caused the TypeScript build failure. It preserves the product
            truth: Pantavion is not a tool directory. It routes intent into governed capability families.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 20 }}>
            <Link href="/intelligence/execute" style={buttonStyle}>
              Open PantaAI Execute
            </Link>
            <Link href="/intelligence/capabilities" style={buttonStyle}>
              View Capabilities
            </Link>
            <Link href="/dashboard" style={buttonStyle}>
              Open Dashboard
            </Link>
          </div>
        </section>

        <section style={gridStyle}>
          {routingDecisions.map((route) => (
            <article key={route.id} style={cardStyle}>
              <span style={badgeStyle[route.status]}>{route.status}</span>

              <h2 style={{ fontSize: 24, margin: "14px 0 8px" }}>{route.title}</h2>

              <p style={{ color: "rgba(245,241,231,.68)", lineHeight: 1.55 }}>{route.query}</p>

              <div
                style={{
                  border: "1px solid rgba(57,214,255,.18)",
                  borderRadius: 16,
                  padding: 12,
                  background: "rgba(57,214,255,.05)",
                  marginTop: 12,
                }}
              >
                <strong style={{ color: "#39D6FF" }}>Kernel route</strong>
                <div style={{ color: "rgba(245,241,231,.76)", marginTop: 4 }}>{route.kernelRoute}</div>
              </div>

              <h3 style={{ color: "#D6A84A", marginTop: 18 }}>Capability families</h3>
              <ul style={{ color: "rgba(245,241,231,.70)", lineHeight: 1.55 }}>
                {route.internalCapabilityFamilies.map((family) => (
                  <li key={family}>{family}</li>
                ))}
              </ul>

              <h3 style={{ color: "#D6A84A", marginTop: 18 }}>Works now</h3>
              <ul style={{ color: "rgba(245,241,231,.70)", lineHeight: 1.55 }}>
                {route.worksNow.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>

              <h3 style={{ color: "#D6A84A", marginTop: 18 }}>Next</h3>
              <ul style={{ color: "rgba(245,241,231,.70)", lineHeight: 1.55 }}>
                {route.next.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>

              <Link href={route.visibleRoute} style={buttonStyle}>
                Open route
              </Link>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
