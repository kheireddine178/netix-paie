import Link from "next/link";
import { listerSalariesPaginated } from "./actions";
import SalarieRowActions from "./salarie-row-actions";
import SalarieFilters from "./salarie-filters";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function SalariesPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const search = query.search || "";
  const status = query.status || "active";
  const page = parseInt(query.page || "1", 10);
  const limit = 15;

  const { salaries, totalCount } = await listerSalariesPaginated({
    search,
    actifOnly: status === "active",
    page,
    limit,
  });

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <>
      <div className="page-header" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <h1>Salariés</h1>
          <p>
            {totalCount} salarié{totalCount > 1 ? "s" : ""} trouvé{totalCount > 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/salaries/nouveau" className="btn btn-primary">
          + Ajouter un salarié
        </Link>
      </div>

      <SalarieFilters />

      {salaries.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "var(--s6)" }}>
          <p style={{ color: "var(--text-muted)" }}>Aucun salarié ne correspond à votre recherche.</p>
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nom &amp; prénom</th>
                  <th>Matricule</th>
                  <th>Fonction</th>
                  <th>Salaire de base</th>
                  <th>Compte Bancaire</th>
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
                    <td style={{ fontFamily: "var(--mono)", fontSize: "11px" }}>{s.ccp_rib || "—"}</td>
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

          {/* Navigation de pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", gap: "6px", justifyContent: "center", marginTop: "var(--s5)" }} className="no-print">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                const isCurrent = p === page;
                const newParams = new URLSearchParams();
                if (search) newParams.set("search", search);
                newParams.set("status", status);
                newParams.set("page", String(p));

                return (
                  <Link
                    key={p}
                    href={`?${newParams.toString()}`}
                    className={`btn btn-sm ${isCurrent ? "btn-primary" : "btn-secondary"}`}
                    style={{ minWidth: "32px", justifyContent: "center" }}
                  >
                    {p}
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}
    </>
  );
}
