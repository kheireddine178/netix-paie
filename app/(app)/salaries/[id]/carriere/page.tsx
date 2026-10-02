import { notFound } from "next/navigation";
import { getSalarie, listerPromotionsSalarie, listerSanctionsSalarie, listerObjectifsSalarie } from "../../actions";
import CarriereClientPage from "./CarriereClientPage";
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

  const [promotions, sanctions, objectifs] = await Promise.all([
    listerPromotionsSalarie(salarieId),
    listerSanctionsSalarie(salarieId),
    listerObjectifsSalarie(salarieId),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <OdooControlPanel
        breadcrumbs={[
          { label: "Collaborateurs", href: "/salaries" },
          { label: salarie.nom_prenom, href: `/salaries/${salarie.id}` },
          { label: "Carrière & Discipline" },
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
          { label: "Formations", href: `/salaries/${salarie.id}/formations` },
        ]}
      />

      <CarriereClientPage
        salarie={salarie}
        promotions={promotions}
        sanctions={sanctions}
        objectifs={objectifs}
      />
    </div>
  );
}
