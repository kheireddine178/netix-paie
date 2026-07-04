import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Netix Paie",
  description: "Application de gestion de paie algérienne",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
