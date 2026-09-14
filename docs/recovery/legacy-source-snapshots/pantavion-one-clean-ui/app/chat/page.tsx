export default function ChatPage() {
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
          Chat · Conversations
        </h1>
        <p
          style={{
            marginTop: "8px",
            fontSize: "0.95rem",
            opacity: 0.9,
            maxWidth: "640px",
          }}
        >
          Ενοποιημένες συνομιλίες για όλα: προσωπικά, επαγγελματικά, υπηρεσίες.
          Εδώ θα ενωθούν κλασικό chat, φωνή, βίντεο και AI βοηθοί.
        </p>
      </header>

      <section
        style={{
          borderRadius: "18px",
          padding: "16px 16px 18px",
          border: "1px solid rgba(148,163,184,0.7)",
          backgroundColor: "rgba(15,23,42,0.95)",
        }}
      >
        <p
          style={{
            fontSize: "0.9rem",
            opacity: 0.9,
            marginBottom: "10px",
          }}
        >
          Προς το παρόν είναι demo layout. Στη συνέχεια θα μπει:
        </p>
        <ul
          style={{
            margin: 0,
            paddingLeft: "18px",
            fontSize: "0.9rem",
            opacity: 0.9,
          }}
        >
          <li>Λίστα συνομιλιών (contacts, groups, services)</li>
          <li>Κεντρικό παράθυρο chat</li>
          <li>Συνδέσεις με Voice / διερμηνέα</li>
          <li>AI βοηθός ανά συνομιλία</li>
        </ul>
      </section>
    </main>
  );
}