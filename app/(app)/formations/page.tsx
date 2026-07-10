import Link from "next/link";
import { listerSalaries, listerInscriptionsSalarie } from "../salaries/actions";

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
    <div className="space-y-6">
      <div className="page-header">
        <h1>🎓 Formations & Évaluations</h1>
        <p>Sélectionnez un collaborateur pour gérer ses inscriptions aux formations et éditer sa fiche d'évaluation.</p>
      </div>

      {salaries.length === 0 ? (
        <div className="card">
          <p style={{ color: "var(--text-muted)" }}>Aucun salarié enregistré.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "var(--s4)" }}>
          {salaries.map((s) => {
            const stat = statMap[s.id];
            return (
              <Link key={s.id} href={`/salaries/${s.id}/formations`} style={{ textDecoration: "none", color: "inherit" }}>
                <div
                  className="card hover-card"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--s4)",
                    padding: "var(--s4)",
                    cursor: "pointer",
                    borderLeft: "4px solid #8b5cf6",
                    transition: "transform 0.15s, box-shadow 0.15s",
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      background: "#8b5cf6",
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
                    {stat && stat.total > 0 && (
                      <span className="badge" style={{ fontSize: 10, background: "#8b5cf6", color: "#fff" }}>
                        {stat.total} formation{stat.total > 1 ? "s" : ""}
                        {stat.enCours > 0 && ` · ${stat.enCours} en cours`}
                      </span>
                    )}
                  </div>
                  <span style={{ color: "#8b5cf6", fontWeight: "bold", fontSize: 18 }}>→</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
