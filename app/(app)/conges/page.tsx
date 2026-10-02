import { listerSalaries, listerCongesSalarie } from "../salaries/actions";
import OdooControlPanel from "@/components/odoo/OdooControlPanel";
import OdooKanbanCard from "@/components/odoo/OdooKanbanCard";

export const dynamic = "force-dynamic";

export default async function CongesPage() {
  const salaries = await listerSalaries();

  // On charge en parallèle les compteurs de congés pour chaque salarié
  const stats = await Promise.all(
    salaries.map(async (s) => {
      const conges = await listerCongesSalarie(s.id);
      const pris = conges
        .filter((c) => c.type_conge === "Annuel" && c.statut === "Approuvé")
        .reduce((sum, c) => sum + c.jours_ouvrables, 0);
      const enAttente = conges.filter((c) => c.statut === "En attente").length;
      return { salarieId: s.id, pris, enAttente };
    })
  );

  const statMap = Object.fromEntries(stats.map((s) => [s.salarieId, s]));

  return (
    <div className="flex flex-col gap-4">
      {/* 1. ODOO CONTROL PANEL */}
      <OdooControlPanel
        breadcrumbs={[{ label: "Congés & Absences" }]}
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
          Aucun salarié enregistré dans la base de données.
        </div>
      ) : (
        <div className="odoo-kanban-grid">
          {salaries.map((s) => {
            const stat = statMap[s.id];
            const hasPending = (stat?.enAttente || 0) > 0;

            return (
              <OdooKanbanCard
                key={s.id}
                title={s.nom_prenom}
                subtitle={s.fonction || "Poste non renseigné"}
                badge={
                  hasPending
                    ? { text: `${stat?.enAttente} à valider`, variant: "warning" }
                    : { text: "À jour", variant: "success" }
                }
                metrics={[
                  { label: "Jours pris", value: `${stat?.pris || 0} j` },
                  { label: "En attente", value: `${stat?.enAttente || 0}` },
                ]}
                href={`/salaries/${s.id}/conges`}
                actions={
                  <span
                    className="text-xs font-bold hover:underline"
                    style={{ color: "var(--amber)" }}
                  >
                    Gérer les congés →
                  </span>
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
