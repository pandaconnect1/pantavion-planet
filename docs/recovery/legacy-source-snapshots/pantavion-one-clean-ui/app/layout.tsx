import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Pantavion One",
  description: "Unified Platform — Here We Are One. For All Humanity.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          background: "#020617",
          color: "#e5e7eb",
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        {/* ======================== NAVBAR ======================== */}
        <nav
          style={{
            width: "100%",
            padding: "18px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background:
              "linear-gradient(90deg, rgba(15,23,42,0.95), rgba(12,74,110,0.85))",
            borderBottom: "1px solid rgba(148,163,184,0.35)",
            position: "sticky",
            top: 0,
            zIndex: 100,
          }}
        >
          {/* LEFT — LOGO */}
          <div
            style={{
              fontSize: "1.3rem",
              fontWeight: 700,
              letterSpacing: "0.07em",
              color: "#facc15",
              textTransform: "uppercase",
            }}
          >
            Pantavion One
          </div>

          {/* RIGHT — MENU LINKS */}
          <div
            style={{
              display: "flex",
              gap: "22px",
              alignItems: "center",
              fontSize: "0.95rem",
              fontWeight: 500,
            }}
          >
            <Link href="/" style={{ color: "#e5e7eb", textDecoration: "none" }}>
              Home
            </Link>
            <Link href="/pulse" style={{ color: "#e5e7eb" }}>
              Pulse
            </Link>
            <Link href="/people" style={{ color: "#e5e7eb" }}>
              People
            </Link>
            <Link href="/chat" style={{ color: "#e5e7eb" }}>
              Chat
            </Link>
            <Link href="/voice" style={{ color: "#e5e7eb" }}>
              Voice
            </Link>
            <Link href="/compass" style={{ color: "#e5e7eb" }}>
              Compass
            </Link>
            <Link href="/mind" style={{ color: "#e5e7eb" }}>
              Mind
            </Link>
            <Link href="/create" style={{ color: "#e5e7eb" }}>
              Create
            </Link>
          </div>
        </nav>

        {/* ======================== PAGE CONTENT ======================== */}
        <div style={{ paddingTop: "10px" }}>{children}</div>
      </body>
    </html>
  );
}

