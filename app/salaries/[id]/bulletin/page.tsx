import { notFound } from "next/navigation";
import Link from "next/link";
import { getSalarie, listerRubriquesSalarie } from "../../actions";
import BulletinForm from "./BulletinForm";

export const dynamic = "force-dynamic";

export default async function BulletinPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const salarie = await getSalarie(parseInt(id, 10));

  if (!salarie) notFound();

  const rubriquesAssignees = await listerRubriquesSalarie(salarie.id);

  return (
    <main className="p-8 max-w-5xl mx-auto font-sans">
      <div className="flex items-start justify-between mb-1">
        <h1 className="text-2xl font-bold">Bulletin de paie — {salarie.nom_prenom}</h1>
        <Link href={`/salaries/${salarie.id}/rubriques`} className="text-sm text-blue-600 hover:underline">
          Configurer les rubriques du catalogue →
        </Link>
      </div>
      <p className="text-gray-500 mb-6">
        {salarie.fonction ?? "—"} · Salaire de base théorique :{" "}
        {salarie.salaire_base_theorique.toLocaleString("fr-FR")} DA
      </p>

      <BulletinForm salarie={salarie} rubriquesAssignees={rubriquesAssignees} />
    </main>
  );
}
