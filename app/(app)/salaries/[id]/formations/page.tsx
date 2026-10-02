import { notFound } from "next/navigation";
import { getSalarie, listerCatalogueFormations, listerInscriptionsSalarie } from "../../actions";
import FormationsClientPage from "./FormationsClientPage";
import OdooControlPanel from "@/components/odoo/OdooControlPanel";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const salarieId = parseInt(id, 10);
  if (isNaN(salarieId)) notFound();

  const salarie = await getSalarie(salarieId);
  if (!salarie) notFound();

  const catalogue = await listerCatalogueFormations();
  const inscriptions = await listerInscriptionsSalarie(salarieId);

  return (
    <div className="flex flex-col gap-4">
      <OdooControlPanel
        breadcrumbs={[
          { label: "Collaborateurs", href: "/salaries" },
          { label: salarie.nom_prenom, href: `/salaries/${salarie.id}` },
          { label: "Formations & Talent" },
        ]}
        primaryAction={{
          label: "💰 Calculer la paie",
          href: `/saisie?salarieId=${salarie.id}`,
        }}
        secondaryActions={[
          { label: "← Fiche Salarié", href: `/salaries/${salarie.id}` },
          { label: "Congés", href: `/salaries/${salarie.id}/conges` },
          { label: "Contrats", href: `/salaries/${salarie.id}/contrat` },
          { label: "Missions", href: `/salaries/${salarie.id}/missions` },
          { label: "Carrière", href: `/salaries/${salarie.id}/carriere` },
        ]}
      />

      <FormationsClientPage
        salarie={salarie}
        catalogue={catalogue}
        inscriptions={inscriptions}
      />
    </div>
  );
}
