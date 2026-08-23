export default function PulsePage() {
  return (
    <main
      style={{
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "24px 20px 40px",
      }}
    >
      <header style={{ marginBottom: "24px" }}>
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#bfdbfe",
          }}
        >
          Pulse · World Activity
        </h1>
        <p
          style={{
            marginTop: "8px",
            fontSize: "0.95rem",
            opacity: 0.9,
            maxWidth: "640px",
          }}
        >
          Εδώ θα ζει ο παλμός του κόσμου: ενημερώσεις, κινήσεις, σήματα από
          ανθρώπους, πόλεις, υπηρεσίες. Προς το παρόν δείχνουμε demo κάρτες.
        </p>
      </header>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "16px",
        }}
      >
        {["Global news signal", "Local city update", "Emergency channel"].map(
          (title, index) => (
            <article
              key={title}
              style={{
                borderRadius: "16px",
                padding: "16px 16px 18px",
                border: "1px solid rgba(148,163,184,0.7)",
                backgroundColor: "rgba(15,23,42,0.95)",
              }}
            >
              <h2
                style={{
                  fontSize: "0.95rem",
                  color: "#facc15",
                  marginBottom: "6px",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                }}
              >
                Pulse {index + 1}
              </h2>
              <h3
                style={{
                  fontSize: "1.05rem",
                  fontWeight: 600,
                  marginBottom: "6px",
                }}
              >
                {title}
              </h3>
              <p
                style={{
                  fontSize: "0.9rem",
                  opacity: 0.9,
                }}
              >
                Demo περιγραφή του σήματος. Αργότερα εδώ θα έρχονται ζωντανά
                events από ανθρώπους, υπηρεσίες, AI αισθητήρες και συστήματα.
              </p>
            </article>
          )
        )}
      </section>
    </main>
  );
}
