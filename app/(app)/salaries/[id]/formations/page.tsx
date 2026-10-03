import { notFound } from "next/navigation";
import { getSalarie, listerCatalogueFormations, listerInscriptionsSalarie } from "../../actions";
import FormationsClientPage from "./FormationsClientPage";

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
      <PageHeader
        title="Carrière"
      />

      <FormationsClientPage
        salarie={salarie}
        catalogue={catalogue}
        inscriptions={inscriptions}
      />
    </div>
  );
}
