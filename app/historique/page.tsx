import { listerSalaries } from "../salaries/actions";
import HistoriqueSelecteur from "./HistoriqueSelecteur";

export const dynamic = "force-dynamic";

export default async function HistoriquePage() {
  const salaries = await listerSalaries();

  return (
    <>
      <div className="page-header">
        <h1>Historique des bulletins</h1>
        <p>Choisissez un salarié pour consulter, télécharger ou supprimer ses bulletins déjà enregistrés.</p>
      </div>

      <HistoriqueSelecteur salaries={salaries} />

      {salaries.length === 0 && (
        <div className="card">
          <p style={{ color: "var(--text-muted)" }}>
            Aucun salarié pour l&apos;instant. Ajoutez d&apos;abord un salarié depuis l&apos;onglet
            Salariés.
          </p>
        </div>
      )}
    </>
  );
}
