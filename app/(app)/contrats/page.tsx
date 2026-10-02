import { listerSalaries } from "../salaries/actions";
import OdooControlPanel from "@/components/odoo/OdooControlPanel";
import OdooKanbanCard from "@/components/odoo/OdooKanbanCard";

export const dynamic = "force-dynamic";

function formatDA(n: number) {
  return n.toLocaleString("fr-FR").replace(/[\u202F\u00A0]/g, " ") + " DA";
}

export default async function ContratsPage() {
  const salaries = await listerSalaries();

  return (
    <div className="flex flex-col gap-4">
      {/* 1. ODOO CONTROL PANEL */}
      <OdooControlPanel
        breadcrumbs={[{ label: "Contrats & Documents RH" }]}
        secondaryActions={[
          {
            label: "Collaborateurs",
            href: "/salaries",
          },
        ]}
      />

      {salaries.length === 0 ? (
        <div
          className="p-12 text-center rounded-lg border border-dashed text-muted-foreground"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          Aucun salarié enregistré.
        </div>
      ) : (
        <div className="odoo-kanban-grid">
          {salaries.map((s) => (
            <OdooKanbanCard
              key={s.id}
              title={s.nom_prenom}
              subtitle={s.fonction || "Poste non renseigné"}
              badge={{
                text: s.actif ? "Actif" : "Inactif",
                variant: s.actif ? "success" : "neutral",
              }}
              metrics={[
                { label: "Matricule", value: s.matricule || "—" },
                { label: "Salaire de base", value: formatDA(s.salaire_base_theorique) },
              ]}
              href={`/salaries/${s.id}/contrat`}
              actions={
                <span
                  className="text-xs font-bold hover:underline"
                  style={{ color: "var(--teal)" }}
                >
                  Voir contrats & documents →
                </span>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
