"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { creerBulletin, chargerBulletinPourSaisie, ajouterRubriqueSalarie, retirerRubriqueSalarie } from "../../actions";
import type {
  ResultatBulletin,
  RubriqueAssignee,
  RubriqueCatalogue,
  Salarie,
} from "../../actions";

const MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

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

// Champs saisis en DA / nombre, envoyés tels quels au serveur.
const CHAMPS_PRIMES_MONTANT = [
  { name: "icr", label: "I.C.R (montant DA)" },
  { name: "panier_jours", label: "Panier — nombre de jours" },
  { name: "panier_forfait_jour", label: "Panier — forfait/jour (DA)" },
  { name: "autre_prime_fixe", label: "Autre prime fixe (DA)" },
];

/**
 * Champs de taux saisis EN POURCENTAGE COURANT (ex: taper "2.5" pour 2,5%), convertis
 * en fraction (0.025) juste avant l'envoi au serveur — voir CHAMPS_TAUX_POURCENTAGE et
 * la transformation dans onSubmit() ci-dessous. Le moteur de calcul (lib/paieCalcul.ts)
 * continue, lui, de recevoir et d'utiliser des fractions, exactement comme avant.
 */
const CHAMPS_PRIMES_POURCENTAGE = [
  { name: "taux_iep", label: "Taux I.E.P (%)" },
  { name: "taux_nuisance", label: "Taux nuisance (%)" },
  { name: "taux_responsabilite", label: "Taux responsabilité (%)" },
  { name: "taux_disponibilite", label: "Taux disponibilité (%)" },
  { name: "taux_pri", label: "Taux P.R.I (%)" },
  { name: "taux_prc", label: "Taux P.R.C (%)" },
];

const CHAMPS_TAUX_POURCENTAGE = new Set(CHAMPS_PRIMES_POURCENTAGE.map((c) => c.name));

const CHAMPS_RETENUES = [
  { name: "cotis_mutuelle", label: "Cotisation mutuelle (DA)" },
  { name: "autres_retenues", label: "Autres retenues (DA)" },
];

function formatDA(n: number) {
  return n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }) + " DA";
}

/** Une ligne de rubrique dynamique affichée dans le formulaire (préassignée ou ajoutée
 * à la volée depuis la recherche). Les valeurs sont celles à afficher par défaut dans
 * les champs (déjà converties en pourcentage courant pour la catégorie "pourcentage"). */
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

const CHAMPS_TAUX_NOMS = CHAMPS_PRIMES_POURCENTAGE.map((c) => c.name);

export default function BulletinForm({
  salarie,
  rubriquesAssignees,
  catalogueRubriques,
}: {
  salarie: Salarie;
  rubriquesAssignees: RubriqueAssignee[];
  catalogueRubriques: RubriqueCatalogue[];
}) {
  const [resultat, setResultat] = useState<ResultatBulletin | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [messageCharge, setMessageCharge] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const now = new Date();
  const [annee, setAnnee] = useState(now.getFullYear());
  const [mois, setMois] = useState(now.getMonth() + 1);

  // "formKey" force un remontage complet du formulaire (donc de tous les champs
  // defaultValue) uniquement quand on charge un bulletin existant. Ajouter/retirer une
  // rubrique via la recherche, en revanche, ne remonte pas les autres champs.
  const [formKey, setFormKey] = useState(0);
  const [initialValues, setInitialValues] = useState<Record<string, number>>({});
  const [lignes, setLignes] = useState<LigneEtat[]>(() => rubriquesAssignees.map(ligneDepuisAssignee));

  const [recherche, setRecherche] = useState("");

  const codesDejaAjoutes = useMemo(() => new Set(lignes.map((l) => l.code)), [lignes]);
  const resultatsRecherche = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return [];
    return catalogueRubriques
      .filter((r) => !codesDejaAjoutes.has(r.code))
      .filter((r) => r.code.toLowerCase().includes(q) || (r.libelle ?? "").toLowerCase().includes(q))
      .slice(0, 8);
  }, [recherche, catalogueRubriques, codesDejaAjoutes]);

  function ajouterRubrique(r: RubriqueCatalogue) {
    setLignes((prev) => [...prev, ligneVide(r)]);
    setRecherche("");
    // Rattache la rubrique au salarié en base : elle le suivra d'un mois à l'autre,
    // exactement comme dans la version Python — pas seulement le temps de cette page.
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
          // Aucun bulletin pour ce mois : on garde les rubriques déjà rattachées au
          // salarié (y compris celles ajoutées à la volée dans cette session), mais on
          // remet leurs valeurs à zéro puisque c'est un nouveau mois à saisir.
          setInitialValues({});
          setLignes((prev) => prev.map((l) => ({ ...l, valeur_1: 0, valeur_2: 0 })));
          setResultat(null);
          setFormKey((k) => k + 1);
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
        }));

        // Une rubrique rattachée au salarié mais non saisie ce mois-là (valeur nulle,
        // donc absente de bulletin_rubriques) doit quand même apparaître, à zéro, plutôt
        // que de disparaître du formulaire.
        const codesCharges = new Set(lignesChargees.map((l) => l.code));
        const lignesConservees = lignes
          .filter((l) => !codesCharges.has(l.code))
          .map((l) => ({ ...l, valeur_1: 0, valeur_2: 0 }));

        setInitialValues(champs);
        setLignes([...lignesChargees, ...lignesConservees]);
        setResultat(null);
        setFormKey((k) => k + 1);
        setMessageCharge("Bulletin chargé — modifiez les valeurs puis cliquez sur Calculer pour mettre à jour.");
      } catch (e) {
        setErreur(e instanceof Error ? e.message : "Erreur au chargement du bulletin");
      }
    });
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreur(null);
    setMessageCharge(null);

    // On construit la FormData nous-mêmes et on empêche la soumission native : React
    // réinitialise automatiquement les champs d'un <form action={...}> après succès,
    // ce qui effaçait toute la saisie après chaque calcul. Avec onSubmit + preventDefault,
    // les valeurs tapées restent affichées et modifiables pour un nouveau calcul.
    const formData = new FormData(e.currentTarget);

    // Convertit les taux saisis en pourcentage courant (ex: 2.5 pour 2,5%) en fraction
    // (0.025) attendue par le moteur de calcul, sans toucher à celui-ci.
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
      } catch (e) {
        setErreur(e instanceof Error ? e.message : "Erreur inconnue");
      }
    });
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <form key={formKey} onSubmit={onSubmit} className="space-y-5">
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
          <button
            type="button"
            onClick={onCharger}
            disabled={isPending}
            className="btn btn-secondary btn-sm"
            style={{ marginTop: "var(--s3)" }}
          >
            {isPending ? "Chargement..." : "📂 Charger le bulletin de cette période"}
          </button>
          {messageCharge && (
            <p style={{ fontSize: "var(--txs)", color: "var(--text-muted)", marginTop: "var(--s2)" }}>
              {messageCharge}
            </p>
          )}
        </div>

        <Section titre="Absences">
          {CHAMPS_ABSENCES.map((c) => (
            <Champ key={c.name} {...c} defaultValue={initialValues[c.name] ?? 0} />
          ))}
        </Section>

        <Section titre="Heures supplémentaires">
          {CHAMPS_HEURES_SUP.map((c) => (
            <Champ key={c.name} {...c} defaultValue={initialValues[c.name] ?? 0} />
          ))}
        </Section>

        <Section titre="Primes et indemnités">
          {CHAMPS_PRIMES_MONTANT.map((c) => (
            <Champ key={c.name} {...c} defaultValue={initialValues[c.name] ?? 0} />
          ))}
          {CHAMPS_PRIMES_POURCENTAGE.map((c) => (
            <Champ
              key={c.name}
              {...c}
              defaultValue={initialValues[c.name] ?? 0}
              placeholder="ex: 2.5 pour 2,5%"
            />
          ))}
        </Section>

        <Section titre="Retenues additionnelles">
          {CHAMPS_RETENUES.map((c) => (
            <Champ key={c.name} {...c} defaultValue={initialValues[c.name] ?? 0} />
          ))}
        </Section>

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
              placeholder="+ Ajouter une rubrique — rechercher par code ou libellé..."
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
                  padding: "var(--s2)",
                  maxHeight: 260,
                  overflowY: "auto",
                }}
              >
                {resultatsRecherche.map((r) => (
                  <button
                    key={r.code}
                    type="button"
                    onClick={() => ajouterRubrique(r)}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "6px 8px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "var(--tsm)",
                    }}
                  >
                    <strong>{r.code}</strong> — {r.libelle}
                  </button>
                ))}
              </div>
            )}
          </div>

          {lignes.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {lignes.map((l) => (
                <ChampRubriqueDynamique key={l.code} ligne={l} onRetirer={() => retirerRubrique(l.code)} />
              ))}
            </div>
          ) : (
            <p style={{ fontSize: "var(--txs)", color: "var(--text-muted)" }}>
              Aucune rubrique pour ce bulletin. Utilisez la recherche ci-dessus pour en ajouter — sans limite.
            </p>
          )}
        </div>

        {erreur && (
          <p className="badge badge-red" style={{ display: "block", width: "fit-content" }}>
            {erreur}
          </p>
        )}

        <button type="submit" disabled={isPending} className="btn btn-primary">
          {isPending ? "Calcul en cours..." : "Calculer et enregistrer le bulletin"}
        </button>
      </form>

      <div>
        {resultat ? (
          <div className="bulletin" style={{ position: "sticky", top: "var(--s6)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--s5)" }}>
              <div>
                <h2>Bulletin de paie</h2>
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
              <strong>{formatDA(resultat.net_a_payer)}</strong>
            </div>
            <div style={{ marginTop: "var(--s2)" }}>
              <Ligne label="Coût total employeur" valeur={resultat.cout_total_employeur} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--s2)", marginTop: "var(--s5)" }}>
              <a
                href={`/salaries/${salarie.id}/bulletin/pdf?annee=${resultat.annee}&mois=${resultat.mois}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                📄 Télécharger le PDF (bulletin salarié)
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
                🔍 Voir l&apos;explication détaillée du calcul
              </Link>
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
}: {
  name: string;
  label: string;
  placeholder?: string;
  defaultValue?: number;
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
      />
    </div>
  );
}

/**
 * Champ(s) de saisie pour une rubrique dynamique (préassignée au salarié ou ajoutée à
 * la volée), adaptés à sa catégorie :
 *   - pourcentage : 1 champ, saisi EN POURCENTAGE COURANT (ex: 2.5 pour 2,5%) — converti
 *     en fraction dans onSubmit() avant l'envoi au serveur (dyn_<code>_v1)
 *   - montant_fixe / regularisation : 1 champ (dyn_<code>_v1), en DA, envoyé tel quel
 *   - nombre_x_taux : 2 champs (dyn_<code>_v1 = nombre, dyn_<code>_v2 = taux/forfait)
 * Un bouton "×" permet de retirer la ligne du bulletin (sans limite de rubriques
 * ajoutables au préalable via la recherche du catalogue).
 */
function ChampRubriqueDynamique({ ligne, onRetirer }: { ligne: LigneEtat; onRetirer: () => void }) {
  const libelle = `${ligne.code} — ${ligne.libelle ?? ""}`;

  const boutonRetirer = (
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
      ✕
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
          />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <input
            name={`dyn_${ligne.code}_v2`}
            type="number"
            step="0.01"
            defaultValue={ligne.valeur_2}
            placeholder="Taux / forfait unitaire"
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
      <dd>{unite === " DA" ? formatDA(valeur) : valeur.toLocaleString("fr-FR", { maximumFractionDigits: 2 })}</dd>
    </div>
  );
}
