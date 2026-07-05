"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Accueil" },
  { href: "/salaries", label: "Salariés" },
  { href: "/test-connexion", label: "Test connexion" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M4 19V5a1 1 0 0 1 1-1h9l6 6v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z"
              stroke="#fff"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path d="M14 4v5a1 1 0 0 0 1 1h5" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="brand-text">
          <strong>Netix Paie</strong>
          <span>Algérie</span>
        </div>
      </div>

      <nav style={{ padding: "12px 0", flex: 1 }}>
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={`nav-link${isActive ? " active" : ""}`}>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
