"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Accueil" },
  { href: "/salaries", label: "Collaborateurs" },
  { href: "/saisie", label: "🧮 Saisie mensuelle" },
  { href: "/contrats", label: "💼 Contrats & Docs" },
  { href: "/conges", label: "📅 Congés & Absences" },
  { href: "/missions", label: "✈️ Missions & Ordres" },
  { href: "/carriere", label: "📈 Carrière & Discipline" },
  { href: "/formations", label: "🎓 Formations & Talent" },
  { href: "/rapports", label: "📊 États de Paie" },
  { href: "/rubriques", label: "📋 Rubriques" },
  { href: "/historique", label: "📜 Historique" },
  { href: "/guide", label: "📖 Guide RH" },
  { href: "/parametres", label: "⚙️ Paramètres" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    setTheme(current === "dark" ? "dark" : "light");
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    window.localStorage.setItem("netix-theme", next);
  }

  return (
    <aside className="sidebar">
      <Link href="/" className="brand">
        <div className="brand-mark">
          <Image src="/logo-icon.svg" alt="Netix" width={32} height={32} priority />
        </div>
        <div className="brand-text">
          <strong>Netix Paie</strong>
          <span>Algérie</span>
        </div>
      </Link>

      <nav style={{ padding: "12px 0", flex: 1 }}>
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href} className={`nav-link${isActive ? " active" : ""}`}>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={toggleTheme}
        aria-label={theme === "dark" ? "Activer le thème clair" : "Activer le thème sombre"}
        className="theme-toggle"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          margin: "0 12px 16px",
          padding: "10px 12px",
          borderRadius: "8px",
          border: "1px solid rgba(255,255,255,.12)",
          background: "rgba(255,255,255,.06)",
          color: "#fff",
          fontSize: "13px",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        <span style={{ fontSize: "16px" }}>{theme === "dark" ? "☀️" : "🌙"}</span>
        <span className="theme-label">{theme === "dark" ? "Thème clair" : "Thème sombre"}</span>
      </button>
    </aside>
  );
}
