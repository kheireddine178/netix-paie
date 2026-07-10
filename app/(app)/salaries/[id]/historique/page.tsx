import { notFound } from "next/navigation";
import Link from "next/link";
import { getSalarie, listerBulletinsSalarie } from "../../actions";
import BulletinRowActions from "./BulletinRowActions";

export const dynamic = "force-dynamic";

const NOMS_MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

export default async function HistoriquePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const salarieId = parseInt(id, 10);
  const salarie = await getSalarie(salarieId);

  if (!salarie) notFound();

  const bulletins = await listerBulletinsSalarie(salarieId);

  return (
    <>
      <div
        className="page-header"
        style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}
      >
        <div>
          <h1>Historique des bulletins — {salarie.nom_prenom}</h1>
          <p>
            {salarie.fonction ?? "—"} · {bulletins.length} bulletin
            {bulletins.length > 1 ? "s" : ""} enregistré{bulletins.length > 1 ? "s" : ""}
          </p>
        </div>
        <Link href={`/salaries/${salarie.id}`} className="btn btn-secondary btn-sm">
          ← Retour au Profil
        </Link>
      </div>

      {bulletins.length === 0 ? (
        <div className="card">
          <p style={{ color: "var(--text-muted)" }}>
            Aucun bulletin enregistré pour l&apos;instant. Rendez-vous dans{" "}
            <Link href={`/salaries/${salarie.id}/bulletin`}>Saisie mensuelle</Link> pour en créer un.
          </p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Période</th>
                <th>Net à payer</th>
                <th>Dernière modification</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bulletins.map((b) => (
                <tr key={b.id}>
                  <td>
                    {NOMS_MOIS[b.mois - 1] ?? b.mois} {b.annee}
                  </td>
                  <td>{b.net_a_payer.toLocaleString("fr-FR")} DA</td>
                  <td style={{ color: "var(--text-muted)" }}>
                    {b.modifie_le ? new Date(b.modifie_le).toLocaleString("fr-FR") : "—"}
                  </td>
                  <td>
                    <BulletinRowActions salarieId={salarie.id} bulletinId={b.id} annee={b.annee} mois={b.mois} />
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
