import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Netix SIRH — Gestion RH & Paie Algérienne",
  description: "SIRH complet pour la gestion RH et la paie conforme CIDTA / LF 2024 / Loi n°90-11 en Algérie.",
  manifest: "/manifest.json",
  themeColor: "#1B5EAB",
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

// Appliqué avant l'hydration React pour éviter un flash clair -> sombre
// au chargement quand l'utilisateur a déjà choisi le mode sombre.
const themeInitScript = `
(function () {
  try {
    var saved = window.localStorage.getItem("netix-theme");
    if (saved === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    }
  } catch (e) {}
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/sw.js');
    });
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`h-full antialiased ${plusJakartaSans.variable} ${geistMono.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1B5EAB" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}

