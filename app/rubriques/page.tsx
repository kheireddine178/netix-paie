import { listerSalaries, listerCatalogueRubriques } from "../salaries/actions";
import RubriquesSelecteur from "./RubriquesSelecteur";

export const dynamic = "force-dynamic";

export default async function RubriquesPage() {
  const [salaries, catalogue] = await Promise.all([listerSalaries(), listerCatalogueRubriques()]);

  return (
    <>
      <div className="page-header">
        <h1>Rubriques</h1>
        <p>
          Choisissez un salarié pour cocher les rubriques du catalogue ({catalogue.length} codes)
          applicables. Elles seront ensuite disponibles lors de la saisie mensuelle.
        </p>
      </div>

      <RubriquesSelecteur salaries={salaries} />

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
