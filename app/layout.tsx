import PantavionGlobalLanguageSelector from "./pantavion-global-language-selector";
import PantavionGlobalUiTranslationRuntime from "@/components/pantavion/PantavionGlobalUiTranslationRuntime";
import "leaflet/dist/leaflet.css";
import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const siteUrl = "https://www.pantavion.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Pantavion",
  title: {
    default: "Pantavion | One Planet. One Living Screen.",
    template: "%s | Pantavion"
  },
  description:
    "Pantavion is a governed global ecosystem for communication, SOS safety, universal interpretation, PantaAI, professional infrastructure, knowledge, work, culture and protected services.",
  keywords: [
    "Pantavion",
    "global AI platform",
    "global communication platform",
    "SOS safety platform",
    "universal interpretation",
    "PantaAI",
    "professional infrastructure",
    "water infrastructure",
    "knowledge",
    "work",
    "culture",
    "protected services"
  ],
  authors: [{ name: "George Nicolaou" }],
  creator: "Pantavion",
  publisher: "Pantavion",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Pantavion",
    title: "Pantavion | One Planet. One Living Screen.",
    description:
      "A governed global ecosystem for communication, SOS safety, universal interpretation, PantaAI, professional infrastructure, knowledge, work and protected services.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Pantavion global ecosystem" }],
    locale: "en_US"
  },
  twitter: {
    card: "summary_large_image",
    title: "Pantavion | One Planet. One Living Screen.",
    description:
      "A governed global ecosystem for communication, SOS safety, universal interpretation, PantaAI, professional infrastructure, knowledge, work and protected services.",
    images: ["/twitter-image"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 }
  },
  icons: { icon: "/pantavion-icon.svg", apple: "/pantavion-icon.svg" },
  manifest: "/manifest.webmanifest"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#071a2d",
  colorScheme: "dark"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <PantavionGlobalUiTranslationRuntime />
        <PantavionGlobalLanguageSelector />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
