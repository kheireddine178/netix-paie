import Link from "next/link";
import { listerSalaries } from "../salaries/actions";

export const dynamic = "force-dynamic";

export default async function ContratsPage() {
  const salaries = await listerSalaries();

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1>💼 Contrats & Core RH</h1>
        <p>Sélectionnez un collaborateur pour gérer son contrat, ses avenants et ses pièces jointes.</p>
      </div>

      {salaries.length === 0 ? (
        <div className="card">
          <p style={{ color: "var(--text-muted)" }}>Aucun salarié enregistré.</p>
          <Link href="/salaries/nouveau" className="btn btn-primary" style={{ marginTop: "var(--s3)" }}>
            + Ajouter un collaborateur
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "var(--s4)",
          }}
        >
          {salaries.map((s) => (
            <Link
              key={s.id}
              href={`/salaries/${s.id}/contrat`}
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
                  borderLeft: "4px solid var(--teal)",
                  transition: "transform 0.15s, box-shadow 0.15s",
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: "var(--accent)",
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
                  <p style={{ fontSize: "var(--tsm)", color: "var(--text-muted)", margin: "2px 0 0" }}>
                    {s.fonction || "Pas de fonction"} · {s.matricule || "—"}
                  </p>
                </div>
                <span style={{ color: "var(--teal)", fontWeight: "bold", fontSize: 18 }}>→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
