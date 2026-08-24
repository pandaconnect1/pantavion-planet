export default function CreatePage() {
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
          Create · Projects & Making
        </h1>
        <p
          style={{
            marginTop: "8px",
            fontSize: "0.95rem",
            opacity: 0.9,
            maxWidth: "640px",
          }}
        >
          Όλα τα δημιουργικά project σε ένα μέρος: προσωπικά, οικογενειακά,
          επαγγελματικά, κοινωνικά. Από ιδέα μέχρι υλοποίηση.
        </p>
      </header>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "16px",
        }}
      >
        {["Προσωπικά", "Οικογένεια / φίλοι", "Εργασία / business"].map(
          (title) => (
            <div
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
                  fontSize: "1rem",
                  fontWeight: 600,
                  marginBottom: "6px",
                }}
              >
                {title}
              </h2>
              <p
                style={{
                  fontSize: "0.9rem",
                  opacity: 0.9,
                }}
              >
                Placeholder πίνακας για tasks, deadlines, υπενθυμίσεις. Αργότερα
                θα συνδεθεί με calendar, AI και συνεργασία με άλλους.
              </p>
            </div>
          )
        )}
      </section>
    </main>
  );
}
