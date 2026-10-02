import { notFound } from "next/navigation";
import { getSalarie, listerCongesSalarie, listerContratsSalarie } from "../../actions";
import CongesClientPage from "./CongesClientPage";
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

  const conges = await listerCongesSalarie(salarieId);
  const contrats = await listerContratsSalarie(salarieId);

  return (
    <div className="flex flex-col gap-4">
      <OdooControlPanel
        breadcrumbs={[
          { label: "Collaborateurs", href: "/salaries" },
          { label: salarie.nom_prenom, href: `/salaries/${salarie.id}` },
          { label: "Absences & Congés" },
        ]}
        primaryAction={{
          label: "💰 Calculer la paie",
          href: `/saisie?salarieId=${salarie.id}`,
        }}
        secondaryActions={[
          { label: "← Fiche Salarié", href: `/salaries/${salarie.id}` },
          { label: "Contrats", href: `/salaries/${salarie.id}/contrat` },
          { label: "Missions", href: `/salaries/${salarie.id}/missions` },
          { label: "Carrière", href: `/salaries/${salarie.id}/carriere` },
          { label: "Formations", href: `/salaries/${salarie.id}/formations` },
        ]}
      />

      <CongesClientPage salarie={salarie} conges={conges} contrats={contrats} />
    </div>
  );
}
