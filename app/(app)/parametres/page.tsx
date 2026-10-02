import { getParametresComplets } from "./actions";
import ParametresForm from "./ParametresForm";
import OdooControlPanel from "@/components/odoo/OdooControlPanel";

export const dynamic = "force-dynamic";

export default async function ParametresPage() {
  const parametres = await getParametresComplets();
  return (
    <div className="flex flex-col gap-4">
      <OdooControlPanel
        breadcrumbs={[{ label: "Configuration & Paramètres Généraux" }]}
        secondaryActions={[
          {
            label: "Saisie de paie",
            href: "/saisie",
          },
          {
            label: "Collaborateurs",
            href: "/salaries",
          },
        ]}
      />
      <ParametresForm initial={parametres} />
    </div>
  );
}
