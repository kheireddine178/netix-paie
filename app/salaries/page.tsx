import Link from "next/link";
import { listerSalaries } from "./actions";

// Cette page dépend des données Supabase à jour (liste des salariés) :
// on la rend à chaque requête plutôt que de la figer au moment du build.
export const dynamic = "force-dynamic";

export default async function SalariesPage() {
  const salaries = await listerSalaries();

  return (
    <main className="p-8 max-w-3xl mx-auto font-sans">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Salariés</h1>
        <Link
          href="/salaries/nouveau"
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
        >
          + Ajouter un salarié
        </Link>
      </div>

      {salaries.length === 0 ? (
        <p className="text-gray-500">Aucun salarié pour l'instant.</p>
      ) : (
        <ul className="divide-y divide-gray-200 border rounded">
          {salaries.map((s) => (
            <li key={s.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold">{s.nom_prenom}</p>
                <p className="text-sm text-gray-500">
                  {s.fonction ?? "—"} · {s.salaire_base_theorique.toLocaleString("fr-FR")} DA
                  {s.matricule ? ` · Matricule ${s.matricule}` : ""}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Link
                  href={`/salaries/${s.id}/bulletin`}
                  className="text-blue-600 hover:underline text-sm"
                >
                  Saisir un bulletin →
                </Link>
                <Link
                  href={`/salaries/${s.id}/rubriques`}
                  className="text-gray-500 hover:underline text-xs"
                >
                  Configurer les rubriques
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
