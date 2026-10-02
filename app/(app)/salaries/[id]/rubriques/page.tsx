import { notFound } from "next/navigation";
import { getSalarie, listerCatalogueRubriques, listerRubriquesSalarie } from "../../actions";
import RubriquesForm from "./RubriquesForm";
import OdooControlPanel from "@/components/odoo/OdooControlPanel";

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
    <div className="flex flex-col gap-4">
      <OdooControlPanel
        breadcrumbs={[
          { label: "Collaborateurs", href: "/salaries" },
          { label: salarie.nom_prenom, href: `/salaries/${salarie.id}` },
          { label: "Rubriques du catalogue" },
        ]}
        primaryAction={{
          label: "💰 Calculer la paie",
          href: `/saisie?salarieId=${salarie.id}`,
        }}
        secondaryActions={[
          { label: "← Fiche Salarié", href: `/salaries/${salarie.id}` },
          { label: "Catalogue général", href: "/rubriques" },
        ]}
      />

      <RubriquesForm salarieId={salarie.id} catalogue={catalogue} assignees={assignees} />
    </div>
  );
}
