import type { Metadata, Viewport } from "next";
import "./globals.css";

const fallbackSiteUrl = "https://pantavion-planet.vercel.app";

function getSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || fallbackSiteUrl;

  try {
    return new URL(raw).origin;
  } catch {
    return fallbackSiteUrl;
  }
}

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Pantavion",
  title: {
    default: "Pantavion | One Planet. One Living Screen.",
    template: "%s | Pantavion"
  },
  description:
    "Pantavion is a governed global ecosystem for communication, safety, knowledge, work, culture and AI-assisted execution.",
  keywords: [
    "Pantavion",
    "global ecosystem",
    "communication",
    "AI orchestration",
    "SOS",
    "translation",
    "knowledge",
    "work",
    "social platform",
    "PWA"
  ],
  authors: [{ name: "George Nicolaou" }],
  creator: "Pantavion",
  publisher: "Pantavion",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Pantavion",
    title: "Pantavion | One Planet. One Living Screen.",
    description:
      "A governed global ecosystem for communication, safety, knowledge, work and AI-assisted execution.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Pantavion global ecosystem"
      }
    ],
    locale: "en_US"
  },
  twitter: {
    card: "summary_large_image",
    title: "Pantavion | One Planet. One Living Screen.",
    description:
      "A governed global ecosystem for communication, safety, knowledge, work and AI-assisted execution.",
    images: ["/twitter-image"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  },
  icons: {
    icon: "/pantavion-icon.svg",
    apple: "/pantavion-icon.svg"
  },
  manifest: "/manifest.webmanifest"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#071a2d",
  colorScheme: "dark"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
