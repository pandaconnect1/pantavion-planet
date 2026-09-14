import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Pantavion One — One Platform. All Life.",
  description: "Pantavion One — unified global hub for people, voice, knowledge and opportunities."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="pv-root">
          <header className="pv-header">
            <div className="pv-logo">Pantavion One</div>
            <div className="pv-slogan">One Platform. All Life.</div>
          </header>
          <main className="pv-main">{children}</main>
          <footer className="pv-footer">
            <span>Pantavion One — Here We Are One. For All Humanity.</span>
          </footer>
        </div>
      </body>
    </html>
  );
}
