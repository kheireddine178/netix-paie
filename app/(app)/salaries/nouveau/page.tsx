import { creerSalarie } from "../actions";
import SalarieForm from "../SalarieForm";

export default function NouveauSalariePage() {
  return (
    <>
      <div className="page-header">
        <h1>Nouveau salarié</h1>
        <p>Renseignez les informations de base du salarié.</p>
      </div>

      <SalarieForm actionSubmit={creerSalarie} buttonText="Créer le salarié" />
    </>
  );
}

