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
        maxWidth: "900px",
        margin: "0 auto",
        border: "1px solid rgba(247,217,139,0.2)",
        borderRadius: "24px",
        padding: "48px",
        background: "rgba(3,8,20,0.72)"
      }}>
        <p style={{
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "#9fb6df",
          fontSize: "12px",
          marginBottom: "16px"
        }}>
          Pantavion One
        </p>
        <h1 style={{
          fontSize: "40px",
          lineHeight: "1.1",
          margin: "0 0 16px",
          color: "#f7d98b"
        }}>
          Safety Center
        </h1>
        <p style={{
          color: "#dbe7ff",
          fontSize: "17px",
          lineHeight: "1.7",
          maxWidth: "700px",
          marginBottom: "32px"
        }}>
          SOS, emergency protocols and crisis communication
        </p>
        <div style={{
          display: "inline-block",
          padding: "8px 20px",
          borderRadius: "999px",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.12)",
          color: "#4ade80",
          fontSize: "13px",
          letterSpacing: "0.1em"
        }}>
          Foundation
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
