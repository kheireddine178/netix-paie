"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Salarie, CongeGlobalRow } from "../salaries/actions";
import {
  changerStatutCongeGlobal,
  supprimerCongeGlobal,
  creerCongeSalarie,
} from "../salaries/actions";
import OdooControlPanel from "@/components/odoo/OdooControlPanel";
import OdooKanbanCard from "@/components/odoo/OdooKanbanCard";

export interface CongesViewClientProps {
  conges: CongeGlobalRow[];
  salaries: Salarie[];
  statsSalarie: Record<number, { pris: number; enAttente: number; reliquat: number }>;
}

export default function CongesViewClient({
  conges,
  salaries,
  statsSalarie,
}: CongesViewClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [viewMode, setViewMode] = useState<"list" | "kanban" | "balances">("list");
  const [filterStatut, setFilterStatut] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // New leave form state
  const [formSalarieId, setFormSalarieId] = useState<string>(salaries[0]?.id ? String(salaries[0].id) : "");
  const [formType, setFormType] = useState("Annuel");
  const [formDebut, setFormDebut] = useState("");
  const [formFin, setFormFin] = useState("");
  const [formJours, setFormJours] = useState(1);
  const [formMotif, setFormMotif] = useState("");

  // KPIs
  const totalEnAttente = conges.filter((c) => c.statut === "En attente" || c.statut === "En attente validation RH").length;
  const totalApprouves = conges.filter((c) => c.statut === "Approuvé").length;
  const totalJoursPris = conges
    .filter((c) => c.statut === "Approuvé" && c.type_conge === "Annuel")
    .reduce((sum, c) => sum + (c.jours_ouvrables || 0), 0);

  // Handlers
  const handleChangerStatut = (id: number, statut: string) => {
    setMessage(null);
    startTransition(async () => {
      try {
        await changerStatutCongeGlobal(id, statut);
        setMessage({ type: "success", text: `Statut mis à jour : ${statut}.` });
        router.refresh();
      } catch (err) {
        setMessage({ type: "error", text: "Erreur lors de la mise à jour." });
      }
    });
  };

  const handleSupprimer = (id: number) => {
    if (!confirm("Voulez-vous vraiment supprimer cette demande de congé ?")) return;
    setMessage(null);
    startTransition(async () => {
      try {
        await supprimerCongeGlobal(id);
        setMessage({ type: "success", text: "Demande de congé supprimée." });
        router.refresh();
      } catch (err) {
        setMessage({ type: "error", text: "Erreur lors de la suppression." });
      }
    });
  };

  const handleCreerConge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSalarieId || !formDebut || !formFin || formJours <= 0) return;

    setMessage(null);
    const formData = new FormData();
    formData.append("type_conge", formType);
    formData.append("date_debut", formDebut);
    formData.append("date_fin", formFin);
    formData.append("jours_ouvrables", String(formJours));
    formData.append("motif", formMotif);
    formData.append("statut", "Approuvé"); // Directly approved when entered by HR Admin

    startTransition(async () => {
      try {
        await creerCongeSalarie(parseInt(formSalarieId, 10), formData);
        setIsModalOpen(false);
        setFormMotif("");
        setFormDebut("");
        setFormFin("");
        setFormJours(1);
        setMessage({ type: "success", text: "Nouvelle demande de congé créée et validée." });
        router.refresh();
      } catch (err) {
        setMessage({ type: "error", text: "Erreur lors de l'enregistrement du congé." });
      }
    });
  };

  // Filtered leaves
  const filteredConges = conges.filter((c) => {
    if (filterStatut === "attente") {
      if (c.statut !== "En attente" && c.statut !== "En attente validation RH") return false;
    } else if (filterStatut === "approuve") {
      if (c.statut !== "Approuvé") return false;
    } else if (filterStatut === "rejete") {
      if (c.statut !== "Rejeté") return false;
    } else if (filterStatut === "annuel") {
      if (c.type_conge !== "Annuel") return false;
    } else if (filterStatut === "maladie") {
      if (c.type_conge !== "Maladie" && c.type_conge !== "Sans solde") return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      const nom = (c.salaries?.nom_prenom || "").toLowerCase();
      const matricule = (c.salaries?.matricule || "").toLowerCase();
      const motif = (c.motif || "").toLowerCase();
      if (!nom.includes(q) && !matricule.includes(q) && !motif.includes(q)) return false;
    }

    return true;
  });

  const getTypeBadgeStyle = (type: string) => {
    switch (type) {
      case "Annuel":
        return { background: "var(--teal-bg)", color: "var(--teal-ink)", border: "1px solid var(--teal)" };
      case "Maladie":
        return { background: "#FEF2F2", color: "#B91C1C", border: "1px solid #FCA5A5" };
      case "Sans solde":
        return { background: "#FFFBEB", color: "#B45309", border: "1px solid #FCD34D" };
      case "Maternité":
        return { background: "#FDF2F8", color: "#BE185D", border: "1px solid #FBCFE8" };
      default:
        return { background: "var(--surface-2)", color: "var(--text-muted)", border: "1px solid var(--border)" };
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 1. ODOO CONTROL PANEL */}
      <OdooControlPanel
        breadcrumbs={[{ label: "Congés & Absences" }]}
        primaryAction={{
          label: "+ Nouvelle demande",
          onClick: () => setIsModalOpen(true),
          icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          ),
        }}
        search={{
          value: search,
          onChange: setSearch,
          placeholder: "Rechercher par collaborateur, matricule, motif…",
        }}
        filters={[
          {
            id: "all",
            label: "Toutes les demandes",
            active: filterStatut === "all",
            onClick: () => setFilterStatut("all"),
          },
          {
            id: "attente",
            label: `À valider (${totalEnAttente})`,
            active: filterStatut === "attente",
            onClick: () => setFilterStatut("attente"),
          },
          {
            id: "approuve",
            label: "Approuvées",
            active: filterStatut === "approuve",
            onClick: () => setFilterStatut("approuve"),
          },
          {
            id: "annuel",
            label: "Congés Annuels",
            active: filterStatut === "annuel",
            onClick: () => setFilterStatut("annuel"),
          },
          {
            id: "maladie",
            label: "Maladies / Sans solde",
            active: filterStatut === "maladie",
            onClick: () => setFilterStatut("maladie"),
          },
        ]}
        viewMode={viewMode === "balances" ? "list" : viewMode}
        onViewModeChange={(m) => setViewMode(m)}
        extraRight={
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setViewMode(viewMode === "balances" ? "list" : "balances")}
              className={`text-xs font-semibold px-2.5 py-1.5 rounded transition-all cursor-pointer`}
              style={{
                background: viewMode === "balances" ? "var(--accent)" : "var(--surface-2)",
                color: viewMode === "balances" ? "#FFFFFF" : "var(--text)",
                border: "1px solid var(--border)",
              }}
            >
              👥 {viewMode === "balances" ? "Vue Demandes" : "Soldes Collaborateurs"}
            </button>
          </div>
        }
      />

      {/* 2. KPI STRIP (Odoo Stats) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div
          className="p-3.5 rounded-lg border flex flex-col justify-between"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--amber)" }}>
            ⏳ En attente de validation
          </span>
          <div className="text-xl font-bold mt-1" style={{ color: "var(--amber)" }}>
            {totalEnAttente} demande(s)
          </div>
        </div>

        <div
          className="p-3.5 rounded-lg border flex flex-col justify-between"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--teal)" }}>
            ✓ Demandes approuvées
          </span>
          <div className="text-xl font-bold mt-1" style={{ color: "var(--teal)" }}>
            {totalApprouves} validée(s)
          </div>
        </div>

        <div
          className="p-3.5 rounded-lg border flex flex-col justify-between"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--accent)" }}>
            🏖️ Jours pris cumulés
          </span>
          <div className="text-xl font-bold mt-1" style={{ color: "var(--accent)" }}>
            {totalJoursPris} jours
          </div>
        </div>

        <div
          className="p-3.5 rounded-lg border flex flex-col justify-between"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
            👥 Effectif suivi
          </span>
          <div className="text-xl font-bold mt-1" style={{ color: "var(--text)" }}>
            {salaries.length} salariés
          </div>
        </div>
      </div>

      {/* Feedback Messages */}
      {message && (
        <div
          className={`p-3 text-xs font-semibold rounded ${
            message.type === "success"
              ? "bg-teal-50 text-teal-800 border border-teal-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* 3. CONTENU PRINCIPAL */}
      {viewMode === "balances" ? (
        /* VUE SOLDES INDIVIDUELS (Trombinoscope & Reliquats) */
        <div className="flex flex-col gap-3">
          <div className="text-xs font-bold text-muted-foreground">
            Soldes individuels de congés légaux (Loi 90-11 : 2.5 jours/mois)
          </div>
          <div className="odoo-kanban-grid">
            {salaries.map((s) => {
              const stat = statsSalarie[s.id];
              return (
                <OdooKanbanCard
                  key={s.id}
                  title={s.nom_prenom}
                  subtitle={s.fonction || "Poste non renseigné"}
                  badge={
                    (stat?.enAttente || 0) > 0
                      ? { text: `${stat?.enAttente} à valider`, variant: "warning" }
                      : { text: "À jour", variant: "success" }
                  }
                  metrics={[
                    { label: "Solde Reliquat", value: `${stat?.reliquat || 0} j` },
                    { label: "Jours Pris", value: `${stat?.pris || 0} j` },
                  ]}
                  href={`/salaries/${s.id}/conges`}
                  actions={
                    <span className="text-xs font-bold hover:underline" style={{ color: "var(--amber)" }}>
                      Gérer le dossier →
                    </span>
                  }
                />
              );
            })}
          </div>
        </div>
      ) : filteredConges.length === 0 ? (
        <div
          className="p-12 text-center rounded-lg border border-dashed text-xs text-muted-foreground"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          Aucune demande de congé ne correspond aux critères de filtre.
        </div>
      ) : viewMode === "list" ? (
        /* VUE LISTE ODOO (Tableau RH avec actions directes) */
        <div
          className="table-wrap rounded-lg border overflow-hidden"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        >
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                <th className="py-2.5 px-3 font-bold">Collaborateur</th>
                <th className="py-2.5 px-3 font-bold w-28">Type</th>
                <th className="py-2.5 px-3 font-bold w-48">Période</th>
                <th className="py-2.5 px-3 font-bold w-20 text-center">Durée</th>
                <th className="py-2.5 px-3 font-bold">Motif</th>
                <th className="py-2.5 px-3 font-bold w-28 text-center">Statut</th>
                <th className="py-2.5 px-3 font-bold w-48 text-right">Actions RH</th>
              </tr>
            </thead>
            <tbody>
              {filteredConges.map((c) => {
                const isPendingItem = c.statut === "En attente" || c.statut === "En attente validation RH";

                return (
                  <tr
                    key={c.id}
                    className="border-b transition-colors hover:bg-slate-50/70"
                    style={{ borderColor: "var(--border-soft)" }}
                  >
                    <td className="py-2.5 px-3 font-semibold">
                      <Link
                        href={`/salaries/${c.salarie_id}/conges`}
                        className="hover:underline flex items-center gap-2"
                        style={{ color: "var(--text)" }}
                      >
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                          style={{ background: "var(--accent-bg)", color: "var(--accent-ink)" }}
                        >
                          {(c.salaries?.nom_prenom || "S").slice(0, 2).toUpperCase()}
                        </div>
                        <span>{c.salaries?.nom_prenom || `Salarié #${c.salarie_id}`}</span>
                      </Link>
                    </td>

                    <td className="py-2.5 px-3">
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold"
                        style={getTypeBadgeStyle(c.type_conge)}
                      >
                        {c.type_conge}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 font-mono text-[11px]">
                      {c.date_debut.split("-").reverse().join("/")} → {c.date_fin.split("-").reverse().join("/")}
                    </td>

                    <td className="py-2.5 px-3 text-center font-bold">
                      {c.jours_ouvrables} j
                    </td>

                    <td className="py-2.5 px-3 text-muted-foreground truncate max-w-[200px]" title={c.motif || ""}>
                      {c.motif || "—"}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.statut === "Approuvé"
                            ? "bg-teal-100 text-teal-800"
                            : c.statut === "Rejeté"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {c.statut}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        {isPendingItem ? (
                          <>
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => handleChangerStatut(c.id, "Approuvé")}
                              title="Valider la demande de congé"
                              className="btn btn-primary btn-sm text-[11px] py-1 px-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded"
                            >
                              ✓ Valider
                            </button>
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => handleChangerStatut(c.id, "Rejeté")}
                              title="Refuser la demande"
                              className="btn btn-secondary btn-sm text-[11px] py-1 px-2 text-red-600 hover:bg-red-50 rounded"
                            >
                              ✕ Refuser
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleChangerStatut(c.id, "En attente")}
                            className="text-[11px] text-muted-foreground hover:underline mr-1"
                            title="Remettre en attente"
                          >
                            ↺ Revoir
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleSupprimer(c.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Supprimer la demande"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* VUE KANBAN (Cartes réactives par demande) */
        <div className="odoo-kanban-grid">
          {filteredConges.map((c) => (
            <div
              key={c.id}
              className="p-4 rounded-lg border transition-all hover:shadow-md flex flex-col justify-between"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
              }}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs"
                      style={{ background: "var(--accent-bg)", color: "var(--accent-ink)" }}
                    >
                      {(c.salaries?.nom_prenom || "S").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-bold text-xs block" style={{ color: "var(--text)" }}>
                        {c.salaries?.nom_prenom}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {c.salaries?.fonction || "Collaborateur"}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      c.statut === "Approuvé"
                        ? "bg-teal-100 text-teal-800"
                        : c.statut === "Rejeté"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {c.statut}
                  </span>
                </div>

                <div className="mt-3 pt-2 border-t text-xs flex flex-col gap-1" style={{ borderColor: "var(--border-soft)" }}>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-[11px]">Type :</span>
                    <span className="font-semibold">{c.type_conge}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-[11px]">Durée :</span>
                    <strong className="text-teal-700">{c.jours_ouvrables} jour(s)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-[11px]">Période :</span>
                    <span className="font-mono text-[10px]">
                      {c.date_debut.split("-").reverse().join("/")} → {c.date_fin.split("-").reverse().join("/")}
                    </span>
                  </div>
                  {c.motif && (
                    <div className="mt-1 text-[11px] italic text-muted-foreground bg-slate-50 p-1.5 rounded">
                      « {c.motif} »
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t flex items-center justify-between" style={{ borderColor: "var(--border-soft)" }}>
                <Link
                  href={`/salaries/${c.salarie_id}/conges`}
                  className="text-[11px] font-semibold hover:underline"
                  style={{ color: "var(--accent)" }}
                >
                  Dossier →
                </Link>

                {c.statut === "En attente" && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleChangerStatut(c.id, "Approuvé")}
                      className="btn btn-primary btn-sm text-[10px] py-1 px-2 bg-teal-600 text-white rounded font-bold"
                    >
                      ✓ Valider
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleChangerStatut(c.id, "Rejeté")}
                      className="btn btn-secondary btn-sm text-[10px] py-1 px-1.5 text-red-600 rounded"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. MODAL DE NOUVELLE DEMANDE (Odoo Quick Drawer / Modal) */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-xl shadow-xl p-6"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b mb-4" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-bold text-base m-0" style={{ color: "var(--text)" }}>
                Nouvelle Demande de Congé
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreerConge} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Collaborateur concerné :</label>
                <select
                  value={formSalarieId}
                  onChange={(e) => setFormSalarieId(e.target.value)}
                  required
                  className="w-full p-2 rounded border"
                  style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}
                >
                  {salaries.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nom_prenom} {s.matricule ? `(${s.matricule})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Type de congé :</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full p-2 rounded border"
                    style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}
                  >
                    <option value="Annuel">Congé Annuel Payé</option>
                    <option value="Maladie">Congé Maladie</option>
                    <option value="Sans solde">Congé Sans Solde</option>
                    <option value="Maternité">Congé Maternité</option>
                    <option value="Événement familial">Événement familial légal</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold block mb-1">Nombre de jours ouvrables :</label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={formJours}
                    onChange={(e) => setFormJours(parseFloat(e.target.value) || 1)}
                    required
                    className="w-full p-2 rounded border font-bold"
                    style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Date de début :</label>
                  <input
                    type="date"
                    value={formDebut}
                    onChange={(e) => setFormDebut(e.target.value)}
                    required
                    className="w-full p-2 rounded border"
                    style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">Date de fin :</label>
                  <input
                    type="date"
                    value={formFin}
                    onChange={(e) => setFormFin(e.target.value)}
                    required
                    className="w-full p-2 rounded border"
                    style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Motif ou commentaire :</label>
                <textarea
                  value={formMotif}
                  onChange={(e) => setFormMotif(e.target.value)}
                  placeholder="Ex : Congé d'été, raison médicale..."
                  rows={2}
                  className="w-full p-2 rounded border"
                  style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t mt-2" style={{ borderColor: "var(--border)" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn btn-primary btn-sm font-bold"
                >
                  {isPending ? "Enregistrement…" : "Enregistrer et Valider"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
