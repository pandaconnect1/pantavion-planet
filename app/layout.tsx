import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pantavion Planet",
  description: "Pantavion Planet - Global human network, knowledge infrastructure and intelligence layer.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="el">
      <body>{children}</body>
    </html>
  );
}
