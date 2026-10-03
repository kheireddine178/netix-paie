import Image from "next/image";
import Link from "next/link";
import {
  CreditCard,
  Users,
  Calendar,
  FileText,
  Plane,
  TrendingUp,
  GraduationCap,
  UserCheck,
  ChevronRight,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

const CORE_PILLARS = [
  {
    icon: Users,
    title: "Gestion des Salariés",
    desc: "Un annuaire unifié pour centraliser les coordonnées, fiches de poste, dossiers administratifs et coordonnées bancaires de vos équipes.",
    color: "var(--odoo-purple, #714B67)",
  },
  {
    icon: CreditCard,
    title: "Calcul Automatique de la Paie",
    desc: "Saisissez les primes et absences, le système calcule instantanément le Brut, les cotisations CNAS et l'IRG avec édition des bulletins PDF.",
    color: "var(--odoo-teal, #017E84)",
  },
  {
    icon: Calendar,
    title: "Congés & Absences",
    desc: "Gérez les demandes de congés légaux (loi 90-11), validez en un clic et synchronisez automatiquement les déductions sur la paie du mois.",
    color: "var(--amber, #D97706)",
  },
  {
    icon: FileText,
    title: "Contrats & Documents RH",
    desc: "Suivez les contrats CDI/CDD, éditez les attestations d'emploi, procès-verbaux d'installation et ordres de mission officiels.",
    color: "#2563EB",
  },
];

const SIRH_MODULES = [
  { 
    title: "Dossiers Collaborateurs", 
    icon: Users, 
    desc: "Fiches individuelles complètes, historique de carrière et suivi des effectifs." 
  },
  { 
    title: "Saisie & Calcul de Paie", 
    icon: CreditCard, 
    desc: "Moteur de calcul en temps réel, gestion des rubriques et impression des fiches de paie." 
  },
  { 
    title: "Contrats & Core RH", 
    icon: FileText, 
    desc: "Suivi des dates d'échéance, périodes d'essai, avenants et pièces jointes." 
  },
  { 
    title: "Congés & Absences", 
    icon: Calendar, 
    desc: "Gestion du solde de congés, calendrier des absences et validations en ligne." 
  },
  { 
    title: "Ordres de Mission", 
    icon: Plane, 
    desc: "Gestion des déplacements professionnels avec génération instantanée de l'ordre de mission." 
  },
  { 
    title: "Carrière & Discipline", 
    icon: TrendingUp, 
    desc: "Historique des promotions, changements de salaire et suivi disciplinaire." 
  },
  { 
    title: "Formations & Évaluations", 
    icon: GraduationCap, 
    desc: "Plan de formation d'entreprise et fiches d'évaluation de performance." 
  },
  { 
    title: "Portail Employé en Libre-Service", 
    icon: UserCheck, 
    desc: "Espace dédié aux collaborateurs pour consulter leurs bulletins et poser leurs congés." 
  },
];

export default function LandingPage() {
  return (
    <div className="landing min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      {/* 1. HERO SECTION ODOO ENTERPRISE */}
      <header
        className="landing-hero relative overflow-hidden text-white"
        style={{
          background: "linear-gradient(135deg, #2D1A27 0%, #462D3F 45%, #714B67 100%)",
          padding: "3rem 1.5rem 5rem",
        }}
      >
        {/* Navigation supérieure */}
        <nav className="max-w-6xl mx-auto flex items-center justify-between gap-4 mb-16">
          <div className="flex items-center gap-3">
            <Image src="/logo.svg" alt="Netix SIRH" width={140} height={38} priority />
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/portail"
              className="text-xs font-semibold px-3 py-2 rounded-lg text-purple-100 hover:text-white transition-colors"
            >
              Espace Salarié
            </Link>
            <Link
              href="/dashboard"
              className="text-xs font-bold px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white backdrop-blur-xs transition-all border border-white/20"
            >
              Accéder au SIRH →
            </Link>
          </div>
        </nav>

        {/* Contenu principal du Hero */}
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/10 text-purple-100 border border-white/20 mb-6 backdrop-blur-xs">
            <Sparkles size={14} className="text-amber-300" />
            <span>Système d&apos;Information Ressources Humaines &amp; Paie Algérie</span>
          </div>

          {/* Titre simple et percutant */}
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-6">
            Le SIRH moderne qui simplifie vos équipes et{" "}
            <span style={{ color: "#2DD4BF" }}>automatise votre paie</span>.
          </h1>

          {/* Description claire et accessible */}
          <p className="text-base sm:text-lg text-purple-100/90 max-w-2xl mx-auto leading-relaxed mb-10">
            Netix regroupe toute l&apos;ergonomie d&apos;Odoo Enterprise pour piloter vos collaborateurs, éditer vos bulletins de salaire conformes à la loi 90-11 et centraliser vos déclarations.
          </p>

          {/* Boutons d'appel à l'action */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm bg-white text-purple-950 shadow-xl hover:bg-purple-50 transition-all hover:-translate-y-0.5"
            >
              <span>Ouvrir l&apos;application</span>
              <ChevronRight size={16} className="text-purple-700" />
            </Link>

            <Link
              href="/saisie"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-xs transition-all"
            >
              <span>Calculer une fiche de paie</span>
            </Link>
          </div>

          {/* 3 Promesses clés */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 mt-12 pt-8 border-t border-white/15 text-xs font-medium text-purple-100">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>Gestion complète des salariés</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>Calcul de paie en temps réel (Loi 90-11)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>Bulletins &amp; Virements prêts à l&apos;emploi</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. CE QUE FAIT NETIX : LES 4 PILIERS */}
      <section className="max-w-6xl mx-auto px-4 py-16 w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider block mb-2" style={{ color: "var(--accent)" }}>
            Fonctionnalités Clés
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: "var(--text)" }}>
            Tout ce dont vous avez besoin pour gérer vos ressources humaines
          </h2>
          <p className="text-sm text-muted-foreground mt-3">
            Fini les fichiers Excel dispersés et les calculs manuels fastidieux : Netix regroupe l&apos;essentiel au même endroit.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {CORE_PILLARS.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="p-6 rounded-2xl border transition-all duration-150 hover:shadow-lg hover:-translate-y-0.5 flex flex-col justify-between"
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--border)",
                }}
              >
                <div>
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-white shadow-sm"
                    style={{ background: p.color }}
                  >
                    <Icon size={24} />
                  </div>
                  <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text)" }}>
                    {p.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {p.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. L'ENSEMBLE DES MODULES DISPONIBLES */}
      <section className="py-14 border-t" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: "var(--text)" }}>
              Une suite RH modulaire et complète
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              Chaque module s&apos;intègre automatiquement pour vous faire gagner du temps chaque jour.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SIRH_MODULES.map((m) => {
              const Icon = m.icon;
              return (
                <div
                  key={m.title}
                  className="p-4 rounded-xl border flex flex-col gap-2.5 transition-all hover:bg-white hover:shadow-md"
                  style={{
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "var(--accent-bg)", color: "var(--accent)" }}
                  >
                    <Icon size={18} />
                  </div>
                  <h3 className="text-sm font-bold m-0" style={{ color: "var(--text)" }}>
                    {m.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed m-0">
                    {m.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. APPEL À L'ACTION FINAL (CTA) */}
      <section className="py-16 text-center max-w-3xl mx-auto px-4">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-4" style={{ color: "var(--text)" }}>
          Prêt à piloter votre entreprise avec Netix ?
        </h2>
        <p className="text-sm text-muted-foreground mb-8 max-w-lg mx-auto">
          Accédez directement à votre espace de travail pour ajouter vos collaborateurs et éditer vos premières fiches de paie.
        </p>
        <Link
          href="/dashboard"
          className="btn btn-primary inline-flex items-center gap-2 text-sm font-bold px-6 py-3.5 rounded-xl shadow-lg hover:-translate-y-0.5 transition-transform"
        >
          <span>Accéder au Tableau de Bord</span>
          <ChevronRight size={16} />
        </Link>
      </section>

      {/* FOOTER ÉPURÉ */}
      <footer
        className="mt-auto py-6 border-t text-center text-xs text-muted-foreground"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>Netix SIRH — Plateforme de gestion des Ressources Humaines &amp; Paie</span>
          <span className="font-medium">Créé par Kharrouby Kheireddine</span>
        </div>
      </footer>
    </div>
  );
}
