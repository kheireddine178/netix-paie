import { notFound } from "next/navigation";
import { getSalarie, listerPromotionsSalarie, listerSanctionsSalarie, listerObjectifsSalarie } from "../../actions";
import CarriereClientPage from "./CarriereClientPage";

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
      <PageHeader
        title="Formations"
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
