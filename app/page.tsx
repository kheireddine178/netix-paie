import Image from "next/image";
import Link from "next/link";
import FeatureSlides from "@/components/FeatureSlides";
import {
  CreditCard,
  Briefcase,
  Calendar,
  Plane,
  TrendingUp,
  GraduationCap,
  UserCheck,
  FileText,
  ShieldAlert,
  Scale,
  Bookmark,
  ChevronRight
} from "lucide-react";

const SIRH_MODULES = [
  { 
    title: "Paie & Bulletins", 
    icon: CreditCard, 
    desc: "Calcul conforme CIDTA / CNAS, abattement 40%, catalogue de rubriques et édition de bulletins PDF." 
  },
  { 
    title: "Contrats & Core RH", 
    icon: Briefcase, 
    desc: "Suivi des CDI, CDD, CTA, PV d'installation et de l'Attestation de travail." 
  },
  { 
    title: "Congés & Absences", 
    icon: Calendar, 
    desc: "Calculateur de solde légal (2.5j/mois), validation et déduction automatique sur la paie." 
  },
  { 
    title: "Missions", 
    icon: Plane, 
    desc: "Déplacements professionnels et édition instantanée de l'Ordre de Mission PDF réglementaire." 
  },
  { 
    title: "Promotions & Sanctions", 
    icon: TrendingUp, 
    desc: "Changements de poste (mise à jour de salaire automatique) et dossier disciplinaire." 
  },
  { 
    title: "Formations & Talent", 
    icon: GraduationCap, 
    desc: "Catalogue de cours, inscriptions et génération de la Fiche d'Évaluation de Performance." 
  },
  { 
    title: "Portail Salarié (ESS)", 
    icon: UserCheck, 
    desc: "Espace self-service pour soumettre les congés et télécharger les bulletins." 
  },
];

const LEGAL_ITEMS = [
  { title: "CIDTA — Art. 104", icon: FileText, desc: "Barème IRG progressif + abattement salarial 40 %" },
  { title: "Loi n°83-11 — Art. 52", icon: ShieldAlert, desc: "Taux CNAS salariale : 9 %" },
  { title: "Loi n°83-11 — Art. 74", icon: Bookmark, desc: "Assiette cotisable (exclusions de panier, transport…)" },
  { title: "LF 2022 — Art. 31", icon: FileText, desc: "Barème IRG actuel (6 tranches)" },
  { title: "Décret exéc. n°24-01", icon: Scale, desc: "SNMG 24 000 DA / seuil exonération IRG 30 000 DA" },
  { title: "Loi n°90-11", icon: Scale, desc: "Code du travail (durée légale, contrat de travail)" },
];

export default function LandingPage() {
  return (
    <div className="landing">
      <header className="landing-hero">
        <nav className="landing-nav">
          <div className="landing-nav-logo">
            <Image src="/logo.svg" alt="Netix SIRH" width={148} height={40} priority />
          </div>
          <Link href="/dashboard" className="btn btn-ghost-light btn-sm">
            Entrer →
          </Link>
        </nav>

        <div className="landing-hero-inner">
          <div className="landing-eyebrow">
            <span>SIRH &amp; Paie Algérie</span>
          </div>
          <h1>
            Le premier SIRH complet &amp; Paie conforme conçu pour <span className="accent">l'entreprise algérienne</span>.
          </h1>
          <p>
            Netix centralise vos processus RH, congés et paie conforme (CIDTA &amp; CNAS) au sein d'une plateforme moderne, collaborative et sécurisée.
          </p>
          <div className="landing-hero-actions">
            <Link href="/dashboard" className="btn btn-primary btn-lg btn-button-in-button">
              <span>Entrer dans le SIRH</span>
              <span className="btn-icon-circle">
                <ChevronRight size={16} />
              </span>
            </Link>
            <Link href="/portail" className="btn btn-ghost-light btn-lg">
              Accès Portail Salarié
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
        <div className="modules-grid">
          {SIRH_MODULES.map((m) => {
            const Icon = m.icon;
            return (
              <div className="nested-bezel-outer" key={m.title}>
                <div className="nested-bezel-inner module-card">
                  <div className="module-card-icon-wrap">
                    <Icon size={20} className="text-teal" />
                  </div>
                  <h3>{m.title}</h3>
                  <p>{m.desc}</p>
                </div>
              </div>
            );
          })}
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
          {LEGAL_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div className="nested-bezel-outer" key={item.title}>
                <div className="nested-bezel-inner legal-card">
                  <div className="legal-card-icon-wrap">
                    <Icon size={18} className="text-marine" />
                  </div>
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.desc}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="landing-section" style={{ paddingTop: 0 }}>
        <div className="landing-cta">
          <h2>Prêt à digitaliser votre gestion des ressources humaines ?</h2>
          <p>Configurez vos contrats, gérez vos salariés et éditez vos bulletins en toute conformité.</p>
          <Link href="/dashboard" className="btn btn-primary btn-lg btn-button-in-button">
            <span>Entrer dans l&rsquo;application</span>
            <span className="btn-icon-circle">
              <ChevronRight size={16} />
            </span>
          </Link>
        </div>
      </section>

      <footer className="landing-footer">Netix SIRH — Créé par Kharrouby Kheireddine</footer>
    </div>
  );
}
