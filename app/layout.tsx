import type { Metadata } from "next";
import "./globals.css";
import { PantavionShell } from "@/components/PantavionShell";

export const metadata: Metadata = {
  title: "Pantavion One — One Planet. One Living Screen.",
  description:
    "Pantavion One is a planetary platform foundation for language, people, media, AI, work, culture, safety and global connection.",
  manifest: "/manifest.webmanifest",
  metadataBase: new URL("https://pantavion.com"),
  openGraph: {
    title: "Pantavion One",
    description: "One Planet. One Living Screen. All Humanity Connected.",
    siteName: "Pantavion One",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="el">
      <body>
        <PantavionShell>{children}</PantavionShell>
      </body>
    </html>
  );
}
