"use client";

import React, { useState, useTransition } from "react";
import {
  getCentralisateur,
  getEtatNominatifRubrique,
  getVirementData,
  type RecapCentralisateur,
  type LigneNominative,
  type LigneVirement,
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
  const [onglet, setOnglet] = useState<"centralisateur" | "nominatif" | "g50" | "virement">("centralisateur");
  const [selectedRubrique, setSelectedRubrique] = useState("R030");

  const [recap, setRecap] = useState<RecapCentralisateur | null>(null);
  const [nominatifList, setNominatifList] = useState<LigneNominative[]>([]);
  const [virementList, setVirementList] = useState<LigneVirement[]>([]);
  
  const [empCcpRib, setEmpCcpRib] = useState("");
  const [empRaisonSociale, setEmpRaisonSociale] = useState("NETIX SIRH");
  const [virementDate, setVirementDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  });
  const [virementFormat, setVirementFormat] = useState<"ccp" | "rib" | "csv">("ccp");

  const [isPending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  const formatDA = (val: number) => {
    return val.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/[\u202F\u00A0]/g, ' ') + " DA";
  };

  const generateFileContent = () => {
    let content = "";
    const totalAmount = virementList.reduce((acc, l) => acc + l.net_a_payer, 0);
    const dateStr = virementDate.replace(/-/g, ""); // YYYYMMDD
    
    if (virementFormat === "ccp") {
      // Header CCP: DEBIT_CCP;RAISON_SOCIALE;DATE;MONTANT_TOTAL;NOMBRE_VIREMENTS
      content += `${empCcpRib};${empRaisonSociale};${virementDate};${totalAmount.toFixed(2)};${virementList.length}\r\n`;
      for (const v of virementList) {
        // Detail CCP: CCP_SALARIE;NOM_PRENOM;MONTANT;MATRICULE
        content += `${v.ccp_rib || ""};${v.nom_prenom};${v.net_a_payer.toFixed(2)};${v.matricule || ""}\r\n`;
      }
    } else if (virementFormat === "rib") {
      // Header RIB (Fixed Width): Company RIB (20) + Company Name (30) + Date YYYYMMDD (8) + Total Amount (12, padded zeros)
      const cleanName = empRaisonSociale.slice(0, 30).padEnd(30, " ");
      const cleanRib = empCcpRib.slice(0, 20).padEnd(20, " ");
      const formattedTotal = totalAmount.toFixed(2).replace(".", "").padStart(12, "0");
      content += `${cleanRib}${cleanName}${dateStr}${formattedTotal}\r\n`;
      
      for (const v of virementList) {
        // Detail RIB: RIB_SALARIE (20) + NOM_PRENOM (30) + MONTANT (12, padded zeros without dot) + MATRICULE (10)
        const salName = v.nom_prenom.slice(0, 30).padEnd(30, " ");
        const salRib = (v.ccp_rib || "").slice(0, 20).padEnd(20, " ");
        const formattedAmount = v.net_a_payer.toFixed(2).replace(".", "").padStart(12, "0");
        const salMatricule = (v.matricule || "").slice(0, 10).padEnd(10, " ");
        content += `${salRib}${salName}${formattedAmount}${salMatricule}\r\n`;
      }
    } else {
      // CSV Format
      content += `Matricule;Nom Prenom;Compte Bancaire (RIB/CCP);Net A Payer\r\n`;
      for (const v of virementList) {
        content += `"${v.matricule || ""}";"${v.nom_prenom}";"${v.ccp_rib || ""}";"${v.net_a_payer.toFixed(2)}"\r\n`;
      }
    }
    return content;
  };

  const handleDownload = () => {
    const content = generateFileContent();
    const extension = virementFormat === "csv" ? "csv" : "txt";
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `virement_masse_${MOIS[mois - 1].toLowerCase()}_${annee}.${extension}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerer = () => {
    setErreur(null);
    startTransition(async () => {
      try {
        if (onglet === "centralisateur" || onglet === "g50") {
          const res = await getCentralisateur(annee, mois);
          setRecap(res);
        } else if (onglet === "virement") {
          const res = await getVirementData(annee, mois);
          setVirementList(res);
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
        <h2 style={{ marginBottom: "var(--s4)" }}>États de Paie & Centralisation</h2>
        
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
                setVirementList([]);
              }}
            >
              <option value="centralisateur">Centralisateur Général (Mois)</option>
              <option value="nominatif">État nominatif par rubrique</option>
              <option value="g50">Synthèse G50 (IRG Salariés)</option>
              <option value="virement">Ordres de Virement de Masse</option>
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
          {erreur}
        </div>
      )}

      {/* Impression Bouton (Masqué à l'impression) */}
      {(recap || nominatifList.length > 0) && (
        <div className="no-print" style={{ display: "flex", justifyContent: "flex-end" }}>
          <button onClick={printReport} className="btn btn-secondary">
            Imprimer le rapport
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

      {/* 3. SYNTHÈSE G50 */}
      {onglet === "g50" && recap && (
        (() => {
          const irgStandardLine = recap.lignes.find(l => l.code === "R980");
          const irgContractLine = recap.lignes.find(l => l.code === "R985");
          
          const assietteIrgStandard = irgStandardLine?.n_base ?? 0;
          const montantIrgStandard = irgStandardLine?.retenue ?? 0;
          
          const assietteIrgContract = irgContractLine?.n_base ?? 0;
          const montantIrgContract = irgContractLine?.retenue ?? 0;
          
          const totalAssietteG50 = assietteIrgStandard + assietteIrgContract;
          const totalImpotsRetenusG50 = montantIrgStandard + montantIrgContract;

          return (
            <div className="card print-report-box" style={{ border: "1px solid var(--border)", padding: "var(--s5)" }}>
              <div style={{ borderBottom: "2px solid var(--text)", paddingBottom: "var(--s3)", marginBottom: "var(--s4)" }}>
                <h3 style={{ fontSize: "var(--tlg)", textAlign: "center", fontWeight: "bold" }}>RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE</h3>
                <h4 style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "var(--tsm)", marginTop: 4 }}>MINISTÈRE DES FINANCES — DIRECTION GÉNÉRALE DES IMPÔTS</h4>
                <h3 style={{ fontSize: "var(--tlg)", textAlign: "center", marginTop: "var(--s3)", color: "var(--accent)", fontWeight: "bold" }}>SYNTHÈSE DECLARATION G50 — IRG SALARIÉS</h3>
                <p style={{ textAlign: "center", fontSize: "var(--tsm)", color: "var(--text-muted)", marginTop: 4 }}>
                  Période d'imposition : <strong>{MOIS[mois - 1].toUpperCase()} {annee}</strong>
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6" style={{ marginBottom: "var(--s4)", marginTop: "var(--s4)" }}>
                <div className="card" style={{ background: "var(--surface-2)" }}>
                  <span style={{ fontSize: "var(--t2xs)", color: "var(--text-muted)", textTransform: "uppercase" }}>Nombre total de bénéficiaires</span>
                  <p style={{ fontSize: "var(--txl)", fontWeight: "bold" }}>{recap.nombreSalaries}</p>
                </div>
                <div className="card" style={{ background: "var(--surface-2)" }}>
                  <span style={{ fontSize: "var(--t2xs)", color: "var(--text-muted)", textTransform: "uppercase" }}>Total Droits à Verser (IRG)</span>
                  <p style={{ fontSize: "var(--txl)", fontWeight: "bold", color: "var(--red)" }}>{formatDA(totalImpotsRetenusG50)}</p>
                </div>
              </div>

              <table className="table" style={{ width: "100%", fontSize: "var(--txs)" }}>
                <thead>
                  <tr style={{ background: "var(--surface-2)" }}>
                    <th style={{ padding: "10px", textAlign: "left" }}>NATURE DES IMPOSITIONS / VERSEMENTS</th>
                    <th style={{ padding: "10px", textAlign: "center" }}>NOMBRE DE BÉNÉFICIAIRES</th>
                    <th style={{ padding: "10px", textAlign: "right" }}>BASE D'IMPOSITION (ASSIETTE)</th>
                    <th style={{ padding: "10px", textAlign: "right" }}>MONTANT DES RETENUES (DROITS DUS)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: "10px", fontWeight: "bold" }}>IRG / Salariés Réguliers (Barème Standard)</td>
                    <td style={{ padding: "10px", textAlign: "center" }}>{irgStandardLine?.eff ?? 0}</td>
                    <td style={{ padding: "10px", textAlign: "right" }}>{assietteIrgStandard > 0 ? formatDA(assietteIrgStandard) : "0,00 DA"}</td>
                    <td style={{ padding: "10px", textAlign: "right", fontWeight: "bold" }}>{montantIrgStandard > 0 ? formatDA(montantIrgStandard) : "0,00 DA"}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "10px", fontWeight: "bold" }}>IRG / Contrats Temporaires (Retenue Forfaitaire 10%)</td>
                    <td style={{ padding: "10px", textAlign: "center" }}>{irgContractLine?.eff ?? 0}</td>
                    <td style={{ padding: "10px", textAlign: "right" }}>{assietteIrgContract > 0 ? formatDA(assietteIrgContract) : "0,00 DA"}</td>
                    <td style={{ padding: "10px", textAlign: "right", fontWeight: "bold" }}>{montantIrgContract > 0 ? formatDA(montantIrgContract) : "0,00 DA"}</td>
                  </tr>
                  <tr style={{ background: "var(--surface-2)", fontWeight: "bold", borderTop: "2px solid var(--text)" }}>
                    <td style={{ padding: "12px" }}>TOTAL SECTION IRG (À reporter sur la G50 papier/numérique)</td>
                    <td style={{ padding: "12px", textAlign: "center" }}>{recap.nombreSalaries}</td>
                    <td style={{ padding: "12px", textAlign: "right" }}>{formatDA(totalAssietteG50)}</td>
                    <td style={{ padding: "12px", textAlign: "right", color: "var(--red)", fontSize: "var(--tsm)" }}>{formatDA(totalImpotsRetenusG50)}</td>
                  </tr>
                </tbody>
              </table>
              <div style={{ marginTop: "var(--s4)", padding: "var(--s3)", background: "var(--blue-50)", borderLeft: "4px solid var(--blue-500)", borderRadius: "var(--radius-sm)", color: "var(--blue-900)" }} className="no-print">
                <p style={{ fontSize: "var(--txs)", margin: 0 }}>
                  💡 <strong>Note de déclaration :</strong> Les montants ci-dessus correspondent aux retenues à la source effectuées au titre du mois de {MOIS[mois - 1]} {annee} et doivent être déclarés et acquittés auprès de la recette des impôts avant le 20 du mois suivant.
                </p>
              </div>
            </div>
          );
        })()
      )}

      {onglet === "g50" && !recap && !isPending && (
        <div className="card" style={{ textAlign: "center", color: "var(--text-muted)" }}>
          Aucune donnée chargée. Cliquez sur "Obtenir l'état" pour générer la synthèse G50 de ce mois.
        </div>
      )}

      {/* 4. VIREMENT DE MASSE */}
      {onglet === "virement" && virementList.length > 0 && (
        <div className="space-y-6">
          <div className="card no-print" style={{ border: "1px solid var(--border)", padding: "var(--s4)" }}>
            <h3>Configuration de l'ordre de virement</h3>
            <div className="grid md:grid-cols-4 gap-4" style={{ marginTop: "var(--s3)" }}>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Compte Débit (CCP / RIB Employeur)</label>
                <input
                  type="text"
                  value={empCcpRib}
                  onChange={(e) => setEmpCcpRib(e.target.value)}
                  placeholder="Ex: 00799999000012345678"
                />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Raison Sociale Employeur</label>
                <input
                  type="text"
                  value={empRaisonSociale}
                  onChange={(e) => setEmpRaisonSociale(e.target.value)}
                  placeholder="Nom de l'entreprise"
                />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Date d'exécution</label>
                <input
                  type="date"
                  value={virementDate}
                  onChange={(e) => setVirementDate(e.target.value)}
                />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Format de fichier</label>
                <select
                  value={virementFormat}
                  onChange={(e) => setVirementFormat(e.target.value as any)}
                >
                  <option value="ccp">Algérie Poste (CCP - CSV)</option>
                  <option value="rib">RIB Bancaire (Largeur Fixe)</option>
                  <option value="csv">Standard CSV</option>
                </select>
              </div>
            </div>
            
            <button
              onClick={handleDownload}
              className="btn btn-primary"
              style={{ marginTop: "var(--s4)", width: "fit-content" }}
            >
              ⬇ Télécharger le fichier de virement de masse
            </button>
          </div>

          <div className="card print-report-box" style={{ border: "1px solid var(--border)", padding: "var(--s5)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--s4)" }}>
              <div>
                <h3 style={{ fontSize: "var(--tlg)" }}>ORDRE DE VIREMENT COLLECTIF DE LA PAIE</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "var(--tsm)", marginTop: 4 }}>
                  Période : {MOIS[mois - 1].toUpperCase()} {annee} — Compte expéditeur : {empCcpRib || "Non configuré"} ({empRaisonSociale})
                </p>
              </div>
              <div style={{ textAlign: "right", fontSize: "var(--txs)", color: "var(--text-muted)" }}>
                <span>Nombre de virements : {virementList.length}</span>
              </div>
            </div>

            <table className="table" style={{ width: "100%", fontSize: "var(--txs)" }}>
              <thead>
                <tr style={{ background: "var(--surface-2)" }}>
                  <th style={{ padding: "8px", textAlign: "left" }}>N°</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>MATRICULE</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>NOM & PRENOM</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>COMPTE DESTINATAIRE (RIB / CCP)</th>
                  <th style={{ padding: "8px", textAlign: "right" }}>MONTANT À VIRER</th>
                </tr>
              </thead>
              <tbody>
                {virementList.map((v, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "8px", color: "var(--text-muted)" }}>{i + 1}</td>
                    <td style={{ padding: "8px", fontWeight: "bold" }}>{v.matricule || "-"}</td>
                    <td style={{ padding: "8px" }}>{v.nom_prenom}</td>
                    <td style={{ padding: "8px" }}>
                      {v.ccp_rib ? (
                        <span style={{ fontFamily: "var(--mono)" }}>{v.ccp_rib}</span>
                      ) : (
                        <span className="badge badge-red" style={{ fontSize: "10px", padding: "2px 6px" }}>⚠️ Aucun compte renseigné</span>
                      )}
                    </td>
                    <td style={{ padding: "8px", textAlign: "right", fontWeight: "bold", color: "var(--teal)" }}>
                      {formatDA(v.net_a_payer)}
                    </td>
                  </tr>
                ))}
                <tr style={{ background: "var(--surface-2)", fontWeight: "bold", borderTop: "2px solid var(--text)" }}>
                  <td colSpan={4} style={{ padding: "10px", textAlign: "right" }}>
                    TOTAL GLOBAL À DÉBITER
                  </td>
                  <td style={{ padding: "10px", textAlign: "right", color: "var(--teal)", fontSize: "var(--tsm)" }}>
                    {formatDA(virementList.reduce((acc, l) => acc + l.net_a_payer, 0))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Fichier de prévisualisation brute */}
          <div className="card no-print" style={{ border: "1px solid var(--border)", padding: "var(--s4)" }}>
            <h3>Prévisualisation brute du fichier</h3>
            <pre
              style={{
                background: "var(--surface-2)",
                padding: "var(--s3)",
                borderRadius: "var(--radius-sm)",
                fontSize: "var(--txs)",
                overflowX: "auto",
                fontFamily: "var(--mono)",
                marginTop: "var(--s2)",
                maxHeight: "200px",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all"
              }}
            >
              {generateFileContent()}
            </pre>
          </div>
        </div>
      )}

      {onglet === "virement" && virementList.length === 0 && !isPending && (
        <div className="card" style={{ textAlign: "center", color: "var(--text-muted)" }}>
          Aucune donnée disponible pour ce mois. Cliquez sur "Obtenir l'état" pour générer la liste.
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
