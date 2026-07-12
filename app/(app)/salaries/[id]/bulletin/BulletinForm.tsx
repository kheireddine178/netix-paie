"use client";

import React, { useMemo, useState, useTransition, useRef, useEffect } from "react";
import Link from "next/link";
import {
  creerBulletin,
  chargerBulletinPourSaisie,
  ajouterRubriqueSalarie,
  retirerRubriqueSalarie,
  cloturerBulletin,
} from "../../actions";
import type {
  ResultatBulletin,
  RubriqueAssignee,
  RubriqueCatalogue,
  Salarie,
} from "../../actions";
import type { Parametres } from "@/lib/paieCalcul";
import { calculerPaie, calculerBaseAvantRubriques, SAISIE_VIDE } from "@/lib/paieCalcul";
import { resoudreLigneRubrique } from "@/lib/rubriquesDynamiques";

const MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const LABELS_CATEGORIE: Record<string, string> = {
  pourcentage: "% d'une base",
  nombre_x_taux: "Nombre × taux",
  montant_fixe: "Montant fixe",
  regularisation: "Régularisation",
};

const CHAMPS_ABSENCES = [
  { name: "maladie_h", label: "Maladie (heures)" },
  { name: "mise_a_pied_h", label: "Mise à pied (heures)" },
  { name: "accident_travail_h", label: "Accident de travail (heures)" },
  { name: "retard_h", label: "Retard (heures)" },
  { name: "absence_irreguliere_h", label: "Absence irrégulière (heures)" },
];

const CHAMPS_HEURES_SUP = [
  { name: "heures_sup_1", label: "Heures sup. palier 1 (x1.5)" },
  { name: "heures_sup_2", label: "Heures sup. palier 2 (x1.75)" },
  { name: "heures_sup_3", label: "Heures sup. palier 3 (x2.0)" },
];

const CHAMPS_PRIMES_MONTANT = [
  { name: "icr", label: "I.C.R (montant DA)" },
  { name: "panier_jours", label: "Panier — nombre de jours" },
  { name: "panier_forfait_jour", label: "Panier — forfait/jour (DA)" },
  { name: "autre_prime_fixe", label: "Autre prime fixe (DA)" },
];

const CHAMPS_PRIMES_POURCENTAGE = [
  { name: "taux_iep", label: "Taux I.E.P (%)" },
  { name: "taux_nuisance", label: "Taux nuisance (%)" },
  { name: "taux_responsabilite", label: "Taux responsabilité (%)" },
  { name: "taux_disponibilite", label: "Taux disponibilité (%)" },
  { name: "taux_pri", label: "Taux P.R.I (%)" },
  { name: "taux_prc", label: "Taux P.R.C (%)" },
];

const CHAMPS_TAUX_POURCENTAGE = new Set(CHAMPS_PRIMES_POURCENTAGE.map((c) => c.name));
const CHAMPS_TAUX_NOMS = CHAMPS_PRIMES_POURCENTAGE.map((c) => c.name);

const CHAMPS_RETENUES = [
  { name: "cotis_mutuelle", label: "Cotisation mutuelle (DA)" },
  { name: "autres_retenues", label: "Autres retenues (DA)" },
];

function formatDA(n: number) {
  return n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/[\u202F\u00A0]/g, ' ') + " DA";
}

interface LigneEtat {
  code: string;
  libelle: string | null;
  categorie: RubriqueCatalogue["categorie"];
  valeur_1: number;
  valeur_2: number;
}

function ligneDepuisAssignee(r: RubriqueAssignee): LigneEtat {
  return {
    code: r.code,
    libelle: r.libelle,
    categorie: r.categorie,
    valeur_1: r.categorie === "pourcentage" ? (r.valeur_defaut || 0) * 100 : r.valeur_defaut || 0,
    valeur_2: 0,
  };
}

function ligneVide(r: RubriqueCatalogue): LigneEtat {
  return { code: r.code, libelle: r.libelle, categorie: r.categorie, valeur_1: 0, valeur_2: 0 };
}

export default function BulletinForm({
  salarie,
  rubriquesAssignees,
  catalogueRubriques,
  parametres,
  userRole,
}: {
  salarie: Salarie;
  rubriquesAssignees: RubriqueAssignee[];
  catalogueRubriques: RubriqueCatalogue[];
  parametres: Parametres;
  userRole: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [resultat, setResultat] = useState<ResultatBulletin | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [messageCharge, setMessageCharge] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const now = new Date();
  const [annee, setAnnee] = useState(now.getFullYear());
  const [mois, setMois] = useState(now.getMonth() + 1);
  const [statut, setStatut] = useState("Brouillon");

  const isReadOnly = statut === "Clôturé" || userRole === "Directeur";

  const [formKey, setFormKey] = useState(0);
  const [initialValues, setInitialValues] = useState<Record<string, number>>({});
  
  // Sort rubriques by code on initial load
  const [lignes, setLignes] = useState<LigneEtat[]>(() =>
    rubriquesAssignees.map(ligneDepuisAssignee).sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
  );

  const [recherche, setRecherche] = useState("");
  const [estEnregistre, setEstEnregistre] = useState(false);
  const [flashActive, setFlashActive] = useState(false);

  const codesDejaAjoutes = useMemo(() => new Set(lignes.map((l: any) => l.code)), [lignes]);
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
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    const num = (name: string) => {
      const val = formData.get(name);
      return val ? parseFloat(val.toString()) || 0 : 0;
    };

    const champsAbsences = {
      salaire_base_theorique: num("salaire_base_theorique") || salarie.salaire_base_theorique,
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
      bulletin_id: resultat?.bulletin_id ?? 0,
      annee,
      mois,
    });
    setEstEnregistre(false); // Any manual input change marks it as unsaved
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 300);
  };

  // Debounced auto-calcul callback
  const debouncedCalcul = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        executerCalculLive();
      }, 350);
    };
  }, [lignes, parametres, annee, mois]);

  // Run initial calculation when form mounts or lines change
  useEffect(() => {
    executerCalculLive();
  }, [formKey, lignes.length]);

  function ajouterRubrique(r: RubriqueCatalogue) {
    setLignes((prev) => {
      const next = [...prev, ligneVide(r)];
      // Auto-sort rubriques by code in ascending order
      return next.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
    });
    setRecherche("");
    ajouterRubriqueSalarie(salarie.id, r.code).catch((e) => {
      setErreur(e instanceof Error ? e.message : "Erreur lors de l'ajout de la rubrique");
    });
  }

  function retirerRubrique(code: string) {
    setLignes((prev) => prev.filter((l) => l.code !== code));
    retirerRubriqueSalarie(salarie.id, code).catch((e) => {
      setErreur(e instanceof Error ? e.message : "Erreur lors du retrait de la rubrique");
    });
  }

  function onCharger() {
    setErreur(null);
    setMessageCharge(null);
    startTransition(async () => {
      try {
        const donnees = await chargerBulletinPourSaisie(salarie.id, annee, mois);
        if (!donnees) {
          setInitialValues({});
          setStatut("Brouillon");
          setLignes((prev) => prev.map((l) => ({ ...l, valeur_1: 0, valeur_2: 0 })));
          setResultat(null);
          setFormKey((k) => k + 1);
          setEstEnregistre(false);
          setMessageCharge(
            "Aucun bulletin enregistré pour cette période — les rubriques de ce salarié sont conservées, valeurs remises à zéro.",
          );
          return;
        }

        const champs = { ...donnees.champs };
        for (const nom of CHAMPS_TAUX_NOMS) {
          champs[nom] = (champs[nom] ?? 0) * 100;
        }

        const lignesChargees: LigneEtat[] = donnees.rubriques.map((r) => ({
          code: r.code,
          libelle: r.libelle,
          categorie: r.categorie,
          valeur_1: r.categorie === "pourcentage" ? r.valeur_1 * 100 : r.valeur_1,
          valeur_2: r.valeur_2,
        })).sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));

        const codesCharges = new Set(lignesChargees.map((l) => l.code));
        const lignesConservees = lignes
          .filter((l) => !codesCharges.has(l.code))
          .map((l) => ({ ...l, valeur_1: 0, valeur_2: 0 }));

        setInitialValues(champs);
        setStatut(donnees.statut || "Brouillon");
        setLignes([...lignesChargees, ...lignesConservees]);
        setFormKey((k) => k + 1);
        setEstEnregistre(true);
        setMessageCharge("Bulletin chargé avec succès.");
      } catch (e) {
        setErreur(e instanceof Error ? e.message : "Erreur au chargement du bulletin");
      }
    });
  }

  function handleCopierMoisPrecedent() {
    setErreur(null);
    setMessageCharge(null);
    const prevMois = mois === 1 ? 12 : mois - 1;
    const prevAnnee = mois === 1 ? annee - 1 : annee;

    startTransition(async () => {
      try {
        const donnees = await chargerBulletinPourSaisie(salarie.id, prevAnnee, prevMois);
        if (!donnees) {
          setErreur(`Aucun bulletin trouvé pour le mois précédent (${MOIS[prevMois - 1]} ${prevAnnee}).`);
          return;
        }

        const champs = { ...donnees.champs };
        for (const nom of CHAMPS_TAUX_NOMS) {
          champs[nom] = (champs[nom] ?? 0) * 100;
        }

        const lignesChargees: LigneEtat[] = donnees.rubriques.map((r) => ({
          code: r.code,
          libelle: r.libelle,
          categorie: r.categorie,
          valeur_1: r.categorie === "pourcentage" ? r.valeur_1 * 100 : r.valeur_1,
          valeur_2: r.valeur_2,
        })).sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));

        setInitialValues(champs);
        setLignes(lignesChargees);
        setFormKey((k) => k + 1);
        setEstEnregistre(false); // Copied data is not saved yet for the target month
        setMessageCharge(
          `Données copiées depuis ${MOIS[prevMois - 1]} ${prevAnnee}. Modifiez-les puis enregistrez le bulletin.`
        );
      } catch (e) {
        setErreur(e instanceof Error ? e.message : "Erreur lors de la copie");
      }
    });
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreur(null);
    setMessageCharge(null);

    const formData = new FormData(e.currentTarget);

    for (const nom of CHAMPS_TAUX_POURCENTAGE) {
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
        const r = await creerBulletin(salarie.id, formData);
        setResultat(r);
        setEstEnregistre(true);
        setMessageCharge("Le bulletin a été enregistré avec succès en base de données.");
      } catch (e) {
        setErreur(e instanceof Error ? e.message : "Erreur inconnue");
      }
    });
  }

  const handleCloturer = async () => {
    if (!resultat?.bulletin_id) return;
    setErreur(null);
    startTransition(async () => {
      try {
        await cloturerBulletin(salarie.id, annee, mois);
        setStatut("Clôturé");
        setMessageCharge("Le bulletin a été validé et clôturé définitivement.");
      } catch (e) {
        setErreur(e instanceof Error ? e.message : "Erreur lors de la clôture");
      }
    });
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <form key={formKey} onSubmit={onSubmit} onChange={debouncedCalcul} ref={formRef} className="space-y-5">
        {/* Loading / Action panel */}
        <div className="card">
          <div className="grid grid-cols-2 gap-3">
            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="annee">Année</label>
              <input
                id="annee"
                name="annee"
                type="number"
                value={annee}
                onChange={(e) => setAnnee(parseInt(e.target.value, 10) || now.getFullYear())}
                required
              />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="mois">Mois</label>
              <select
                id="mois"
                name="mois"
                value={mois}
                onChange={(e) => setMois(parseInt(e.target.value, 10))}
                required
              >
                {MOIS.map((m, i) => (
                  <option key={i} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: "var(--s2)", flexWrap: "wrap", marginTop: "var(--s3)" }}>
            <button
              type="button"
              onClick={onCharger}
              disabled={isPending}
              className="btn btn-secondary btn-sm"
              style={{ flex: 1 }}
            >
              Charger ce mois
            </button>
            <button
              type="button"
              onClick={handleCopierMoisPrecedent}
              disabled={isPending || isReadOnly}
              className="btn btn-secondary btn-sm"
              style={{ flex: 1 }}
              title="Copier les données saisies le mois précédent"
            >
              Copier mois précédent
            </button>
          </div>
          {messageCharge && (
            <p style={{ fontSize: "var(--txs)", color: "var(--text-muted)", marginTop: "var(--s2)" }}>
              {messageCharge}
            </p>
          )}
        </div>

        <Section titre="Salaire de Base">
          <div className="field" style={{ marginBottom: 0, gridColumn: "span 2" }}>
            <label htmlFor="salaire_base_theorique">Salaire de base théorique (DA)</label>
            <input
              id="salaire_base_theorique"
              name="salaire_base_theorique"
              type="number"
              step="0.01"
              defaultValue={initialValues["salaire_base_theorique"] ?? salarie.salaire_base_theorique}
              style={{ fontWeight: "bold" }}
              disabled={isReadOnly}
            />
          </div>
        </Section>

        <Section titre="Absences (heures) — réduisent le salaire">
          {CHAMPS_ABSENCES.map((c) => (
            <Champ key={c.name} {...c} defaultValue={initialValues[c.name] ?? 0} disabled={isReadOnly} />
          ))}
        </Section>

        <Section titre="Heures supplémentaires">
          {CHAMPS_HEURES_SUP.map((c) => (
            <Champ key={c.name} {...c} defaultValue={initialValues[c.name] ?? 0} disabled={isReadOnly} />
          ))}
        </Section>

        {/* Champs masqués pour préserver la compatibilité et les valeurs existantes */}
        {CHAMPS_PRIMES_MONTANT.map((c) => (
          <input key={c.name} type="hidden" name={c.name} value={initialValues[c.name] ?? 0} />
        ))}
        {CHAMPS_PRIMES_POURCENTAGE.map((c) => (
          <input key={c.name} type="hidden" name={c.name} value={initialValues[c.name] ?? 0} />
        ))}
        {CHAMPS_RETENUES.map((c) => (
          <input key={c.name} type="hidden" name={c.name} value={initialValues[c.name] ?? 0} />
        ))}

        {/* Custom Rubrics Section */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--s3)" }}>
            <h3>Primes, indemnités et retenues — catalogue</h3>
            <Link href={`/salaries/${salarie.id}/rubriques`} style={{ fontSize: "var(--txs)" }}>
              Gérer les rubriques par défaut →
            </Link>
          </div>

          <div style={{ position: "relative", marginBottom: "var(--s3)" }}>
            <input
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder={isReadOnly ? "Dossier verrouillé — modification interdite" : "+ Ajouter une rubrique — rechercher par code ou libellé..."}
              disabled={isReadOnly}
            />
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

          {lignes.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {lignes.map((l) => (
                <ChampRubriqueDynamique key={l.code} ligne={l} onRetirer={() => retirerRubrique(l.code)} disabled={isReadOnly} />
              ))}
            </div>
          ) : (
            <p style={{ fontSize: "var(--txs)", color: "var(--text-muted)" }}>
              Aucune rubrique pour ce bulletin. Utilisez la recherche ci-dessus pour en ajouter.
            </p>
          )}
        </div>

        {erreur && (
          <p className="badge badge-red" style={{ display: "block", width: "fit-content" }}>
            {erreur}
          </p>
        )}

        {statut === "Clôturé" ? (
          <div className="badge badge-teal" style={{ display: "block", width: "fit-content", padding: "8px 12px", fontSize: "12px", marginTop: "var(--s2)" }}>
            ✓ Ce bulletin est validé et clôturé (lecture seule)
          </div>
        ) : userRole === "Directeur" ? (
          <div className="badge badge-secondary" style={{ display: "block", width: "fit-content", padding: "8px 12px", fontSize: "12px", marginTop: "var(--s2)" }}>
            Accès Directeur (lecture seule)
          </div>
        ) : (
          <button type="submit" disabled={isPending} className="btn btn-primary">
            {isPending ? "Enregistrement..." : "Enregistrer le bulletin"}
          </button>
        )}

        {userRole === "Responsable RH" && statut === "Brouillon" && estEnregistre && (
          <button
            type="button"
            onClick={handleCloturer}
            disabled={isPending}
            className="btn"
            style={{ display: "block", width: "100%", marginTop: "var(--s2)", background: "var(--teal-700)", color: "white", borderColor: "var(--teal-700)", fontWeight: "bold" }}
          >
            {isPending ? "Clôture..." : "✓ Valider & Clôturer la paie du mois"}
          </button>
        )}
      </form>

      {/* Right side: Live Calculation Results Panel */}
      <div>
        {resultat ? (
          <div
            className="bulletin"
            style={{
              position: "sticky",
              top: "var(--s6)",
              transition: "box-shadow 0.3s ease, border-color 0.3s ease",
              borderColor: flashActive ? "var(--green-600)" : "var(--border)",
              boxShadow: flashActive ? "0 0 15px rgba(22, 163, 74, 0.2)" : "var(--shmd)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--s5)" }}>
              <div>
                <h2>Calcul en direct</h2>
                <p style={{ color: "var(--text-muted)", marginTop: 4 }}>{salarie.nom_prenom}</p>
              </div>
              <span className="badge badge-accent">
                {MOIS[resultat.mois - 1]} {resultat.annee}
              </span>
            </div>

            <LigneSection titre="Gains">
              <Ligne label="Salaire de base théorique" valeur={salarie.salaire_base_theorique} />
              <Ligne label="Heures travaillées" valeur={resultat.heures_travaillees} unite="" />
              <Ligne label="Salaire de base réel" valeur={resultat.salaire_base_reel} />
              <Ligne label="Heures sup. (montant)" valeur={resultat.total_heures_sup_da} />
              <Ligne label="Rubriques dynamiques — gains" valeur={resultat.total_rubriques_gains_da} />
              <Ligne label="Rubriques dynamiques — retenues" valeur={-resultat.total_rubriques_retenues_da} />
              <Ligne label="Total des gains" valeur={resultat.total_gains} gras />
            </LigneSection>

            <LigneSection titre="Cotisations et impôt">
              <Ligne label="Base CNAS" valeur={resultat.base_cnas} />
              <Ligne label="Retenue CNAS (9%)" valeur={-resultat.retenue_cnas} />
              <Ligne label="Base imposable IRG" valeur={resultat.base_imposable_irg} />
              <Ligne label="IRG brut" valeur={resultat.irg_brut} />
              <Ligne label="Abattement IRG" valeur={resultat.abattement_irg} />
              <Ligne label="Retenue IRG nette" valeur={-resultat.retenue_irg_nette} />
              <Ligne label="Total des retenues" valeur={-resultat.total_retenues} gras />
            </LigneSection>

            <div className="bulletin-total">
              <span>NET À PAYER</span>
              <strong style={{ transition: "color 0.2s", color: flashActive ? "var(--green-600)" : "var(--marine-900)" }}>
                {formatDA(resultat.net_a_payer)}
              </strong>
            </div>
            <div style={{ marginTop: "var(--s2)", marginBottom: "var(--s4)" }}>
              <Ligne label="Coût total employeur" valeur={resultat.cout_total_employeur} />
            </div>

            {/* Save notice & Action PDF buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--s2)", marginTop: "var(--s5)" }}>
              {estEnregistre ? (
                <>
                  <a
                    href={`/salaries/${salarie.id}/bulletin/pdf?annee=${resultat.annee}&mois=${resultat.mois}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                  >
                    Télécharger le PDF (bulletin salarié)
                  </a>
                  <a
                    href={`/salaries/${salarie.id}/bulletin/pdf?annee=${resultat.annee}&mois=${resultat.mois}&variante=employeur`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                  >
                    Voir la variante employeur (avec charges patronales)
                  </a>
                  <Link
                    href={`/salaries/${salarie.id}/bulletin/explication?annee=${resultat.annee}&mois=${resultat.mois}`}
                    className="btn btn-secondary"
                    style={{ textAlign: "center" }}
                  >
                    Voir l&apos;explication détaillée du calcul
                  </Link>
                </>
              ) : (
                <div
                  className="card"
                  style={{
                    border: "1px dashed var(--amber)",
                    background: "var(--amber-bg)",
                    color: "var(--amber)",
                    fontSize: "var(--txs)",
                    fontWeight: 600,
                    textAlign: "center",
                    padding: "var(--s3)",
                  }}
                >
                  Modifié. Cliquez sur le bouton "Enregistrer le bulletin" pour activer l'export PDF et les explications.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div
            className="card"
            style={{ borderStyle: "dashed", color: "var(--text-muted)", fontSize: "var(--tsm)" }}
          >
            Le détail du bulletin (net à payer, IRG, CNAS...) apparaîtra ici après le calcul.
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <h3 style={{ marginBottom: "var(--s3)" }}>{titre}</h3>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function Champ({
  name,
  label,
  placeholder,
  defaultValue = 0,
  disabled = false,
}: {
  name: string;
  label: string;
  placeholder?: string;
  defaultValue?: number;
  disabled?: boolean;
}) {
  return (
    <div className="field" style={{ marginBottom: 0 }}>
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type="number"
        step="0.01"
        defaultValue={defaultValue}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  );
}

function ChampRubriqueDynamique({ ligne, onRetirer, disabled = false }: { ligne: LigneEtat; onRetirer: () => void; disabled?: boolean }) {
  const libelle = `${ligne.code} — ${ligne.libelle ?? ""}`;

  const boutonRetirer = !disabled && (
    <button
      type="button"
      onClick={onRetirer}
      title="Retirer cette rubrique"
      style={{
        background: "none",
        border: "none",
        color: "var(--red-500, #dc2626)",
        cursor: "pointer",
        fontSize: "var(--tsm)",
        lineHeight: 1,
        padding: "0 4px",
      }}
    >
      ×
    </button>
  );

  if (ligne.categorie === "nombre_x_taux") {
    return (
      <div
        className="col-span-2 grid grid-cols-2 gap-2"
        style={{ borderTop: "var(--hairline)", paddingTop: "var(--s2)" }}
      >
        <label
          className="col-span-2"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "var(--t2xs)",
            fontWeight: 700,
            color: "var(--text-2)",
            textTransform: "uppercase",
            letterSpacing: ".04em",
          }}
        >
          <span>{libelle}</span>
          {boutonRetirer}
        </label>
        <div className="field" style={{ marginBottom: 0 }}>
          <input
            name={`dyn_${ligne.code}_v1`}
            type="number"
            step="0.01"
            defaultValue={ligne.valeur_1}
            placeholder="Nombre"
            disabled={disabled}
          />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <input
            name={`dyn_${ligne.code}_v2`}
            type="number"
            step="0.01"
            defaultValue={ligne.valeur_2}
            placeholder="Taux / forfait unitaire"
            disabled={disabled}
          />
        </div>
      </div>
    );
  }

  const placeholder =
    ligne.categorie === "pourcentage"
      ? "ex: 2.5 pour 2,5%"
      : ligne.categorie === "regularisation"
        ? "Montant signé (+/-)"
        : "Montant (DA)";

  return (
    <div className="field" style={{ marginBottom: 0 }}>
      <label
        htmlFor={`dyn_${ligne.code}_v1`}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
      >
        <span>{libelle}</span>
        {boutonRetirer}
      </label>
      <input
        id={`dyn_${ligne.code}_v1`}
        name={`dyn_${ligne.code}_v1`}
        type="number"
        step="0.01"
        defaultValue={ligne.valeur_1}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  );
}

function LigneSection({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "var(--s4)" }}>
      <h3 style={{ marginBottom: "var(--s2)" }}>{titre}</h3>
      <dl style={{ display: "flex", flexDirection: "column", gap: "6px" }}>{children}</dl>
    </div>
  );
}

function Ligne({
  label,
  valeur,
  unite = " DA",
  gras = false,
  large = false,
}: {
  label: string;
  valeur: number;
  unite?: string;
  gras?: boolean;
  large?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: large ? "var(--tmd)" : "var(--tsm)",
        fontWeight: gras ? 700 : 400,
        color: "var(--text)",
      }}
    >
      <dt style={{ color: gras ? "var(--text)" : "var(--text-2)" }}>{label}</dt>
      <dd>{unite === " DA" ? formatDA(valeur) : valeur.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/[\u202F\u00A0]/g, ' ')}</dd>
    </div>
  );
}
