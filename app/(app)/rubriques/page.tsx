import { listerSalaries, listerCatalogueRubriques } from "../salaries/actions";
import RubriquesSelecteur from "./RubriquesSelecteur";
import OdooControlPanel from "@/components/odoo/OdooControlPanel";

export const dynamic = "force-dynamic";

export default async function RubriquesPage() {
  const [salaries, catalogue] = await Promise.all([listerSalaries(), listerCatalogueRubriques()]);

  return (
    <div className="flex flex-col gap-4">
      <OdooControlPanel
        breadcrumbs={[{ label: "Catalogue des Rubriques" }]}
        extraRight={
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700">
            {catalogue.length} rubriques disponibles
          </span>
        }
        secondaryActions={[
          {
            label: "Saisie de paie",
            href: "/saisie",
          },
        ]}
      />

      <RubriquesSelecteur salaries={salaries} />

      {salaries.length === 0 && (
        <div className="p-8 text-center rounded-lg border border-dashed text-muted-foreground" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          Aucun salarié pour l&apos;instant. Ajoutez d&apos;abord un salarié depuis le module Collaborateurs.
        </div>
      )}
    </div>
  );
}
