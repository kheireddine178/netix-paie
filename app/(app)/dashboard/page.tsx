import Link from "next/link";
import {
  IconUsers, IconCalculator, IconFileText, IconCalendar,
  IconPlane, IconTrendingUp, IconGraduation, IconBook, IconSettings,
} from "@/components/Icons";

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

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1>Plateforme Netix SIRH</h1>
        <p>Gérez l'intégralité de vos ressources humaines et votre paie en toute conformité réglementaire.</p>
      </div>

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
            <h3>Guide Juridique & RH</h3>
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
