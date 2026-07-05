"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { creerBulletin } from "../../actions";
import type { ResultatBulletin, RubriqueAssignee, Salarie } from "../../actions";

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

const CHAMPS_PRIMES = [
  { name: "icr", label: "I.C.R (montant DA)" },
  { name: "taux_iep", label: "Taux I.E.P (ex: 0.05 = 5%)" },
  { name: "taux_nuisance", label: "Taux nuisance" },
  { name: "taux_responsabilite", label: "Taux responsabilité" },
  { name: "taux_disponibilite", label: "Taux disponibilité" },
  { name: "taux_pri", label: "Taux P.R.I" },
  { name: "taux_prc", label: "Taux P.R.C" },
  { name: "panier_jours", label: "Panier — nombre de jours" },
  { name: "panier_forfait_jour", label: "Panier — forfait/jour (DA)" },
  { name: "autre_prime_fixe", label: "Autre prime fixe (DA)" },
];

const CHAMPS_RETENUES = [
  { name: "cotis_mutuelle", label: "Cotisation mutuelle (DA)" },
  { name: "autres_retenues", label: "Autres retenues (DA)" },
];

function formatDA(n: number) {
  return n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }) + " DA";
}

export default function BulletinForm({
  salarie,
  rubriquesAssignees,
}: {
  salarie: Salarie;
  rubriquesAssignees: RubriqueAssignee[];
}) {
  const [resultat, setResultat] = useState<ResultatBulletin | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const now = new Date();

  function onSubmit(formData: FormData) {
    setErreur(null);
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
      <form action={onSubmit} className="space-y-5">
        <div className="card">
          <div className="grid grid-cols-2 gap-3">
            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="annee">Année</label>
              <input id="annee" name="annee" type="number" defaultValue={now.getFullYear()} required />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="mois">Mois</label>
              <select id="mois" name="mois" defaultValue={now.getMonth() + 1} required>
                {MOIS.map((m, i) => (
                  <option key={i} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <Section titre="Absences">
          {CHAMPS_ABSENCES.map((c) => (
            <Champ key={c.name} {...c} />
          ))}
        </Section>

        <Section titre="Heures supplémentaires">
          {CHAMPS_HEURES_SUP.map((c) => (
            <Champ key={c.name} {...c} />
          ))}
        </Section>

        <Section titre="Primes et indemnités">
          {CHAMPS_PRIMES.map((c) => (
            <Champ key={c.name} {...c} />
          ))}
        </Section>

        <Section titre="Retenues additionnelles">
          {CHAMPS_RETENUES.map((c) => (
            <Champ key={c.name} {...c} />
          ))}
        </Section>

        {rubriquesAssignees.length > 0 ? (
          <div className="card">
            <h3 style={{ marginBottom: "var(--s3)" }}>
              Rubriques du catalogue ({rubriquesAssignees.length})
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {rubriquesAssignees.map((r) => (
                <ChampRubriqueDynamique key={r.code} rubrique={r} />
              ))}
            </div>
          </div>
        ) : (
          <p style={{ fontSize: "var(--txs)", color: "var(--text-muted)" }}>
            Aucune rubrique du catalogue n&apos;est cochée pour ce salarié.{" "}
            <Link href={`/salaries/${salarie.id}/rubriques`}>
              Configurer les rubriques →
            </Link>
          </p>
        )}

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

function Champ({ name, label }: { name: string; label: string }) {
  return (
    <div className="field" style={{ marginBottom: 0 }}>
      <label htmlFor={name}>{label}</label>
      <input id={name} name={name} type="number" step="0.01" defaultValue={0} />
    </div>
  );
}

/**
 * Champ(s) de saisie pour une rubrique dynamique du catalogue, adaptés à sa catégorie
 * (étape 7) :
 *   - pourcentage / montant_fixe / regularisation : 1 champ (dyn_<code>_v1)
 *   - nombre_x_taux : 2 champs (dyn_<code>_v1 = nombre, dyn_<code>_v2 = taux/forfait)
 */
function ChampRubriqueDynamique({ rubrique }: { rubrique: RubriqueAssignee }) {
  const libelle = `${rubrique.code} — ${rubrique.libelle ?? ""}`;

  if (rubrique.categorie === "nombre_x_taux") {
    return (
      <div
        className="col-span-2 grid grid-cols-2 gap-2"
        style={{ borderTop: "var(--hairline)", paddingTop: "var(--s2)" }}
      >
        <label
          className="col-span-2"
          style={{ fontSize: "var(--t2xs)", fontWeight: 700, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: ".04em" }}
        >
          {libelle}
        </label>
        <div className="field" style={{ marginBottom: 0 }}>
          <input
            name={`dyn_${rubrique.code}_v1`}
            type="number"
            step="0.01"
            defaultValue={rubrique.valeur_defaut || 0}
            placeholder="Nombre"
          />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <input
            name={`dyn_${rubrique.code}_v2`}
            type="number"
            step="0.01"
            defaultValue={0}
            placeholder="Taux / forfait unitaire"
          />
        </div>
      </div>
    );
  }

  const placeholder =
    rubrique.categorie === "pourcentage"
      ? "Taux (ex: 0.05 = 5%)"
      : rubrique.categorie === "regularisation"
        ? "Montant signé (+/-)"
        : "Montant (DA)";

  return (
    <div className="field" style={{ marginBottom: 0 }}>
      <label htmlFor={`dyn_${rubrique.code}_v1`}>{libelle}</label>
      <input
        id={`dyn_${rubrique.code}_v1`}
        name={`dyn_${rubrique.code}_v1`}
        type="number"
        step="0.01"
        defaultValue={rubrique.valeur_defaut || 0}
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
