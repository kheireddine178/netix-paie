import { notFound } from "next/navigation";
import { getSalarie, modifierSalarie } from "../../actions";
import SalarieForm from "../../salarie-form";

export default async function ModifierSalariePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const salarie = await getSalarie(Number(id));

  if (!salarie) notFound();

  const modifierAvecId = modifierSalarie.bind(null, salarie.id);

  return (
    <>
      <div className="page-header">
        <h1>Modifier le salarié</h1>
        <p>Mettez à jour les informations de base de {salarie.nom_prenom}.</p>
      </div>

      <SalarieForm
        initialData={{
          id: salarie.id,
          nom_prenom: salarie.nom_prenom,
          matricule: salarie.matricule,
          fonction: salarie.fonction,
          salaire_base_theorique: salarie.salaire_base_theorique,
          ccp_rib: salarie.ccp_rib,
        }}
        actionSubmit={modifierAvecId}
        buttonText="Enregistrer les modifications"
      />
    </>
  );
}

