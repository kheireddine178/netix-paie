import Link from "next/link";

const MODULES = [
  {
    title: "Collaborateurs",
    desc: "Gérer l'annuaire des salariés et les fiches individuelles.",
    href: "/salaries",
    btn: "Accéder à l'annuaire",
    color: "var(--accent)",
  },
  {
    title: "🧮 Paie Mensuelle",
    desc: "Saisir les variables du mois et calculer/éditer les bulletins.",
    href: "/saisie",
    btn: "Saisie de paie",
    color: "var(--accent)",
  },
  {
    title: "💼 Contrats & Core RH",
    desc: "CDD, CDI, PV d'installation, Attestations de travail et documents.",
    href: "/contrats",
    btn: "Gérer les contrats",
    color: "var(--teal)",
  },
  {
    title: "📅 Congés & Absences",
    desc: "Workflow d'approbation et calcul des soldes de congés légaux.",
    href: "/conges",
    btn: "Gérer les absences",
    color: "var(--amber)",
  },
  {
    title: "✈️ Missions & Déplacements",
    desc: "Suivi des déplacements et ordres de mission PDF officiels.",
    href: "/missions",
    btn: "Gérer les missions",
    color: "#6366f1",
  },
  {
    title: "📈 Carrière & Discipline",
    desc: "Historique des promotions, changements de poste et sanctions.",
    href: "/carriere",
    btn: "Gérer les carrières",
    color: "#ec4899",
  },
  {
    title: "🎓 Formations & Talent",
    desc: "Catalogue de formation et fiches d'évaluation annuelles.",
    href: "/formations",
    btn: "Gérer les talents",
    color: "#8b5cf6",
  },
];

export default function Home() {
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
              <h2 style={{ fontSize: "var(--tmd)", marginBottom: "var(--s2)" }}>{m.title}</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "var(--tsm)", marginBottom: "var(--s4)", lineHeight: 1.4 }}>
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
          <h3 style={{ marginBottom: "var(--s2)" }}>📖 Guide Juridique & RH</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "var(--tsm)", marginBottom: "var(--s4)" }}>
            Accédez aux articles clés de la loi n°90-11, du CIDTA et de la loi n°83-11 pour vos calculs.
          </p>
          <Link href="/guide" className="btn btn-ghost">
            Consulter le guide
          </Link>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: "var(--s2)" }}>⚙️ Paramètres Légaux</h3>
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
