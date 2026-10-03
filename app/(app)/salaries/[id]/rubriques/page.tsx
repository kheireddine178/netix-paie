import { notFound } from "next/navigation";
import Link from "next/link";
import { getSalarie, listerCatalogueRubriques, listerRubriquesSalarie } from "../../actions";
import RubriquesForm from "./RubriquesForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";

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
      <PageHeader
        title={`Rubriques personnalisées — ${salarie.nom_prenom}`}
        subtitle="Attribution et configuration des primes et retenues spécifiques"
        breadcrumbs={[
          { label: "Collaborateurs", href: "/salaries" },
          { label: salarie.nom_prenom, href: `/salaries/${salarie.id}` },
          { label: "Rubriques du salarié" },
        ]}
        primaryAction={
          <Link href={`/saisie?salarieId=${salarie.id}`}>
            <Button variant="primary">Calculer la paie</Button>
          </Link>
        }
        secondaryActions={
          <div className="flex items-center gap-2">
            <Link href={`/salaries/${salarie.id}`}>
              <Button variant="secondary">← Fiche Salarié</Button>
            </Link>
            <Link href="/rubriques">
              <Button variant="secondary">Catalogue général</Button>
            </Link>
          </div>
        }
      />

      <RubriquesForm salarieId={salarie.id} catalogue={catalogue} assignees={assignees} />
    </div>
  );
}
