"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Salarie, RubriqueCatalogue } from "../salaries/actions";
import OdooControlPanel from "@/components/odoo/OdooControlPanel";

export interface CatalogueViewClientProps {
  catalogue: RubriqueCatalogue[];
  salaries: Salarie[];
}

export default function CatalogueViewClient({
  catalogue,
  salaries,
}: CatalogueViewClientProps) {
  const router = useRouter();
  const [tab, setTab] = useState<"catalogue" | "affectation">("catalogue");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string>("all");

  const filteredCatalogue = catalogue.filter((r) => {
    if (catFilter !== "all" && r.categorie !== catFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const code = r.code.toLowerCase();
    const libelle = (r.libelle || "").toLowerCase();
    return code.includes(q) || libelle.includes(q);
  });

  const getCatBadge = (cat: string) => {
    switch (cat) {
      case "pourcentage":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">Pourcentage (%)</span>;
      case "montant_fixe":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Montant Fixe (DA)</span>;
      case "nombre_x_taux":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">Nombre × Taux</span>;
      case "regularisation":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">Régularisation</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">{cat}</span>;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 1. ODOO CONTROL PANEL */}
      <OdooControlPanel
        breadcrumbs={[
          { label: "Catalogue des Rubriques de Paie" },
          { label: tab === "catalogue" ? "Plan de paie" : "Affectation salariés" },
        ]}
        search={
          tab === "catalogue"
            ? {
                value: search,
                onChange: setSearch,
                placeholder: "Rechercher par code (R100...), libellé (Panier...)",
              }
            : undefined
        }
        filters={
          tab === "catalogue"
            ? [
                {
                  id: "all",
                  label: "Toutes",
                  active: catFilter === "all",
                  onClick: () => setCatFilter("all"),
                },
                {
                  id: "pourcentage",
                  label: "% Pourcentage",
                  active: catFilter === "pourcentage",
                  onClick: () => setCatFilter("pourcentage"),
                },
                {
                  id: "montant_fixe",
                  label: "Montant Fixe",
                  active: catFilter === "montant_fixe",
                  onClick: () => setCatFilter("montant_fixe"),
                },
                {
                  id: "nombre_x_taux",
                  label: "Nombre × Taux",
                  active: catFilter === "nombre_x_taux",
                  onClick: () => setCatFilter("nombre_x_taux"),
                },
              ]
            : undefined
        }
        secondaryActions={[
          {
            label: "Saisie de paie",
            href: "/saisie",
          },
          {
            label: "Paramètres & Taux",
            href: "/parametres",
          },
        ]}
        extraRight={
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setTab(tab === "catalogue" ? "affectation" : "catalogue")}
              className="text-xs font-semibold px-2.5 py-1.5 rounded transition-all cursor-pointer"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "var(--text)",
              }}
            >
              {tab === "catalogue" ? "👤 Affectation par Salarié" : "📋 Voir le Plan de Paie"}
            </button>
            <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 text-slate-700">
              {catalogue.length} rubriques
            </span>
          </div>
        }
      />

      {/* 2. CONTENU SELON ONGLET */}
      {tab === "affectation" ? (
        <div
          className="p-6 rounded-lg border flex flex-col gap-4 max-w-xl mx-auto w-full"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div>
            <h3 className="font-bold text-sm m-0" style={{ color: "var(--text)" }}>
              Affecter des rubriques à un collaborateur
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Sélectionnez un salarié pour activer ou désactiver les primes personnalisées sur son bulletin.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold">Sélectionner un collaborateur :</label>
            <select
              defaultValue=""
              onChange={(e) => {
                const id = e.target.value;
                if (id) router.push(`/salaries/${id}/rubriques`);
              }}
              className="p-2.5 rounded border text-xs font-semibold"
              style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}
            >
              <option value="" disabled>
                Choisir un salarié…
              </option>
              {salaries.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nom_prenom} {s.matricule ? `(${s.matricule})` : ""} — {s.fonction || "Poste non défini"}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        /* VUE TABLEAU DU CATALOGUE COMPLET */
        <div
          className="table-wrap rounded-lg border overflow-hidden"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        >
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                <th className="py-2.5 px-3 font-bold w-24">Code</th>
                <th className="py-2.5 px-3 font-bold">Libellé de la prime / retenue</th>
                <th className="py-2.5 px-3 font-bold w-36">Mode de calcul</th>
                <th className="py-2.5 px-3 font-bold w-32">Type de valeur</th>
                <th className="py-2.5 px-3 font-bold text-right w-36">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCatalogue.slice(0, 100).map((r) => (
                <tr
                  key={r.code}
                  className="border-b transition-colors hover:bg-slate-50/70"
                  style={{ borderColor: "var(--border-soft)" }}
                >
                  <td className="py-2.5 px-3 font-mono font-bold" style={{ color: "var(--accent)" }}>
                    {r.code}
                  </td>
                  <td className="py-2.5 px-3 font-semibold" style={{ color: "var(--text)" }}>
                    {r.libelle || "Rubrique sans libellé"}
                  </td>
                  <td className="py-2.5 px-3">
                    {getCatBadge(r.categorie)}
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground font-mono text-[11px]">
                    {r.type_valeur || "standard"}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span className="text-[11px] text-teal-700 font-semibold">
                      ✓ Active en paie
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredCatalogue.length > 100 && (
            <div className="p-3 text-center text-xs text-muted-foreground bg-slate-50 border-t" style={{ borderColor: "var(--border)" }}>
              Affichage des 100 premières rubriques sur {filteredCatalogue.length}. Utilisez la recherche par code pour affiner.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
