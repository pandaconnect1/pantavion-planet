export default function LiveCorePage() {
  return (
    <main style={{
      minHeight: "100vh",
      background: "radial-gradient(circle at top, #102449 0%, #050914 52%, #02040a 100%)",
      color: "#f7d98b",
      padding: "56px",
      fontFamily: "Arial, sans-serif"
    }}>
      <section style={{
        maxWidth: "980px",
        margin: "0 auto",
        border: "1px solid rgba(247,217,139,0.28)",
        borderRadius: "28px",
        padding: "42px",
        background: "rgba(3,8,20,0.72)",
        boxShadow: "0 30px 90px rgba(0,0,0,0.45)"
      }}>
        <p style={{
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "#9fb6df",
          fontSize: "13px",
          marginBottom: "18px"
        }}>
          Pantavion Sovereign Kernel
        </p>
        <h1 style={{
          fontSize: "44px",
          lineHeight: "1.05",
          margin: "0 0 18px"
        }}>
          Live Core is online.
        </h1>
        <p style={{
          color: "#dbe7ff",
          fontSize: "18px",
          lineHeight: "1.7",
          maxWidth: "760px"
        }}>
          This route confirms the visible Pantavion core surface is deployed.
          It is the public checkpoint for kernel, safety, translation, SOS,
          and future execution orchestration layers.
        </p>
        <div style={{
          marginTop: "32px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px"
        }}>
          {["Kernel Status","Health Check","PantaAI Execute","Safety Foundation"].map((item) => (
            <div key={item} style={{
              border: "1px solid rgba(247,217,139,0.18)",
              borderRadius: "18px",
              padding: "18px",
              color: "#ffffff",
              background: "rgba(255,255,255,0.04)"
            }}>
              {item}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
