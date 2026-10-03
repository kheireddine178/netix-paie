import { notFound } from "next/navigation";
import { getSalarie, listerMissionsSalarie } from "../../actions";
import MissionsClientPage from "./MissionsClientPage";

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

  const missions = await listerMissionsSalarie(salarieId);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Formations"
      />

      <MissionsClientPage salarie={salarie} missions={missions} />
    </div>
  );
}
