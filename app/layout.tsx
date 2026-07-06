import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Netix Paie",
  description: "Logiciel de gestion de paie algérienne — conforme CIDTA / LF 2024 / Loi n°90-11.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
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
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
