import { notFound } from "next/navigation";
import { getSalarie, listerContratsSalarie, listerDocumentsSalarie } from "../../actions";
import ContratClientPage from "./contrat-client-page";

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
      <PageHeader
        title="Formations"
      />

      <ContratClientPage salarie={salarie} contrats={contrats} documents={documents} />
    </div>
  );
}
