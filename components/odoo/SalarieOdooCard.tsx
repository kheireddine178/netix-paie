"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type Salarie, desactiverSalarie, reactiverSalarie, supprimerSalarieDefinitif } from "@/app/(app)/salaries/actions";

interface Props {
  salarie: Salarie;
}

export default function SalarieOdooCard({ salarie }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [menuOpen, setMenuOpen] = useState(false);

  // Initiales pour l'avatar
  const initials = (salarie.nom_prenom || "Collaborateur")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleDesactiver = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(false);
    if (!confirm(`Désactiver ${salarie.nom_prenom} ?\nSon historique de paie sera conservé.`)) return;
    startTransition(async () => {
      await desactiverSalarie(salarie.id);
      router.refresh();
    });
  };

  const handleReactiver = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(false);
    startTransition(async () => {
      await reactiverSalarie(salarie.id);
      router.refresh();
    });
  };

  const handleSupprimer = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(false);
    if (
      !confirm(
        `SUPPRESSION DÉFINITIVE\n\nÊtes-vous sûr de vouloir supprimer définitivement ${salarie.nom_prenom} et tous ses bulletins ?\nCette action est irréversible.`
      )
    )
      return;
    startTransition(async () => {
      await supprimerSalarieDefinitif(salarie.id);
      router.refresh();
    });
  };

  return (
    <div
      onClick={() => router.push(`/salaries/${salarie.id}`)}
      className="group relative rounded-xl border p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      <div>
        {/* Top Header: Avatar + Nom + Menu ⋮ */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar avec pastille de présence Odoo */}
            <div className="relative shrink-0">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xs shadow-xs select-none"
                style={{
                  background: salarie.actif ? "var(--accent-bg)" : "var(--surface-2)",
                  color: salarie.actif ? "var(--accent)" : "var(--text-muted)",
                  border: "1px solid var(--border)",
                }}
              >
                {initials}
              </div>
              {/* Pastille de présence (vert pour actif, gris pour inactif) */}
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                  salarie.actif ? "bg-emerald-500" : "bg-gray-400"
                }`}
                title={salarie.actif ? "Collaborateur actif" : "Collaborateur inactif"}
              />
            </div>

            {/* Identité */}
            <div className="min-w-0 flex flex-col">
              <h3
                className="text-sm font-bold truncate group-hover:text-purple-900 dark:group-hover:text-purple-300 transition-colors m-0"
                style={{ color: "var(--text)" }}
              >
                {salarie.nom_prenom}
              </h3>
              <span className="text-xs text-muted-foreground truncate font-medium mt-0.5">
                {salarie.fonction || "Poste non renseigné"}
              </span>
            </div>
          </div>

          {/* Badge statut et menu d'options contextuel ⋮ */}
          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                salarie.actif
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-slate-100 text-slate-600 border-slate-200"
              }`}
            >
              {salarie.actif ? "Actif" : "Inactif"}
            </span>

            {/* Menu 3 petits points Odoo */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen((prev) => !prev);
                }}
                className="w-7 h-7 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer text-sm font-bold"
                title="Options du collaborateur"
                aria-label="Options du collaborateur"
              >
                ⋮
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                    }}
                  />
                  <div
                    className="absolute right-0 top-8 z-50 w-44 rounded-lg border bg-white dark:bg-slate-900 shadow-xl py-1 text-xs"
                    style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link
                      href={`/salaries/${salarie.id}`}
                      className="block px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium"
                      style={{ color: "var(--text)" }}
                    >
                      Dossier complet
                    </Link>
                    <Link
                      href={`/salaries/${salarie.id}/modifier`}
                      className="block px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium"
                      style={{ color: "var(--text)" }}
                    >
                      Modifier la fiche
                    </Link>
                    <Link
                      href={`/saisie?salarieId=${salarie.id}`}
                      className="block px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium text-purple-700 dark:text-purple-300"
                    >
                      Calculer la paie
                    </Link>
                    <div className="border-t my-1" style={{ borderColor: "var(--border)" }} />
                    {salarie.actif ? (
                      <button
                        type="button"
                        onClick={handleDesactiver}
                        disabled={isPending}
                        className="w-full text-left px-3 py-1.5 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-700 font-medium cursor-pointer"
                      >
                        Désactiver
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleReactiver}
                        disabled={isPending}
                        className="w-full text-left px-3 py-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-700 font-medium cursor-pointer"
                      >
                        Réactiver
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleSupprimer}
                      disabled={isPending}
                      className="w-full text-left px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 font-medium cursor-pointer"
                    >
                      Supprimer
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Informations Métier Odoo */}
        <div
          className="mt-3.5 pt-3 border-t grid grid-cols-2 gap-2 text-xs"
          style={{ borderColor: "var(--border-soft)" }}
        >
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
              Matricule
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {salarie.matricule || "—"}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
              Salaire Base
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {(salarie.salaire_base_theorique || 0).toLocaleString("fr-FR").replace(/[\u202F\u00A0]/g, " ")} DA
            </span>
          </div>
        </div>
      </div>

      {/* Pied de Carte Odoo : Actions discrètes */}
      <div
        className="mt-3.5 pt-2.5 border-t flex items-center justify-between text-xs"
        style={{ borderColor: "var(--border-soft)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <Link
          href={`/saisie?salarieId=${salarie.id}`}
          className="inline-flex items-center gap-1 font-semibold text-[11px] px-2.5 py-1 rounded transition-colors"
          style={{
            background: "var(--accent-bg)",
            color: "var(--accent)",
          }}
        >
          <span>💰 Paie du mois</span>
        </Link>

        <Link
          href={`/salaries/${salarie.id}`}
          className="text-[11px] font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
        >
          <span>Fiche RH →</span>
        </Link>
      </div>
    </div>
  );
}
