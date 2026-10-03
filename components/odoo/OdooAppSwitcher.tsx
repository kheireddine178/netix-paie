"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconUsers,
  IconCalculator,
  IconFileText,
  IconCalendar,
  IconPlane,
  IconTrendingUp,
  IconGraduation,
  IconBarChart,
  IconList,
  IconClock,
  IconHome,
  IconBook,
  IconSettings,
  IconUser,
  IconSearch,
} from "@/components/Icons";

export interface AppItem {
  id: string;
  name: string;
  tagline: string;
  href: string;
  gradient: string;
  shadowColor: string;
  icon: React.ReactNode;
  category: "RH & Paie" | "Social & Carrière" | "Reporting & Config";
}

export const ODOO_APPS: AppItem[] = [
  {
    id: "dashboard",
    name: "Tableau de Bord",
    tagline: "Vue d'ensemble & alertes",
    href: "/dashboard",
    gradient: "from-slate-700 to-slate-900",
    shadowColor: "rgba(30, 41, 59, 0.4)",
    icon: <IconHome size={28} />,
    category: "Reporting & Config",
  },
  {
    id: "salaries",
    name: "Collaborateurs",
    tagline: "Annuaire & dossiers RH",
    href: "/salaries",
    gradient: "from-indigo-600 to-indigo-800",
    shadowColor: "rgba(79, 70, 229, 0.4)",
    icon: <IconUsers size={28} />,
    category: "RH & Paie",
  },
  {
    id: "saisie",
    name: "Paie Mensuelle",
    tagline: "Saisie des variables & calcul",
    href: "/saisie",
    gradient: "from-violet-600 to-purple-800",
    shadowColor: "rgba(124, 58, 237, 0.4)",
    icon: <IconCalculator size={28} />,
    category: "RH & Paie",
  },
  {
    id: "contrats",
    name: "Contrats & Documents",
    tagline: "CDD, CDI, PV & attestations",
    href: "/contrats",
    gradient: "from-emerald-600 to-teal-800",
    shadowColor: "rgba(13, 148, 136, 0.4)",
    icon: <IconFileText size={28} />,
    category: "RH & Paie",
  },
  {
    id: "conges",
    name: "Congés & Absences",
    tagline: "Soldes légaux & validations",
    href: "/conges",
    gradient: "from-amber-500 to-orange-700",
    shadowColor: "rgba(217, 119, 6, 0.4)",
    icon: <IconCalendar size={28} />,
    category: "Social & Carrière",
  },
  {
    id: "missions",
    name: "Missions & Déplacements",
    tagline: "Frais & ordres de mission PDF",
    href: "/missions",
    gradient: "from-sky-500 to-blue-700",
    shadowColor: "rgba(2, 132, 199, 0.4)",
    icon: <IconPlane size={28} />,
    category: "Social & Carrière",
  },
  {
    id: "carriere",
    name: "Carrière & Discipline",
    tagline: "Promotions & notifications",
    href: "/carriere",
    gradient: "from-pink-500 to-rose-700",
    shadowColor: "rgba(225, 29, 72, 0.4)",
    icon: <IconTrendingUp size={28} />,
    category: "Social & Carrière",
  },
  {
    id: "formations",
    name: "Formations & Talents",
    tagline: "Catalogue, sessions & fiches",
    href: "/formations",
    gradient: "from-purple-600 to-fuchsia-800",
    shadowColor: "rgba(147, 51, 234, 0.4)",
    icon: <IconGraduation size={28} />,
    category: "Social & Carrière",
  },
  {
    id: "historique",
    name: "Livre de Paie",
    tagline: "Journal général des bulletins",
    href: "/historique",
    gradient: "from-emerald-500 to-green-700",
    shadowColor: "rgba(16, 185, 129, 0.4)",
    icon: <IconClock size={28} />,
    category: "RH & Paie",
  },
  {
    id: "rapports",
    name: "États de Paie & G50",
    tagline: "Centralisateur, virements, fisc",
    href: "/rapports",
    gradient: "from-blue-600 to-indigo-800",
    shadowColor: "rgba(37, 99, 235, 0.4)",
    icon: <IconBarChart size={28} />,
    category: "Reporting & Config",
  },
  {
    id: "rubriques",
    name: "Plan de Paie",
    tagline: "Catalogue primes & indemnités",
    href: "/rubriques",
    gradient: "from-teal-600 to-cyan-800",
    shadowColor: "rgba(14, 165, 233, 0.4)",
    icon: <IconList size={28} />,
    category: "Reporting & Config",
  },
  {
    id: "parametres",
    name: "Paramètres & Barèmes",
    tagline: "SNMG, CNAS 9%/26%, barème IRG",
    href: "/parametres",
    gradient: "from-slate-600 to-zinc-800",
    shadowColor: "rgba(71, 85, 105, 0.4)",
    icon: <IconSettings size={28} />,
    category: "Reporting & Config",
  },
  {
    id: "guide",
    name: "Guide RH Algérien",
    tagline: "Droit du travail Loi n°90-11",
    href: "/guide",
    gradient: "from-amber-600 to-amber-800",
    shadowColor: "rgba(180, 83, 9, 0.4)",
    icon: <IconBook size={28} />,
    category: "Reporting & Config",
  },
  {
    id: "portail",
    name: "Portail Salarié (ESS)",
    tagline: "Self-service collaborateurs",
    href: "/portail",
    gradient: "from-rose-600 to-red-800",
    shadowColor: "rgba(225, 29, 72, 0.4)",
    icon: <IconUser size={28} />,
    category: "RH & Paie",
  },
];

export function IconWaffle({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className="shrink-0"
    >
      <circle cx="4.5" cy="4.5" r="2.5" />
      <circle cx="12" cy="4.5" r="2.5" />
      <circle cx="19.5" cy="4.5" r="2.5" />
      <circle cx="4.5" cy="12" r="2.5" />
      <circle cx="12" cy="12" r="2.5" />
      <circle cx="19.5" cy="12" r="2.5" />
      <circle cx="4.5" cy="19.5" r="2.5" />
      <circle cx="12" cy="19.5" r="2.5" />
      <circle cx="19.5" cy="19.5" r="2.5" />
    </svg>
  );
}

interface OdooAppSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OdooAppSwitcher({ isOpen, onClose }: OdooAppSwitcherProps) {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Filter apps by search
  const filteredApps = ODOO_APPS.filter((app) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      app.name.toLowerCase().includes(q) ||
      app.tagline.toLowerCase().includes(q) ||
      app.category.toLowerCase().includes(q)
    );
  });

  // Focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setSelectedIndex(0);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Global keydown listener
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredApps.length);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredApps.length) % filteredApps.length);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 4, filteredApps.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 4, 0));
      } else if (e.key === "Enter" && filteredApps[selectedIndex]) {
        e.preventDefault();
        router.push(filteredApps[selectedIndex].href);
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredApps, selectedIndex, router, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Sélecteur d'applications Odoo"
      className="odoo-app-switcher-overlay fixed inset-0 z-50 flex flex-col items-center justify-start p-4 sm:p-8"
      style={{
        background: "rgba(15, 23, 42, 0.78)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Top Bar with Brand & Search */}
      <div className="w-full max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white shadow-inner">
            <IconWaffle size={20} />
          </div>
          <div>
            <h2 className="text-white font-black text-lg tracking-tight m-0">
              Applications Netix
            </h2>
            <p className="text-white/60 text-xs m-0">Odoo Enterprise SIRH Algérie</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Rechercher une application… (ex: paie, congés)"
            className="w-full pl-9 pr-12 py-2 text-xs rounded-xl bg-white/15 text-white placeholder-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white/25 transition-all"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none">
            <IconSearch size={14} />
          </div>
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-white/40 px-1.5 py-0.5 rounded bg-white/10 border border-white/10">
            ESC
          </span>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all text-sm font-bold"
          aria-label="Fermer le sélecteur d'applications"
        >
          ✕
        </button>
      </div>

      {/* Grid of Applications */}
      <div className="w-full max-w-4xl overflow-y-auto max-h-[calc(100vh-140px)] pr-1">
        {filteredApps.length === 0 ? (
          <div className="text-center py-16 text-white/60">
            <p className="text-sm font-semibold">Aucune application ne correspond à &quot;{search}&quot;</p>
            <p className="text-xs mt-1 text-white/40">Essayez un autre mot-clé (ex: paie, congés, contrat, bilan)</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pb-6">
            {filteredApps.map((app, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <Link
                  key={app.id}
                  href={app.href}
                  onClick={onClose}
                  className={`group flex flex-col items-center text-center p-4 rounded-2xl border transition-all duration-200 ${
                    isSelected
                      ? "bg-white/20 border-white/40 shadow-xl scale-[1.02]"
                      : "bg-white/10 hover:bg-white/15 border-white/10 hover:border-white/25"
                  }`}
                  style={{
                    backdropFilter: "blur(8px)",
                  }}
                >
                  {/* Colorful App Icon Squircle */}
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${app.gradient} text-white flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:scale-110 group-hover:-translate-y-1`}
                    style={{
                      boxShadow: `0 8px 20px ${app.shadowColor}`,
                    }}
                  >
                    {app.icon}
                  </div>

                  {/* App Name */}
                  <h3 className="text-white font-bold text-xs mt-3 mb-0.5 tracking-tight group-hover:text-indigo-200 transition-colors">
                    {app.name}
                  </h3>

                  {/* App Tagline */}
                  <p className="text-white/60 text-[11px] leading-tight line-clamp-1">
                    {app.tagline}
                  </p>
                </Link>
              );
            })}
          </div>
        )}

        {/* Footer shortcuts hint */}
        <div className="text-center text-white/40 text-[11px] pt-4 border-t border-white/10 flex items-center justify-center gap-4">
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/70 text-[10px] mr-1">↑</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/70 text-[10px] mr-1">↓</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/70 text-[10px] mr-1">←</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/70 text-[10px] mr-1">→</kbd>
            Naviguer
          </span>
          <span>•</span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/70 text-[10px] mr-1">Entrée</kbd> Ouvrir
          </span>
          <span>•</span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/70 text-[10px] mr-1">Échap</kbd> Quitter
          </span>
        </div>
      </div>
    </div>
  );
}
