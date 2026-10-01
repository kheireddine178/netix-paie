import type { Metadata } from "next";
import { Lexend, DM_Sans, Roboto_Mono } from "next/font/google";
import "./globals.css";

const lexend = Lexend({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-lexend",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-dmsans",
  display: "swap",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Netix SIRH — Gestion RH & Paie Algérienne",
  description: "SIRH complet pour la gestion RH et la paie conforme CIDTA / LF 2024 / Loi n°90-11 en Algérie.",
  manifest: "/manifest.json",
  themeColor: "#7C3AED", // HRFlow Primary
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Netix SIRH",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/logo-icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`h-full antialiased ${lexend.variable} ${dmSans.variable} ${robotoMono.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#7C3AED" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}

