export default function PeoplePage() {
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
          People · Global Profiles
        </h1>
        <p
          style={{
            marginTop: "8px",
            fontSize: "0.95rem",
            opacity: 0.9,
            maxWidth: "640px",
          }}
        >
          Η καρδιά του Pantavion One: προφίλ, ταυτότητες, δίκτυα. Εδώ θα
          χτίσουμε τους ανθρώπους, τις σχέσεις, τα επίπεδα, τις επαφές και τις
          κοινότητες.
        </p>
      </header>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(260px, 1.4fr) minmax(260px, 1fr)",
          gap: "18px",
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            borderRadius: "18px",
            padding: "18px 16px 20px",
            border: "1px solid rgba(148,163,184,0.7)",
            background:
              "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,64,175,0.9))",
          }}
        >
          <h2
            style={{
              fontSize: "0.95rem",
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              color: "#facc15",
              marginBottom: "10px",
            }}
          >
            Κεντρικό προφίλ χρήστη (template)
          </h2>
          <p
            style={{
              fontSize: "0.9rem",
              opacity: 0.95,
              marginBottom: "12px",
            }}
          >
            Εδώ θα εμφανίζεται το βασικό προφίλ: όνομα, φωτογραφία, ρόλος,
            τοποθεσία, επίπεδο Pantavion, βασικά στοιχεία επικοινωνίας.
          </p>
          <ul
            style={{
              margin: 0,
              paddingLeft: "18px",
              fontSize: "0.9rem",
              opacity: 0.95,
            }}
          >
            <li>Όνομα / Επώνυμο</li>
            <li>Φωτογραφία προφίλ</li>
            <li>Χώρα, πόλη, ζώνη ώρας</li>
            <li>Ρόλος (πολίτης, επαγγελματίας, οργανισμός κ.λπ.)</li>
            <li>Επίπεδο Pantavion (basic, gold, elite κ.λπ.)</li>
            <li>Σύντομη περιγραφή / bio</li>
          </ul>
        </div>

        <div
          style={{
            borderRadius: "18px",
            padding: "18px 16px 20px",
            border: "1px solid rgba(148,163,184,0.7)",
            backgroundColor: "rgba(15,23,42,0.95)",
          }}
        >
          <h3
            style={{
              fontSize: "0.9rem",
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              color: "#bfdbfe",
              marginBottom: "10px",
            }}
          >
            Ερχονται σύντομα
          </h3>
          <ul
            style={{
              margin: 0,
              paddingLeft: "18px",
              fontSize: "0.88rem",
              opacity: 0.9,
            }}
          >
            <li>Σύνδεση με Contacts Sync (GDPR safe)</li>
            <li>Φίλοι, οικογένεια, επαγγελματικό δίκτυο</li>
            <li>Ειδικές ταυτότητες (υπηρεσίες, υγεία, εκπαίδευση)</li>
            <li>Κάρτα “For All Humanity” με επίπεδα εμπιστοσύνης</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
