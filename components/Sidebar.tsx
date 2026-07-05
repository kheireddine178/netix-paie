"use client";

import Link from "next/link";
import Image from "next/image";
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
          <Image src="/logo-icon.svg" alt="Netix" width={32} height={32} priority />
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
