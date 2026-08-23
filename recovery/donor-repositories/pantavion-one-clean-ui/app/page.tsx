import Link from "next/link";

type Module = {
  slug: string;
  title: string;
  subtitle: string;
};

const modules: Module[] = [
  { slug: "pulse", title: "Pulse", subtitle: "Ζωντανός παλμός κόσμου" },
  { slug: "people", title: "People", subtitle: "Άνθρωποι, προφίλ, δίκτυα" },
  { slug: "chat", title: "Chat", subtitle: "Μηνύματα & στιγμές" },
  { slug: "voice", title: "Voice", subtitle: "Ζωντανός διερμηνέας φωνής" },
  { slug: "compass", title: "Compass", subtitle: "Πλοήγηση στη ζωή σου" },
  { slug: "mind", title: "Mind", subtitle: "Γνώση, ιδέες, σκέψη" },
  { slug: "create", title: "Create", subtitle: "Δημιουργία & projects" },
];

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        margin: 0,
        padding: "0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(circle at top, #0f172a 0, #020617 45%, #000000 100%)",
        color: "#e5e7eb",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1100px",
          padding: "32px 20px 40px",
        }}
      >
        {/* HEADER */}
        <header
          style={{
            textAlign: "center",
            marginBottom: "32px",
          }}
        >
          <h1
            style={{
              fontSize: "clamp(2.4rem, 4vw, 3.2rem)",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#bfdbfe",
            }}
          >
            Pantavion One
          </h1>
          <p
            style={{
              marginTop: "8px",
              fontSize: "0.95rem",
              opacity: 0.9,
            }}
          >
            Here We Are One. For All Humanity.
          </p>
          <p
            style={{
              marginTop: "14px",
              fontSize: "0.9rem",
              maxWidth: "640px",
              marginLeft: "auto",
              marginRight: "auto",
              opacity: 0.9,
            }}
          >
            Αυτή είναι η κεντρική αρχική σελίδα του Pantavion One.
            Από εδώ μπαίνεις σε κάθε ενότητα (Pulse, People, Chat, Voice,
            Compass, Mind, Create). Πατάς σε οποιοδήποτε κουμπί και
            ανοίγει η αντίστοιχη σελίδα.
          </p>
        </header>

        {/* MAIN GRID MENU */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
          {modules.map((module) => (
            <Link
              key={module.slug}
              href={`/${module.slug}`}
              style={{
                textDecoration: "none",
              }}
            >
              <div
                style={{
                  borderRadius: "18px",
                  padding: "18px 16px",
                  border: "1px solid rgba(148, 163, 184, 0.5)",
                  background:
                    "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(12,74,110,0.9))",
                  boxShadow: "0 10px 30px rgba(15,23,42,0.85)",
                }}
              >
                <div
                  style={{
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.16em",
                    color: "#facc15",
                    marginBottom: "4px",
                    fontWeight: 600,
                  }}
                >
                  Module
                </div>
                <h2
                  style={{
                    fontSize: "1.3rem",
                    fontWeight: 600,
                    marginBottom: "4px",
                    color: "#e5e7eb",
                  }}
                >
                  {module.title}
                </h2>
                <p
                  style={{
                    fontSize: "0.9rem",
                    opacity: 0.9,
                  }}
                >
                  {module.subtitle}
                </p>
                <p
                  style={{
                    fontSize: "0.8rem",
                    marginTop: "10px",
                    opacity: 0.75,
                  }}
                >
                  Πάτα για να μπεις στην ενότητα {module.title}.
                </p>
              </div>
            </Link>
          ))}
        </section>

        {/* FOOTER / INFO BAR */}
        <footer
          style={{
            marginTop: "16px",
            borderRadius: "14px",
            border: "1px solid rgba(55, 65, 81, 0.9)",
            padding: "10px 14px",
            fontSize: "0.78rem",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            gap: "8px",
            background:
              "linear-gradient(90deg, rgba(15,23,42,0.95), rgba(30,64,175,0.9))",
          }}
        >
          <span style={{ opacity: 0.9 }}>
            Pantavion One · Unified Platform (Alpha build)
          </span>
          <span style={{ opacity: 0.9 }}>
            Από εδώ συνεχίζουμε βήμα–βήμα όλο το UI.
          </span>
        </footer>
      </div>
    </main>
  );
}

