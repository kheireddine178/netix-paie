"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Salarie } from "./actions";
import OdooControlPanel from "@/components/odoo/OdooControlPanel";
import OdooKanbanCard from "@/components/odoo/OdooKanbanCard";
import SalarieRowActions from "./salarie-row-actions";

export interface SalariesViewClientProps {
  salaries: Salarie[];
  totalCount: number;
  page: number;
  limit: number;
  search: string;
  status: string;
}

function formatDA(n: number) {
  return n.toLocaleString("fr-FR").replace(/[\u202F\u00A0]/g, " ") + " DA";
}

export default function SalariesViewClient({
  salaries,
  totalCount,
  page,
  limit,
  search: initialSearch,
  status: initialStatus,
}: SalariesViewClientProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [searchVal, setSearchVal] = useState(initialSearch);

  const totalPages = Math.ceil(totalCount / limit);
  const startIdx = totalCount > 0 ? (page - 1) * limit + 1 : 0;
  const endIdx = Math.min(page * limit, totalCount);

  // Search submission on enter or debounced
  const handleSearchChange = (val: string) => {
    setSearchVal(val);
    const params = new URLSearchParams();
    if (val) params.set("search", val);
    params.set("status", initialStatus);
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  const handleFilterClick = (statusKey: string) => {
    const params = new URLSearchParams();
    if (searchVal) params.set("search", searchVal);
    params.set("status", statusKey);
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  const handlePrevPage = () => {
    if (page > 1) {
      const params = new URLSearchParams();
      if (searchVal) params.set("search", searchVal);
      params.set("status", initialStatus);
      params.set("page", String(page - 1));
      router.push(`?${params.toString()}`);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      const params = new URLSearchParams();
      if (searchVal) params.set("search", searchVal);
      params.set("status", initialStatus);
      params.set("page", String(page + 1));
      router.push(`?${params.toString()}`);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 1. ODOO CONTROL PANEL */}
      <OdooControlPanel
        breadcrumbs={[{ label: "Collaborateurs" }]}
        primaryAction={{
          label: "Nouveau collaborateur",
          href: "/salaries/nouveau",
          icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          ),
        }}
        search={{
          value: searchVal,
          onChange: handleSearchChange,
          placeholder: "Rechercher par nom, matricule, poste…",
        }}
        filters={[
          {
            id: "all",
            label: "Tous",
            active: initialStatus === "all",
            onClick: () => handleFilterClick("all"),
          },
          {
            id: "active",
            label: "Actifs uniquement",
            active: initialStatus === "active",
            onClick: () => handleFilterClick("active"),
          },
          {
            id: "inactive",
            label: "Inactifs",
            active: initialStatus === "inactive",
            onClick: () => handleFilterClick("inactive"),
          },
        ]}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        pager={{
          current: page,
          total: totalPages,
          label: `${startIdx}-${endIdx} / ${totalCount}`,
          hasPrev: page > 1,
          hasNext: page < totalPages,
          onPrev: handlePrevPage,
          onNext: handleNextPage,
        }}
      />

      {/* 2. CONTENU PRINCIPAL (KANBAN ou LISTE) */}
      {salaries.length === 0 ? (
        <div
          className="p-12 text-center rounded-lg border border-dashed"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
            color: "var(--text-muted)",
          }}
        >
          <p className="font-semibold text-sm">Aucun collaborateur ne correspond à vos filtres.</p>
          <Link href="/salaries/nouveau" className="btn btn-primary btn-sm inline-block mt-3">
            + Ajouter un salarié
          </Link>
        </div>
      ) : viewMode === "kanban" ? (
        /* VUE KANBAN (Cartes réactives idéales sur smartphone et tablette) */
        <div className="odoo-kanban-grid">
          {salaries.map((s) => (
            <OdooKanbanCard
              key={s.id}
              title={s.nom_prenom}
              subtitle={s.fonction || "Poste non renseigné"}
              badge={{
                text: s.actif ? "Actif" : "Inactif",
                variant: s.actif ? "success" : "neutral",
              }}
              metrics={[
                { label: "Matricule", value: s.matricule || "—" },
                { label: "Salaire de base", value: formatDA(s.salaire_base_theorique) },
              ]}
              href={`/salaries/${s.id}`}
              actions={
                <div className="flex items-center gap-1.5 w-full justify-between">
                  <Link
                    href={`/saisie?salarieId=${s.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="btn btn-secondary btn-sm text-[11px] font-semibold py-1 px-2.5"
                    style={{ border: "1px solid var(--accent)", color: "var(--accent)" }}
                  >
                    💰 Fiche de paie
                  </Link>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Link
                      href={`/salaries/${s.id}/modifier`}
                      className="p-1.5 rounded hover:bg-slate-100 text-xs font-semibold text-gray-600"
                      title="Modifier"
                    >
                      ✏️
                    </Link>
                    <SalarieRowActions id={s.id} actif={s.actif} />
                  </div>
                </div>
              }
            />
          ))}
        </div>
      ) : (
        /* VUE LISTE (Tableau Odoo haute densité) */
        <div className="table-wrap rounded-lg border overflow-hidden" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                <th className="py-2.5 px-3 font-bold">Nom & Prénom</th>
                <th className="py-2.5 px-3 font-bold w-28">Matricule</th>
                <th className="py-2.5 px-3 font-bold">Fonction</th>
                <th className="py-2.5 px-3 font-bold text-right w-36">Salaire de base</th>
                <th className="py-2.5 px-3 font-bold w-36">CCP / RIP</th>
                <th className="py-2.5 px-3 font-bold w-20 text-center">Statut</th>
                <th className="py-2.5 px-3 font-bold text-right w-44">Actions</th>
              </tr>
            </thead>
            <tbody>
              {salaries.map((s) => (
                <tr
                  key={s.id}
                  className="border-b transition-colors hover:bg-slate-50/70"
                  style={{
                    borderColor: "var(--border-soft)",
                    opacity: s.actif ? 1 : 0.6,
                  }}
                >
                  <td className="py-2.5 px-3 font-semibold">
                    <Link
                      href={`/salaries/${s.id}`}
                      className="hover:underline"
                      style={{ color: "var(--text)" }}
                    >
                      {s.nom_prenom}
                    </Link>
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold" style={{ color: "var(--accent)" }}>
                    {s.matricule || "—"}
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground">
                    {s.fonction || "—"}
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold">
                    {formatDA(s.salaire_base_theorique)}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px]">
                    {s.ccp_rib || "—"}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        s.actif ? "bg-teal-100 text-teal-800" : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {s.actif ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="inline-flex items-center gap-1.5 justify-end">
                      <Link
                        href={`/salaries/${s.id}`}
                        className="btn btn-secondary btn-sm text-[11px] py-0.5 px-2"
                      >
                        Gérer
                      </Link>
                      <Link
                        href={`/saisie?salarieId=${s.id}`}
                        className="btn btn-primary btn-sm text-[11px] py-0.5 px-2"
                      >
                        Paie
                      </Link>
                      <SalarieRowActions id={s.id} actif={s.actif} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
