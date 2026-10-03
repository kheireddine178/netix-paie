import { notFound } from "next/navigation";
import { getSalarie, listerCongesSalarie, listerContratsSalarie } from "../../actions";
import CongesClientPage from "./CongesClientPage";

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
      <PageHeader
        title="Formations"
      />

      <CongesClientPage salarie={salarie} conges={conges} contrats={contrats} />
    </div>
  );
}
