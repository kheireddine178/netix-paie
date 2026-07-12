import Link from "next/link";
import { listerSalaries, listerBulletinsPourPeriode } from "../../salaries/actions";
import SaisieCollectiveClient from "./saisie-collective-client";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{
    annee?: string;
    mois?: string;
  }>;
}

export default async function SaisieCollectivePage({ searchParams }: Props) {
  const query = await searchParams;
  const salaries = await listerSalaries();

  // Filter only active salariés for mass entry
  const activeSalaries = salaries.filter((s) => s.actif !== false);

  const now = new Date();
  const selectedAnnee = query.annee ? parseInt(query.annee, 10) : now.getFullYear();
  const selectedMois = query.mois ? parseInt(query.mois, 10) : now.getMonth() + 1;

  // Load existing bulletins for the selected period
  const bulletins = await listerBulletinsPourPeriode(selectedAnnee, selectedMois);

  // Map to the simplified type
  const initialBulletins = bulletins.map((b) => ({
    salarie_id: b.salarie_id,
    maladie_h: b.maladie_h || 0,
    absence_irreguliere_h: b.absence_irreguliere_h || 0,
    retard_h: b.retard_h || 0,
    heures_sup_1: b.heures_sup_1 || 0,
    heures_sup_2: b.heures_sup_2 || 0,
    heures_sup_3: b.heures_sup_3 || 0,
    panier_jours: b.panier_jours || 0,
    autre_prime_fixe: b.autre_prime_fixe || 0,
    statut: b.statut,
  }));

  return (
    <>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1>Saisie collective de masse</h1>
          <p>Saisissez les variables de paie de tous les salariés sur une grille unique style Excel.</p>
        </div>
        <Link href="/saisie" className="btn btn-secondary btn-sm">
          ← Retour à la saisie individuelle
        </Link>
      </div>

      <SaisieCollectiveClient
        salaries={activeSalaries}
        initialBulletins={initialBulletins}
        anneeActive={selectedAnnee}
        moisActive={selectedMois}
      />
    </>
  );
}
