"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconCalculator,
  IconFileText,
  IconTrash,
  IconSearch,
  IconUser,
  IconCalendar,
} from "@/components/Icons";
import OdooControlPanel from "@/components/odoo/OdooControlPanel";
import {
  type BulletinGlobalItem,
  type Salarie,
  supprimerBulletin,
} from "../salaries/actions";

const NOMS_MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

interface Props {
  bulletins: BulletinGlobalItem[];
  salaries: Salarie[];
}

export default function JournalBulletinsClient({ bulletins, salaries }: Props) {
  const router = useRouter();
  const now = new Date();
  const [selectedMois, setSelectedMois] = useState<number | "tous">("tous");
  const [selectedAnnee, setSelectedAnnee] = useState<number | "tous">("tous");
  const [filterStatut, setFilterStatut] = useState<string>("Tous");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  // Distinct years in bulletins
  const anneesDisponibles = Array.from(
    new Set(bulletins.map((b) => b.annee))
  ).sort((a, b) => b - a);
  if (anneesDisponibles.length === 0) {
    anneesDisponibles.push(now.getFullYear());
  }

  // Filtrage
  const bulletinsFiltres = bulletins.filter((b) => {
    if (selectedAnnee !== "tous" && b.annee !== selectedAnnee) return false;
    if (selectedMois !== "tous" && b.mois !== selectedMois) return false;
    if (filterStatut !== "Tous" && (b.statut || "Calculé") !== filterStatut) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNom = b.salaries?.nom_prenom.toLowerCase().includes(q);
      const matchMatricule = b.salaries?.matricule?.toLowerCase().includes(q);
      if (!matchNom && !matchMatricule) return false;
    }
    return true;
  });

  // KPI Calculations
  const totalMasseNette = bulletinsFiltres.reduce((sum, b) => sum + (b.net_a_payer || 0), 0);
  const totalRetenueSS = bulletinsFiltres.reduce((sum, b) => sum + (b.retenue_ss || 0), 0);
  const totalIRG = bulletinsFiltres.reduce((sum, b) => sum + (b.irg || 0), 0);
  const totalBulletins = bulletinsFiltres.length;

  const handleSupprimerBulletin = (salarieId: number, bulletinId: number, mois: number, annee: number) => {
    if (
      !confirm(
        `Supprimer définitivement ce bulletin de ${NOMS_MOIS[mois - 1]} ${annee} ?\n\nCette action est irréversible.`
      )
    ) {
      return;
    }

    startTransition(async () => {
      try {
        await supprimerBulletin(salarieId, bulletinId);
        router.refresh();
      } catch (err: any) {
        alert(err.message || "Erreur lors de la suppression");
      }
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 1. ODOO CONTROL PANEL */}
      <OdooControlPanel
        breadcrumbs={[{ label: "Journal Général des Bulletins de Paie" }]}
        primaryAction={{
          label: "💰 Nouvelle saisie de paie",
          href: "/saisie",
        }}
        secondaryActions={[
          {
            label: "📊 Rapports & G50",
            href: "/rapports",
          },
          {
            label: "👥 Collaborateurs",
            href: "/salaries",
          },
        ]}
        searchPlaceholder="Rechercher par salarié ou matricule…"
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* 2. BARRE DE FILTRES ODOO & PERIODE */}
      <div
        className="p-3.5 rounded-lg border flex flex-wrap items-center justify-between gap-3 text-xs"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-muted-foreground">Année :</span>
            <select
              value={selectedAnnee}
              onChange={(e) =>
                setSelectedAnnee(e.target.value === "tous" ? "tous" : parseInt(e.target.value, 10))
              }
              className="p-1.5 rounded border bg-transparent font-medium"
              style={{ borderColor: "var(--border)" }}
            >
              <option value="tous">Toutes les années</option>
              {anneesDisponibles.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-muted-foreground">Mois :</span>
            <select
              value={selectedMois}
              onChange={(e) =>
                setSelectedMois(e.target.value === "tous" ? "tous" : parseInt(e.target.value, 10))
              }
              className="p-1.5 rounded border bg-transparent font-medium"
              style={{ borderColor: "var(--border)" }}
            >
              <option value="tous">Tous les mois</option>
              {NOMS_MOIS.map((m, idx) => (
                <option key={m} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 border-l pl-3" style={{ borderColor: "var(--border)" }}>
            <span className="font-semibold text-muted-foreground mr-1">Statut :</span>
            {["Tous", "Calculé", "Validé", "Clôturé"].map((st) => (
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
        </div>

        <div className="text-xs text-muted-foreground">
          <strong>{bulletinsFiltres.length}</strong> bulletin(s) affiché(s)
        </div>
      </div>

      {/* 3. KPI RIBBON ODOO */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div
          className="p-3.5 rounded-lg border flex flex-col justify-between"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
            Masse Salariale Nette
          </div>
          <div className="text-xl font-black text-emerald-700 mt-1">
            {totalMasseNette.toLocaleString("fr-FR").replace(/[\u202F\u00A0]/g, " ")} DA
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            Total Net à payer filtré
          </div>
        </div>

        <div
          className="p-3.5 rounded-lg border flex flex-col justify-between"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
            Cotisations CNAS (9%)
          </div>
          <div className="text-xl font-black text-blue-700 mt-1">
            {totalRetenueSS.toLocaleString("fr-FR").replace(/[\u202F\u00A0]/g, " ")} DA
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            Retenues Sécurité Sociale
          </div>
        </div>

        <div
          className="p-3.5 rounded-lg border flex flex-col justify-between"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="text-xs font-semibold text-purple-700 uppercase tracking-wider">
            Impôt IRG Précompté
          </div>
          <div className="text-xl font-black text-purple-700 mt-1">
            {totalIRG.toLocaleString("fr-FR").replace(/[\u202F\u00A0]/g, " ")} DA
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            Retenue fiscale à la source
          </div>
        </div>

        <div
          className="p-3.5 rounded-lg border flex flex-col justify-between"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Nombre de Bulletins
          </div>
          <div className="text-2xl font-black mt-1" style={{ color: "var(--text)" }}>
            {totalBulletins}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            Période sélectionnée
          </div>
        </div>
      </div>

      {/* 4. TABLEAU DU JOURNAL DES BULLETINS */}
      {bulletinsFiltres.length === 0 ? (
        <div
          className="p-12 text-center rounded-lg border border-dashed text-muted-foreground"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <IconCalculator size={32} className="mx-auto mb-2 opacity-40 text-emerald-600" />
          <p className="font-semibold text-sm">Aucun bulletin ne correspond aux critères sélectionnés.</p>
          <p className="text-xs mt-1">
            Effectuez une saisie de paie depuis le module{" "}
            <Link href="/saisie" className="font-semibold text-indigo-600 hover:underline">
              Saisie mensuelle
            </Link>.
          </p>
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
                  <th className="py-2.5 px-3">Période</th>
                  <th className="py-2.5 px-3 text-right">Salaire Base</th>
                  <th className="py-2.5 px-3 text-right">Salaire Poste</th>
                  <th className="py-2.5 px-3 text-right">CNAS (9%)</th>
                  <th className="py-2.5 px-3 text-right">IRG</th>
                  <th className="py-2.5 px-3 text-right">Net à Payer</th>
                  <th className="py-2.5 px-3 text-center">Statut</th>
                  <th className="py-2.5 px-3 text-right">Actions Odoo</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                {bulletinsFiltres.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3">
                      <Link
                        href={`/salaries/${b.salarie_id}`}
                        className="font-bold hover:underline flex items-center gap-1.5"
                        style={{ color: "var(--text)" }}
                      >
                        <span>{b.salaries?.nom_prenom || `Salarié #${b.salarie_id}`}</span>
                      </Link>
                      <div className="text-[11px] text-muted-foreground">
                        {b.salaries?.matricule ? `Matr. ${b.salaries.matricule}` : ""}
                        {b.salaries?.fonction ? ` • ${b.salaries.fonction}` : ""}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 font-semibold whitespace-nowrap">
                      {NOMS_MOIS[b.mois - 1]} {b.annee}
                    </td>

                    <td className="py-2.5 px-3 text-right text-muted-foreground whitespace-nowrap">
                      {b.salaire_base_reel.toLocaleString("fr-FR").replace(/[\u202F\u00A0]/g, " ")} DA
                    </td>

                    <td className="py-2.5 px-3 text-right font-medium whitespace-nowrap">
                      {b.salaire_poste.toLocaleString("fr-FR").replace(/[\u202F\u00A0]/g, " ")} DA
                    </td>

                    <td className="py-2.5 px-3 text-right text-blue-700 font-medium whitespace-nowrap">
                      {b.retenue_ss.toLocaleString("fr-FR").replace(/[\u202F\u00A0]/g, " ")} DA
                    </td>

                    <td className="py-2.5 px-3 text-right text-purple-700 font-medium whitespace-nowrap">
                      {b.irg.toLocaleString("fr-FR").replace(/[\u202F\u00A0]/g, " ")} DA
                    </td>

                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <span className="inline-block px-2.5 py-1 rounded font-bold text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {b.net_a_payer.toLocaleString("fr-FR").replace(/[\u202F\u00A0]/g, " ")} DA
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                          b.statut === "Clôturé"
                            ? "bg-slate-100 text-slate-700 border-slate-300"
                            : b.statut === "Validé"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}
                      >
                        {b.statut || "Calculé"}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <Link
                          href={`/salaries/${b.salarie_id}/bulletin/explication?annee=${b.annee}&mois=${b.mois}`}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors"
                          title="Détail du calcul"
                        >
                          Explication
                        </Link>
                        <a
                          href={`/salaries/${b.salarie_id}/bulletin/pdf?annee=${b.annee}&mois=${b.mois}&variante=salarie`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-[11px] transition-colors inline-flex items-center gap-1"
                          title="Bulletin PDF Salarié"
                        >
                          <IconFileText size={12} />
                          <span>PDF</span>
                        </a>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleSupprimerBulletin(b.salarie_id, b.id, b.mois, b.annee)}
                          className="p-1 rounded text-red-600 hover:bg-red-50 transition-colors"
                          title="Supprimer ce bulletin"
                        >
                          <IconTrash size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. ACCES DIRECT PAR COLLABORATEUR */}
      <div
        className="p-4 rounded-lg border text-xs"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="font-bold text-sm mb-2 flex items-center gap-1.5" style={{ color: "var(--text)" }}>
          <IconUser size={16} />
          <span>Accès direct à l&apos;historique complet d&apos;un salarié</span>
        </div>
        <p className="text-muted-foreground mb-3">
          Consultez l&apos;évolution salariale et l&apos;historique pluriannuel d&apos;un collaborateur spécifique :
        </p>
        <div className="flex flex-wrap gap-2">
          {salaries.map((s) => (
            <Link
              key={s.id}
              href={`/salaries/${s.id}/historique`}
              className="px-2.5 py-1.5 rounded border hover:border-indigo-400 hover:bg-indigo-50/40 text-xs font-semibold transition-all flex items-center gap-1"
              style={{ borderColor: "var(--border)" }}
            >
              <span>{s.nom_prenom}</span>
              {s.matricule && <span className="text-muted-foreground text-[10px]">({s.matricule})</span>}
              <span className="text-indigo-600">→</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
