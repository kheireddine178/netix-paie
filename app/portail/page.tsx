import { listerSalaries } from "../(app)/salaries/actions";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PortailLoginPage() {
  const salaries = await listerSalaries();

  return (
    <div style={{ maxWidth: 600, margin: "80px auto", padding: "var(--s4)" }}>
      <div className="card text-center" style={{ padding: "var(--s6)" }}>
        <h1 style={{ marginBottom: "var(--s2)", fontSize: "var(--txl)" }}>🔑 Portail Salarié (ESS)</h1>
        <p style={{ color: "var(--text-muted)", marginBottom: "var(--s4)" }}>
          Simulez la connexion d'un collaborateur pour accéder à son espace personnel en self-service.
        </p>

        <div className="field" style={{ textAlign: "left" }}>
          <label style={{ fontWeight: "bold", marginBottom: 8, display: "block" }}>
            Sélectionner un collaborateur :
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: "300px", overflowY: "auto", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: 8 }}>
            {salaries.map((s) => (
              <Link
                key={s.id}
                href={`/portail/${s.id}`}
                className="btn btn-secondary"
                style={{ justifyContent: "space-between", padding: "10px 16px", textDecoration: "none", display: "flex", width: "100%" }}
              >
                <span>👤 {s.nom_prenom}</span>
                <span className="badge" style={{ fontSize: 10 }}>{s.fonction || "Employé"}</span>
              </Link>
            ))}
          </div>
        </div>

        <div style={{ marginTop: "var(--s4)" }}>
          <Link href="/dashboard" className="btn-link" style={{ fontSize: "var(--tsm)" }}>
            ← Retour au panneau Administrateur RH
          </Link>
        </div>
      </div>
    </div>
  );
}
