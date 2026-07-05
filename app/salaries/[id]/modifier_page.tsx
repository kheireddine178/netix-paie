import { notFound } from "next/navigation";
import { getSalarie, modifierSalarie } from "../../actions";

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

      <div className="card" style={{ maxWidth: 520 }}>
        <form action={modifierAvecId}>
          <div className="field">
            <label htmlFor="nom_prenom">Nom et prénom *</label>
            <input
              id="nom_prenom"
              name="nom_prenom"
              required
              defaultValue={salarie.nom_prenom}
              placeholder="Ex: Amina Benali"
            />
          </div>

          <div className="field">
            <label htmlFor="matricule">Matricule</label>
            <input id="matricule" name="matricule" defaultValue={salarie.matricule ?? ""} />
          </div>

          <div className="field">
            <label htmlFor="fonction">Fonction</label>
            <input id="fonction" name="fonction" defaultValue={salarie.fonction ?? ""} />
          </div>

          <div className="field">
            <label htmlFor="salaire_base_theorique">Salaire de base théorique (DA)</label>
            <input
              id="salaire_base_theorique"
              name="salaire_base_theorique"
              type="number"
              step="0.01"
              defaultValue={salarie.salaire_base_theorique}
            />
          </div>

          <div style={{ display: "flex", gap: "var(--s3)" }}>
            <button type="submit" className="btn btn-primary">
              Enregistrer les modifications
            </button>
            <a href="/salaries" className="btn btn-secondary">
              Annuler
            </a>
          </div>
        </form>
      </div>
    </>
  );
}
