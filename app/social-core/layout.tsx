import Link from "next/link";
import type { ReactNode } from "react";

export default function SocialCoreLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <nav
        aria-label="Pantavion Social World"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          padding: "12px 20px",
          background: "rgba(255,255,255,.94)",
          borderBottom: "1px solid #dce7f5",
          backdropFilter: "blur(14px)",
          boxShadow: "0 8px 24px rgba(16,35,63,.06)",
        }}
      >
        <Link href="/social-core" style={{ color: "#10233f", textDecoration: "none", fontWeight: 900 }}>
          Pantavion Social World
        </Link>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link href="/social-core" style={navLinkStyle}>Home</Link>
          <Link href="/social-core/cultural-bridge" style={navLinkStyle}>Cultural Bridge</Link>
          <Link href="/daily/feed" style={navLinkStyle}>Feed</Link>
          <Link href="/language" style={navLinkStyle}>Translation</Link>
          <Link href="/dashboard" style={navLinkStyle}>Dashboard</Link>
        </div>
      </nav>
      {children}
    </>
  );
}

const navLinkStyle = {
  color: "#124a86",
  textDecoration: "none",
  fontWeight: 800,
  padding: "9px 12px",
  borderRadius: 12,
  background: "#eef6ff",
  border: "1px solid #d9e9fb",
} as const;
