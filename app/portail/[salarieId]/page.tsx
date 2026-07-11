import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getSalarie,
  listerContratsSalarie,
  listerCongesSalarie,
  listerInscriptionsSalarie,
  listerBulletinsSalarie,
} from "../../(app)/salaries/actions";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ salarieId: string }>;
}

export default async function PortailDashboard({ params }: Props) {
  const { salarieId } = await params;
  const id = parseInt(salarieId, 10);
  if (isNaN(id)) notFound();

  const salarie = await getSalarie(id);
  if (!salarie) notFound();

  const [contrats, conges, inscriptions, bulletins] = await Promise.all([
    listerContratsSalarie(id),
    listerCongesSalarie(id),
    listerInscriptionsSalarie(id),
    listerBulletinsSalarie(id),
  ]);

  const contratActif = contrats.find((c) => c.statut === "En cours") || contrats[0] || null;
  const dernierBulletin = bulletins[0] || null;

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: "0 var(--s4)" }}>
      {/* En-tête Espace Salarié */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--s5)", borderBottom: "var(--hairline)", paddingBottom: "var(--s3)" }}>
        <div>
          <span style={{ fontSize: "var(--t2xs)", color: "var(--accent)", fontWeight: "bold", textTransform: "uppercase" }}>Espace Employé</span>
          <h1 style={{ fontSize: "var(--txl)", margin: "4px 0" }}>Bonjour, {salarie.nom_prenom}</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "var(--tsm)" }}>{salarie.fonction || "Collaborateur"} · Matricule {salarie.matricule || "—"}</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/portail" className="btn btn-secondary btn-sm">
            Changer de Salarié
          </Link>
          <Link href="/dashboard" className="btn btn-primary btn-sm">
            RH Admin
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Colonne Gauche : Actions rapides */}
        <div className="space-y-6">
          <div className="card text-center" style={{ padding: "var(--s4)" }}>
            <h3 style={{ marginBottom: "var(--s3)" }}>Actions Rapides</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <Link href={`/portail/${salarie.id}/conges`} className="btn btn-primary" style={{ width: "100%", justifyContent: "center", textDecoration: "none" }}>
                Mes Congés &amp; Absences
              </Link>
              <Link href={`/portail/${salarie.id}/bulletins`} className="btn btn-secondary" style={{ width: "100%", justifyContent: "center", textDecoration: "none" }}>
                Mes Bulletins de Paie
              </Link>
              <Link href={`/portail/${salarie.id}/avances`} className="btn btn-secondary" style={{ width: "100%", justifyContent: "center", textDecoration: "none" }}>
                Mes Avances sur Salaire
              </Link>
            </div>
          </div>

          {/* Fiche contrat */}
          <div className="card">
            <h3 style={{ marginBottom: "var(--s3)" }}>Mon Contrat</h3>
            {contratActif ? (
              <div style={{ fontSize: "var(--tsm)", display: "flex", flexDirection: "column", gap: "8px" }}>
                <p><strong>Type :</strong> {contratActif.type_contrat}</p>
                <p><strong>Début :</strong> {contratActif.date_debut.split("-").reverse().join("/")}</p>
                {contratActif.date_fin && <p><strong>Fin :</strong> {contratActif.date_fin.split("-").reverse().join("/")}</p>}
                <p><strong>Statut :</strong> <span className="badge badge-teal">{contratActif.statut}</span></p>
                <p><strong>Salaire contractuel :</strong> {contratActif.salaire_base_contrat.toLocaleString("fr-FR").replace(/[\u202F\u00A0]/g, ' ')} DA</p>
              </div>
            ) : (
              <p style={{ color: "var(--text-muted)", fontSize: "var(--tsm)" }}>Aucun contrat actif enregistré.</p>
            )}
          </div>
        </div>

        {/* Colonne Droite : Activités récentes */}
        <div className="md:col-span-2 space-y-6">
          {/* Dernières formations */}
          <div className="card">
            <h3 style={{ marginBottom: "var(--s3)" }}>Mes Formations</h3>
            {inscriptions.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "var(--tsm)" }}>Aucune formation programmée.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {inscriptions.slice(0, 3).map((i) => (
                  <div key={i.id} style={{ display: "flex", justifyContent: "space-between", background: "var(--surface-2)", padding: 12, borderRadius: "var(--r)" }}>
                    <div>
                      <strong>{i.formations?.titre}</strong>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                        {i.formations?.organisme} · Début : {i.date_debut.split("-").reverse().join("/")}
                      </div>
                    </div>
                    <span className="badge badge-teal" style={{ alignSelf: "center" }}>{i.statut}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Derniers congés */}
          <div className="card">
            <h3 style={{ marginBottom: "var(--s3)" }}>Mes Derniers Congés</h3>
            {conges.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "var(--tsm)" }}>Aucune demande de congé.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {conges.slice(0, 3).map((c) => (
                  <div key={c.id} style={{ display: "flex", justifyContent: "space-between", background: "var(--surface-2)", padding: 12, borderRadius: "var(--r)" }}>
                    <div>
                      <strong>Congé {c.type_conge}</strong>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                        Du {c.date_debut.split("-").reverse().join("/")} au {c.date_fin.split("-").reverse().join("/")} ({c.jours_ouvrables} jours)
                      </div>
                    </div>
                    <span className={`badge ${c.statut === "Approuvé" ? "badge-teal" : c.statut === "Rejeté" ? "badge-red" : "badge-accent"}`} style={{ alignSelf: "center" }}>
                      {c.statut}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
