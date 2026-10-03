"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { Salarie, PromotionGlobalRow, SanctionGlobalRow } from "../salaries/actions";
import OdooControlPanel from "@/components/odoo/OdooControlPanel";
import OdooKanbanCard from "@/components/odoo/OdooKanbanCard";

export interface CarriereViewClientProps {
  promotions: PromotionGlobalRow[];
  sanctions: SanctionGlobalRow[];
  salaries: Salarie[];
}

function formatDA(n: number) {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/[\u202F\u00A0]/g, " ") + " DA";
}

export default function CarriereViewClient({
  promotions,
  sanctions,
  salaries,
}: CarriereViewClientProps) {
  const [tab, setTab] = useState<"promotions" | "sanctions" | "folders">("promotions");
  const [search, setSearch] = useState("");

  const filteredPromotions = promotions.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const nom = (p.salaries?.nom_prenom || "").toLowerCase();
    const poste = (p.nouveau_poste || "").toLowerCase();
    return nom.includes(q) || poste.includes(q);
  });

  const filteredSanctions = sanctions.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const nom = (s.salaries?.nom_prenom || "").toLowerCase();
    const typeS = (s.type_sanction || "").toLowerCase();
    const motif = (s.motif || "").toLowerCase();
    return nom.includes(q) || typeS.includes(q) || motif.includes(q);
  });

  return (
    <div className="flex flex-col gap-4">
      {/* 1. ODOO CONTROL PANEL */}
      <OdooControlPanel
        breadcrumbs={[
          { label: "Carrière & Discipline" },
          { label: tab === "promotions" ? "Promotions" : tab === "sanctions" ? "Registre Disciplinaire" : "Dossiers" },
        ]}
        search={{
          value: search,
          onChange: setSearch,
          placeholder: "Rechercher par collaborateur, poste, motif…",
        }}
        filters={[
          {
            id: "promotions",
            label: `📈 Promotions (${promotions.length})`,
            active: tab === "promotions",
            onClick: () => setTab("promotions"),
          },
          {
            id: "sanctions",
            label: `⚖️ Sanctions (${sanctions.length})`,
            active: tab === "sanctions",
            onClick: () => setTab("sanctions"),
          },
          {
            id: "folders",
            label: `👥 Dossiers individuels`,
            active: tab === "folders",
            onClick: () => setTab("folders"),
          },
        ]}
        secondaryActions={[
          {
            label: "Collaborateurs",
            href: "/salaries",
          },
        ]}
      />

      {/* 2. STATS KPI ODOO */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
        <div
          className="p-3.5 rounded-lg border flex flex-col justify-between cursor-pointer transition-all hover:border-pink-300"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          onClick={() => setTab("promotions")}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: "#ec4899" }}>
            📈 Évolutions & Promotions
          </span>
          <div className="text-xl font-bold mt-1" style={{ color: "#ec4899" }}>
            {promotions.length} acte(s)
          </div>
        </div>

        <div
          className="p-3.5 rounded-lg border flex flex-col justify-between cursor-pointer transition-all hover:border-red-300"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          onClick={() => setTab("sanctions")}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider text-red-600">
            ⚖️ Registre Disciplinaire
          </span>
          <div className="text-xl font-bold mt-1 text-red-600">
            {sanctions.length} sanction(s)
          </div>
        </div>

        <div
          className="p-3.5 rounded-lg border flex flex-col justify-between"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
            👥 Effectif de l&apos;entreprise
          </span>
          <div className="text-xl font-bold mt-1" style={{ color: "var(--text)" }}>
            {salaries.length} salariés
          </div>
        </div>
      </div>

      {/* 3. CONTENU SELON ONGLET */}
      {tab === "promotions" ? (
        filteredPromotions.length === 0 ? (
          <div
            className="p-12 text-center rounded-lg border border-dashed text-xs text-muted-foreground"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            Aucune promotion enregistrée dans l&apos;historique.
          </div>
        ) : (
          <div
            className="table-wrap rounded-lg border overflow-hidden"
            style={{ borderColor: "var(--border)", background: "var(--surface)" }}
          >
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                  <th className="py-2.5 px-3 font-bold">Collaborateur</th>
                  <th className="py-2.5 px-3 font-bold">Évolution de poste</th>
                  <th className="py-2.5 px-3 font-bold w-32">Date d&apos;effet</th>
                  <th className="py-2.5 px-3 font-bold text-right w-40">Nouveau salaire base</th>
                  <th className="py-2.5 px-3 font-bold text-right w-36">Document PDF</th>
                </tr>
              </thead>
              <tbody>
                {filteredPromotions.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b transition-colors hover:bg-slate-50/70"
                    style={{ borderColor: "var(--border-soft)" }}
                  >
                    <td className="py-2.5 px-3 font-semibold">
                      <Link
                        href={`/salaries/${p.salarie_id}/carriere`}
                        className="hover:underline flex items-center gap-2"
                        style={{ color: "var(--text)" }}
                      >
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                          style={{ background: "#FDF2F8", color: "#EC4899" }}
                        >
                          {(p.salaries?.nom_prenom || "S").slice(0, 2).toUpperCase()}
                        </div>
                        <span>{p.salaries?.nom_prenom || `Salarié #${p.salarie_id}`}</span>
                      </Link>
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-muted-foreground line-through text-[11px]">
                          {p.ancien_poste || "Poste initial"}
                        </span>
                        <span className="font-bold text-pink-600">→</span>
                        <span className="font-bold" style={{ color: "var(--text)" }}>
                          {p.nouveau_poste}
                        </span>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 font-mono text-[11px]">
                      {p.date_effet.split("-").reverse().join("/")}
                    </td>

                    <td className="py-2.5 px-3 text-right font-bold" style={{ color: "var(--accent)" }}>
                      {formatDA(p.salaire_base_nouveau)}
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      <Link
                        href={`/salaries/${p.salarie_id}/carriere/pdf-decision?id=${p.id}`}
                        target="_blank"
                        className="btn btn-secondary btn-sm text-[11px] py-1 px-2.5 inline-flex items-center gap-1"
                      >
                        📄 Décision PDF
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : tab === "sanctions" ? (
        filteredSanctions.length === 0 ? (
          <div
            className="p-12 text-center rounded-lg border border-dashed text-xs text-muted-foreground"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            Le registre disciplinaire est vierge (aucune sanction notifiée).
          </div>
        ) : (
          <div
            className="table-wrap rounded-lg border overflow-hidden"
            style={{ borderColor: "var(--border)", background: "var(--surface)" }}
          >
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                  <th className="py-2.5 px-3 font-bold">Collaborateur</th>
                  <th className="py-2.5 px-3 font-bold w-36">Nature de sanction</th>
                  <th className="py-2.5 px-3 font-bold w-32">Date de notification</th>
                  <th className="py-2.5 px-3 font-bold">Motif légal</th>
                  <th className="py-2.5 px-3 font-bold w-24 text-center">Mise à pied</th>
                  <th className="py-2.5 px-3 font-bold text-right w-36">Document PDF</th>
                </tr>
              </thead>
              <tbody>
                {filteredSanctions.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b transition-colors hover:bg-slate-50/70"
                    style={{ borderColor: "var(--border-soft)" }}
                  >
                    <td className="py-2.5 px-3 font-semibold">
                      <Link
                        href={`/salaries/${s.salarie_id}/carriere`}
                        className="hover:underline flex items-center gap-2"
                        style={{ color: "var(--text)" }}
                      >
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                          style={{ background: "#FEF2F2", color: "#B91C1C" }}
                        >
                          {(s.salaries?.nom_prenom || "S").slice(0, 2).toUpperCase()}
                        </div>
                        <span>{s.salaries?.nom_prenom || `Salarié #${s.salarie_id}`}</span>
                      </Link>
                    </td>

                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                        {s.type_sanction}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 font-mono text-[11px]">
                      {s.date_sanction.split("-").reverse().join("/")}
                    </td>

                    <td className="py-2.5 px-3 text-muted-foreground">
                      {s.motif}
                    </td>

                    <td className="py-2.5 px-3 text-center font-bold">
                      {s.duree_mise_a_pied ? `${s.duree_mise_a_pied} j` : "—"}
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      <Link
                        href={`/salaries/${s.salarie_id}/carriere/pdf-sanction?id=${s.id}`}
                        target="_blank"
                        className="btn btn-secondary btn-sm text-[11px] py-1 px-2.5 inline-flex items-center gap-1 text-red-700"
                      >
                        📄 Lettre PDF
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* VUE DOSSIERS */
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
                { label: "Dossier", value: "Promotions / Discipline" },
              ]}
              href={`/salaries/${s.id}/carriere`}
              actions={
                <span className="text-xs font-bold hover:underline" style={{ color: "#ec4899" }}>
                  Historique de carrière →
                </span>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
