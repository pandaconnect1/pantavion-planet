import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Pantavion Planet",
  description:
    "One living platform for AI execution, communication, social connection, work, media, services and global language access.",
  applicationName: "Pantavion One",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://pantavion-planet.vercel.app"
  ),
  openGraph: {
    title: "Pantavion Planet",
    description:
      "AI execution, communication, social connection, work, media, services and global language access inside one living platform.",
    type: "website",
    siteName: "Pantavion One"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#06111f"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

