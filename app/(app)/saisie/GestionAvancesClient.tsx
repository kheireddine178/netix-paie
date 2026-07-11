"use client";

import React, { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { listerToutesAvances, changerStatutAvance, type AvanceSalaireRow } from "../salaries/actions";

export default function GestionAvancesClient() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [avances, setAvances] = useState<AvanceSalaireRow[]>([]);
  const [chargement, setChargement] = useState(true);

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

  if (chargement) {
    return <p style={{ color: "var(--text-muted)", fontSize: "var(--tsm)" }}>Chargement des demandes d'avances...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1>Validation des Avances sur Salaire</h1>
        <p>Gérez, approuvez ou rejetez les demandes d'acompte soumises par les salariés.</p>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: "var(--s3)" }}>Demandes en attente et historique</h3>
        {avances.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "var(--tsm)" }}>Aucune demande d'avance enregistrée.</p>
        ) : (
          <div className="table-wrap">
            <table style={{ width: "100%", fontSize: "var(--tsm)" }}>
              <thead>
                <tr style={{ background: "var(--surface-2)" }}>
                  <th>Collaborateur</th>
                  <th>Période visée</th>
                  <th>Montant demandé</th>
                  <th>Motif</th>
                  <th>Date de demande</th>
                  <th>Statut</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {avances.map((a) => (
                  <tr key={a.id} style={{ borderBottom: "1px solid var(--border-soft)" }}>
                    <td style={{ fontWeight: "bold" }}>{a.salaries?.nom_prenom}</td>
                    <td>{String(a.mois).padStart(2, "0")}/{a.annee}</td>
                    <td style={{ fontWeight: "bold", color: "var(--accent)" }}>{a.montant.toLocaleString("fr-FR")} DA</td>
                    <td>{a.motif || "—"}</td>
                    <td style={{ fontSize: "var(--t2xs)", color: "var(--text-muted)" }}>
                      {new Date(a.cree_le).toLocaleDateString("fr-FR")}
                    </td>
                    <td>
                      <span className={`badge ${
                        a.statut === "Approuvée"
                          ? "badge-teal"
                          : a.statut === "Rejetée"
                          ? "badge-red"
                          : "badge-accent"
                      }`}>
                        {a.statut}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {a.statut === "En attente" && (
                        <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                          <button
                            disabled={isPending}
                            onClick={() => handleChangerStatut(a.id, "Approuvée")}
                            className="btn btn-teal btn-sm"
                            style={{ padding: "4px 8px", fontSize: "10px" }}
                          >
                            ✓ Approuver
                          </button>
                          <button
                            disabled={isPending}
                            onClick={() => handleChangerStatut(a.id, "Rejetée")}
                            className="btn btn-red btn-sm"
                            style={{ padding: "4px 8px", fontSize: "10px" }}
                          >
                            ✕ Rejeter
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
