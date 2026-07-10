import Image from "next/image";
import Link from "next/link";
import FeatureSlides from "@/components/FeatureSlides";

const SIRH_MODULES = [
  { title: "🧮 Paie & Bulletins", desc: "Calcul conforme CIDTA / CNAS, abattement 40%, 402 rubriques du catalogue et édition de bulletins PDF." },
  { title: "💼 Contrats & Core RH", desc: "Suivi des CDI, CDD, CTA, avenants. Impression du PV d'installation et de l'Attestation de travail." },
  { title: "📅 Congés & Absences", desc: "Calculateur de solde légal (2.5j/mois), workflow de validation et liaison de déduction automatique sur la paie." },
  { title: "✈️ Missions", desc: "Enregistrement des déplacements professionnels et édition instantanée de l'Ordre de Mission PDF réglementaire." },
  { title: "📈 Promotions & Sanctions", desc: "Suivi d'évolution de carrière (mise à jour de salaire automatique) et dossier disciplinaire (lettre d'avertissement)." },
  { title: "🎓 Formations & Talent", desc: "Catalogue de cours, suivi des inscriptions des salariés et génération de la Fiche d'Évaluation de Performance." },
  { title: "🔑 Portail Salarié (ESS)", desc: "Espace self-service sécurisé permettant à chaque collaborateur de soumettre ses congés et de télécharger ses bulletins." },
];

const LEGAL_ITEMS = [
  { title: "CIDTA — Art. 104", desc: "Barème IRG progressif + abattement salarial 40 %" },
  { title: "Loi n°83-11 — Art. 52", desc: "Taux CNAS salariale : 9 %" },
  { title: "Loi n°83-11 — Art. 74", desc: "Assiette cotisable (exclusions de panier, transport…)" },
  { title: "LF 2022 — Art. 31", desc: "Barème IRG actuel (6 tranches)" },
  { title: "Décret exéc. n°24-01", desc: "SNMG 24 000 DA / seuil exonération IRG 30 000 DA" },
  { title: "Loi n°90-11", desc: "Code du travail (durée légale, contrat de travail)" },
];

export default function LandingPage() {
  return (
    <div className="landing">
      <header className="landing-hero">
        <nav className="landing-nav">
          <div className="landing-nav-logo">
            <Image src="/logo.svg" alt="Netix SIRH" width={110} height={30} priority />
          </div>
          <Link href="/dashboard" className="btn btn-ghost-light btn-sm">
            Entrer →
          </Link>
        </nav>

        <div className="landing-hero-inner">
          <h1>
            Le premier SIRH complet & Paie conforme conçu pour <span className="accent">l'entreprise algérienne</span>.
          </h1>
          <p>
            Netix centralise vos processus RH : du recrutement et contrats à la paie réglementaire en dinars algériens (DA) conforme au CIDTA, loi n°90-11, loi n°83-11 et LF 2024. Suivez les carrières, les congés et donnez un accès self-service à vos salariés.
          </p>
          <div className="landing-hero-actions">
            <Link href="/dashboard" className="btn btn-primary btn-lg">
              Entrer dans le SIRH
            </Link>
            <Link href="/portail" className="btn btn-ghost-light btn-lg">
              Accès Portail Salarié 🔑
            </Link>
          </div>

          <div className="landing-badges">
            <span>CIDTA · Art. 104</span>
            <span>Loi n°83-11 (CNAS)</span>
            <span>Loi n°90-11</span>
            <span>LF 2024</span>
          </div>
        </div>
      </header>

      {/* Section des 7 Modules */}
      <section className="landing-section">
        <div className="landing-section-head">
          <h2>Un SIRH modulaire et intégré de bout en bout</h2>
          <p>
            Découvrez nos 7 modules fonctionnels pour automatiser l'intégralité de vos ressources humaines.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "var(--s4)", marginTop: "var(--s6)" }}>
          {SIRH_MODULES.map((m) => (
            <div className="card" key={m.title} style={{ padding: "var(--s4)", borderTop: "3px solid var(--accent)" }}>
              <h3 style={{ fontSize: "var(--tmd)", marginBottom: "var(--s2)", display: "flex", alignItems: "center", gap: 8 }}>
                {m.title}
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "var(--tsm)", lineHeight: 1.5 }}>{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section" style={{ paddingTop: 0 }}>
        <div className="landing-section-head">
          <h2>Tout ce qu&rsquo;il faut pour éditer une paie fiable</h2>
          <p>
            De la fiche salarié au bulletin PDF, chaque étape suit un calcul en cascade transparent et
            conforme à la réglementation algérienne.
          </p>
        </div>
        <FeatureSlides />
      </section>

      <section className="landing-section" style={{ paddingTop: 0 }}>
        <div className="landing-section-head">
          <h2>Un cadre légal couvert de bout en bout</h2>
          <p>Les textes qui encadrent le calcul sont directement intégrés au moteur de paie.</p>
        </div>
        <div className="legal-grid">
          {LEGAL_ITEMS.map((item) => (
            <div className="legal-card" key={item.title}>
              <strong>{item.title}</strong>
              <span>{item.desc}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section" style={{ paddingTop: 0 }}>
        <div className="landing-cta">
          <h2>Prêt à digitaliser votre gestion des ressources humaines ?</h2>
          <p>Configurez vos contrats, gérez vos salariés et éditez vos bulletins en toute conformité.</p>
          <Link href="/dashboard" className="btn btn-primary btn-lg">
            Entrer dans l&rsquo;application
          </Link>
        </div>
      </section>

      <footer className="landing-footer">Netix SIRH — Créé par Kharrouby Kheireddine</footer>
    </div>
  );
}
