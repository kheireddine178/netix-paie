import Link from "next/link";
import {
  IconUsers, IconCalculator, IconFileText, IconCalendar,
  IconPlane, IconTrendingUp, IconGraduation, IconBook, IconSettings,
  IconAlertTriangle,
} from "@/components/Icons";
import { listerSalaries, listerTousContrats } from "../salaries/actions";

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

  const 📅 = new Date();
  const limiteAlertes = new Date();
  limiteAlertes.setDate(📅.getDate() + 30); // Alertes sous 30 jours

  // 1. Détecter les CDD se terminant sous 30 jours
  const cddExpirations = contrats.filter((c) => {
    if (c.type_contrat !== "CDD" || c.statut !== "En cours" || !c.date_fin) return false;
    const dateFin = new Date(c.date_fin);
    return dateFin >= 📅 && dateFin <= limiteAlertes;
  });

  // 2. Détecter les visites médicales expirant ou en retard (visite annuelle obligatoire)
  const visitesMedicalesExpirations = salaries.filter((s) => {
    if (!s.actif) return false;
    if (!s.date_visite_medicale) return true; // Pas de visite renseignée = alerte
    const derniereVisite = new Date(s.date_visite_medicale);
    const dateEcheance = new Date(derniereVisite);
    dateEcheance.setFullYear(dateEcheance.getFullYear() + 1); // Visite valable 1 an
    return dateEcheance <= limiteAlertes;
  });

  const totalAlertes = cddExpirations.length + visitesMedicalesExpirations.length;

  return (
    <div className="space-y-6">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1>Plateforme Netix SIRH</h1>
          <p>Gérez l'intégralité de vos ressources humaines et votre paie en toute conformité réglementaire.</p>
        </div>
      </div>

      {/* SECTION ALERTES & VIGILANCE RH */}
      {totalAlertes > 0 && (
        <div className="card" style={{ borderLeft: "4px solid var(--red)", background: "rgba(239, 68, 68, 0.05)", padding: "var(--s4)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--red)", marginBottom: "var(--s3)" }}>
            <IconAlertTriangle size={20} />
            <h3 style={{ margin: 0, fontSize: "var(--tmd)", fontWeight: "bold" }}>Alertes &amp; Vigilance RH ({totalAlertes})</h3>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "var(--s4)" }}>
            {cddExpirations.length > 0 && (
              <div>
                <h4 style={{ fontSize: "var(--tsm)", fontWeight: "bold", marginBottom: "8px" }}>📅 Échéances de Contrats (CDD) :</h4>
                <ul style={{ paddingLeft: "16px", margin: 0, fontSize: "var(--txs)", display: "flex", flexDirection: "column", gap: "4px" }}>
                  {cddExpirations.map((c) => (
                    <li key={c.id}>
                      <span style={{ fontWeight: "bold" }}>{c.salaries?.nom_prenom}</span> : contrat CDD se termine le{" "}
                      <span style={{ color: "var(--red)", fontWeight: "bold" }}>
                        {c.date_fin?.split("-").reverse().join("/")}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {visitesMedicalesExpirations.length > 0 && (
              <div>
                <h4 style={{ fontSize: "var(--tsm)", fontWeight: "bold", marginBottom: "8px" }}>🩺 Médecine du travail (Visites médicales) :</h4>
                <ul style={{ paddingLeft: "16px", margin: 0, fontSize: "var(--txs)", display: "flex", flexDirection: "column", gap: "4px" }}>
                  {visitesMedicalesExpirations.map((s) => (
                    <li key={s.id}>
                      <span style={{ fontWeight: "bold" }}>{s.nom_prenom}</span> :{" "}
                      {s.date_visite_medicale ? (
                        <>
                          dernière visite le {s.date_visite_medicale.split("-").reverse().join("/")}{" "}
                          <span style={{ color: "var(--red)", fontWeight: "bold" }}>(Échue ou expire bientôt)</span>
                        </>
                      ) : (
                        <span style={{ color: "var(--red)", fontWeight: "bold" }}>Aucune visite médicale enregistrée</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODULES GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "var(--s4)",
          marginBottom: "var(--s6)",
        }}
      >
        {MODULES.map((m) => (
          <div
            key={m.title}
            className="card"
            style={{
              borderTop: `4px solid ${m.color}`,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "var(--s4)",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--s2)", marginBottom: "var(--s2)", color: m.color }}>
                {m.icon}
                <h2 style={{ fontSize: "var(--tmd)", color: "var(--text)" }}>{m.title}</h2>
              </div>
              <p style={{ color: "var(--text-muted)", fontSize: "var(--tsm)", marginBottom: "var(--s4)", lineHeight: 1.5 }}>
                {m.desc}
              </p>
            </div>
            <Link href={m.href} className="btn btn-secondary btn-sm" style={{ width: "100%", justifyContent: "center" }}>
              {m.btn} →
            </Link>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "var(--s4)" }}>
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--s2)", marginBottom: "var(--s2)", color: "var(--teal)" }}>
            <IconBook size={18} />
            <h3>Guide Juridique &amp; RH</h3>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "var(--tsm)", marginBottom: "var(--s4)" }}>
            Accédez aux articles clés de la loi n°90-11, du CIDTA et de la loi n°83-11 pour vos calculs.
          </p>
          <Link href="/guide" className="btn btn-ghost">
            Consulter le guide
          </Link>
        </div>

        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--s2)", marginBottom: "var(--s2)", color: "var(--text-muted)" }}>
            <IconSettings size={18} />
            <h3>Paramètres Légaux</h3>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "var(--tsm)", marginBottom: "var(--s4)" }}>
            Configurer le taux de CNAS patronal/salarial, le SNMG et le barème IRG.
          </p>
          <Link href="/parametres" className="btn btn-ghost">
            Configurer
          </Link>
        </div>
      </div>
    </div>
  );
}
