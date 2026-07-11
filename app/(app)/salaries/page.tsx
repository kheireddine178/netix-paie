import Link from "next/link";
import { listerSalaries } from "./actions";
import SalarieRowActions from "./SalarieRowActions";

// Cette page dépend des données Supabase à jour (liste des salariés) :
// on la rend à chaque requête plutôt que de la figer au moment du build.
export const dynamic = "force-dynamic";

export default async function SalariesPage() {
  const salaries = await listerSalaries();

  return (
    <>
      <div className="page-header" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <h1>Salariés</h1>
          <p>{salaries.length} salarié{salaries.length > 1 ? "s" : ""} enregistré{salaries.length > 1 ? "s" : ""}</p>
        </div>
        <Link href="/salaries/nouveau" className="btn btn-primary">
          + Ajouter un salarié
        </Link>
      </div>

      {salaries.length === 0 ? (
        <div className="card">
          <p style={{ color: "var(--text-muted)" }}>Aucun salarié pour l&apos;instant.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nom &amp; prénom</th>
                <th>Matricule</th>
                <th>Fonction</th>
                <th>Salaire de base</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {salaries.map((s) => (
                <tr key={s.id} style={s.actif ? undefined : { opacity: 0.55 }}>
                  <td style={{ fontWeight: 650, color: "var(--text)" }}>
                    {s.nom_prenom}
                    {!s.actif && (
                      <span className="badge" style={{ marginLeft: "var(--s2)", color: "var(--text-muted)" }}>
                        Inactif
                      </span>
                    )}
                  </td>
                  <td>
                    {s.matricule ? (
                      <span className="badge badge-accent">{s.matricule}</span>
                    ) : (
                      <span style={{ color: "var(--text-muted)" }}>—</span>
                    )}
                  </td>
                  <td>{s.fonction ?? "—"}</td>
                  <td>{s.salaire_base_theorique.toLocaleString("fr-FR").replace(/[\u202F\u00A0]/g, ' ')} DA</td>
                  <td>
                    <div style={{ display: "flex", gap: "var(--s3)", justifyContent: "flex-end", flexWrap: "wrap" }}>
                      <Link href={`/salaries/${s.id}`} className="btn btn-primary btn-sm">
                        Gérer
                      </Link>
                      <Link href={`/salaries/${s.id}/modifier`} className="btn btn-secondary btn-sm">
                        Modifier
                      </Link>
                      <SalarieRowActions id={s.id} actif={s.actif} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
