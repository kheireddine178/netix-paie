import { notFound } from "next/navigation";
import Link from "next/link";
import { getSalarie, listerCatalogueFormations, listerInscriptionsSalarie } from "../../actions";
import FormationsClientPage from "./FormationsClientPage";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const salarieId = parseInt(id, 10);
  if (isNaN(salarieId)) notFound();

  const salarie = await getSalarie(salarieId);
  if (!salarie) notFound();

  const catalogue = await listerCatalogueFormations();
  const inscriptions = await listerInscriptionsSalarie(salarieId);

  return (
    <div className="space-y-6">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1>Formations & Évaluations — {salarie.nom_prenom}</h1>
          <p>Gérez le développement des compétences (formations) et évaluez les performances.</p>
        </div>
        <Link href="/salaries" className="btn btn-secondary btn-sm">
          ← Retour à la liste
        </Link>
      </div>

      {/* Barre de navigation interne du salarié */}
      <div style={{ display: "flex", gap: "var(--s3)", borderBottom: "var(--hairline)", paddingBottom: "var(--s3)" }}>
        <Link href={`/salaries/${salarie.id}/bulletin`} className="btn-link" style={{ textDecoration: "none", color: "var(--text-muted)", fontSize: "var(--tsm)" }}>
          Calcul Bulletin
        </Link>
        <span style={{ color: "var(--border)" }}>|</span>
        <Link href={`/salaries/${salarie.id}/rubriques`} className="btn-link" style={{ textDecoration: "none", color: "var(--text-muted)", fontSize: "var(--tsm)" }}>
          Rubriques
        </Link>
        <span style={{ color: "var(--border)" }}>|</span>
        <Link href={`/salaries/${salarie.id}/historique`} className="btn-link" style={{ textDecoration: "none", color: "var(--text-muted)", fontSize: "var(--tsm)" }}>
          Historique Paies
        </Link>
        <span style={{ color: "var(--border)" }}>|</span>
        <Link href={`/salaries/${salarie.id}/contrat`} className="btn-link" style={{ textDecoration: "none", color: "var(--text-muted)", fontSize: "var(--tsm)" }}>
          Contrat & Documents
        </Link>
        <span style={{ color: "var(--border)" }}>|</span>
        <Link href={`/salaries/${salarie.id}/conges`} className="btn-link" style={{ textDecoration: "none", color: "var(--text-muted)", fontSize: "var(--tsm)" }}>
          Absences & Congés
        </Link>
        <span style={{ color: "var(--border)" }}>|</span>
        <Link href={`/salaries/${salarie.id}/missions`} className="btn-link" style={{ textDecoration: "none", color: "var(--text-muted)", fontSize: "var(--tsm)" }}>
          Missions & Déplacements
        </Link>
        <span style={{ color: "var(--border)" }}>|</span>
        <Link href={`/salaries/${salarie.id}/carriere`} className="btn-link" style={{ textDecoration: "none", color: "var(--text-muted)", fontSize: "var(--tsm)" }}>
          Carrière & Discipline
        </Link>
        <span style={{ color: "var(--border)" }}>|</span>
        <strong style={{ color: "var(--accent)", fontSize: "var(--tsm)" }}>
          🎓 Formations & Évaluations
        </strong>
      </div>

      <FormationsClientPage salarie={salarie} catalogue={catalogue} inscriptions={inscriptions} />
    </div>
  );
}
