"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface OdooSubNavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  count?: number;
}

export interface OdooSubNavProps {
  items: OdooSubNavItem[];
  className?: string;
}

export default function OdooSubNav({ items, className = "" }: OdooSubNavProps) {
  const pathname = usePathname();

  return (
    <div
      className={`odoo-subnav flex items-center gap-1.5 p-1 rounded-lg overflow-x-auto ${className}`}
      style={{
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
      }}
    >
      {items.map((item) => {
        const isActive =
          item.href === "/saisie"
            ? pathname === "/saisie"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
              isActive
                ? "shadow-xs"
                : "opacity-75 hover:opacity-100 hover:bg-slate-200/50"
            }`}
            style={{
              background: isActive ? "var(--surface)" : "transparent",
              color: isActive ? "var(--accent)" : "var(--text-muted)",
              border: isActive ? "1px solid var(--border)" : "1px solid transparent",
              textDecoration: "none",
            }}
          >
            {item.icon && <span>{item.icon}</span>}
            <span>{item.label}</span>
            {item.count !== undefined && (
              <span
                className="px-1.5 py-0.2 rounded-full text-[10px] font-bold"
                style={{
                  background: isActive ? "var(--accent-bg)" : "var(--border)",
                  color: isActive ? "var(--accent-ink)" : "var(--text-muted)",
                }}
              >
                {item.count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
