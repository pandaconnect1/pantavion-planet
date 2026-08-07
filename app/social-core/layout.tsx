import Link from "next/link";
import type { ReactNode } from "react";

export default function SocialCoreLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <nav
        aria-label="Pantavion Release 1"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          padding: "12px 20px",
          background: "rgba(255,255,255,.96)",
          borderBottom: "1px solid #dce7f5",
          backdropFilter: "blur(14px)",
          boxShadow: "0 8px 24px rgba(16,35,63,.06)",
        }}
      >
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gap: 9 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <Link href="/social-core" style={{ color: "#10233f", textDecoration: "none", fontWeight: 950 }}>
              Pantavion Release 1
            </Link>
            <span style={{ color: "#60758c", fontSize: 12, fontWeight: 800 }}>7 continents · one connected core</span>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }} aria-label="Release 1 priorities">
            <Link href="/social-core" style={priorityLinkStyle}>Social</Link>
            <Link href="/ads" style={priorityLinkStyle}>Ads / Income</Link>
            <Link href="/social/contacts" style={priorityLinkStyle}>Contacts</Link>
            <Link href="/translate" style={priorityLinkStyle}>↔ Translation · 7 Continents</Link>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }} aria-label="Social capabilities">
            <Link href="/daily/feed" style={navLinkStyle}>Feed</Link>
            <Link href="/social/chat" style={navLinkStyle}>Chat</Link>
            <Link href="/social/communities" style={navLinkStyle}>Communities</Link>
            <Link href="/social/notifications" style={navLinkStyle}>Notifications</Link>
            <Link href="/social-core/cultural-bridge" style={navLinkStyle}>Cultural Bridge</Link>
            <Link href="/dashboard" style={navLinkStyle}>Dashboard</Link>
          </div>
        </div>
      </nav>
      {children}
    </>
  );
}

const priorityLinkStyle = {
  color: "white",
  textDecoration: "none",
  fontWeight: 900,
  padding: "10px 14px",
  borderRadius: 13,
  background: "#123f75",
  border: "1px solid #123f75",
} as const;

const navLinkStyle = {
  color: "#124a86",
  textDecoration: "none",
  fontWeight: 800,
  padding: "8px 11px",
  borderRadius: 12,
  background: "#eef6ff",
  border: "1px solid #d9e9fb",
} as const;
