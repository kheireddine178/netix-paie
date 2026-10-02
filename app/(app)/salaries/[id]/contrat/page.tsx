import { notFound } from "next/navigation";
import { getSalarie, listerContratsSalarie, listerDocumentsSalarie } from "../../actions";
import ContratClientPage from "./contrat-client-page";
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

  const contrats = await listerContratsSalarie(salarieId);
  const documents = await listerDocumentsSalarie(salarieId);

  return (
    <div className="flex flex-col gap-4">
      <OdooControlPanel
        breadcrumbs={[
          { label: "Collaborateurs", href: "/salaries" },
          { label: salarie.nom_prenom, href: `/salaries/${salarie.id}` },
          { label: "Contrats & Documents" },
        ]}
        primaryAction={{
          label: "💰 Calculer la paie",
          href: `/saisie?salarieId=${salarie.id}`,
        }}
        secondaryActions={[
          { label: "← Fiche Salarié", href: `/salaries/${salarie.id}` },
          { label: "Congés", href: `/salaries/${salarie.id}/conges` },
          { label: "Missions", href: `/salaries/${salarie.id}/missions` },
          { label: "Carrière", href: `/salaries/${salarie.id}/carriere` },
          { label: "Formations", href: `/salaries/${salarie.id}/formations` },
        ]}
      />

      <ContratClientPage salarie={salarie} contrats={contrats} documents={documents} />
    </div>
  );
}
