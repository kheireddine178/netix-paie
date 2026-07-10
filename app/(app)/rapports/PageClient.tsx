"use client";

import React, { useState, useTransition } from "react";
import {
  getCentralisateur,
  getEtatNominatifRubrique,
  type RecapCentralisateur,
  type LigneNominative,
} from "./actions";
import { type RubriqueCatalogue } from "../salaries/actions";

const MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

const NOMS_NATIONAUX: Record<string, string> = {
  R030: "Salaire de base",
  R120: "Heures supplémentaires",
  R100: "I.C.R",
  R110: "I.E.P",
  R200: "Indemnité de nuisance",
  R201: "Prime de responsabilité",
  R202: "Prime de disponibilité",
  R203: "P.R.I",
  R204: "P.R.C",
  R250: "Panier",
  R260: "Autre prime",
  R950: "Retenue sécurité sociale (CNAS)",
  R980: "Retenue IRG",
  R985: "Retenue forfaitaire 10%",
  R995: "Cotisation mutuelle",
  R999: "Autres retenues",
};

export default function PageClient({ catalogue }: { catalogue: RubriqueCatalogue[] }) {
  const now = new Date();
  const [annee, setAnnee] = useState(now.getFullYear());
  const [mois, setMois] = useState(now.getMonth() + 1);
  const [onglet, setOnglet] = useState<"centralisateur" | "nominatif">("centralisateur");
  const [selectedRubrique, setSelectedRubrique] = useState("R030");

  const [recap, setRecap] = useState<RecapCentralisateur | null>(null);
  const [nominatifList, setNominatifList] = useState<LigneNominative[]>([]);
  
  const [isPending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  const formatDA = (val: number) => {
    return val.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " DA";
  };

  const handleGenerer = () => {
    setErreur(null);
    startTransition(async () => {
      try {
        if (onglet === "centralisateur") {
          const res = await getCentralisateur(annee, mois);
          setRecap(res);
        } else {
          const res = await getEtatNominatifRubrique(annee, mois, selectedRubrique);
          setNominatifList(res);
        }
      } catch (e) {
        setErreur(e instanceof Error ? e.message : "Une erreur est survenue");
      }
    });
  };

  const totalNominatif = nominatifList.reduce((acc, l) => acc + l.valeur, 0);

  const codeRubriquesOptions = [
    ...Object.entries(NOMS_NATIONAUX).map(([code, name]) => ({ code, name })),
    ...catalogue.map((c) => ({ code: c.code, name: `${c.code} - ${c.libelle}` })),
  ];

  const printReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print-container">
      {/* Contrôles et Filtres (Masqués à l'impression) */}
      <div className="card no-print">
        <h2 style={{ marginBottom: "var(--s4)" }}>📊 États de Paie & Centralisation</h2>
        
        <div className="grid md:grid-cols-4 gap-4 items-end">
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="annee-sel">Année</label>
            <input
              id="annee-sel"
              type="number"
              value={annee}
              onChange={(e) => setAnnee(parseInt(e.target.value) || now.getFullYear())}
            />
          </div>

          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="mois-sel">Mois</label>
            <select
              id="mois-sel"
              value={mois}
              onChange={(e) => setMois(parseInt(e.target.value))}
            >
              {MOIS.map((m, i) => (
                <option key={i} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="onglet-sel">Type de Rapport</label>
            <select
              id="onglet-sel"
              value={onglet}
              onChange={(e) => {
                setOnglet(e.target.value as any);
                setRecap(null);
                setNominatifList([]);
              }}
            >
              <option value="centralisateur">Centralisateur Général (Mois)</option>
              <option value="nominatif">État nominatif par rubrique</option>
            </select>
          </div>

          <button
            onClick={handleGenerer}
            disabled={isPending}
            className="btn btn-primary"
            style={{ width: "100%", height: "42px" }}
          >
            {isPending ? "Génération..." : "Obtenir l'état"}
          </button>
        </div>

        {onglet === "nominatif" && (
          <div className="grid md:grid-cols-2 gap-4 style-select-rubrique" style={{ marginTop: "var(--s3)" }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="rubrique-sel">Sélectionner la rubrique</label>
              <select
                id="rubrique-sel"
                value={selectedRubrique}
                onChange={(e) => {
                  setSelectedRubrique(e.target.value);
                  setNominatifList([]);
                }}
              >
                {codeRubriquesOptions.map((o) => (
                  <option key={o.code} value={o.code}>
                    {o.code} — {o.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {erreur && (
        <div className="card" style={{ borderLeft: "4px solid var(--red)", color: "var(--red)" }}>
          ⚠️ {erreur}
        </div>
      )}

      {/* Impression Bouton (Masqué à l'impression) */}
      {(recap || nominatifList.length > 0) && (
        <div className="no-print" style={{ display: "flex", justifyContent: "flex-end" }}>
          <button onClick={printReport} className="btn btn-secondary">
            🖨️ Imprimer le rapport
          </button>
        </div>
      )}

      {/* RAPPORTS À IMPRIMER / AFFICHER */}
      
      {/* 1. CENTRALISATEUR */}
      {onglet === "centralisateur" && recap && (
        <div className="card print-report-box" style={{ border: "1px solid var(--border)", padding: "var(--s5)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--s4)" }}>
            <div>
              <h3 style={{ fontSize: "var(--tlg)" }}>CENTRALISATEUR GÉNÉRAL DE LA PAIE</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "var(--tsm)", marginTop: 4 }}>
                Unité : Chaabat El Leham — Période : {MOIS[mois - 1].toUpperCase()} {annee}
              </p>
            </div>
            <div style={{ textAlign: "right", fontSize: "var(--txs)", color: "var(--text-muted)" }}>
              <span>Effectif total : {recap.nombreSalaries} salariés</span>
            </div>
          </div>

          <table className="table" style={{ width: "100%", fontSize: "var(--txs)" }}>
            <thead>
              <tr style={{ background: "var(--surface-2)" }}>
                <th style={{ padding: "8px", textAlign: "left" }}>CODE</th>
                <th style={{ padding: "8px", textAlign: "left" }}>RUBRIQUE</th>
                <th style={{ padding: "8px", textAlign: "right" }}>N/BASE</th>
                <th style={{ padding: "8px", textAlign: "right" }}>GAIN</th>
                <th style={{ padding: "8px", textAlign: "right" }}>RETENUE</th>
                <th style={{ padding: "8px", textAlign: "center" }}>EFF</th>
              </tr>
            </thead>
            <tbody>
              {recap.lignes.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "16px", color: "var(--text-muted)" }}>
                    Aucune paie enregistrée sur ce mois.
                  </td>
                </tr>
              ) : (
                recap.lignes.map((l) => (
                  <tr key={l.code} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "8px", fontWeight: "bold" }}>{l.code}</td>
                    <td style={{ padding: "8px" }}>{l.libelle}</td>
                    <td style={{ padding: "8px", textAlign: "right" }}>{l.n_base > 0 ? formatDA(l.n_base) : ""}</td>
                    <td style={{ padding: "8px", textAlign: "right", color: l.gain > 0 ? "var(--teal)" : "inherit" }}>
                      {l.gain > 0 ? formatDA(l.gain) : ""}
                    </td>
                    <td style={{ padding: "8px", textAlign: "right", color: l.retenue > 0 ? "var(--red)" : "inherit" }}>
                      {l.retenue > 0 ? formatDA(l.retenue) : ""}
                    </td>
                    <td style={{ padding: "8px", textAlign: "center", fontWeight: "bold" }}>{l.eff}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Charges Patronales */}
          {recap.chargesPatronales.length > 0 && (
            <div style={{ marginTop: "var(--s5)" }}>
              <h4 style={{ marginBottom: "var(--s3)", fontSize: "var(--tsm)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Charges Patronales (Employeur)
              </h4>
              <table className="table" style={{ width: "100%", fontSize: "var(--txs)" }}>
                <thead>
                  <tr style={{ background: "var(--surface-2)" }}>
                    <th style={{ padding: "8px", textAlign: "left" }}>CODE</th>
                    <th style={{ padding: "8px", textAlign: "left" }}>LIBELLE</th>
                    <th style={{ padding: "8px", textAlign: "right" }}>BASE ASSIETTE</th>
                    <th style={{ padding: "8px", textAlign: "center" }}>TAUX</th>
                    <th style={{ padding: "8px", textAlign: "right" }}>MONTANT PATRONAL</th>
                  </tr>
                </thead>
                <tbody>
                  {recap.chargesPatronales.map((c) => (
                    <tr key={c.code} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "8px", fontWeight: "bold" }}>{c.code}</td>
                      <td style={{ padding: "8px" }}>{c.libelle}</td>
                      <td style={{ padding: "8px", textAlign: "right" }}>{formatDA(c.n_base)}</td>
                      <td style={{ padding: "8px", textAlign: "center" }}>{c.taux} %</td>
                      <td style={{ padding: "8px", textAlign: "right", color: "var(--red)" }}>{formatDA(c.montant)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Synthèse finale */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--s3)", marginTop: "var(--s5)", borderTop: "2px solid var(--text)", paddingTop: "var(--s3)" }}>
            <div>
              <span style={{ fontSize: "var(--t2xs)", color: "var(--text-muted)", textTransform: "uppercase" }}>TOTAL GAINS SALARIÉS</span>
              <p style={{ fontSize: "var(--tlg)", fontWeight: "bold", color: "var(--teal)" }}>{formatDA(recap.totalGains)}</p>
            </div>
            <div>
              <span style={{ fontSize: "var(--t2xs)", color: "var(--text-muted)", textTransform: "uppercase" }}>TOTAL RETENUES SALARIÉS</span>
              <p style={{ fontSize: "var(--tlg)", fontWeight: "bold", color: "var(--red)" }}>{formatDA(recap.totalRetenues)}</p>
            </div>
            <div>
              <span style={{ fontSize: "var(--t2xs)", color: "var(--text-muted)", textTransform: "uppercase" }}>NET À PAYER GLOBAL</span>
              <p style={{ fontSize: "var(--tlg)", fontWeight: "bold", color: "var(--text)" }}>{formatDA(recap.netAPayer)}</p>
            </div>
            <div>
              <span style={{ fontSize: "var(--t2xs)", color: "var(--text-muted)", textTransform: "uppercase" }}>MASSE SALARIALE (COÛT TOTAL)</span>
              <p style={{ fontSize: "var(--tlg)", fontWeight: "bold", color: "var(--text)" }}>{formatDA(recap.masseSalariale)}</p>
            </div>
          </div>
        </div>
      )}

      {/* 2. ÉTAT NOMINATIF PAR RUBRIQUE */}
      {onglet === "nominatif" && nominatifList.length > 0 && (
        <div className="card print-report-box" style={{ border: "1px solid var(--border)", padding: "var(--s5)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--s4)" }}>
            <div>
              <h3 style={{ fontSize: "var(--tlg)" }}>
                ÉTA NOMINATIF PAR RUBRIQUE : {selectedRubrique} - {NOMS_NATIONAUX[selectedRubrique] || catalogue.find(c => c.code === selectedRubrique)?.libelle}
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "var(--tsm)", marginTop: 4 }}>
                Unité : Chaabat El Leham — Période : {MOIS[mois - 1].toUpperCase()} {annee}
              </p>
            </div>
            <div style={{ textAlign: "right", fontSize: "var(--txs)", color: "var(--text-muted)" }}>
              <span>Salariés concernés : {nominatifList.length}</span>
            </div>
          </div>

          <table className="table" style={{ width: "100%", fontSize: "var(--txs)" }}>
            <thead>
              <tr style={{ background: "var(--surface-2)" }}>
                <th style={{ padding: "8px", textAlign: "left" }}>N°</th>
                <th style={{ padding: "8px", textAlign: "left" }}>MATRICULE</th>
                <th style={{ padding: "8px", textAlign: "left" }}>NOM & PRENOM</th>
                <th style={{ padding: "8px", textAlign: "left" }}>FONCTION</th>
                <th style={{ padding: "8px", textAlign: "right" }}>VALEUR</th>
              </tr>
            </thead>
            <tbody>
              {nominatifList.map((l, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "8px", color: "var(--text-muted)" }}>{i + 1}</td>
                  <td style={{ padding: "8px", fontWeight: "bold" }}>{l.matricule || "-"}</td>
                  <td style={{ padding: "8px", fontWeight: 600 }}>{l.nom_prenom}</td>
                  <td style={{ padding: "8px" }}>{l.fonction || "-"}</td>
                  <td style={{ padding: "8px", textAlign: "right", fontWeight: "bold" }}>{formatDA(l.valeur)}</td>
                </tr>
              ))}
              <tr style={{ background: "var(--surface-2)", fontWeight: "bold", borderTop: "2px solid var(--text)" }}>
                <td colSpan={4} style={{ padding: "10px", textAlign: "right" }}>
                  TOTAL GÉNÉRAL ({nominatifList.length} SALARIÉS)
                </td>
                <td style={{ padding: "10px", textAlign: "right", color: "var(--teal)" }}>
                  {formatDA(totalNominatif)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {onglet === "nominatif" && nominatifList.length === 0 && !isPending && (
        <div className="card" style={{ textAlign: "center", color: "var(--text-muted)" }}>
          Aucune donnée disponible pour cette rubrique sur cette période. Cliquez sur "Obtenir l'état" pour charger.
        </div>
      )}
    </div>
  );
}
