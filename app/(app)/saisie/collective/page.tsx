import { listerSalaries, listerBulletinsPourPeriode } from "../../salaries/actions";
import SaisieCollectiveClient from "./saisie-collective-client";
import OdooSubNav from "@/components/odoo/OdooSubNav";
import OdooControlPanel from "@/components/odoo/OdooControlPanel";

export const dynamic = "force-dynamic";

const MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

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
    <div className="flex flex-col gap-4">
      {/* 0. ODOO SUBNAV TABS */}
      <OdooSubNav
        items={[
          { label: "👤 Saisie individuelle", href: "/saisie" },
          { label: "📊 Grille collective en masse", href: "/saisie/collective" },
          { label: "💳 Acomptes & Avances", href: "/saisie/avances" },
        ]}
      />

      {/* 1. ODOO CONTROL PANEL */}
      <OdooControlPanel
        breadcrumbs={[
          { label: "Saisie Mensuelle", href: "/saisie" },
          { label: "Grille collective de masse" },
          { label: `${MOIS[selectedMois - 1]} ${selectedAnnee}` },
        ]}
        secondaryActions={[
          {
            label: "← Saisie individuelle",
            href: "/saisie",
          },
          {
            label: "Avances & Acomptes",
            href: "/saisie/avances",
          },
        ]}
        extraRight={
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700">
            👥 {activeSalaries.length} salariés actifs
          </span>
        }
      />

      {/* 2. GRILLE CLIENT */}
      <SaisieCollectiveClient
        salaries={activeSalaries}
        initialBulletins={initialBulletins}
        anneeActive={selectedAnnee}
        moisActive={selectedMois}
      />
    </div>
  );
}
