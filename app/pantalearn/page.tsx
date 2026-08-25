import ScanToLearnClient from "./scan-to-learn-client";

export default function Page() {
  return (
    <main style={{ minHeight: "100vh", background: "radial-gradient(circle at top, #102449 0%, #050914 52%, #02040a 100%)", color: "#f7d98b", padding: "48px 20px", fontFamily: "Arial, sans-serif" }}>
      <section style={{ maxWidth: 980, margin: "0 auto", border: "1px solid rgba(247,217,139,0.2)", borderRadius: 24, padding: "clamp(22px,5vw,46px)", background: "rgba(3,8,20,0.72)" }}>
        <p style={{ letterSpacing: "0.18em", textTransform: "uppercase", color: "#9fb6df", fontSize: 12 }}>Pantavion One · PantaLearn</p>
        <h1 style={{ fontSize: "clamp(32px,6vw,46px)", lineHeight: 1.1, margin: "10px 0 14px" }}>Μάθε το — μην το παπαγαλίζεις</h1>
        <p style={{ color: "#dbe7ff", fontSize: 17, lineHeight: 1.7, maxWidth: 820 }}>
          Το PantaLearn χρησιμοποιεί φωτογραφίες, σαρώσεις, PDF ή κείμενο για να βοηθά τον μαθητή να κατανοεί την έννοια, να δοκιμάζει ο ίδιος, να παίρνει στοχευμένες νύξεις και να αποδεικνύει ότι μπορεί να εφαρμόσει τη γνώση σε νέο παράδειγμα.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 12, marginTop: 22 }}>
          {[
            ["1. Κατανόηση", "Βρίσκουμε τι ξέρεις ήδη και ποια έννοια λείπει."],
            ["2. Νύξη", "Μία μικρή βοήθεια κάθε φορά, όχι έτοιμη απάντηση."],
            ["3. Δική σου προσπάθεια", "Δοκιμάζεις το επόμενο βήμα και παίρνεις feedback."],
            ["4. Εμπέδωση", "Νέο παρόμοιο πρόβλημα επιβεβαιώνει ότι κατάλαβες τη μέθοδο."],
          ].map(([title, text]) => (
            <article key={title} style={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 15, background: "rgba(255,255,255,0.035)" }}>
              <strong>{title}</strong>
              <p style={{ color: "#b9c9e8", lineHeight: 1.55, fontSize: 14 }}>{text}</p>
            </article>
          ))}
        </div>
        <ScanToLearnClient />
        <div style={{ marginTop: 36, display: "flex", gap: 16, flexWrap: "wrap" }}>
          <a href="/minors" style={{ color: "#9fb6df", textDecoration: "none" }}>Youth Safe Architecture</a>
          <a href="/" style={{ color: "#9fb6df", textDecoration: "none" }}>← Pantavion</a>
        </div>
      </section>
    </main>
  );
}
