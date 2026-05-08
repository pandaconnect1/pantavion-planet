import Link from "next/link";
import type { CSSProperties } from "react";

const primaryActions = [
  {
    label: "Water Network",
    href: "/professional/infrastructure/water",
    tone: "blue",
  },  {
    label: "Open Universal Interpreter",
    href: "/translate",
    tone: "gold",
  },
  {
    label: "Ask PantaAI",
    href: "/panta-ai",
    tone: "blue",
  },
  {
    label: "SOS Center",
    href: "/sos",
    tone: "red",
  },
];

const publicModules = [
  {
    title: "Universal Interpreter",
    href: "/translate",
    status: "Live public surface",
    marker: "PANTAVION_UNIVERSAL_INTERPRETER_V1",
    text: "Independent natural-language interpreter for travel, work, social meetings, signs, text, subtitles, accessibility, elder mode, and SOS support.",
  },
  {
    title: "PantaAI Command Center",
    href: "/panta-ai",
    status: "AI command layer",
    marker: "PANTAVION_AI_COMMAND_CENTER_V1",
    text: "Public AI, personal AI direction, work AI, creator AI, SOS language AI, and Internal Guardian Kernel doctrine.",
  },
  {
    title: "SOS Center",
    href: "/sos",
    status: "Trusted contacts first",
    marker: "PANTAVION_SOS_AI_CENTER_V1",
    text: "Emergency circle, browser/PWA actions, local sharing, elder-safe path, and clear no-false-dispatch boundaries.",
  },
  {
    title: "Elder Safe Mode",
    href: "/sos/elder",
    status: "Simple mode",
    marker: "PANTAVION_ELDER_SAFE_MODE",
    text: "High-contrast safety, simple translation, red/orange/green model, and elder/minor/special-needs friendly flow.",
  },
  {
    title: "People",
    href: "/people",
    status: "Human network surface",
    marker: "PANTAVION_PEOPLE_LAYER_V1",
    text: "Global people, profiles, contacts, communities, family, professional presence, and consent-based connection direction.",
  },
  {
    title: "Planet",
    href: "/planet",
    status: "Global hub",
    marker: "PANTAVION_PLANET_SCREEN_V1",
    text: "The planet in one living screen: continents, countries, cultures, languages, public awareness, and global navigation.",
  },
  {
    title: "Radio / Audio",
    href: "/radio",
    status: "Media surface",
    marker: "PANTAVION_AUDIO_NETWORK_V1",
    text: "World audio, multilingual radio direction, civic alerts, culture, news summaries, and future personal audio streams.",
  },
  {
    title: "Services",
    href: "/services",
    status: "Service layer",
    marker: "PANTAVION_SERVICES_LAYER_V1",
    text: "Future service access, professional help, local/global requests, and governed service discovery.",
  },
  {
    title: "Work",
    href: "/work",
    status: "Work layer",
    marker: "PANTAVION_WORK_LAYER_V1",
    text: "Work, income, productivity, business workflows, and future AI-assisted professional execution.",
  },
  {
    title: "Professional Infrastructure / Water Network",
    href: "/professional/infrastructure/water",
    status: "Protected professional module",
    marker: "PANTAVION_PROFESSIONAL_WATER_NETWORK_PHASE_1B",
    text: "Protected map-first workspace for real water-network operations. Real KMZ/KML/GIS files stay private, never public, and are shown only through protected optimized map layers.",
  },
  {
    title: "Pricing",
    href: "/pricing",
    status: "Commercial surface",
    marker: "PANTAVION_PRICING_LAYER_V1",
    text: "Transparent access model, future paid layers, fair-use rules, and no unsafe unlimited provider-cost promises.",
  },
  {
    title: "Product Status",
    href: "/product-status",
    status: "Truth surface",
    marker: "PANTAVION_PRODUCT_STATUS_V1",
    text: "Clear public truth: what is live, what is local-only, what requires provider, database, legal, or institution agreements.",
  },
  {
    title: "Safety",
    href: "/safety",
    status: "Trust surface",
    marker: "PANTAVION_SAFETY_LAYER_V1",
    text: "Safety rules, minors, vulnerable users, SOS boundaries, abuse prevention, and platform trust doctrine.",
  },
  {
    title: "Privacy",
    href: "/privacy",
    status: "Legal surface",
    marker: "PANTAVION_PRIVACY_LAYER_V1",
    text: "Privacy-first doctrine, consent, data minimization, contacts/import boundaries, and user-controlled memory direction.",
  },
  {
    title: "Terms",
    href: "/terms",
    status: "Legal surface",
    marker: "PANTAVION_TERMS_LAYER_V1",
    text: "Terms, use boundaries, provider-required features, no false emergency authority claims, and platform rules.",
  },
  {
    title: "Security",
    href: "/security",
    status: "Security surface",
    marker: "PANTAVION_SECURITY_LAYER_V1",
    text: "Security, resilience, anti-abuse, audit discipline, CI checks, and production-readiness doctrine.",
  },
];

const continents = [
  "Europe",
  "North America",
  "South America",
  "Asia",
  "Africa",
  "Oceania",
];

export default function HomePage() {
  return (
    <main style={styles.shell}>
      <section style={styles.hero}>
        <div style={styles.languageNotice}>
          <strong>Global language spine</strong>
          <span>
            Pantavion language is not SOS-only and not English/Greek-only. The Universal Interpreter, SOS language layer, and global UI preference are separate systems connected by <code>pantavion-global-language</code>.
          </span>
        </div>
        <p style={styles.kicker}>Pantavion Planet</p>
        <h1 style={styles.title}>The planet in one living screen.</h1>
        <p style={styles.subtitle}>
          Universal communication, SOS safety, PantaAI, people, work, culture,
          travel, accessibility, public discovery, and multilingual life in one
          governed ecosystem.
        </p>

        <div style={styles.actions}>
          {primaryActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              style={{
                ...styles.actionButton,
                ...(action.tone === "gold"
                  ? styles.goldButton
                  : action.tone === "red"
                    ? styles.redButton
                    : styles.blueButton),
              }}
            >
              {action.label}
            </Link>
          ))}
        </div>

        <div style={styles.truthBar}>
          <span>PANTAVION_PUBLIC_GATEWAY_V1 PANTAVION_HOMEPAGE_USES_GLOBAL_LANGUAGE_CATALOG PANTAVION_7000_NATURAL_LANGUAGES_DOCTRINE PANTAVION_EMERGENCY_LANGUAGE_LAYER_SEPARATE</span>
          <span>No fake dispatch claims</span>
          <span>No intrusive ads in core UI</span>
          <span>Provider-required labels respected</span>
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <p style={styles.kicker}>Public discovery</p>
          <h2 style={styles.sectionTitle}>Real surfaces people and search engines can find.</h2>
          <p style={styles.sectionText}>
            Every visible entry below points to a real Pantavion route or a
            clearly governed product surface. The goal is public truth, not a
            static showcase.
          </p>
        </div>

        <div style={styles.grid}>
          {publicModules.map((module) => (
            <Link key={module.href} href={module.href} style={styles.card}>
              <div style={styles.cardTop}>
                <p style={styles.marker}>{module.marker}</p>
                <span style={styles.status}>{module.status}</span>
              </div>
              <h3 style={styles.cardTitle}>{module.title}</h3>
              <p style={styles.cardText}>{module.text}</p>
              <p style={styles.openText}>Open {module.href}</p>
            </Link>
          ))}
        </div>
      </section>

      <section style={styles.globalSection}>
        <div>
          <p style={styles.kicker}>Global by design</p>
          <h2 style={styles.sectionTitle}>Built for six continents, not one local market.</h2>
          <p style={styles.sectionText}>
            Pantavion must adapt by language, age, safety needs, role,
            country, region, culture, accessibility, and legal boundary.
          </p>
        </div>

        <div style={styles.continentGrid}>
          {continents.map((continent) => (
            <span key={continent} style={styles.continentPill}>
              {continent}
            </span>
          ))}
        </div>
      </section>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  shell: {
    minHeight: "100vh",
    padding: "48px",
    background:
      "radial-gradient(circle at top, #182a54 0, #071020 46%, #02040b 100%)",
    color: "#fff8e7",
    fontFamily: "Arial, sans-serif",
  },
  hero: {
    maxWidth: 1180,
    margin: "0 auto 44px",
  },
  kicker: {
    color: "#f6c85f",
    letterSpacing: 4,
    fontSize: 12,
    textTransform: "uppercase",
    fontWeight: 1000,
    margin: "0 0 12px",
  },
  title: {
    fontSize: "clamp(46px, 8vw, 104px)",
    lineHeight: 0.92,
    margin: "10px 0 18px",
    maxWidth: 1040,
  },
  subtitle: {
    color: "#d8e0f4",
    maxWidth: 920,
    fontSize: 20,
    lineHeight: 1.55,
    margin: 0,
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 14,
    marginTop: 26,
  },
  actionButton: {
    padding: "15px 22px",
    borderRadius: 999,
    textDecoration: "none",
    fontWeight: 1000,
  },
  goldButton: {
    background: "#f6c85f",
    color: "#071020",
  },
  blueButton: {
    border: "1px solid rgba(246,200,95,.45)",
    color: "#fff8e7",
    background: "rgba(255,255,255,.03)",
  },
  redButton: {
    background: "#ff2f3f",
    color: "#fff",
  },
  truthBar: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 28,
  },
  section: {
    maxWidth: 1180,
    margin: "0 auto 42px",
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: "clamp(30px, 5vw, 56px)",
    lineHeight: 1,
    margin: "0 0 12px",
  },
  sectionText: {
    color: "#d8e0f4",
    fontSize: 18,
    lineHeight: 1.55,
    maxWidth: 850,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: 16,
  },
  card: {
    display: "block",
    padding: 22,
    borderRadius: 24,
    background: "rgba(8,16,32,.84)",
    border: "1px solid rgba(246,200,95,.25)",
    textDecoration: "none",
    color: "#fff8e7",
    minHeight: 245,
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "flex-start",
  },
  marker: {
    color: "#f6c85f",
    fontSize: 10,
    letterSpacing: 1.1,
    fontWeight: 1000,
    margin: 0,
    wordBreak: "break-word",
  },
  status: {
    border: "1px solid rgba(216,224,244,.24)",
    borderRadius: 999,
    padding: "5px 8px",
    fontSize: 11,
    color: "#d8e0f4",
    whiteSpace: "nowrap",
  },
  cardTitle: {
    fontSize: 25,
    margin: "18px 0 10px",
  },
  cardText: {
    color: "#d8e0f4",
    lineHeight: 1.55,
    margin: 0,
  },
  openText: {
    color: "#f6c85f",
    fontWeight: 900,
    marginTop: 18,
  },
  globalSection: {
    maxWidth: 1180,
    margin: "0 auto",
    padding: 26,
    borderRadius: 30,
    background: "rgba(246,200,95,.08)",
    border: "1px solid rgba(246,200,95,.25)",
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.4fr) minmax(260px, .8fr)",
    gap: 20,
  },
  continentGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    alignContent: "center",
  },
  continentPill: {
    padding: "11px 14px",
    borderRadius: 999,
    background: "rgba(8,16,32,.78)",
    border: "1px solid rgba(246,200,95,.25)",
    color: "#fff8e7",
    fontWeight: 900,
  },
};
