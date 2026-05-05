import Link from "next/link";

const cards = [
  {
    title: "Universal Interpreter",
    href: "/translate",
    text: "Independent bidirectional translation for travel, work, social, signs, subtitles, elder mode, and SOS.",
    marker: "PANTAVION_UNIVERSAL_INTERPRETER_V1",
  },
  {
    title: "PantaAI Center",
    href: "/panta-ai",
    text: "Public AI, personal AI for each user, SOS language AI, creator AI, work AI, and internal Guardian Kernel AI.",
    marker: "PANTAVION_AI_COMMAND_CENTER_V1",
  },
  {
    title: "SOS Center",
    href: "/sos",
    text: "Trusted contacts first, local emergency message, location capture, elder-simple path, interpreter connection.",
    marker: "PANTAVION_SOS_AI_CENTER_V1",
  },
  {
    title: "Elder Safe Mode",
    href: "/sos/elder",
    text: "Simple high-contrast safety and translation flow for elder, minor, and special-needs users.",
    marker: "PANTAVION_ELDER_SAFE_MODE",
  },
];

export default function HomePage() {
  return (
    <main style={styles.shell}>
      <section style={styles.hero}>
        <p style={styles.kicker}>Pantavion Planet</p>
        <h1 style={styles.title}>The planet in one living screen.</h1>
        <p style={styles.subtitle}>
          Universal communication, SOS safety, PantaAI, global social connection, work, culture, travel, accessibility, and multilingual life in one governed ecosystem.
        </p>
        <div style={styles.actions}>
          <Link href="/translate" style={styles.primaryButton}>
            Open Universal Interpreter
          </Link>
          <Link href="/panta-ai" style={styles.secondaryButton}>
            Ask PantaAI
          </Link>
          <Link href="/sos" style={styles.sosButton}>
            SOS Center
          </Link>
        </div>
      </section>

      <section style={styles.grid}>
        {cards.map((card) => (
          <Link key={card.href} href={card.href} style={styles.card}>
            <p style={styles.marker}>{card.marker}</p>
            <h2 style={styles.cardTitle}>{card.title}</h2>
            <p style={styles.cardText}>{card.text}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: {
    minHeight: "100vh",
    padding: "48px",
    background: "radial-gradient(circle at top, #172448 0, #071020 45%, #02040b 100%)",
    color: "#fff8e7",
    fontFamily: "Arial, sans-serif",
  },
  hero: { maxWidth: 1120, margin: "0 auto 32px" },
  kicker: { color: "#f6c85f", letterSpacing: 3, fontSize: 13, textTransform: "uppercase", fontWeight: 900 },
  title: { fontSize: "clamp(44px, 8vw, 92px)", lineHeight: 0.92, margin: "10px 0" },
  subtitle: { color: "#d8e0f4", maxWidth: 860, fontSize: 20, lineHeight: 1.55 },
  actions: { display: "flex", flexWrap: "wrap", gap: 14, marginTop: 24 },
  primaryButton: { background: "#f6c85f", color: "#071020", padding: "15px 22px", borderRadius: 999, textDecoration: "none", fontWeight: 1000 },
  secondaryButton: { border: "1px solid rgba(246,200,95,.45)", color: "#fff8e7", padding: "15px 22px", borderRadius: 999, textDecoration: "none", fontWeight: 900 },
  sosButton: { background: "#ff2f3f", color: "#fff", padding: "15px 22px", borderRadius: 999, textDecoration: "none", fontWeight: 1000 },
  grid: { maxWidth: 1120, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 },
  card: {
    display: "block",
    padding: 22,
    borderRadius: 24,
    background: "rgba(8,16,32,.84)",
    border: "1px solid rgba(246,200,95,.25)",
    textDecoration: "none",
    color: "#fff8e7",
    minHeight: 210,
  },
  marker: { color: "#f6c85f", fontSize: 11, letterSpacing: 1.2, fontWeight: 900 },
  cardTitle: { fontSize: 26, margin: "12px 0" },
  cardText: { color: "#d8e0f4", lineHeight: 1.55 },
};
