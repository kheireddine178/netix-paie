"use client";

import { useMemo, useState, useTransition } from "react";
import { assignerRubriquesSalarie } from "../../actions";
import type { RubriqueAssignee, RubriqueCatalogue } from "../../actions";

const LABELS_CATEGORIE: Record<string, string> = {
  pourcentage: "% d'une base",
  nombre_x_taux: "Nombre × taux",
  montant_fixe: "Montant fixe",
  regularisation: "Régularisation (+/-)",
};

const BADGE_CATEGORIE: Record<string, string> = {
  pourcentage: "badge-teal",
  nombre_x_taux: "badge-accent",
  montant_fixe: "badge-amber",
  regularisation: "badge-red",
};

export default function RubriquesForm({
  salarieId,
  catalogue,
  assignees,
}: {
  salarieId: number;
  catalogue: RubriqueCatalogue[];
  assignees: RubriqueAssignee[];
}) {
  const valeursDefautInitiales = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of assignees) m.set(a.code, a.valeur_defaut);
    return m;
  }, [assignees]);

  const [coches, setCoches] = useState<Set<string>>(new Set(assignees.map((a) => a.code)));
  const [recherche, setRecherche] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtre = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return catalogue;
    return catalogue.filter(
      (r) => r.code.toLowerCase().includes(q) || (r.libelle ?? "").toLowerCase().includes(q),
    );
  }, [catalogue, recherche]);

  function toggle(code: string) {
    setCoches((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  function onSubmit(formData: FormData) {
    setMessage(null);
    setErreur(null);
    startTransition(async () => {
      try {
        await assignerRubriquesSalarie(salarieId, formData);
        setMessage("Rubriques enregistrées.");
      } catch (e) {
        setErreur(e instanceof Error ? e.message : "Erreur inconnue");
      }
    });
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <div
        className="card"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--s4)",
          position: "sticky",
          top: "var(--s4)",
          zIndex: 10,
        }}
      >
        <div className="field" style={{ marginBottom: 0, flex: 1 }}>
          <label htmlFor="recherche">Rechercher</label>
          <input
            id="recherche"
            type="text"
            placeholder="Code ou libellé..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />
        </div>
        <span className="badge badge-accent" style={{ whiteSpace: "nowrap" }}>
          {coches.size} sélectionnée{coches.size > 1 ? "s" : ""} / {catalogue.length}
        </span>
      </div>

      <div className="table-wrap" style={{ maxHeight: "60vh", overflowY: "auto" }}>
        {filtre.length === 0 ? (
          <p style={{ padding: "var(--s4)", fontSize: "var(--tsm)", color: "var(--text-muted)" }}>
            Aucune rubrique ne correspond à cette recherche.
          </p>
        ) : (
          <table>
            <tbody>
              {filtre.map((r) => {
                const estCoche = coches.has(r.code);
                return (
                  <tr key={r.code}>
                    <td style={{ width: 32 }}>
                      <input
                        type="checkbox"
                        name={`rub_${r.code}`}
                        checked={estCoche}
                        onChange={() => toggle(r.code)}
                        style={{ width: 16, height: 16 }}
                      />
                    </td>
                    <td>
                      <span
                        style={{
                          fontFamily: "var(--mono)",
                          fontSize: "var(--t2xs)",
                          color: "var(--text-muted)",
                          marginRight: "var(--s2)",
                        }}
                      >
                        {r.code}
                      </span>
                      <span style={{ color: "var(--text)" }}>{r.libelle ?? "—"}</span>
                    </td>
                    <td>
                      <span className={`badge ${BADGE_CATEGORIE[r.categorie] ?? "badge-accent"}`}>
                        {LABELS_CATEGORIE[r.categorie] ?? r.categorie}
                        {r.type_valeur ? ` · ${r.type_valeur}` : ""}
                      </span>
                    </td>
                    <td style={{ width: 160 }}>
                      {estCoche && (
                        <input
                          type="number"
                          step="0.01"
                          name={`defaut_${r.code}`}
                          defaultValue={valeursDefautInitiales.get(r.code) ?? 0}
                          placeholder="Valeur par défaut"
                          style={{
                            width: "100%",
                            padding: "6px 10px",
                            borderRadius: "var(--r)",
                            border: "1px solid var(--border)",
                            fontSize: "var(--txs)",
                          }}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {message && <p className="badge badge-green" style={{ width: "fit-content" }}>{message}</p>}
      {erreur && <p className="badge badge-red" style={{ width: "fit-content" }}>{erreur}</p>}

      <button type="submit" disabled={isPending} className="btn btn-primary">
        {isPending ? "Enregistrement..." : "Enregistrer les rubriques"}
      </button>
    </form>
  );
}
