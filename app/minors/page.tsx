import YouthPolicyClient from "./youth-policy-client";
import CurriculumClient from "./curriculum-client";

export default function Page() {
  return (
    <main style={{
      minHeight: "100vh",
      background: "radial-gradient(circle at top, #102449 0%, #050914 52%, #02040a 100%)",
      color: "#f7d98b",
      padding: "56px 24px",
      fontFamily: "Arial, sans-serif"
    }}>
      <section style={{
        maxWidth: "980px",
        margin: "0 auto",
        border: "1px solid rgba(247,217,139,0.2)",
        borderRadius: "24px",
        padding: "clamp(24px,5vw,48px)",
        background: "rgba(3,8,20,0.72)"
      }}>
        <p style={{
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "#9fb6df",
          fontSize: "12px",
          marginBottom: "16px"
        }}>
          Pantavion One · Youth Safe Architecture
        </p>
        <h1 style={{
          fontSize: "clamp(32px,6vw,46px)",
          lineHeight: "1.1",
          margin: "0 0 16px",
          color: "#f7d98b"
        }}>
          Μάθηση, υποστήριξη και ασφαλής συμμετοχή ανά ηλικία
        </h1>
        <p style={{
          color: "#dbe7ff",
          fontSize: "17px",
          lineHeight: "1.7",
          maxWidth: "820px",
          marginBottom: "28px"
        }}>
          Το Pantavion δεν αντιμετωπίζει τα παιδιά ως μικρούς ενήλικες και δεν εξισώνει τη μάθηση ή την υποστήριξη με δημόσιο social. Κάθε capability αξιολογείται χωριστά με βάση ηλικία, χώρα, σκοπό, όφελος, κίνδυνο και απαιτούμενες δικλίδες.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 12 }}>
          {[
            ["Learning", "Προσαρμοσμένη μάθηση, δημιουργικότητα, γλωσσική και accessibility υποστήριξη."],
            ["Support", "Βοήθεια χωρίς κρυφές διαγνώσεις ή στιγματισμό, με ασφαλείς διαδρομές όταν χρειάζονται."],
            ["Protected Communication", "Περιορισμένη επικοινωνία και επαφές ανά ηλικία και jurisdiction."],
            ["Public Social", "Ξεχωριστό υψηλότερου κινδύνου capability που μπορεί να περιοριστεί χωρίς να κλείνει η μάθηση ή η υποστήριξη."],
          ].map(([title, text]) => (
            <article key={title} style={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 16, background: "rgba(255,255,255,0.035)" }}>
              <strong style={{ color: "#f7d98b" }}>{title}</strong>
              <p style={{ color: "#b9c9e8", lineHeight: 1.55, fontSize: 14 }}>{text}</p>
            </article>
          ))}
        </div>

        <div style={{
          marginTop: 24,
          display: "inline-block",
          padding: "8px 20px",
          borderRadius: "999px",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.12)",
          color: "#4ade80",
          fontSize: "13px",
          letterSpacing: "0.08em"
        }}>
          Runtime policy surface
        </div>

        <YouthPolicyClient />
        <CurriculumClient />

        <div style={{ marginTop: 28, padding: 18, border: "1px solid rgba(247,217,139,0.2)", borderRadius: 16, background: "rgba(247,217,139,0.04)" }}>
          <strong>PantaLearn · Scan‑to‑Learn</strong>
          <p style={{ color: "#c7d5ef", lineHeight: 1.6, marginBottom: 12 }}>
            Φωτογραφία, σκανάρισμα, PDF ή κείμενο μετατρέπονται σε καθοδηγούμενη μάθηση: έννοια, νύξη, προσπάθεια, feedback και νέο πρόβλημα για πραγματική εμπέδωση.
          </p>
          <a href="/pantalearn" style={{ color: "#f7d98b", fontWeight: 700, textDecoration: "none" }}>
            Άνοιγμα PantaLearn →
          </a>
        </div>

        <div style={{ marginTop: "48px" }}>
          <a href="/" style={{
            color: "#9fb6df",
            fontSize: "14px",
            textDecoration: "none",
            letterSpacing: "0.1em"
          }}>
            ← Back to Pantavion
          </a>
        </div>
      </section>
    </main>
  );
}
