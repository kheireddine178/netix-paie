import { creerSalarie } from "../actions";

export default function NouveauSalariePage() {
  return (
    <>
      <div className="page-header">
        <h1>Nouveau salarié</h1>
        <p>Renseignez les informations de base du salarié.</p>
      </div>

      <div className="card" style={{ maxWidth: 520 }}>
        <form action={creerSalarie}>
          <div className="field">
            <label htmlFor="nom_prenom">Nom et prénom *</label>
            <input
              id="nom_prenom"
              name="nom_prenom"
              required
              placeholder="Ex: Amina Benali"
            />
          </div>

          <div className="field">
            <label htmlFor="matricule">Matricule</label>
            <input id="matricule" name="matricule" />
          </div>

          <div className="field">
            <label htmlFor="fonction">Fonction</label>
            <input id="fonction" name="fonction" />
          </div>

          <div className="field">
            <label htmlFor="salaire_base_theorique">Salaire de base théorique (DA)</label>
            <input
              id="salaire_base_theorique"
              name="salaire_base_theorique"
              type="number"
              step="0.01"
              defaultValue={0}
            />
          </div>

          <button type="submit" className="btn btn-primary">
            Créer le salarié
          </button>
        </form>
      </div>
    </>
  );
}
