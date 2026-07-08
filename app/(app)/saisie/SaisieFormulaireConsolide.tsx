"use client";

import React, { useMemo, useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Salarie } from "../salaries/actions";
import {
  creerBulletin,
  chargerBulletinPourSaisie,
  ajouterRubriqueSalarie,
  retirerRubriqueSalarie,
  supprimerBulletin,
} from "../salaries/actions";
import type {
  ResultatBulletin,
  RubriqueAssignee,
  RubriqueCatalogue,
} from "../salaries/actions";
import type { Parametres } from "@/lib/paieCalcul";
import { calculerPaie, calculerBaseAvantRubriques, SAISIE_VIDE } from "@/lib/paieCalcul";
import { resoudreLigneRubrique } from "@/lib/rubriquesDynamiques";

const MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const LABELS_CATEGORIE: Record<string, string> = {
  pourcentage: "%",
  nombre_x_taux: "Nombre × taux",
  montant_fixe: "DA",
  regularisation: "DA",
};

const CHAMPS_ABSENCES = [
  { name: "maladie_h", label: "MALADIE" },
  { name: "mise_a_pied_h", label: "MISE À PIED" },
  { name: "accident_travail_h", label: "ACCIDENT TRAVAIL" },
  { name: "retard_h", label: "RETARD" },
  { name: "absence_irreguliere_h", label: "ABS. IRRÉGULIÈRE" },
];

const CHAMPS_HEURES_SUP = [
  { name: "heures_sup_1", label: "PALIER 1 (H)" },
  { name: "heures_sup_2", label: "PALIER 2 (H)" },
  { name: "heures_sup_3", label: "PALIER 3 (H)" },
];

// List of hidden fields to preserve database state
const CHAMPS_CACHES = [
  "icr",
  "taux_iep",
  "taux_nuisance",
  "taux_responsabilite",
  "taux_disponibilite",
  "taux_pri",
  "taux_prc",
  "panier_jours",
  "panier_forfait_jour",
  "autre_prime_fixe",
  "cotis_mutuelle",
  "autres_retenues",
];

function formatDA(n: number) {
  return n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }) + " DA";
}

interface LigneEtat {
  code: string;
  libelle: string | null;
  categorie: RubriqueCatalogue["categorie"];
  type_valeur: string | null;
  valeur_1: number;
  valeur_2: number;
}

function ligneDepuisAssignee(r: RubriqueAssignee): LigneEtat {
  return {
    code: r.code,
    libelle: r.libelle,
    categorie: r.categorie,
    type_valeur: r.type_valeur,
    valeur_1: r.categorie === "pourcentage" ? (r.valeur_defaut || 0) * 100 : r.valeur_defaut || 0,
    valeur_2: 0,
  };
}

function ligneVide(r: RubriqueCatalogue): LigneEtat {
  return {
    code: r.code,
    libelle: r.libelle,
    categorie: r.categorie,
    type_valeur: r.type_valeur,
    valeur_1: 0,
    valeur_2: 0,
  };
}

export default function SaisieFormulaireConsolide({
  salaries,
  salarieActive,
  anneeActive,
  moisActive,
  rubriquesAssignees,
  catalogueRubriques,
  parametres,
  initialBulletin,
}: {
  salaries: Salarie[];
  salarieActive?: Salarie | null;
  anneeActive: number;
  moisActive: number;
  rubriquesAssignees: RubriqueAssignee[];
  catalogueRubriques: RubriqueCatalogue[];
  parametres: Parametres;
  initialBulletin: any;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [resultat, setResultat] = useState<ResultatBulletin | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [messageCharge, setMessageCharge] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [salarieId, setSalarieId] = useState(salarieActive?.id || "");
  const [annee, setAnnee] = useState(anneeActive);
  const [mois, setMois] = useState(moisActive);

  const [formKey, setFormKey] = useState(0);
  const [initialValues, setInitialValues] = useState<Record<string, number>>({});
  const [lignes, setLignes] = useState<LigneEtat[]>([]);

  const [recherche, setRecherche] = useState("");
  const [estEnregistre, setEstEnregistre] = useState(false);
  const [flashActive, setFlashActive] = useState(false);

  // Initialize form values and dynamic rubrics list
  useEffect(() => {
    if (salarieActive) {
      if (initialBulletin) {
        const champs = { ...initialBulletin.champs };
        // Scale percentages to 0-100 scale for user input
        champs.taux_iep = (champs.taux_iep ?? 0) * 100;
        champs.taux_nuisance = (champs.taux_nuisance ?? 0) * 100;
        champs.taux_responsabilite = (champs.taux_responsabilite ?? 0) * 100;
        champs.taux_disponibilite = (champs.taux_disponibilite ?? 0) * 100;
        champs.taux_pri = (champs.taux_pri ?? 0) * 100;
        champs.taux_prc = (champs.taux_prc ?? 0) * 100;

        const lignesChargees: LigneEtat[] = initialBulletin.rubriques.map((r: any) => ({
          code: r.code,
          libelle: r.libelle,
          categorie: r.categorie,
          type_valeur: r.type_valeur ?? (catalogueRubriques.find((cr) => cr.code === r.code)?.type_valeur || null),
          valeur_1: r.categorie === "pourcentage" ? r.valeur_1 * 100 : r.valeur_1,
          valeur_2: r.valeur_2,
        })).sort((a: LigneEtat, b: LigneEtat) => a.code.localeCompare(b.code));

        setInitialValues(champs);
        setLignes(lignesChargees);
        setEstEnregistre(true);
      } else {
        // No saved bulletin, use empty fields + default assigned rubrics
        setInitialValues({});
        setLignes(rubriquesAssignees.map(ligneDepuisAssignee).sort((a, b) => a.code.localeCompare(b.code)));
        setEstEnregistre(false);
      }
      setFormKey((k) => k + 1);
    } else {
      setInitialValues({});
      setLignes([]);
      setResultat(null);
      setEstEnregistre(false);
    }
  }, [salarieActive, initialBulletin, rubriquesAssignees, catalogueRubriques]);

  const codesDejaAjoutes = useMemo(() => new Set(lignes.map((l) => l.code)), [lignes]);
  
  const resultatsRecherche = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return [];
    return catalogueRubriques
      .filter((r) => !codesDejaAjoutes.has(r.code))
      .filter((r) => r.code.toLowerCase().includes(q) || (r.libelle ?? "").toLowerCase().includes(q))
      .slice(0, 8);
  }, [recherche, catalogueRubriques, codesDejaAjoutes]);

  // Execute live calculation from DOM form values
  const executerCalculLive = () => {
    if (!formRef.current || !salarieActive) return;
    const formData = new FormData(formRef.current);
    const num = (name: string) => {
      const val = formData.get(name);
      return val ? parseFloat(val.toString()) || 0 : 0;
    };

    const champsAbsences = {
      salaire_base_theorique: salarieActive.salaire_base_theorique,
      maladie_h: num("maladie_h"),
      mise_a_pied_h: num("mise_a_pied_h"),
      accident_travail_h: num("accident_travail_h"),
      retard_h: num("retard_h"),
      absence_irreguliere_h: num("absence_irreguliere_h"),
    };
    
    const { salaire_base_reel } = calculerBaseAvantRubriques(champsAbsences, parametres);

    const rubriques_dynamiques: any[] = [];
    for (const ligne of lignes) {
      const catRow = catalogueRubriques.find((cr) => cr.code === ligne.code);
      if (!catRow) continue;
      const rawV1 = num(`dyn_${ligne.code}_v1`);
      const v1 = ligne.categorie === "pourcentage" ? rawV1 / 100 : rawV1;
      const v2 = ligne.categorie === "nombre_x_taux" ? num(`dyn_${ligne.code}_v2`) : 0;
      
      const res = resoudreLigneRubrique(catRow, v1, v2, salaire_base_reel);
      if (res) {
        rubriques_dynamiques.push(res);
      }
    }

    const saisie = {
      ...SAISIE_VIDE,
      ...champsAbsences,
      heures_sup_1: num("heures_sup_1"),
      heures_sup_2: num("heures_sup_2"),
      heures_sup_3: num("heures_sup_3"),
      icr: num("icr"),
      taux_iep: num("taux_iep") / 100,
      taux_nuisance: num("taux_nuisance") / 100,
      taux_responsabilite: num("taux_responsabilite") / 100,
      taux_disponibilite: num("taux_disponibilite") / 100,
      taux_pri: num("taux_pri") / 100,
      taux_prc: num("taux_prc") / 100,
      panier_jours: num("panier_jours"),
      panier_forfait_jour: num("panier_forfait_jour"),
      autre_prime_fixe: num("autre_prime_fixe"),
      cotis_mutuelle: num("cotis_mutuelle"),
      autres_retenues: num("autres_retenues"),
      rubriques_dynamiques,
    };

    const res = calculerPaie(saisie, parametres);
    setResultat({
      ...res,
      bulletin_id: initialBulletin?.bulletin_id ?? 0,
      annee,
      mois,
    });
    setEstEnregistre(false); // mark as dirty
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 300);
  };

  const debouncedCalcul = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        executerCalculLive();
      }, 350);
    };
  }, [lignes, parametres, annee, mois, salarieActive]);

  useEffect(() => {
    executerCalculLive();
  }, [formKey, lignes.length]);

  function handleCharger() {
    if (!salarieId) {
      alert("Veuillez sélectionner un salarié");
      return;
    }
    setErreur(null);
    setMessageCharge(null);
    router.push(`/saisie?salarieId=${salarieId}&annee=${annee}&mois=${mois}`);
  }

  function ajouterRubrique(r: RubriqueCatalogue) {
    if (!salarieActive) return;
    setLignes((prev) => {
      const next = [...prev, ligneVide(r)];
      return next.sort((a, b) => a.code.localeCompare(b.code));
    });
    setRecherche("");
    ajouterRubriqueSalarie(salarieActive.id, r.code).catch((e) => {
      setErreur(e instanceof Error ? e.message : "Erreur lors de l'ajout de la rubrique");
    });
  }

  function retirerRubrique(code: string) {
    if (!salarieActive) return;
    setLignes((prev) => prev.filter((l) => l.code !== code));
    retirerRubriqueSalarie(salarieActive.id, code).catch((e) => {
      setErreur(e instanceof Error ? e.message : "Erreur lors du retrait de la rubrique");
    });
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!salarieActive) return;
    setErreur(null);
    setMessageCharge(null);

    const formData = new FormData(e.currentTarget);

    // Convert percentage values back to fractional values (0-1 scale)
    for (const nom of ["taux_iep", "taux_nuisance", "taux_responsabilite", "taux_disponibilite", "taux_pri", "taux_prc"]) {
      const brut = formData.get(nom);
      if (brut !== null) {
        const valeur = parseFloat(brut.toString().replace(",", "."));
        formData.set(nom, isNaN(valeur) ? "0" : String(valeur / 100));
      }
    }
    for (const ligne of lignes) {
      if (ligne.categorie !== "pourcentage") continue;
      const champ = `dyn_${ligne.code}_v1`;
      const brut = formData.get(champ);
      if (brut !== null) {
        const valeur = parseFloat(brut.toString().replace(",", "."));
        formData.set(champ, isNaN(valeur) ? "0" : String(valeur / 100));
      }
    }

    startTransition(async () => {
      try {
        const r = await creerBulletin(salarieActive.id, formData);
        setResultat(r);
        setEstEnregistre(true);
        setMessageCharge("Le bulletin a été enregistré avec succès en base de données.");
        router.refresh();
      } catch (e) {
        setErreur(e instanceof Error ? e.message : "Erreur inconnue");
      }
    });
  }

  async function handleSupprimer() {
    if (!salarieActive || !initialBulletin?.bulletin_id) return;
    if (!confirm("Voulez-vous vraiment supprimer ce bulletin ?")) return;
    
    startTransition(async () => {
      try {
        await supprimerBulletin(salarieActive.id, initialBulletin.bulletin_id);
        router.refresh();
        setMessageCharge("Le bulletin a été supprimé.");
        setResultat(null);
        setLignes([]);
        setFormKey((k) => k + 1);
        setEstEnregistre(false);
      } catch (e) {
        setErreur(e instanceof Error ? e.message : "Erreur de suppression");
      }
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s4)" }}>
      {/* Top Selector Bar Card */}
      <div className="card" style={{ padding: "var(--s4)" }}>
        <div style={{ display: "flex", gap: "var(--s4)", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div className="field" style={{ flex: "2 1 250px", marginBottom: 0 }}>
            <label style={{ fontSize: "var(--t2xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em" }}>SALARIÉ</label>
            <select
              value={salarieId}
              onChange={(e) => setSalarieId(e.target.value)}
              style={{ width: "100%", height: "42px" }}
            >
              <option value="">Sélectionner un salarié…</option>
              {salaries.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nom_prenom} {s.matricule ? ` (${s.matricule})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="field" style={{ flex: "1 1 120px", marginBottom: 0 }}>
            <label style={{ fontSize: "var(--t2xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em" }}>MOIS</label>
            <select
              value={mois}
              onChange={(e) => setMois(parseInt(e.target.value, 10))}
              style={{ width: "100%", height: "42px" }}
            >
              {MOIS.map((m, i) => (
                <option key={i} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="field" style={{ flex: "1 1 100px", marginBottom: 0 }}>
            <label style={{ fontSize: "var(--t2xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em" }}>ANNÉE</label>
            <input
              type="number"
              value={annee}
              onChange={(e) => setAnnee(parseInt(e.target.value, 10) || anneeActive)}
              style={{ width: "100%", height: "42px" }}
            />
          </div>

          <button
            type="button"
            onClick={handleCharger}
            className="btn btn-secondary"
            style={{ height: "42px", padding: "0 24px", fontWeight: "bold" }}
          >
            Charger
          </button>
        </div>
      </div>

      {erreur && (
        <div className="badge badge-red" style={{ padding: "var(--s3)", borderRadius: "var(--r)", display: "block" }}>
          {erreur}
        </div>
      )}

      {messageCharge && (
        <div className="badge badge-green" style={{ padding: "var(--s3)", borderRadius: "var(--r)", display: "block" }}>
          {messageCharge}
        </div>
      )}

      {salarieActive ? (
        <div style={{ display: "grid", gap: "var(--s6)", alignItems: "start" }} className="grid grid-cols-1 lg:grid-cols-3">
          
          {/* Main Form Column (BULLETIN DE PAIE) */}
          <div className="lg:col-span-2" style={{ display: "flex", flexDirection: "column", gap: "var(--s4)" }}>
            
            {/* Header style bar */}
            <div style={{
              background: "#0f233c",
              color: "white",
              padding: "var(--s3) var(--s5)",
              borderTopLeftRadius: "var(--rlg)",
              borderTopRightRadius: "var(--rlg)",
              fontWeight: 700,
              fontSize: "var(--t2xs)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "-20px",
              zIndex: 2
            }}>
              📄 BULLETIN DE PAIE
            </div>

            <form key={formKey} ref={formRef} onSubmit={onSubmit} onChange={debouncedCalcul} className="card" style={{ display: "flex", flexDirection: "column", gap: "var(--s5)", paddingTop: "var(--s8)" }}>
              {/* Pass Month/Year as hidden values */}
              <input type="hidden" name="annee" value={annee} />
              <input type="hidden" name="mois" value={mois} />

              {/* Render non-visible fields as hidden to avoid losing their data */}
              {CHAMPS_CACHES.map((nom) => (
                <input key={nom} type="hidden" name={nom} defaultValue={initialValues[nom] ?? 0} />
              ))}

              {/* SALAIRE DE BASE */}
              <div style={{ borderBottom: "var(--hairline)", paddingBottom: "var(--s4)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--s2)", marginBottom: "var(--s3)" }}>
                  <h4 style={{ fontSize: "var(--txs)", fontWeight: 700, textTransform: "uppercase", color: "var(--text)", letterSpacing: "0.04em" }}>
                    🔔 SALAIRE DE BASE
                  </h4>
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: "10px", color: "var(--text-muted)" }}>SALAIRE DE BASE THÉORIQUE (DA)</label>
                  <input
                    type="text"
                    value={salarieActive.salaire_base_theorique.toLocaleString("fr-FR") + " DA"}
                    disabled
                    style={{ background: "var(--surface-2)", color: "var(--text-muted)", cursor: "not-allowed", fontWeight: "bold" }}
                  />
                </div>
              </div>

              {/* ABSENCES */}
              <div style={{ borderBottom: "var(--hairline)", paddingBottom: "var(--s4)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--s2)", marginBottom: "var(--s4)" }}>
                  <h4 style={{ fontSize: "var(--txs)", fontWeight: 700, textTransform: "uppercase", color: "var(--text)", letterSpacing: "0.04em" }}>
                    🛑 ABSENCES (HEURES)
                  </h4>
                  <span className="badge badge-red" style={{ fontSize: "9px", padding: "2px 8px" }}>RÉDUISENT LE SALAIRE</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "var(--s3)" }}>
                  {CHAMPS_ABSENCES.map((c) => (
                    <div key={c.name} className="field" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: "9px" }}>{c.label}</label>
                      <input
                        name={c.name}
                        type="number"
                        step="0.01"
                        defaultValue={initialValues[c.name] ?? 0}
                        style={{ textAlign: "center" }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* HEURES SUPPLEMENTAIRES */}
              <div style={{ borderBottom: "var(--hairline)", paddingBottom: "var(--s4)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--s2)", marginBottom: "var(--s4)" }}>
                  <h4 style={{ fontSize: "var(--txs)", fontWeight: 700, textTransform: "uppercase", color: "var(--text)", letterSpacing: "0.04em" }}>
                    ⚡ HEURES SUPPLÉMENTAIRES
                  </h4>
                  <span className="badge badge-accent" style={{ fontSize: "9px", padding: "2px 8px" }}>MAJORATIONS PARAMÉTRABLES</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--s3)" }}>
                  {CHAMPS_HEURES_SUP.map((c) => (
                    <div key={c.name} className="field" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: "9px" }}>{c.label}</label>
                      <input
                        name={c.name}
                        type="number"
                        step="0.01"
                        defaultValue={initialValues[c.name] ?? 0}
                        style={{ textAlign: "center" }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* PRIMES, INDEMNITÉS ET RETENUES */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--s2)", marginBottom: "var(--s4)" }}>
                  <h4 style={{ fontSize: "var(--txs)", fontWeight: 700, textTransform: "uppercase", color: "var(--text)", letterSpacing: "0.04em" }}>
                    💵 PRIMES, INDEMNITÉS ET RETENUES
                  </h4>
                  <span className="badge badge-teal" style={{ fontSize: "9px", padding: "2px 8px" }}>CATALOGUE DES RUBRIQUES</span>
                </div>

                {/* Add Rubric Input search bar */}
                <div style={{ position: "relative", marginBottom: "var(--s4)", border: "1px dashed var(--amber)", borderRadius: "var(--r)", padding: "12px", background: "var(--amber-50)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--s2)" }}>
                    <span style={{ fontSize: "var(--t2xs)", fontWeight: "bold", color: "var(--amber-800)", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                      + AJOUTER UNE RUBRIQUE
                    </span>
                    <div style={{ flex: 1, position: "relative" }}>
                      <input
                        type="text"
                        value={recherche}
                        onChange={(e) => setRecherche(e.target.value)}
                        placeholder="Rechercher par code ou libellé..."
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "4px", border: "1px solid var(--border)", fontSize: "var(--tsm)", background: "var(--surface)" }}
                      />
                    </div>
                  </div>

                  {resultatsRecherche.length > 0 && (
                    <div
                      className="card"
                      style={{
                        position: "absolute",
                        zIndex: 10,
                        top: "100%",
                        left: 0,
                        right: 0,
                        marginTop: 4,
                        padding: "var(--s1)",
                        maxHeight: 260,
                        overflowY: "auto",
                        boxShadow: "var(--shmd)",
                      }}
                    >
                      {resultatsRecherche.map((r) => {
                        const isGain = r.type_valeur === "Gain (+)";
                        const badgeClass = isGain ? "badge-teal" : "badge-red";
                        const badgeText = isGain ? "Gain" : "Retenue";
                        const catLabel = LABELS_CATEGORIE[r.categorie] || r.categorie;
                        return (
                          <button
                            key={r.code}
                            type="button"
                            onClick={() => ajouterRubrique(r)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              width: "100%",
                              padding: "8px 12px",
                              background: "none",
                              border: "none",
                              borderBottom: "1px solid var(--border-soft)",
                              cursor: "pointer",
                              fontSize: "var(--tsm)",
                              textAlign: "left",
                            }}
                          >
                            <div>
                              <strong style={{ fontFamily: "var(--mono)", color: "var(--accent)" }}>{r.code}</strong>{" "}
                              <span style={{ color: "var(--text)" }}>— {r.libelle}</span>
                            </div>
                            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                              <span className={`badge ${badgeClass}`} style={{ fontSize: "10px", padding: "2px 6px" }}>{badgeText}</span>
                              <span className="badge" style={{ fontSize: "10px", padding: "2px 6px", border: "1px solid var(--border)" }}>{catLabel}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Rubrics list */}
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--s2)" }}>
                  {lignes.map((ligne) => {
                    const isGain = ligne.type_valeur === "Gain (+)" || !ligne.type_valeur?.includes("Retenue");
                    
                    return (
                      <div
                        key={ligne.code}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "var(--s3)",
                          padding: "var(--s2) var(--s3)",
                          background: "var(--surface-2)",
                          borderRadius: "var(--r)",
                          border: "1px solid var(--border-soft)",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "var(--s3)", flex: "1 1 auto" }}>
                          {/* Code Badge */}
                          <div style={{
                            background: "var(--amber-100)",
                            color: "var(--amber-800)",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontWeight: "bold",
                            fontFamily: "var(--mono)",
                            fontSize: "var(--txs)",
                            minWidth: "60px",
                            textAlign: "center"
                          }}>
                            {ligne.code}
                          </div>
                          
                          {/* Libellé */}
                          <div style={{ fontWeight: 600, fontSize: "var(--tsm)" }}>
                            {ligne.libelle}
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "var(--s3)", flexWrap: "nowrap" }}>
                          {/* Sign +/- Indicator */}
                          <div style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "50%",
                            background: isGain ? "var(--green-100)" : "var(--red-100)",
                            color: isGain ? "var(--green-700)" : "var(--red-700)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "bold",
                            fontSize: "14px"
                          }}>
                            {isGain ? "+" : "-"}
                          </div>

                          {/* Dynamic Inputs depending on Category */}
                          {ligne.categorie === "nombre_x_taux" ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <input
                                name={`dyn_${ligne.code}_v1`}
                                type="number"
                                step="0.01"
                                defaultValue={ligne.valeur_1}
                                style={{ width: "60px", padding: "6px", textAlign: "center", height: "34px" }}
                                placeholder="Nbr"
                              />
                              <span style={{ fontSize: "var(--txs)", color: "var(--text-muted)" }}>×</span>
                              <input
                                name={`dyn_${ligne.code}_v2`}
                                type="number"
                                step="0.01"
                                defaultValue={ligne.valeur_2}
                                style={{ width: "80px", padding: "6px", textAlign: "center", height: "34px" }}
                                placeholder="Taux"
                              />
                            </div>
                          ) : (
                            <input
                              name={`dyn_${ligne.code}_v1`}
                              type="number"
                              step="0.01"
                              defaultValue={ligne.valeur_1}
                              style={{ width: "90px", padding: "6px", textAlign: "center", height: "34px" }}
                            />
                          )}

                          {/* Unit Indicator label */}
                          <span style={{ fontSize: "var(--tsm)", fontWeight: "bold", color: "var(--text-muted)", width: "30px" }}>
                            {LABELS_CATEGORIE[ligne.categorie] || "DA"}
                          </span>

                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={() => retirerRubrique(ligne.code)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "var(--text-muted)",
                              cursor: "pointer",
                              fontSize: "16px",
                              padding: "4px"
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {lignes.length === 0 && (
                    <p style={{ fontSize: "var(--txs)", color: "var(--text-muted)", textAlign: "center", padding: "var(--s3)" }}>
                      Aucune rubrique additionnelle ajoutée pour ce salarié.
                    </p>
                  )}
                </div>
              </div>

              {/* Form Buttons */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "var(--s4)", borderTop: "var(--hairline)", paddingTop: "var(--s4)" }}>
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn btn-primary"
                  style={{ background: "#0f233c", border: "none", display: "flex", alignItems: "center", gap: "8px" }}
                >
                  💾 Enregistrer le bulletin
                </button>

                {initialBulletin?.bulletin_id && (
                  <button
                    type="button"
                    onClick={handleSupprimer}
                    disabled={isPending}
                    className="btn"
                    style={{ color: "var(--red-600)", background: "transparent", border: "none", fontSize: "var(--tsm)", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    🗑️ Supprimer ce bulletin
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Right Column (RÉSULTAT DU CALCUL) */}
          <div className="lg:col-span-1" style={{ display: "flex", flexDirection: "column", gap: "var(--s4)", position: "sticky", top: "var(--s6)" }}>
            
            <div style={{
              background: "#0f233c",
              color: "white",
              padding: "var(--s3) var(--s5)",
              borderTopLeftRadius: "var(--rlg)",
              borderTopRightRadius: "var(--rlg)",
              fontWeight: 700,
              fontSize: "var(--t2xs)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "-20px",
              zIndex: 2
            }}>
              🧮 RÉSULTAT DU CALCUL
            </div>

            <div className="card" style={{ display: "flex", flexDirection: "column", gap: "var(--s4)", paddingTop: "var(--s8)" }}>
              {resultat ? (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", borderBottom: "var(--hairline)", paddingBottom: "var(--s3)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--tsm)" }}>
                      <span style={{ color: "var(--text-muted)" }}>Heures travaillées</span>
                      <strong style={{ color: "var(--text)" }}>{resultat.heures_travaillees.toFixed(2)} h</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--tsm)" }}>
                      <span style={{ color: "var(--text-muted)" }}>Salaire de base réel</span>
                      <strong style={{ color: "var(--text)" }}>{formatDA(resultat.salaire_base_reel)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--tsm)" }}>
                      <span style={{ color: "var(--text-muted)" }}>Heures supplémentaires</span>
                      <strong style={{ color: "var(--text)" }}>{formatDA(resultat.total_heures_sup_da)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--tsm)", borderTop: "1px dashed var(--border-soft)", paddingTop: "8px", marginTop: "4px" }}>
                      <span style={{ color: "var(--text)", fontWeight: "bold" }}>Total des gains</span>
                      <strong style={{ color: "var(--marine-900)", fontWeight: "bold" }}>{formatDA(resultat.total_gains)}</strong>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", borderBottom: "var(--hairline)", paddingBottom: "var(--s3)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--tsm)" }}>
                      <span style={{ color: "var(--text-muted)" }}>Base CNAS</span>
                      <strong style={{ color: "var(--text)" }}>{formatDA(resultat.base_cnas)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--tsm)" }}>
                      <span style={{ color: "var(--text-muted)" }}>Retenue CNAS (9%)</span>
                      <strong style={{ color: "var(--text)" }}>{formatDA(resultat.retenue_cnas)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--tsm)" }}>
                      <span style={{ color: "var(--text-muted)" }}>Base imposable IRG</span>
                      <strong style={{ color: "var(--text)" }}>{formatDA(resultat.base_imposable_irg)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--tsm)" }}>
                      <span style={{ color: "var(--text-muted)" }}>IRG brut</span>
                      <strong style={{ color: "var(--text)" }}>{formatDA(resultat.irg_brut)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--tsm)" }}>
                      <span style={{ color: "var(--text-muted)" }}>Abattement IRG (40%)</span>
                      <strong style={{ color: "var(--text)" }}>{formatDA(resultat.abattement_irg)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--tsm)" }}>
                      <span style={{ color: "var(--text-muted)" }}>Retenue IRG nette</span>
                      <strong style={{ color: "var(--text)" }}>{formatDA(resultat.retenue_irg_nette)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--tsm)", borderTop: "1px dashed var(--border-soft)", paddingTop: "8px", marginTop: "4px" }}>
                      <span style={{ color: "var(--text)", fontWeight: "bold" }}>Total retenues</span>
                      <strong style={{ color: "var(--text)", fontWeight: "bold" }}>{formatDA(resultat.total_retenues)}</strong>
                    </div>
                  </div>

                  {/* NET A PAYER BANNER */}
                  <div style={{
                    background: "#0f233c",
                    color: "white",
                    padding: "var(--s4)",
                    borderRadius: "var(--r)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontWeight: "bold"
                  }}>
                    <span>NET À PAYER</span>
                    <span style={{ fontSize: "20px" }}>{formatDA(resultat.net_a_payer)}</span>
                  </div>

                  {/* COUT EMPLOYEUR BANNER */}
                  <div style={{
                    background: "#fef7eb",
                    color: "#7c3d0a",
                    border: "1px solid #fcd494",
                    padding: "var(--s4)",
                    borderRadius: "var(--r)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontWeight: "bold"
                  }}>
                    <span>COÛT EMPLOYEUR</span>
                    <span style={{ fontSize: "18px" }}>{formatDA(resultat.cout_total_employeur)}</span>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--s2)", marginTop: "var(--s2)" }}>
                    {estEnregistre ? (
                      <>
                        <a
                          href={`/salaries/${salarieActive.id}/bulletin/pdf?annee=${resultat.annee}&mois=${resultat.mois}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary"
                          style={{ width: "100%", justifyContent: "center" }}
                        >
                          👁️ Voir bulletin salarié
                        </a>
                        <a
                          href={`/salaries/${salarieActive.id}/bulletin/pdf?annee=${resultat.annee}&mois=${resultat.mois}&variante=employeur`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary"
                          style={{ width: "100%", justifyContent: "center" }}
                        >
                          👁️ Voir bulletin employeur
                        </a>
                      </>
                    ) : (
                      <>
                        <button disabled className="btn btn-secondary" style={{ width: "100%", opacity: 0.5, cursor: "not-allowed" }}>
                          👁️ Voir bulletin salarié
                        </button>
                        <button disabled className="btn btn-secondary" style={{ width: "100%", opacity: 0.5, cursor: "not-allowed" }}>
                          👁️ Voir bulletin employeur
                        </button>
                        <p style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "center" }}>
                          Enregistrez d&apos;abord le bulletin.
                        </p>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <p style={{ fontSize: "var(--tsm)", color: "var(--text-muted)", textAlign: "center", padding: "var(--s4)" }}>
                  Le résultat du calcul s&apos;affichera en temps réel ici.
                </p>
              )}
            </div>

          </div>

        </div>
      ) : (
        <div className="card" style={{ textAlign: "center", padding: "var(--s6)", color: "var(--text-muted)" }}>
          👈 Sélectionnez un salarié, puis cliquez sur <strong>Charger</strong> pour afficher et saisir ses données mensuelles de paie.
        </div>
      )}
    </div>
  );
}
