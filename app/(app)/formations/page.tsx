import { listerSalaries, listerInscriptionsSalarie } from "../salaries/actions";
import OdooControlPanel from "@/components/odoo/OdooControlPanel";
import OdooKanbanCard from "@/components/odoo/OdooKanbanCard";

export const dynamic = "force-dynamic";

export default async function FormationsPage() {
  const salaries = await listerSalaries();

  const stats = await Promise.all(
    salaries.map(async (s) => {
      const inscriptions = await listerInscriptionsSalarie(s.id);
      const enCours = inscriptions.filter((i) => i.statut === "En cours" || i.statut === "Prévue").length;
      return { salarieId: s.id, total: inscriptions.length, enCours };
    })
  );

  const statMap = Object.fromEntries(stats.map((s) => [s.salarieId, s]));

  return (
    <div className="flex flex-col gap-4">
      {/* 1. ODOO CONTROL PANEL */}
      <OdooControlPanel
        breadcrumbs={[{ label: "Formations & Évaluations" }]}
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
          {salaries.map((s) => {
            const stat = statMap[s.id];
            return (
              <OdooKanbanCard
                key={s.id}
                title={s.nom_prenom}
                subtitle={s.fonction || "Poste non renseigné"}
                badge={
                  stat && stat.enCours > 0
                    ? { text: `${stat.enCours} en cours`, variant: "info" }
                    : { text: `${stat?.total || 0} totale(s)`, variant: "neutral" }
                }
                metrics={[
                  { label: "Matricule", value: s.matricule || "—" },
                  { label: "Inscriptions", value: `${stat?.total || 0}` },
                ]}
                href={`/salaries/${s.id}/formations`}
                actions={
                  <span
                    className="text-xs font-bold hover:underline"
                    style={{ color: "#8b5cf6" }}
                  >
                    Dossier formation →
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
