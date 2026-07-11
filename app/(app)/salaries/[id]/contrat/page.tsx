import { notFound } from "next/navigation";
import Link from "next/link";
import { getSalarie, listerContratsSalarie, listerDocumentsSalarie } from "../../actions";
import ContratClientPage from "./ContratClientPage";

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

  const contrats = await listerContratsSalarie(salarieId);
  const documents = await listerDocumentsSalarie(salarieId);

  return (
    <div className="space-y-6">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1>Contrats & Documents — {salarie.nom_prenom}</h1>
          <p>Gérez les contrats de travail, téléversez les justificatifs et générez les documents officiels.</p>
        </div>
        <Link href={`/salaries/${salarie.id}`} className="btn btn-secondary btn-sm">
          ← Retour au Profil
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
        <strong style={{ color: "var(--accent)", fontSize: "var(--tsm)" }}>
          Contrat & Documents
        </strong>
      </div>

      <ContratClientPage salarie={salarie} contrats={contrats} documents={documents} />
    </div>
  );
}
