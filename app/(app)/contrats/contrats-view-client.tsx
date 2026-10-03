"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Salarie, ContratGlobalRow } from "../salaries/actions";
import {
  changerStatutContratGlobal,
  supprimerContratGlobal,
  creerContratSalarie,
} from "../salaries/actions";
import OdooControlPanel from "@/components/odoo/OdooControlPanel";
import OdooKanbanCard from "@/components/odoo/OdooKanbanCard";

export interface ContratsViewClientProps {
  contrats: ContratGlobalRow[];
  salaries: Salarie[];
}

function formatDA(n: number) {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/[\u202F\u00A0]/g, " ") + " DA";
}

export default function ContratsViewClient({
  contrats,
  salaries,
}: ContratsViewClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [viewMode, setViewMode] = useState<"list" | "kanban" | "folders">("list");
  const [filterType, setFilterType] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // New contract form
  const [formSalarieId, setFormSalarieId] = useState<string>(salaries[0]?.id ? String(salaries[0].id) : "");
  const [formType, setFormType] = useState("CDI");
  const [formDebut, setFormDebut] = useState("");
  const [formFin, setFormFin] = useState("");
  const [formEssai, setFormEssai] = useState(0);
  const [formSalaire, setFormSalaire] = useState(salaries[0]?.salaire_base_theorique || 45000);
  const [formStatut, setFormStatut] = useState("En cours");

  // Detect CDD expiring in <= 30 days
  const today = new Date();
  const alert30Days = new Date();
  alert30Days.setDate(today.getDate() + 30);

  const cddExpirants = contrats.filter((c) => {
    if (c.type_contrat !== "CDD" || c.statut !== "En cours" || !c.date_fin) return false;
    const fin = new Date(c.date_fin);
    return fin >= today && fin <= alert30Days;
  });

  const totalActifs = contrats.filter((c) => c.statut === "En cours").length;
  const totalEssai = contrats.filter((c) => c.statut === "Période d'essai").length;
  const totalCDI = contrats.filter((c) => c.type_contrat === "CDI").length;

  // Actions
  const handleChangerStatut = (id: number, statut: string) => {
    setMessage(null);
    startTransition(async () => {
      try {
        await changerStatutContratGlobal(id, statut);
        setMessage({ type: "success", text: `Statut du contrat mis à jour : ${statut}.` });
        router.refresh();
      } catch (err) {
        setMessage({ type: "error", text: "Erreur lors de la mise à jour." });
      }
    });
  };

  const handleSupprimer = (id: number) => {
    if (!confirm("Voulez-vous vraiment supprimer ce contrat ?")) return;
    setMessage(null);
    startTransition(async () => {
      try {
        await supprimerContratGlobal(id);
        setMessage({ type: "success", text: "Contrat supprimé." });
        router.refresh();
      } catch (err) {
        setMessage({ type: "error", text: "Erreur lors de la suppression." });
      }
    });
  };

  const handleCreerContrat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSalarieId || !formDebut || formSalaire <= 0) return;

    setMessage(null);
    const formData = new FormData();
    formData.append("type_contrat", formType);
    formData.append("date_debut", formDebut);
    formData.append("date_fin", formFin);
    formData.append("periode_essai_mois", String(formEssai));
    formData.append("salaire_base_contrat", String(formSalaire));
    formData.append("statut", formStatut);

    startTransition(async () => {
      try {
        await creerContratSalarie(parseInt(formSalarieId, 10), formData);
        setIsModalOpen(false);
        setMessage({ type: "success", text: "Contrat créé avec succès." });
        router.refresh();
      } catch (err) {
        setMessage({ type: "error", text: "Erreur lors de la création du contrat." });
      }
    });
  };

  // Filtered contracts
  const filteredContrats = contrats.filter((c) => {
    if (filterType === "expirant") {
      if (c.type_contrat !== "CDD" || c.statut !== "En cours" || !c.date_fin) return false;
      const fin = new Date(c.date_fin);
      if (!(fin >= today && fin <= alert30Days)) return false;
    } else if (filterType === "en_cours") {
      if (c.statut !== "En cours") return false;
    } else if (filterType === "essai") {
      if (c.statut !== "Période d'essai") return false;
    } else if (filterType === "cdi") {
      if (c.type_contrat !== "CDI") return false;
    } else if (filterType === "cdd") {
      if (c.type_contrat !== "CDD") return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      const nom = (c.salaries?.nom_prenom || "").toLowerCase();
      const matricule = (c.salaries?.matricule || "").toLowerCase();
      const typeC = c.type_contrat.toLowerCase();
      if (!nom.includes(q) && !matricule.includes(q) && !typeC.includes(q)) return false;
    }

    return true;
  });

  const getTypeBadgeStyle = (type: string) => {
    switch (type) {
      case "CDI":
        return { background: "var(--accent-bg)", color: "var(--accent-ink)", border: "1px solid var(--accent)" };
      case "CDD":
        return { background: "#FFFBEB", color: "#B45309", border: "1px solid #FCD34D" };
      case "CTA":
        return { background: "var(--teal-bg)", color: "var(--teal-ink)", border: "1px solid var(--teal)" };
      default:
        return { background: "var(--surface-2)", color: "var(--text-muted)", border: "1px solid var(--border)" };
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 1. ODOO CONTROL PANEL */}
      <OdooControlPanel
        breadcrumbs={[{ label: "Contrats & Documents RH" }]}
        primaryAction={{
          label: "+ Nouveau contrat",
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
          placeholder: "Rechercher par collaborateur, matricule, type de contrat…",
        }}
        filters={[
          {
            id: "all",
            label: "Tous les contrats",
            active: filterType === "all",
            onClick: () => setFilterType("all"),
          },
          {
            id: "expirant",
            label: `⚠️ CDD expirant (< 30j) (${cddExpirants.length})`,
            active: filterType === "expirant",
            onClick: () => setFilterType("expirant"),
          },
          {
            id: "en_cours",
            label: "En cours",
            active: filterType === "en_cours",
            onClick: () => setFilterType("en_cours"),
          },
          {
            id: "essai",
            label: `Période d'essai (${totalEssai})`,
            active: filterType === "essai",
            onClick: () => setFilterType("essai"),
          },
          {
            id: "cdi",
            label: `CDI (${totalCDI})`,
            active: filterType === "cdi",
            onClick: () => setFilterType("cdi"),
          },
          {
            id: "cdd",
            label: "CDD",
            active: filterType === "cdd",
            onClick: () => setFilterType("cdd"),
          },
        ]}
        viewMode={viewMode === "folders" ? "list" : viewMode}
        onViewModeChange={(m) => setViewMode(m)}
        extraRight={
          <button
            type="button"
            onClick={() => setViewMode(viewMode === "folders" ? "list" : "folders")}
            className="text-xs font-semibold px-2.5 py-1.5 rounded transition-all cursor-pointer"
            style={{
              background: viewMode === "folders" ? "var(--accent)" : "var(--surface-2)",
              color: viewMode === "folders" ? "#FFFFFF" : "var(--text)",
              border: "1px solid var(--border)",
            }}
          >
            📁 {viewMode === "folders" ? "Vue Contrats" : "Dossiers Collaborateurs"}
          </button>
        }
      />

      {/* 2. STATS KPI ODOO */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div
          className="p-3.5 rounded-lg border flex flex-col justify-between"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--teal)" }}>
            ✓ Contrats en cours
          </span>
          <div className="text-xl font-bold mt-1" style={{ color: "var(--teal)" }}>
            {totalActifs} contrat(s)
          </div>
        </div>

        <div
          className="p-3.5 rounded-lg border flex flex-col justify-between"
          style={{
            background: cddExpirants.length > 0 ? "#FEF2F2" : "var(--surface)",
            borderColor: cddExpirants.length > 0 ? "#FCA5A5" : "var(--border)",
          }}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: cddExpirants.length > 0 ? "#B91C1C" : "var(--amber)" }}>
            ⚠️ CDD expirant (&lt; 30j)
          </span>
          <div className="text-xl font-bold mt-1" style={{ color: cddExpirants.length > 0 ? "#B91C1C" : "var(--amber)" }}>
            {cddExpirants.length} alerte(s)
          </div>
        </div>

        <div
          className="p-3.5 rounded-lg border flex flex-col justify-between"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--accent)" }}>
            💼 Effectif CDI
          </span>
          <div className="text-xl font-bold mt-1" style={{ color: "var(--accent)" }}>
            {totalCDI} collaborateur(s)
          </div>
        </div>

        <div
          className="p-3.5 rounded-lg border flex flex-col justify-between"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
            ⏳ Période d&apos;essai
          </span>
          <div className="text-xl font-bold mt-1" style={{ color: "var(--text)" }}>
            {totalEssai} en cours
          </div>
        </div>
      </div>

      {/* Alert Banner for CDD expiring */}
      {cddExpirants.length > 0 && filterType !== "expirant" && (
        <div className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/70 text-xs flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-amber-900 font-semibold">
            <span>⚠️ Attention :</span>
            <span>{cddExpirants.length} contrat(s) CDD arrivent à échéance sous 30 jours.</span>
          </div>
          <button
            type="button"
            onClick={() => setFilterType("expirant")}
            className="text-xs font-bold underline text-amber-900 hover:text-amber-950 cursor-pointer"
          >
            Filtrer ces CDD →
          </button>
        </div>
      )}

      {/* Messages */}
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

      {/* 3. MAIN CONTENT */}
      {viewMode === "folders" ? (
        /* VUE DOSSIERS PAR SALARIÉ */
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
                { label: "Salaire base", value: formatDA(s.salaire_base_theorique) },
              ]}
              href={`/salaries/${s.id}/contrat`}
              actions={
                <span className="text-xs font-bold hover:underline" style={{ color: "var(--teal)" }}>
                  Voir contrats & documents →
                </span>
              }
            />
          ))}
        </div>
      ) : filteredContrats.length === 0 ? (
        <div
          className="p-12 text-center rounded-lg border border-dashed text-xs text-muted-foreground"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          Aucun contrat ne correspond aux critères de filtre.
        </div>
      ) : viewMode === "list" ? (
        /* VUE LISTE ODOO (Tableau RH des Contrats) */
        <div
          className="table-wrap rounded-lg border overflow-hidden"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        >
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                <th className="py-2.5 px-3 font-bold">Collaborateur</th>
                <th className="py-2.5 px-3 font-bold w-24">Type</th>
                <th className="py-2.5 px-3 font-bold w-32">Date début</th>
                <th className="py-2.5 px-3 font-bold w-32">Date fin</th>
                <th className="py-2.5 px-3 font-bold text-right w-36">Salaire contractuel</th>
                <th className="py-2.5 px-3 font-bold w-28 text-center">Statut</th>
                <th className="py-2.5 px-3 font-bold w-48 text-right">Actions RH</th>
              </tr>
            </thead>
            <tbody>
              {filteredContrats.map((c) => {
                const isCddExpirant =
                  c.type_contrat === "CDD" &&
                  c.statut === "En cours" &&
                  c.date_fin &&
                  new Date(c.date_fin) >= today &&
                  new Date(c.date_fin) <= alert30Days;

                return (
                  <tr
                    key={c.id}
                    className="border-b transition-colors hover:bg-slate-50/70"
                    style={{
                      borderColor: "var(--border-soft)",
                      background: isCddExpirant ? "#FEF3C720" : undefined,
                    }}
                  >
                    <td className="py-2.5 px-3 font-semibold">
                      <Link
                        href={`/salaries/${c.salarie_id}/contrat`}
                        className="hover:underline flex items-center gap-2"
                        style={{ color: "var(--text)" }}
                      >
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                          style={{ background: "var(--accent-bg)", color: "var(--accent-ink)" }}
                        >
                          {(c.salaries?.nom_prenom || "S").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span>{c.salaries?.nom_prenom || `Salarié #${c.salarie_id}`}</span>
                          {c.salaries?.matricule && (
                            <span className="font-mono text-[10px] text-muted-foreground ml-1.5">
                              ({c.salaries.matricule})
                            </span>
                          )}
                        </div>
                      </Link>
                    </td>

                    <td className="py-2.5 px-3">
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold"
                        style={getTypeBadgeStyle(c.type_contrat)}
                      >
                        {c.type_contrat}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 font-mono text-[11px]">
                      {c.date_debut ? c.date_debut.split("-").reverse().join("/") : "—"}
                    </td>

                    <td className="py-2.5 px-3 font-mono text-[11px]">
                      {c.date_fin ? (
                        <span className={isCddExpirant ? "font-bold text-red-600" : ""}>
                          {c.date_fin.split("-").reverse().join("/")}
                          {isCddExpirant && " ⚠️"}
                        </span>
                      ) : (
                        <span className="text-muted-foreground italic">Indéterminée (CDI)</span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-right font-bold" style={{ color: "var(--accent)" }}>
                      {formatDA(c.salaire_base_contrat)}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.statut === "En cours"
                            ? "bg-teal-100 text-teal-800"
                            : c.statut === "Période d'essai"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {c.statut}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <Link
                          href={`/salaries/${c.salarie_id}/contrat`}
                          className="btn btn-secondary btn-sm text-[11px] py-1 px-2 font-semibold"
                        >
                          Dossier
                        </Link>
                        {c.statut === "En cours" ? (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleChangerStatut(c.id, "Terminé")}
                            className="text-[11px] text-muted-foreground hover:text-amber-800 px-1"
                            title="Clôturer le contrat"
                          >
                            Clôturer
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleChangerStatut(c.id, "En cours")}
                            className="text-[11px] text-teal-700 hover:underline px-1"
                            title="Mettre en cours"
                          >
                            Activer
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleSupprimer(c.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                          title="Supprimer"
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
        /* VUE KANBAN */
        <div className="odoo-kanban-grid">
          {filteredContrats.map((c) => (
            <OdooKanbanCard
              key={c.id}
              title={c.salaries?.nom_prenom || `Salarié #${c.salarie_id}`}
              subtitle={`${c.type_contrat} • ${c.salaries?.fonction || "Collaborateur"}`}
              badge={{
                text: c.statut,
                variant: c.statut === "En cours" ? "success" : c.statut === "Période d'essai" ? "info" : "neutral",
              }}
              metrics={[
                { label: "Début", value: c.date_debut ? c.date_debut.split("-").reverse().join("/") : "—" },
                { label: "Fin", value: c.date_fin ? c.date_fin.split("-").reverse().join("/") : "CDI" },
                { label: "Salaire", value: formatDA(c.salaire_base_contrat) },
              ]}
              href={`/salaries/${c.salarie_id}/contrat`}
              actions={
                <Link
                  href={`/salaries/${c.salarie_id}/contrat`}
                  className="text-xs font-bold hover:underline"
                  style={{ color: "var(--teal)" }}
                >
                  Voir dossier & documents →
                </Link>
              }
            />
          ))}
        </div>
      )}

      {/* 4. MODAL NOUVEAU CONTRAT */}
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
                Établir un Nouveau Contrat de Travail
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreerContrat} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Collaborateur concerné :</label>
                <select
                  value={formSalarieId}
                  onChange={(e) => {
                    setFormSalarieId(e.target.value);
                    const sel = salaries.find((s) => s.id === parseInt(e.target.value, 10));
                    if (sel) setFormSalaire(sel.salaire_base_theorique);
                  }}
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
                  <label className="font-bold block mb-1">Type de contrat :</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full p-2 rounded border font-semibold"
                    style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}
                  >
                    <option value="CDI">CDI (Durée indéterminée)</option>
                    <option value="CDD">CDD (Durée déterminée)</option>
                    <option value="CTA">CTA (Aide à l&apos;insertion)</option>
                    <option value="Stage">Convention de Stage</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold block mb-1">Salaire contractuel (DA) :</label>
                  <input
                    type="number"
                    value={formSalaire}
                    onChange={(e) => setFormSalaire(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full p-2 rounded border font-bold"
                    style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Date d&apos;embauche (début) :</label>
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
                  <label className="font-bold block mb-1">
                    Date de fin {formType === "CDI" ? "(Optionnelle)" : "(Requise)"} :
                  </label>
                  <input
                    type="date"
                    value={formFin}
                    onChange={(e) => setFormFin(e.target.value)}
                    required={formType === "CDD"}
                    className="w-full p-2 rounded border"
                    style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Période d&apos;essai (mois) :</label>
                  <input
                    type="number"
                    min="0"
                    max="12"
                    value={formEssai}
                    onChange={(e) => setFormEssai(parseInt(e.target.value, 10) || 0)}
                    className="w-full p-2 rounded border"
                    style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">Statut initial :</label>
                  <select
                    value={formStatut}
                    onChange={(e) => setFormStatut(e.target.value)}
                    className="w-full p-2 rounded border"
                    style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}
                  >
                    <option value="En cours">En cours</option>
                    <option value="Période d'essai">Période d&apos;essai</option>
                    <option value="Terminé">Terminé</option>
                  </select>
                </div>
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
                  {isPending ? "Enregistrement…" : "Enregistrer le contrat"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
