"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Parametres } from "@/lib/paieCalcul";
import { updateParametres, reinitialiserParametres } from "./actions";

export default function ParametresForm({ initial }: { initial: Parametres }) {
  const [parametres, setParametres] = useState<Parametres>(initial);
  const [bareme, setBareme] = useState<[number, number | null, number][]>(initial.bareme_irg);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  function updateBareme(idx: number, field: "de" | "a" | "taux", value: string) {
    setBareme((prev) => {
      const next = [...prev];
      const row = [...next[idx]] as [number, number | null, number];
      if (field === "de") row[0] = parseFloat(value) || 0;
      if (field === "a") row[1] = value === "" ? null : parseFloat(value) || 0;
      if (field === "taux") row[2] = parseFloat(value) || 0;
      next[idx] = row;
      return next;
    });
  }

  function handleSubmit(formData: FormData) {
    formData.set("bareme_irg_json", JSON.stringify(bareme));
    startTransition(async () => {
      const result = await updateParametres(formData);
      setParametres(result);
      setBareme(result.bareme_irg);
      setMessage("Paramètres enregistrés.");
      router.refresh();
    });
  }

  function handleReset() {
    if (!confirm("Réinitialiser tous les paramètres aux valeurs légales par défaut ?")) return;
    startTransition(async () => {
      const result = await reinitialiserParametres();
      setParametres(result);
      setBareme(result.bareme_irg);
      setMessage("Paramètres réinitialisés aux valeurs par défaut.");
      router.refresh();
    });
  }

  return (
    <>
      <div
        className="page-header"
        style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}
      >
        <div>
          <h1>Paramètres</h1>
          <p>Taux légaux et informations employeur. Modifiez ici en cas de changement de loi de finances.</p>
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleReset}
          disabled={isPending}
        >
          ↺ Réinitialiser les défauts
        </button>
      </div>

      {message && (
        <div className="card" style={{ borderColor: "var(--teal)", marginBottom: "var(--s4)" }}>
          <p style={{ color: "var(--teal-ink)" }}>{message}</p>
        </div>
      )}

      <form action={handleSubmit}>
        <div className="card" style={{ marginBottom: "var(--s5)" }}>
          <h3 style={{ marginBottom: "var(--s3)" }}>🏢 Informations employeur</h3>
          <p style={{ color: "var(--text-muted)", marginBottom: "var(--s4)" }}>
            Ces données figurent sur les bulletins PDF.
          </p>
          <div className="field">
            <label htmlFor="employeur_nom">Nom de l&apos;entreprise</label>
            <input
              id="employeur_nom"
              name="employeur_nom"
              defaultValue={parametres.employeur_nom}
              placeholder="Ex : SARL Atlas Industrie"
            />
          </div>
          <div className="field">
            <label htmlFor="employeur_adresse">Adresse</label>
            <input
              id="employeur_adresse"
              name="employeur_adresse"
              defaultValue={parametres.employeur_adresse}
              placeholder="Ex : Zone industrielle, Oran"
            />
          </div>
          <div style={{ display: "flex", gap: "var(--s3)" }}>
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="employeur_nif">NIF</label>
              <input id="employeur_nif" name="employeur_nif" defaultValue={parametres.employeur_nif} />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="employeur_nis">NIS</label>
              <input id="employeur_nis" name="employeur_nis" defaultValue={parametres.employeur_nis} />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="employeur_affiliation_cnas">Affiliation CNAS</label>
              <input
                id="employeur_affiliation_cnas"
                name="employeur_affiliation_cnas"
                defaultValue={parametres.employeur_affiliation_cnas}
              />
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: "var(--s5)" }}>
          <h3 style={{ marginBottom: "var(--s3)" }}>📊 SNMG, durée légale et cotisations</h3>
          <p style={{ color: "var(--text-muted)", marginBottom: "var(--s4)" }}>
            Valeurs définies par la loi de finances.
          </p>
          <div style={{ display: "flex", gap: "var(--s3)" }}>
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="snmg">SNMG mensuel (DA)</label>
              <input id="snmg" name="snmg" type="number" step="0.01" defaultValue={parametres.snmg} />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="duree_legale_mensuelle">Durée légale mensuelle (h)</label>
              <input
                id="duree_legale_mensuelle"
                name="duree_legale_mensuelle"
                type="number"
                step="0.01"
                defaultValue={parametres.duree_legale_mensuelle}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: "var(--s3)" }}>
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="taux_cnas_salarie">Taux CNAS salarié</label>
              <input
                id="taux_cnas_salarie"
                name="taux_cnas_salarie"
                type="number"
                step="0.0001"
                defaultValue={parametres.taux_cnas_salarie}
              />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="taux_cnas_employeur">Taux CNAS employeur</label>
              <input
                id="taux_cnas_employeur"
                name="taux_cnas_employeur"
                type="number"
                step="0.0001"
                defaultValue={parametres.taux_cnas_employeur}
              />
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: "var(--s5)" }}>
          <h3 style={{ marginBottom: "var(--s3)" }}>⏱️ Majorations heures supplémentaires</h3>
          <p style={{ color: "var(--text-muted)", marginBottom: "var(--s4)" }}>
            Coefficients multiplicateurs par palier.
          </p>
          <div style={{ display: "flex", gap: "var(--s3)" }}>
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="majoration_hs_1">Palier 1</label>
              <input
                id="majoration_hs_1"
                name="majoration_hs_1"
                type="number"
                step="0.01"
                defaultValue={parametres.majoration_hs_1}
              />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="majoration_hs_2">Palier 2</label>
              <input
                id="majoration_hs_2"
                name="majoration_hs_2"
                type="number"
                step="0.01"
                defaultValue={parametres.majoration_hs_2}
              />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="majoration_hs_3">Palier 3</label>
              <input
                id="majoration_hs_3"
                name="majoration_hs_3"
                type="number"
                step="0.01"
                defaultValue={parametres.majoration_hs_3}
              />
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: "var(--s5)" }}>
          <h3 style={{ marginBottom: "var(--s3)" }}>📈 Barème IRG — Art. 104 CIDTA</h3>
          <p style={{ color: "var(--text-muted)", marginBottom: "var(--s4)" }}>Tranches mensuelles en DA.</p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>De (DA)</th>
                  <th>À (DA)</th>
                  <th>Taux</th>
                </tr>
              </thead>
              <tbody>
                {bareme.map((t, i) => (
                  <tr key={i}>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        value={t[0]}
                        onChange={(e) => updateBareme(i, "de", e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type={t[1] === null ? "text" : "number"}
                        step="0.01"
                        value={t[1] === null ? "" : t[1]}
                        placeholder="illimité"
                        onChange={(e) => updateBareme(i, "a", e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.0001"
                        value={t[2]}
                        onChange={(e) => updateBareme(i, "taux", e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ marginBottom: "var(--s5)" }}>
          <h3 style={{ marginBottom: "var(--s3)" }}>🧮 Exonération et abattement IRG</h3>
          <p style={{ color: "var(--text-muted)", marginBottom: "var(--s4)" }}>Plafonds légaux mensuels.</p>
          <div style={{ display: "flex", gap: "var(--s3)" }}>
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="seuil_exoneration_irg">Seuil d&apos;exonération totale (DA/mois)</label>
              <input
                id="seuil_exoneration_irg"
                name="seuil_exoneration_irg"
                type="number"
                step="0.01"
                defaultValue={parametres.seuil_exoneration_irg}
              />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="taux_abattement_irg">Taux d&apos;abattement sur l&apos;IRG brut</label>
              <input
                id="taux_abattement_irg"
                name="taux_abattement_irg"
                type="number"
                step="0.0001"
                defaultValue={parametres.taux_abattement_irg}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: "var(--s3)" }}>
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="abattement_irg_min">Abattement minimum (DA/mois)</label>
              <input
                id="abattement_irg_min"
                name="abattement_irg_min"
                type="number"
                step="0.01"
                defaultValue={parametres.abattement_irg_min}
              />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="abattement_irg_max">Abattement maximum (DA/mois)</label>
              <input
                id="abattement_irg_max"
                name="abattement_irg_max"
                type="number"
                step="0.01"
                defaultValue={parametres.abattement_irg_max}
              />
            </div>
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={isPending}>
          💾 Enregistrer les paramètres
        </button>
      </form>
    </>
  );
}
