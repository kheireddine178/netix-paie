"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  IconGraduation,
  IconPlus,
  IconSearch,
  IconCheck,
  IconTrash,
  IconFileText,
  IconUser,
  IconCalendar,
} from "@/components/Icons";
import OdooControlPanel from "@/components/odoo/OdooControlPanel";
import {
  type InscriptionGlobalRow,
  type FormationRow,
  type Salarie,
  changerStatutInscriptionGlobal,
  supprimerInscriptionGlobal,
  creerInscriptionGenerale,
  creerFormationCatalogue,
} from "../salaries/actions";

interface Props {
  inscriptions: InscriptionGlobalRow[];
  catalogue: FormationRow[];
  salaries: Salarie[];
}

export default function FormationsViewClient({
  inscriptions,
  catalogue,
  salaries,
}: Props) {
  const [activeTab, setActiveTab] = useState<"inscriptions" | "catalogue" | "salaries">("inscriptions");
  const [filterStatut, setFilterStatut] = useState<string>("Tous");
  const [searchQuery, setSearchQuery] = useState("");
  const [showModalInscription, setShowModalInscription] = useState(false);
  const [showModalFormation, setShowModalFormation] = useState(false);
  const [preselectedFormationId, setPreselectedFormationId] = useState<number | null>(null);

  const [isPending, startTransition] = useTransition();

  // KPI Calculations
  const totalInscriptions = inscriptions.length;
  const enCoursOuPrevues = inscriptions.filter(
    (i) => i.statut === "En cours" || i.statut === "Prévue"
  ).length;
  const terminees = inscriptions.filter((i) => i.statut === "Terminée").length;
  const budgetInvesti = inscriptions.reduce((sum, i) => {
    return sum + (i.formations?.prix_da || 0);
  }, 0);

  // Inscriptions filtrées
  const inscriptionsFiltrees = inscriptions.filter((item) => {
    if (filterStatut !== "Tous" && item.statut !== filterStatut) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNom = item.salaries?.nom_prenom.toLowerCase().includes(q);
      const matchMatricule = item.salaries?.matricule?.toLowerCase().includes(q);
      const matchTitre = item.formations?.titre.toLowerCase().includes(q);
      const matchOrganisme = item.formations?.organisme.toLowerCase().includes(q);
      if (!matchNom && !matchMatricule && !matchTitre && !matchOrganisme) {
        return false;
      }
    }
    return true;
  });

  // Catalogue filtré
  const catalogueFiltre = catalogue.filter((f) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      f.titre.toLowerCase().includes(q) ||
      f.theme.toLowerCase().includes(q) ||
      f.organisme.toLowerCase().includes(q)
    );
  });

  const handleChangerStatut = (id: number, statut: string) => {
    startTransition(async () => {
      try {
        await changerStatutInscriptionGlobal(id, statut);
      } catch (err: any) {
        alert(err.message || "Erreur de mise à jour");
      }
    });
  };

  const handleSupprimer = (id: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette inscription ?")) return;
    startTransition(async () => {
      try {
        await supprimerInscriptionGlobal(id);
      } catch (err: any) {
        alert(err.message || "Erreur de suppression");
      }
    });
  };

  const handleCreerInscription = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      try {
        await creerInscriptionGenerale(formData);
        setShowModalInscription(false);
        setPreselectedFormationId(null);
      } catch (err: any) {
        alert(err.message || "Erreur lors de l'inscription");
      }
    });
  };

  const handleCreerFormation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      try {
        await creerFormationCatalogue(formData);
        setShowModalFormation(false);
      } catch (err: any) {
        alert(err.message || "Erreur lors de l'ajout au catalogue");
      }
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 1. ODOO CONTROL PANEL */}
      <OdooControlPanel
        breadcrumbs={[{ label: "Formations & Talents" }]}
        primaryAction={{
          label: "+ Inscrire un salarié",
          onClick: () => {
            setPreselectedFormationId(null);
            setShowModalInscription(true);
          },
        }}
        secondaryActions={[
          {
            label: "+ Nouveau module au catalogue",
            onClick: () => setShowModalFormation(true),
          },
          {
            label: "Collaborateurs",
            href: "/salaries",
          },
        ]}
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: "Rechercher par collaborateur, matricule, formation…",
        }}
      />

      {/* 2. KPI RIBBON ODOO */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div
          className="p-3.5 rounded-lg border flex flex-col justify-between"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Total Inscriptions
          </div>
          <div className="text-2xl font-black mt-1" style={{ color: "var(--text)" }}>
            {totalInscriptions}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            Toutes sessions confondues
          </div>
        </div>

        <div
          className="p-3.5 rounded-lg border flex flex-col justify-between"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
            En cours / Prévues
          </div>
          <div className="text-2xl font-black text-blue-600 mt-1">
            {enCoursOuPrevues}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            Sessions actives programmées
          </div>
        </div>

        <div
          className="p-3.5 rounded-lg border flex flex-col justify-between"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
            Terminées / Certifiées
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {terminees}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            Compétences validées
          </div>
        </div>

        <div
          className="p-3.5 rounded-lg border flex flex-col justify-between"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="text-xs font-semibold text-purple-600 uppercase tracking-wider">
            Budget Investi
          </div>
          <div className="text-xl font-black text-purple-600 mt-1">
            {budgetInvesti.toLocaleString("fr-FR").replace(/[\u202F\u00A0]/g, " ")} DA
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            Coût catalogue cumulé
          </div>
        </div>
      </div>

      {/* 3. SEGMENTED TABS ODOO */}
      <div
        className="flex items-center gap-1 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("inscriptions")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === "inscriptions"
              ? "border-indigo-600 text-indigo-600 bg-indigo-50/40"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <IconGraduation size={15} />
          <span>Sessions & Inscriptions ({inscriptions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("catalogue")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === "catalogue"
              ? "border-indigo-600 text-indigo-600 bg-indigo-50/40"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <IconFileText size={15} />
          <span>Catalogue des Formations ({catalogue.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("salaries")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === "salaries"
              ? "border-indigo-600 text-indigo-600 bg-indigo-50/40"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <IconUser size={15} />
          <span>Vue par Salarié ({salaries.length})</span>
        </button>
      </div>

      {/* ONGLET 1 : SESSIONS & INSCRIPTIONS */}
      {activeTab === "inscriptions" && (
        <div className="flex flex-col gap-3">
          {/* Status Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-muted-foreground font-medium mr-1">Statut :</span>
            {["Tous", "En cours", "Prévue", "Terminée", "Annulée"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatut(st)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                  filterStatut === st
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {inscriptionsFiltrees.length === 0 ? (
            <div
              className="p-12 text-center rounded-lg border border-dashed text-muted-foreground"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              <IconGraduation size={32} className="mx-auto mb-2 opacity-40 text-purple-600" />
              <p className="font-semibold text-sm">Aucune inscription ne correspond aux critères.</p>
              <p className="text-xs mt-1">Inscrivez un collaborateur via le bouton en haut à droite.</p>
            </div>
          ) : (
            <div
              className="rounded-lg border overflow-hidden shadow-sm"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr
                      className="border-b text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
                      style={{ background: "var(--bg-subtle, rgba(0,0,0,0.02))", borderColor: "var(--border)" }}
                    >
                      <th className="py-2.5 px-3">Collaborateur</th>
                      <th className="py-2.5 px-3">Formation</th>
                      <th className="py-2.5 px-3">Organisme & Thème</th>
                      <th className="py-2.5 px-3">Date Début</th>
                      <th className="py-2.5 px-3">Durée / Coût</th>
                      <th className="py-2.5 px-3 text-center">Statut</th>
                      <th className="py-2.5 px-3 text-right">Actions Odoo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                    {inscriptionsFiltrees.map((item) => {
                      const statutColors: Record<string, string> = {
                        "Terminée": "bg-emerald-50 text-emerald-700 border-emerald-200",
                        "En cours": "bg-blue-50 text-blue-700 border-blue-200",
                        "Prévue": "bg-amber-50 text-amber-700 border-amber-200",
                        "Annulée": "bg-slate-100 text-slate-600 border-slate-200",
                      };
                      const badgeClass = statutColors[item.statut] || "bg-slate-100 text-slate-700 border-slate-200";

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50/60 transition-colors"
                        >
                          <td className="py-2.5 px-3">
                            <Link
                              href={`/salaries/${item.salarie_id}`}
                              className="font-bold hover:underline flex items-center gap-1.5"
                              style={{ color: "var(--text)" }}
                            >
                              <span>{item.salaries?.nom_prenom || `Salarié #${item.salarie_id}`}</span>
                            </Link>
                            <div className="text-[11px] text-muted-foreground">
                              {item.salaries?.matricule ? `Matr. ${item.salaries.matricule}` : ""}
                              {item.salaries?.fonction ? ` • ${item.salaries.fonction}` : ""}
                            </div>
                          </td>

                          <td className="py-2.5 px-3 font-semibold">
                            {item.formations?.titre || `Formation #${item.formation_id}`}
                          </td>

                          <td className="py-2.5 px-3 text-muted-foreground">
                            <div>{item.formations?.organisme || "—"}</div>
                            <div className="text-[11px] text-slate-500">{item.formations?.theme}</div>
                          </td>

                          <td className="py-2.5 px-3 font-medium">
                            {item.date_debut ? item.date_debut.split("-").reverse().join("/") : "—"}
                          </td>

                          <td className="py-2.5 px-3">
                            <span className="font-semibold">{item.formations?.duree_jours || 0} j</span>
                            <div className="text-[11px] text-muted-foreground">
                              {(item.formations?.prix_da || 0).toLocaleString("fr-FR").replace(/[\u202F\u00A0]/g, " ")} DA
                            </div>
                          </td>

                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold border ${badgeClass}`}
                            >
                              {item.statut}
                            </span>
                          </td>

                          <td className="py-2.5 px-3 text-right">
                            <div className="inline-flex items-center gap-1">
                              {item.statut !== "Terminée" && (
                                <button
                                  type="button"
                                  disabled={isPending}
                                  onClick={() => handleChangerStatut(item.id, "Terminée")}
                                  className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-[11px] transition-colors"
                                  title="Marquer comme terminée"
                                >
                                  ✓ Terminer
                                </button>
                              )}
                              {item.statut !== "Annulée" && item.statut !== "Terminée" && (
                                <button
                                  type="button"
                                  disabled={isPending}
                                  onClick={() => handleChangerStatut(item.id, "Annulée")}
                                  className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors"
                                  title="Annuler"
                                >
                                  Annuler
                                </button>
                              )}
                              <a
                                href={`/salaries/${item.salarie_id}/formations/pdf-evaluation`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-1 rounded bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-[11px] transition-colors inline-flex items-center gap-1"
                                title="Imprimer la Fiche d'Évaluation PDF"
                              >
                                <IconFileText size={12} />
                                <span>Évaluation PDF</span>
                              </a>
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => handleSupprimer(item.id)}
                                className="p-1 rounded text-red-600 hover:bg-red-50 transition-colors"
                                title="Supprimer"
                              >
                                <IconTrash size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ONGLET 2 : CATALOGUE DES FORMATIONS */}
      {activeTab === "catalogue" && (
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              Modules et programmes de formation enregistrés pour l&apos;entreprise ({catalogueFiltre.length})
            </span>
            <button
              type="button"
              onClick={() => setShowModalFormation(true)}
              className="btn btn-secondary btn-sm text-xs font-semibold"
            >
              + Nouveau module
            </button>
          </div>

          {catalogueFiltre.length === 0 ? (
            <div
              className="p-12 text-center rounded-lg border border-dashed text-muted-foreground"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              <p className="font-semibold text-sm">Le catalogue est actuellement vide.</p>
              <p className="text-xs mt-1">Créez votre première formation via le bouton ci-dessus.</p>
            </div>
          ) : (
            <div
              className="rounded-lg border overflow-hidden shadow-sm"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr
                      className="border-b text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
                      style={{ background: "var(--bg-subtle, rgba(0,0,0,0.02))", borderColor: "var(--border)" }}
                    >
                      <th className="py-2.5 px-3">Titre de la Formation</th>
                      <th className="py-2.5 px-3">Thème / Domaine</th>
                      <th className="py-2.5 px-3">Organisme Formateur</th>
                      <th className="py-2.5 px-3">Durée</th>
                      <th className="py-2.5 px-3">Coût Unitaire (DA)</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                    {catalogueFiltre.map((f) => (
                      <tr key={f.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 px-3 font-bold" style={{ color: "var(--text)" }}>
                          {f.titre}
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                            {f.theme || "Général"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">
                          {f.organisme || "Interne"}
                        </td>
                        <td className="py-2.5 px-3 font-semibold">
                          {f.duree_jours} jour(s)
                        </td>
                        <td className="py-2.5 px-3 font-bold text-purple-700">
                          {f.prix_da.toLocaleString("fr-FR").replace(/[\u202F\u00A0]/g, " ")} DA
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setPreselectedFormationId(f.id);
                              setShowModalInscription(true);
                            }}
                            className="px-2.5 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-[11px] transition-colors"
                          >
                            + Inscrire
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ONGLET 3 : VUE PAR SALARIE */}
      {activeTab === "salaries" && (
        <div className="odoo-kanban-grid">
          {salaries.map((s) => {
            const inscriptionsSalarie = inscriptions.filter((i) => i.salarie_id === s.id);
            const enCours = inscriptionsSalarie.filter(
              (i) => i.statut === "En cours" || i.statut === "Prévue"
            ).length;

            return (
              <div
                key={s.id}
                className="p-4 rounded-lg border transition-all hover:shadow-md flex flex-col justify-between"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <Link
                        href={`/salaries/${s.id}`}
                        className="font-bold text-sm hover:underline block"
                        style={{ color: "var(--text)" }}
                      >
                        {s.nom_prenom}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {s.fonction || "Poste non renseigné"}
                      </span>
                    </div>
                    {enCours > 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {enCours} active(s)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                        {inscriptionsSalarie.length} totale(s)
                      </span>
                    )}
                  </div>

                  <div className="text-xs space-y-1 my-3 text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Matricule :</span>
                      <strong className="text-foreground">{s.matricule || "—"}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Formations suivies :</span>
                      <strong className="text-foreground">{inscriptionsSalarie.length}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                  <Link
                    href={`/salaries/${s.id}/formations`}
                    className="btn btn-secondary btn-sm text-xs font-semibold flex-1 text-center justify-center"
                  >
                    Dossier Formation →
                  </Link>
                  <a
                    href={`/salaries/${s.id}/formations/pdf-evaluation`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded hover:bg-slate-100 text-purple-700 transition-colors"
                    title="Fiche d'Évaluation PDF"
                  >
                    <IconFileText size={16} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1 : INSCRIRE UN SALARIE */}
      {showModalInscription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div
            className="w-full max-w-lg rounded-xl border p-6 shadow-xl relative"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between border-b pb-3 mb-4" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2 font-bold text-base" style={{ color: "var(--text)" }}>
                <IconGraduation size={20} className="text-indigo-600" />
                <span>Inscrire un collaborateur à une formation</span>
              </div>
              <button
                type="button"
                onClick={() => setShowModalInscription(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreerInscription} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Collaborateur *</label>
                <select
                  name="salarie_id"
                  required
                  className="w-full p-2 rounded border bg-transparent font-medium"
                  style={{ borderColor: "var(--border)" }}
                >
                  <option value="">Sélectionner un salarié…</option>
                  {salaries.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nom_prenom} {s.matricule ? `(${s.matricule})` : ""} — {s.fonction || "Employé"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Module de formation *</label>
                <select
                  name="formation_id"
                  required
                  defaultValue={preselectedFormationId || ""}
                  className="w-full p-2 rounded border bg-transparent font-medium"
                  style={{ borderColor: "var(--border)" }}
                >
                  <option value="">Sélectionner un module du catalogue…</option>
                  {catalogue.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.titre} ({f.organisme || "Interne"} - {f.duree_jours}j - {f.prix_da} DA)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Date de début *</label>
                  <input
                    type="date"
                    name="date_debut"
                    required
                    defaultValue={new Date().toISOString().split("T")[0]}
                    className="w-full p-2 rounded border bg-transparent font-medium"
                    style={{ borderColor: "var(--border)" }}
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Statut initial</label>
                  <select
                    name="statut"
                    defaultValue="Prévue"
                    className="w-full p-2 rounded border bg-transparent font-medium"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <option value="Prévue">Prévue</option>
                    <option value="En cours">En cours</option>
                    <option value="Terminée">Terminée</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                <button
                  type="button"
                  onClick={() => setShowModalInscription(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn btn-primary btn-sm"
                >
                  {isPending ? "Enregistrement…" : "Confirmer l'inscription"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2 : NOUVEAU MODULE AU CATALOGUE */}
      {showModalFormation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div
            className="w-full max-w-lg rounded-xl border p-6 shadow-xl relative"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between border-b pb-3 mb-4" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2 font-bold text-base" style={{ color: "var(--text)" }}>
                <IconFileText size={20} className="text-purple-600" />
                <span>Nouveau module de formation au catalogue</span>
              </div>
              <button
                type="button"
                onClick={() => setShowModalFormation(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreerFormation} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Intitulé de la formation *</label>
                <input
                  type="text"
                  name="titre"
                  required
                  placeholder="ex: Sécurité industrielle, Management d'équipe, Excel Avancé"
                  className="w-full p-2 rounded border bg-transparent font-medium"
                  style={{ borderColor: "var(--border)" }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Thème / Domaine</label>
                  <input
                    type="text"
                    name="theme"
                    placeholder="ex: Technique, RH, Finance, HSE"
                    className="w-full p-2 rounded border bg-transparent font-medium"
                    style={{ borderColor: "var(--border)" }}
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Organisme formateur</label>
                  <input
                    type="text"
                    name="organisme"
                    placeholder="ex: INPED, IAP, Interne, etc."
                    className="w-full p-2 rounded border bg-transparent font-medium"
                    style={{ borderColor: "var(--border)" }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Durée en jours</label>
                  <input
                    type="number"
                    name="duree_jours"
                    min="1"
                    defaultValue="3"
                    className="w-full p-2 rounded border bg-transparent font-medium"
                    style={{ borderColor: "var(--border)" }}
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Prix unitaire (DA)</label>
                  <input
                    type="number"
                    name="prix_da"
                    min="0"
                    step="100"
                    defaultValue="25000"
                    className="w-full p-2 rounded border bg-transparent font-medium"
                    style={{ borderColor: "var(--border)" }}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                <button
                  type="button"
                  onClick={() => setShowModalFormation(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn btn-primary btn-sm"
                >
                  {isPending ? "Création…" : "Ajouter au catalogue"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
