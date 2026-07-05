import { listerSalaries } from "../salaries/actions";
import SaisieSelecteur from "./SaisieSelecteur";

export const dynamic = "force-dynamic";

export default async function SaisiePage() {
  const salaries = await listerSalaries();

  return (
    <>
      <div className="page-header">
        <h1>Saisie mensuelle</h1>
        <p>Absences, heures supplémentaires, rubriques — le résultat se calcule en temps réel.</p>
      </div>

      <SaisieSelecteur salaries={salaries} />

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
