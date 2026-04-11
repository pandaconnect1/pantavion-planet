import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pantavion Planet",
  description: "Pantavion Kernel OS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
