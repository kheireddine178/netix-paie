import { listerSalaries } from "../salaries/actions";
import HistoriqueSelecteur from "./HistoriqueSelecteur";
import OdooControlPanel from "@/components/odoo/OdooControlPanel";

export const dynamic = "force-dynamic";

export default async function HistoriquePage() {
  const salaries = await listerSalaries();

  return (
    <div className="flex flex-col gap-4">
      <OdooControlPanel
        breadcrumbs={[{ label: "Historique des Bulletins" }]}
        secondaryActions={[
          {
            label: "Saisie mensuelle",
            href: "/saisie",
          },
          {
            label: "Collaborateurs",
            href: "/salaries",
          },
        ]}
      />

      <HistoriqueSelecteur salaries={salaries} />

      {salaries.length === 0 && (
        <div className="p-8 text-center rounded-lg border border-dashed text-muted-foreground" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          Aucun salarié pour l&apos;instant. Ajoutez d&apos;abord un salarié depuis le module Collaborateurs.
        </div>
      )}
    </div>
  );
}
