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
    <>
      <div
        className="page-header"
        style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}
      >
        <div>
          <h1>Rubriques du catalogue — {salarie.nom_prenom}</h1>
          <p>
            Cochez les rubriques du catalogue ({catalogue.length} codes) applicables à ce salarié.
            Elles apparaîtront ensuite comme champs de saisie sur la page de bulletin mensuel. La
            « valeur par défaut » est facultative : elle pré-remplit le champ chaque mois (vous
            pouvez toujours la modifier au moment de la saisie du bulletin).
          </p>
        </div>
        <Link href={`/salaries/${salarie.id}`} className="btn btn-secondary btn-sm">
          ← Retour au Profil
        </Link>
      </div>

      <RubriquesForm salarieId={salarie.id} catalogue={catalogue} assignees={assignees} />
    </>
  );
}
