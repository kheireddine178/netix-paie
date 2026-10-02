"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

export interface OdooMobileDrawerProps {
  navItems: NavItem[];
  theme: "light" | "dark";
  onToggleTheme: () => void;
  brandName?: string;
  brandSubtitle?: string;
}

export default function OdooMobileDrawer({
  navItems,
  theme,
  onToggleTheme,
  brandName = "Netix SIRH",
  brandSubtitle = "Algérie",
}: OdooMobileDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile Top App Bar (Only visible on small screens <= 768px) */}
      <div
        className="odoo-mobile-topbar flex md:hidden items-center justify-between px-4 py-2.5 w-full sticky top-0 z-40"
        style={{
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-3">
          {/* Hamburger Button */}
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Ouvrir le menu de navigation"
            className="p-1.5 rounded-md hover:bg-slate-100 transition-colors"
            style={{ color: "var(--text)" }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          {/* Mini Brand */}
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center"
              style={{ background: "var(--accent)" }}
            >
              <Image src="/logo-icon.svg" alt="Netix" width={20} height={20} priority />
            </div>
            <span className="font-bold text-sm tracking-tight" style={{ color: "var(--text)" }}>
              {brandName}
            </span>
          </div>
        </div>

        {/* Quick Theme Toggle on Mobile */}
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label="Changer de thème"
          className="p-1.5 rounded-md hover:bg-slate-100 transition-colors"
          style={{ color: "var(--text)" }}
        >
          {theme === "dark" ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </div>

      {/* Slide-over Drawer (Off-Canvas Backdrop & Panel) */}
      {isOpen && (
        <div className="odoo-drawer-overlay fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop Blur / Dim */}
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer Sidebar Content */}
          <aside
            className="relative w-72 max-w-[80vw] h-full flex flex-col z-50 shadow-2xl transition-transform"
            style={{
              background: "var(--sidebar-bg)",
              borderRight: "1px solid var(--border)",
            }}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--border-soft)" }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--accent)" }}>
                  <Image src="/logo-icon.svg" alt="Netix" width={22} height={22} priority />
                </div>
                <div className="flex flex-col">
                  <strong className="text-sm font-bold leading-tight" style={{ color: "var(--text)" }}>
                    {brandName}
                  </strong>
                  <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--text-muted)" }}>
                    {brandSubtitle}
                  </span>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Fermer le menu"
                className="p-1 rounded-md hover:bg-slate-100"
                style={{ color: "var(--text-muted)" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Navigation links list */}
            <nav className="flex-1 overflow-y-auto p-2 space-y-1">
              {navItems.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname === item.href || pathname.startsWith(item.href + "/");

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
                    style={{
                      background: isActive ? "var(--accent-bg)" : "transparent",
                      color: isActive ? "var(--accent-ink)" : "var(--text)",
                    }}
                  >
                    <span className="flex-shrink-0" style={{ color: isActive ? "var(--accent)" : "var(--text-muted)" }}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Bottom Footer in Drawer */}
            <div className="p-4 border-t" style={{ borderColor: "var(--border-soft)" }}>
              <button
                type="button"
                onClick={onToggleTheme}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold"
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                }}
              >
                <span>{theme === "dark" ? "Mode clair" : "Mode sombre"}</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
