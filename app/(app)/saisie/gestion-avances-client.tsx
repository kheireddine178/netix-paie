"use client";

import React, { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { listerToutesAvances, changerStatutAvance, type AvanceSalaireRow } from "../salaries/actions";
import OdooSubNav from "@/components/odoo/OdooSubNav";
import OdooControlPanel from "@/components/odoo/OdooControlPanel";

export default function GestionAvancesClient() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [avances, setAvances] = useState<AvanceSalaireRow[]>([]);
  const [chargement, setChargement] = useState(true);
  const [filterStatut, setFilterStatut] = useState<"all" | "attente" | "approuvee" | "rejetee">("all");

  useEffect(() => {
    listerToutesAvances().then((data) => {
      setAvances(data);
      setChargement(false);
    });
  }, []);

  const handleChangerStatut = async (id: number, statut: string) => {
    startTransition(async () => {
      try {
        await changerStatutAvance(id, statut);
        const data = await listerToutesAvances();
        setAvances(data);
        router.refresh();
      } catch (err) {
        alert("Erreur lors de la modification du statut.");
      }
    });
  };

  const enAttenteCount = avances.filter((a) => a.statut === "En attente").length;
  const filteredAvances = avances.filter((a) => {
    if (filterStatut === "attente") return a.statut === "En attente";
    if (filterStatut === "approuvee") return a.statut === "Approuvée";
    if (filterStatut === "rejetee") return a.statut === "Rejetée";
    return true;
  });

  return (
    <div className="flex flex-col gap-4">
      {/* 0. ODOO SUBNAV TABS */}
      <OdooSubNav
        items={[
          { label: "👤 Saisie individuelle", href: "/saisie" },
          { label: "📊 Grille collective en masse", href: "/saisie/collective" },
          { label: "💳 Acomptes & Avances", href: "/saisie/avances" },
        ]}
      />

      {/* 1. ODOO CONTROL PANEL */}
      <OdooControlPanel
        breadcrumbs={[
          { label: "Saisie Mensuelle", href: "/saisie" },
          { label: "Gestion des Avances & Acomptes" },
        ]}
        filters={[
          {
            id: "all",
            label: "Toutes",
            active: filterStatut === "all",
            onClick: () => setFilterStatut("all"),
          },
          {
            id: "attente",
            label: `À valider (${enAttenteCount})`,
            active: filterStatut === "attente",
            onClick: () => setFilterStatut("attente"),
          },
          {
            id: "approuvee",
            label: "Approuvées",
            active: filterStatut === "approuvee",
            onClick: () => setFilterStatut("approuvee"),
          },
          {
            id: "rejetee",
            label: "Rejetées",
            active: filterStatut === "rejetee",
            onClick: () => setFilterStatut("rejetee"),
          },
        ]}
        secondaryActions={[
          {
            label: "← Saisie individuelle",
            href: "/saisie",
          },
          {
            label: "Grille collective",
            href: "/saisie/collective",
          },
        ]}
        extraRight={
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700">
            {enAttenteCount > 0 ? `⚠️ ${enAttenteCount} en attente` : "✓ Tout est à jour"}
          </span>
        }
      />

      {/* 2. TABLE DES AVANCES */}
      {chargement ? (
        <div className="p-8 text-center text-xs text-muted-foreground">
          Chargement des demandes d&apos;avances…
        </div>
      ) : filteredAvances.length === 0 ? (
        <div
          className="p-12 text-center rounded-lg border border-dashed text-xs text-muted-foreground"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          Aucune demande d&apos;acompte trouvée pour ce filtre.
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
                <th className="py-2.5 px-3 font-bold w-24">Période</th>
                <th className="py-2.5 px-3 font-bold w-36 text-right">Montant demandé</th>
                <th className="py-2.5 px-3 font-bold">Motif</th>
                <th className="py-2.5 px-3 font-bold w-28">Date</th>
                <th className="py-2.5 px-3 font-bold w-28 text-center">Statut</th>
                <th className="py-2.5 px-3 font-bold w-40 text-right">Décision RH</th>
              </tr>
            </thead>
            <tbody>
              {filteredAvances.map((a) => (
                <tr
                  key={a.id}
                  className="border-b transition-colors hover:bg-slate-50/70"
                  style={{ borderColor: "var(--border-soft)" }}
                >
                  <td className="py-2.5 px-3 font-semibold" style={{ color: "var(--text)" }}>
                    {a.salaries?.nom_prenom || `Salarié #${a.salarie_id}`}
                  </td>
                  <td className="py-2.5 px-3 font-mono">
                    {String(a.mois).padStart(2, "0")}/{a.annee}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold" style={{ color: "var(--accent)" }}>
                    {a.montant.toLocaleString("fr-FR").replace(/[\u202F\u00A0]/g, " ")} DA
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground">
                    {a.motif || "—"}
                  </td>
                  <td className="py-2.5 px-3 text-[11px] text-muted-foreground">
                    {new Date(a.cree_le).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        a.statut === "Approuvée"
                          ? "bg-teal-100 text-teal-800"
                          : a.statut === "Rejetée"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {a.statut}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {a.statut === "En attente" ? (
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleChangerStatut(a.id, "Approuvée")}
                          className="btn btn-primary btn-sm text-[11px] py-1 px-2.5 bg-teal-600 hover:bg-teal-700"
                        >
                          ✓ Valider
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleChangerStatut(a.id, "Rejetée")}
                          className="btn btn-secondary btn-sm text-[11px] py-1 px-2 text-red-600 hover:bg-red-50"
                        >
                          ✕ Refuser
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-muted-foreground italic">Traitée</span>
                    )}
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
