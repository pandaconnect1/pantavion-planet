import Link from "next/link";
import type { ReactNode } from "react";

export function PantavionShell({ children }: { children: ReactNode }) {
  return (
    <div className="pv-shell">
      <header className="pv-header">
        <div className="pv-container pv-header-inner">
          <Link href="/" className="pv-brand" aria-label="Pantavion home">
            <span className="pv-brand-mark" aria-hidden="true" />
            <span>Pantavion One</span>
          </Link>

          <nav className="pv-nav" aria-label="Main navigation">
            <Link href="/planet">Planet</Link>
            <Link href="/language">Language</Link>
            <Link href="/people">People</Link>
            <Link href="/media">Media</Link>
            <Link href="/intelligence/execute">PantaAI</Link>
            <Link href="/work">Work</Link>
            <Link href="/safety">Safety</Link>
            <Link href="/dashboard">Dashboard</Link>
          </nav>
        </div>
      </header>

      <main>{children}</main>

      <footer className="pv-footer">
        <div className="pv-container">
          <strong>Pantavion One</strong>
          <p>
            One Planet. One Living Screen. All Humanity Connected. Foundation routes are live;
            providers, databases, payments and regulated systems must be connected before final production claims.
          </p>
          <div className="pv-nav" style={{ justifyContent: "flex-start", marginTop: 12 }}>
            <Link href="/legal">Legal</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/minors">Minors</Link>
            <Link href="/download">Install</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
