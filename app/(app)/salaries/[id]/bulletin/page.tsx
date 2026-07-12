import { notFound } from "next/navigation";
import Link from "next/link";
import { getSalarie, listerRubriquesSalarie, listerCatalogueRubriques, getParametres } from "../../actions";
import { checkAdminAccess } from "@/lib/authHelper";
import BulletinForm from "./bulletin-form";

export const dynamic = "force-dynamic";

export default async function BulletinPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const salarie = await getSalarie(parseInt(id, 10));

  if (!salarie) notFound();

  // Contrôle d'accès et récupération du rôle
  const { profile } = await checkAdminAccess();

  const [rubriquesAssignees, catalogueRubriques, parametres] = await Promise.all([
    listerRubriquesSalarie(salarie.id),
    listerCatalogueRubriques(),
    getParametres(),
  ]);

  return (
    <>
      <div
        className="page-header"
        style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}
      >
        <div>
          <h1>Bulletin de paie — {salarie.nom_prenom}</h1>
          <p>
            {salarie.fonction ?? "—"} · Salaire de base théorique :{" "}
            {salarie.salaire_base_theorique.toLocaleString("fr-FR").replace(/[\u202F\u00A0]/g, ' ')} DA
          </p>
        </div>
        <Link href={`/salaries/${salarie.id}/rubriques`} className="btn btn-secondary btn-sm">
          Configurer les rubriques →
        </Link>
      </div>

      <BulletinForm
        salarie={salarie}
        rubriquesAssignees={rubriquesAssignees}
        catalogueRubriques={catalogueRubriques}
        parametres={parametres}
        userRole={profile.role}
      />
    </>
  );
}
