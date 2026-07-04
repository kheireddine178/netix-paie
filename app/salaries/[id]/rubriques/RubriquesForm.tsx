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
      <div className="flex items-center justify-between gap-4 sticky top-0 bg-white py-2 z-10 border-b">
        <input
          type="text"
          placeholder="Rechercher un code ou un libellé..."
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          className="border rounded px-3 py-2 flex-1"
        />
        <span className="text-sm text-gray-500 whitespace-nowrap">
          {coches.size} sélectionnée{coches.size > 1 ? "s" : ""} / {catalogue.length}
        </span>
      </div>

      <div className="border rounded divide-y max-h-[60vh] overflow-y-auto">
        {filtre.length === 0 ? (
          <p className="p-4 text-sm text-gray-400">Aucune rubrique ne correspond à cette recherche.</p>
        ) : (
          filtre.map((r) => {
            const estCoche = coches.has(r.code);
            return (
              <div key={r.code} className="p-3 flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  name={`rub_${r.code}`}
                  checked={estCoche}
                  onChange={() => toggle(r.code)}
                  className="w-4 h-4"
                />
                <div className="flex-1">
                  <span className="font-mono text-xs text-gray-500 mr-2">{r.code}</span>
                  <span>{r.libelle ?? "—"}</span>
                  <span className="ml-2 text-xs text-gray-400">
                    ({LABELS_CATEGORIE[r.categorie] ?? r.categorie}
                    {r.type_valeur ? ` · ${r.type_valeur}` : ""})
                  </span>
                </div>
                {estCoche && (
                  <input
                    type="number"
                    step="0.01"
                    name={`defaut_${r.code}`}
                    defaultValue={valeursDefautInitiales.get(r.code) ?? 0}
                    placeholder="Valeur par défaut"
                    className="w-36 border rounded px-2 py-1 text-xs"
                  />
                )}
              </div>
            );
          })
        )}
      </div>

      {message && <p className="text-green-700 text-sm">{message}</p>}
      {erreur && <p className="text-red-600 text-sm">{erreur}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 disabled:opacity-50"
      >
        {isPending ? "Enregistrement..." : "Enregistrer les rubriques"}
      </button>
    </form>
  );
}
