import Link from "next/link";

export const metadata = {
  title: "Pantavion — One Planet. One Living Screen.",
  description: "One platform. All languages. Every human. Connected.",
};

export default function HomePage() {
  return (
    <main style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 50% 0%, #1a3a6e 0%, #07101f 50%, #020508 100%)",
      color: "white",
      fontFamily: "'Inter', system-ui, sans-serif",
      overflowX: "hidden",
    }}>

      {/* Navbar */}
      <nav style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px 48px",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: "rgba(2,5,8,0.7)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "radial-gradient(circle at 35% 35%, #d4a843, #4a9eff 60%, #030711)",
            boxShadow: "0 0 20px rgba(212,168,67,0.4)",
          }} />
          <span style={{ fontWeight: 900, fontSize: 16, letterSpacing: "0.08em", color: "#d4a843" }}>PANTAVION</span>
        </div>
        <Link href="/pricing" style={{
          padding: "8px 22px",
          borderRadius: 999,
          border: "1px solid rgba(212,168,67,0.5)",
          color: "#d4a843",
          fontSize: 13,
          fontWeight: 700,
          textDecoration: "none",
        }}>Είσοδος</Link>
      </nav>

      {/* Hero */}
      <section style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "120px 24px 80px",
        textAlign: "center",
        position: "relative",
      }}>

        {/* Orb */}
        <div style={{ position: "relative", marginBottom: 56, width: 340, height: 340 }}>
          {/* Outer orbit rings */}
          <div style={{ position: "absolute", inset: -80, borderRadius: "50%", border: "1px solid rgba(212,168,67,0.35)", animation: "spin 25s linear infinite" }} />
          <div style={{ position: "absolute", inset: -55, borderRadius: "50%", border: "1px solid rgba(74,158,255,0.25)", animation: "spin 18s linear infinite reverse" }} />
          <div style={{ position: "absolute", inset: -30, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.12)", animation: "spin 40s linear infinite" }} />

          {/* Planet */}
          <div style={{
            position: "absolute", inset: 0,
            borderRadius: "50%",
            background: "radial-gradient(circle at 35% 30%, #e8c060 0%, #4a9eff 35%, #1a3a8f 65%, #040d1f 100%)",
            boxShadow: "0 0 160px rgba(74,158,255,0.45), 0 0 80px rgba(212,168,67,0.3), inset 0 0 60px rgba(0,0,20,0.5)",
            animation: "pulse 4s ease-in-out infinite",
          }}>
            {/* Inner ring lines on planet */}
            <div style={{ position: "absolute", inset: "12%", borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.18)" }} />
            <div style={{ position: "absolute", inset: "28%", borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.13)" }} />
            <div style={{ position: "absolute", inset: "44%", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.10)" }} />
            {/* Core light */}
            <div style={{
              position: "absolute", inset: "40%",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0.6) 50%, transparent 100%)",
              boxShadow: "0 0 50px rgba(255,255,255,1), 0 0 20px rgba(255,255,255,0.8)",
            }} />
          </div>
        </div>

        {/* Label */}
        <p style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.4em",
          textTransform: "uppercase",
          color: "#d4a843",
          marginBottom: 20,
          opacity: 0.8,
        }}>PANTAVION ONE</p>

        {/* Headline */}
        <h1 style={{
          fontSize: "clamp(42px, 7vw, 88px)",
          fontWeight: 900,
          lineHeight: 1.02,
          margin: "0 0 24px",
          maxWidth: 900,
          letterSpacing: "-0.02em",
        }}>
          One Planet.<br />
          <span style={{ color: "#d4a843" }}>One Living Screen.</span><br />
          All Humanity Connected.
        </h1>

        {/* Subline */}
        <p style={{
          fontSize: "clamp(16px, 2vw, 20px)",
          lineHeight: 1.7,
          color: "#8899bb",
          maxWidth: 560,
          marginBottom: 48,
        }}>
          Μία πλατφόρμα. Όλες οι γλώσσες.<br />
          Κάθε άνθρωπος. Σε πραγματικό χρόνο.
        </p>

        {/* CTA */}
        <Link href="/pricing" style={{
          display: "inline-block",
          padding: "18px 48px",
          borderRadius: 999,
          background: "linear-gradient(135deg, #d4a843, #f0c866)",
          color: "#0a0600",
          fontWeight: 900,
          fontSize: 17,
          textDecoration: "none",
          boxShadow: "0 8px 40px rgba(212,168,67,0.4), 0 2px 12px rgba(212,168,67,0.3)",
          letterSpacing: "0.02em",
        }}>
          Μπες στο Pantavion — Δωρεάν
        </Link>

        <p style={{ marginTop: 16, fontSize: 13, color: "#445566" }}>
          Χωρίς πιστωτική κάρτα · Άμεση πρόσβαση
        </p>

        {/* Scroll hint */}
        <div style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", animation: "bounce 2s ease-in-out infinite" }}>
          <div style={{ width: 1, height: 48, background: "linear-gradient(to bottom, rgba(212,168,67,0.6), transparent)", margin: "0 auto" }} />
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "80px 48px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 }}>
          {[
            { icon: "🌍", title: "Παγκόσμια Επικοινωνία", desc: "Μίλα με οποιονδήποτε στον πλανήτη στη γλώσσα σου" },
            { icon: "🗣️", title: "Live Μετάφραση", desc: "Αμφίδρομη μετάφραση φωνής, κειμένου και βίντεο σε πραγματικό χρόνο" },
            { icon: "🤖", title: "PantaAI", desc: "Έξυπνος βοηθός που εκτελεί, δημιουργεί και οργανώνει" },
            { icon: "🆘", title: "SOS & Ασφάλεια", desc: "Άμεση βοήθεια για κάθε ανάγκη, σε κάθε γλώσσα" },
          ].map((f) => (
            <div key={f.title} style={{
              padding: "32px 28px",
              borderRadius: 20,
              border: "1px solid rgba(255,255,255,0.07)",
              background: "rgba(255,255,255,0.03)",
              backdropFilter: "blur(10px)",
            }}>
              <div style={{ fontSize: 36, marginBottom: 16 }}>{f.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 10, color: "#e8d5a0" }}>{f.title}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: "#667788" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 140px rgba(74,158,255,0.35), 0 0 80px rgba(212,168,67,0.25); }
          50% { transform: scale(1.04); box-shadow: 0 0 180px rgba(74,158,255,0.5), 0 0 100px rgba(212,168,67,0.4); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(8px); }
        }
      `}</style>
    </main>
  );
}

