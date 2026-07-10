import Link from "next/link";
import { listerSalaries, listerCongesSalarie } from "../salaries/actions";

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
    <div className="space-y-6">
      <div className="page-header">
        <h1>📅 Congés & Absences</h1>
        <p>Sélectionnez un collaborateur pour gérer ses demandes de congés, valider ou rejeter.</p>
      </div>

      {salaries.length === 0 ? (
        <div className="card">
          <p style={{ color: "var(--text-muted)" }}>Aucun salarié enregistré.</p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "var(--s4)",
          }}
        >
          {salaries.map((s) => {
            const stat = statMap[s.id];
            return (
              <Link
                key={s.id}
                href={`/salaries/${s.id}/conges`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div
                  className="card hover-card"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--s4)",
                    padding: "var(--s4)",
                    cursor: "pointer",
                    borderLeft: "4px solid var(--amber)",
                    transition: "transform 0.15s, box-shadow 0.15s",
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      background: "var(--amber, #f59e0b)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                      fontSize: 18,
                      flexShrink: 0,
                    }}
                  >
                    {s.nom_prenom.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: "bold", margin: 0 }}>{s.nom_prenom}</p>
                    <p style={{ fontSize: "var(--tsm)", color: "var(--text-muted)", margin: "2px 0 4px" }}>
                      {s.fonction || "Pas de fonction"}
                    </p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <span className="badge badge-teal" style={{ fontSize: 10 }}>
                        {stat?.pris || 0} jours pris
                      </span>
                      {stat?.enAttente > 0 && (
                        <span className="badge badge-accent" style={{ fontSize: 10 }}>
                          {stat.enAttente} en attente
                        </span>
                      )}
                    </div>
                  </div>
                  <span style={{ color: "var(--amber, #f59e0b)", fontWeight: "bold", fontSize: 18 }}>→</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
