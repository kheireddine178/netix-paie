import { listerSalaries } from "../salaries/actions";
import OdooControlPanel from "@/components/odoo/OdooControlPanel";
import OdooKanbanCard from "@/components/odoo/OdooKanbanCard";

export const dynamic = "force-dynamic";

export default async function CarrierePage() {
  const salaries = await listerSalaries();

  return (
    <div className="flex flex-col gap-4">
      {/* 1. ODOO CONTROL PANEL */}
      <OdooControlPanel
        breadcrumbs={[{ label: "Carrière & Discipline" }]}
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
                { label: "Dossier", value: "Promotions / Sanctions" },
              ]}
              href={`/salaries/${s.id}/carriere`}
              actions={
                <span
                  className="text-xs font-bold hover:underline"
                  style={{ color: "#ec4899" }}
                >
                  Historique de carrière →
                </span>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
