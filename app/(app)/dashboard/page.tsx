import Link from "next/link";
import {
  IconUsers, IconCalculator, IconFileText, IconCalendar,
  IconPlane, IconTrendingUp, IconGraduation, IconBook, IconSettings,
  IconAlertTriangle,
} from "@/components/Icons";
import { listerSalaries, listerTousContrats } from "../salaries/actions";
import OdooControlPanel from "@/components/odoo/OdooControlPanel";

const MODULES = [
  {
    title: "Collaborateurs",
    desc: "Gérer l'annuaire des salariés et les fiches individuelles.",
    href: "/salaries",
    btn: "Accéder à l'annuaire",
    color: "var(--accent)",
    icon: <IconUsers size={20} />,
  },
  {
    title: "Paie Mensuelle",
    desc: "Saisir les variables du mois et calculer/éditer les bulletins.",
    href: "/saisie",
    btn: "Saisie de paie",
    color: "var(--accent)",
    icon: <IconCalculator size={20} />,
  },
  {
    title: "Contrats & Core RH",
    desc: "CDD, CDI, PV d'installation, Attestations de travail et documents.",
    href: "/contrats",
    btn: "Gérer les contrats",
    color: "var(--teal)",
    icon: <IconFileText size={20} />,
  },
  {
    title: "Congés & Absences",
    desc: "Workflow d'approbation et calcul des soldes de congés légaux.",
    href: "/conges",
    btn: "Gérer les absences",
    color: "var(--amber)",
    icon: <IconCalendar size={20} />,
  },
  {
    title: "Missions & Déplacements",
    desc: "Suivi des déplacements et ordres de mission PDF officiels.",
    href: "/missions",
    btn: "Gérer les missions",
    color: "#6366f1",
    icon: <IconPlane size={20} />,
  },
  {
    title: "Carrière & Discipline",
    desc: "Historique des promotions, changements de poste et sanctions.",
    href: "/carriere",
    btn: "Gérer les carrières",
    color: "#ec4899",
    icon: <IconTrendingUp size={20} />,
  },
  {
    title: "Formations & Talent",
    desc: "Catalogue de formation et fiches d'évaluation annuelles.",
    href: "/formations",
    btn: "Gérer les talents",
    color: "#8b5cf6",
    icon: <IconGraduation size={20} />,
  },
];

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [salaries, contrats] = await Promise.all([
    listerSalaries(),
    listerTousContrats(),
  ]);

  const dateAujourdhui = new Date();
  const limiteAlertes = new Date();
  limiteAlertes.setDate(dateAujourdhui.getDate() + 30); // Alertes sous 30 jours

  // 1. Détecter les CDD se terminant sous 30 jours
  const cddExpirations = contrats.filter((c) => {
    if (c.type_contrat !== "CDD" || c.statut !== "En cours" || !c.date_fin) return false;
    const dateFin = new Date(c.date_fin);
    return dateFin >= dateAujourdhui && dateFin <= limiteAlertes;
  });

  // 2. Détecter les visites médicales expirant ou en retard
  const visitesMedicalesExpirations = salaries.filter((s) => {
    if (!s.actif) return false;
    if (!s.date_visite_medicale) return true;
    const derniereVisite = new Date(s.date_visite_medicale);
    const dateEcheance = new Date(derniereVisite);
    dateEcheance.setFullYear(dateEcheance.getFullYear() + 1);
    return dateEcheance <= limiteAlertes;
  });

  const totalAlertes = cddExpirations.length + visitesMedicalesExpirations.length;

  return (
    <div className="flex flex-col gap-4">
      {/* 1. ODOO CONTROL PANEL */}
      <OdooControlPanel
        breadcrumbs={[{ label: "Tableau de Bord SIRH" }]}
        primaryAction={{
          label: "💰 Saisie de paie",
          href: "/saisie",
        }}
        secondaryActions={[
          {
            label: "+ Nouveau collaborateur",
            href: "/salaries/nouveau",
          },
          {
            label: "États de paie",
            href: "/rapports",
          },
        ]}
        extraRight={
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-800">
              👥 {salaries.length} salariés
            </span>
            {totalAlertes > 0 && (
              <span className="text-xs font-bold px-2.5 py-1 rounded bg-amber-100 text-amber-800">
                ⚠️ {totalAlertes} alerte(s)
              </span>
            )}
          </div>
        }
      />

      {/* SECTION ALERTES & VIGILANCE RH */}
      {totalAlertes > 0 && (
        <div className="p-4 rounded-lg border border-red-200 bg-red-50/60 text-xs">
          <div className="flex items-center gap-2 text-red-700 font-bold mb-3">
            <IconAlertTriangle size={18} />
            <h3 className="m-0 text-sm font-bold">Vigilance RH & Échéances ({totalAlertes})</h3>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {cddExpirations.length > 0 && (
              <div>
                <strong className="text-red-900 block mb-1">Fin de Contrat CDD sous 30 jours :</strong>
                <ul className="pl-4 m-0 space-y-1 text-red-800">
                  {cddExpirations.map((c) => (
                    <li key={c.id}>
                      <span className="font-semibold">{c.salaries?.nom_prenom}</span> : échéance au{" "}
                      <strong>{c.date_fin?.split("-").reverse().join("/")}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {visitesMedicalesExpirations.length > 0 && (
              <div>
                <strong className="text-amber-900 block mb-1">Visites médicales à renouveler :</strong>
                <span className="text-amber-800">
                  {visitesMedicalesExpirations.length} collaborateur(s) nécessitent une visite médicale de travail.
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* GRILLE DES MODULES EN KANBAN ODOO */}
      <div className="odoo-kanban-grid">
        {MODULES.map((m) => (
          <div
            key={m.title}
            className="p-5 rounded-lg border transition-all hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
              borderTop: `4px solid ${m.color}`,
            }}
          >
            <div>
              <div className="flex items-center gap-2 mb-2" style={{ color: m.color }}>
                {m.icon}
                <h2 className="text-base font-bold m-0" style={{ color: "var(--text)" }}>
                  {m.title}
                </h2>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                {m.desc}
              </p>
            </div>
            <Link
              href={m.href}
              className="btn btn-secondary btn-sm text-xs font-semibold w-full text-center justify-center py-2"
            >
              {m.btn} →
            </Link>
          </div>
        ))}
      </div>

      {/* FOOTER WIDGETS */}
      <div className="grid sm:grid-cols-2 gap-4 mt-2">
        <div className="p-4 rounded-lg border text-xs flex flex-col justify-between" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div>
            <div className="flex items-center gap-2 mb-2 font-bold text-sm" style={{ color: "var(--teal)" }}>
              <IconBook size={18} />
              <span>Guide Réglementaire & Droit du Travail</span>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Consultez les articles clés de la loi n°90-11, du code des impôts (CIDTA) et des barèmes officiels.
            </p>
          </div>
          <Link href="/guide" className="btn btn-secondary btn-sm text-xs w-fit">
            Consulter le guide RH →
          </Link>
        </div>

        <div className="p-4 rounded-lg border text-xs flex flex-col justify-between" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div>
            <div className="flex items-center gap-2 mb-2 font-bold text-sm" style={{ color: "var(--text-muted)" }}>
              <IconSettings size={18} />
              <span>Paramètres & Barèmes de Paie</span>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Configurez le SNMG (20 000 DA), les taux CNAS (9% / 26%) et les règles de calcul de l&apos;IRG.
            </p>
          </div>
          <Link href="/parametres" className="btn btn-secondary btn-sm text-xs w-fit">
            Configurer les paramètres →
          </Link>
        </div>
      </div>
    </div>
  );
}
