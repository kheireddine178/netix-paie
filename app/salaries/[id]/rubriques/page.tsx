import { notFound } from "next/navigation";
import Link from "next/link";
import { getSalarie, listerCatalogueRubriques, listerRubriquesSalarie } from "../../actions";
import RubriquesForm from "./RubriquesForm";

export const dynamic = "force-dynamic";

export default async function RubriquesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const salarie = await getSalarie(parseInt(id, 10));
  if (!salarie) notFound();

  const [catalogue, assignees] = await Promise.all([
    listerCatalogueRubriques(),
    listerRubriquesSalarie(salarie.id),
  ]);

  return (
    <main className="p-8 max-w-4xl mx-auto font-sans">
      <div className="flex items-start justify-between mb-1">
        <h1 className="text-2xl font-bold">Rubriques du catalogue — {salarie.nom_prenom}</h1>
        <Link href={`/salaries/${salarie.id}/bulletin`} className="text-sm text-blue-600 hover:underline">
          ← Retour au bulletin
        </Link>
      </div>
      <p className="text-gray-500 mb-6 text-sm">
        Cochez les rubriques du catalogue (402 codes) applicables à ce salarié. Elles apparaîtront
        ensuite comme champs de saisie sur la page de bulletin mensuel. La &quot;valeur par défaut&quot;
        est facultative : elle pré-remplit le champ chaque mois (vous pouvez toujours la modifier au
        moment de la saisie du bulletin).
      </p>

      <RubriquesForm salarieId={salarie.id} catalogue={catalogue} assignees={assignees} />
    </main>
  );
}
