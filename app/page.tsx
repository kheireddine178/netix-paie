import Image from "next/image";
import Link from "next/link";
import FeatureSlides from "@/components/FeatureSlides";

const LEGAL_ITEMS = [
  { title: "CIDTA — Art. 104", desc: "Barème IRG progressif + abattement salarial 40 %" },
  { title: "Loi n°83-11 — Art. 52", desc: "Taux CNAS salariale : 9 %" },
  { title: "Loi n°83-11 — Art. 74", desc: "Assiette cotisable (exclusions panier, transport…)" },
  { title: "LF 2022 — Art. 31", desc: "Barème IRG actuel (6 tranches)" },
  { title: "Décret exéc. n°24-01", desc: "SNMG 24 000 DA / seuil exonération IRG 30 000 DA" },
  { title: "Loi n°90-11", desc: "Code du travail (durée légale, contrat)" },
];

export default function LandingPage() {
  return (
    <div className="landing">
      <header className="landing-hero">
        <nav className="landing-nav">
          <div className="landing-nav-logo">
            <Image src="/logo.svg" alt="Netix Paie" width={110} height={30} priority />
          </div>
          <Link href="/dashboard" className="btn btn-ghost-light btn-sm">
            Entrer →
          </Link>
        </nav>

        <div className="landing-hero-inner">
          <h1>
            La paie algérienne, calculée <span className="accent">juste</span>, du premier au dernier centime.
          </h1>
          <p>
            Netix Paie est un logiciel de gestion de paie conforme au CIDTA, à la loi n°90-11 et à la LF 2024.
            Calculez, enregistrez et éditez les bulletins de vos salariés en dinars algériens, avec le barème
            IRG et les cotisations CNAS appliqués automatiquement.
          </p>
          <div className="landing-hero-actions">
            <Link href="/dashboard" className="btn btn-primary btn-lg">
              Entrer dans l&rsquo;application
            </Link>
            <a
              href="https://github.com/kheireddine178/netix-paie"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost-light btn-lg"
            >
              Voir le code source
            </a>
          </div>

          <div className="landing-badges">
            <span>CIDTA · Art. 104</span>
            <span>Loi n°83-11 (CNAS)</span>
            <span>Loi n°90-11</span>
            <span>LF 2024</span>
          </div>
        </div>
      </header>

      <section className="landing-section">
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
          <h2>Prêt à gérer votre paie ?</h2>
          <p>Accédez à la liste de vos salariés et éditez votre premier bulletin en quelques minutes.</p>
          <Link href="/dashboard" className="btn btn-primary btn-lg">
            Entrer dans l&rsquo;application
          </Link>
        </div>
      </section>

      <footer className="landing-footer">Netix Paie — Créé par Kharrouby Kheireddine</footer>
    </div>
  );
}
