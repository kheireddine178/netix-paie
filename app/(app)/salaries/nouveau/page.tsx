import { creerSalarie } from "../actions";
import SalarieForm from "../salarie-form";
import OdooControlPanel from "@/components/odoo/OdooControlPanel";

export default function NouveauSalariePage() {
  return (
    <div className="flex flex-col gap-4">
      <OdooControlPanel
        breadcrumbs={[
          { label: "Collaborateurs", href: "/salaries" },
          { label: "Nouveau collaborateur" },
        ]}
        secondaryActions={[
          {
            label: "Retour à la liste",
            href: "/salaries",
          },
        ]}
      />

      <SalarieForm actionSubmit={creerSalarie} buttonText="Créer le collaborateur" />
    </div>
  );
}
