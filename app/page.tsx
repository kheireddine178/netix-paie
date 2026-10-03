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
  ShieldCheck,
  Layers,
} from "lucide-react";

const CORE_PILLARS = [
  {
    icon: Users,
    title: "Gestion des Collaborateurs",
    desc: "Un annuaire unifié pour centraliser les coordonnées, fiches de poste, dossiers administratifs et coordonnées bancaires de vos équipes.",
  },
  {
    icon: CreditCard,
    title: "Calcul Automatique de la Paie",
    desc: "Saisissez les primes et absences, le moteur certifié calcule instantanément le Brut, les cotisations CNAS (9%/26%) et l'IRG avec édition des bulletins PDF.",
  },
  {
    icon: Calendar,
    title: "Congés & Absences",
    desc: "Gérez les demandes de congés légaux (loi 90-11), validez en un clic et synchronisez automatiquement les déductions sur la paie du mois.",
  },
  {
    icon: FileText,
    title: "Contrats & Documents RH",
    desc: "Suivez les contrats CDI/CDD, éditez les attestations d'emploi, procès-verbaux d'installation et certificats de travail officiels.",
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
    title: "Contrats & Documents", 
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
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      {/* 1. HERO SECTION NETIX SIRH */}
      <header
        className="relative overflow-hidden text-white bg-[#0F172A]"
        style={{
          background: "radial-gradient(ellipse at top, #1E1B4B 0%, #0F172A 100%)",
          padding: "2.5rem 1.5rem 5rem",
        }}
      >
        {/* Navigation supérieure */}
        <nav className="max-w-6xl mx-auto flex items-center justify-between gap-4 mb-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#4F46E5] flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
              N
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-white leading-tight">
                NETIX SIRH
              </span>
              <span className="text-[10px] text-indigo-300 font-medium tracking-wider uppercase">
                Système RH &amp; Paie Algérie
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/design"
              className="text-xs font-semibold px-3 py-2 rounded-lg text-indigo-200 hover:text-white transition-colors"
            >
              Design System
            </Link>
            <Link
              href="/portail"
              className="text-xs font-semibold px-3 py-2 rounded-lg text-indigo-200 hover:text-white transition-colors"
            >
              Espace Salarié
            </Link>
            <Link
              href="/dashboard"
              className="text-xs font-bold px-4 py-2 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white transition-all shadow-sm"
            >
              Accéder au SIRH →
            </Link>
          </div>
        </nav>

        {/* Contenu principal du Hero */}
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/10 text-indigo-200 border border-white/15 mb-6 backdrop-blur-xs">
            <Sparkles size={14} className="text-indigo-400" />
            <span>Conformité Loi 90-11 • Barème IRG 2024 • CNAS 9% / 26%</span>
          </div>

          {/* Titre percutant */}
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-6">
            Le SIRH moderne qui unifie vos équipes et{" "}
            <span className="text-indigo-400">automatise votre paie</span>.
          </h1>

          {/* Description */}
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed mb-10">
            Netix centralise la gestion de vos collaborateurs, sécurise l&apos;émission de vos bulletins de paie algériens et simplifie toutes vos obligations déclaratives.
          </p>

          {/* Boutons d'appel à l'action */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-lg font-bold text-sm bg-[#4F46E5] text-white shadow-lg hover:bg-[#4338CA] transition-all hover:-translate-y-0.5"
            >
              <span>Ouvrir le Tableau de Bord</span>
              <ChevronRight size={16} />
            </Link>

            <Link
              href="/saisie"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-lg font-semibold text-sm bg-white/10 hover:bg-white/15 text-white border border-white/20 backdrop-blur-xs transition-all"
            >
              <span>Calculer une fiche de paie</span>
            </Link>
          </div>

          {/* 3 Promesses clés */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 mt-12 pt-8 border-t border-white/10 text-xs font-medium text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>Dossier collaborateur unique &amp; complet</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>Moteur de paie certifié (Loi 90-11 &amp; CIDTA)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>Bordereaux CNAS &amp; Déclarations prêtes</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. LES 4 PILIERS DE NETIX */}
      <section className="max-w-6xl mx-auto px-4 py-16 w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-[#4F46E5] block mb-2">
            Fonctionnalités Majeures
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
            Tout ce dont votre direction RH a besoin au quotidien
          </h2>
          <p className="text-sm text-[#64748B] mt-3">
            Fini les fichiers Excel dispersés et les risques d&apos;erreur de formule : Netix SIRH garantit l&apos;intégrité de vos données sociales.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {CORE_PILLARS.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="p-6 rounded-lg border border-[#E2E8F0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)] transition-all duration-150 hover:border-[#CBD5E1] flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-lg bg-[#EEF2FF] border border-[#E0E7FF] text-[#4F46E5] flex items-center justify-center mb-4">
                    <Icon size={20} strokeWidth={1.75} />
                  </div>
                  <h3 className="text-base font-bold text-[#0F172A] mb-2">{p.title}</h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">{p.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. TOUS LES MODULES DU SIRH */}
      <section className="bg-white border-t border-b border-[#E2E8F0] py-16">
        <div className="max-w-6xl mx-auto px-4 w-full">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#4F46E5] block mb-2">
              Architecture Complète
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
              Une plateforme unifiée, de l&apos;embauche au départ
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SIRH_MODULES.map((m) => {
              const Icon = m.icon;
              return (
                <div
                  key={m.title}
                  className="p-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] flex flex-col gap-2 hover:bg-white transition-colors"
                >
                  <div className="w-8 h-8 rounded-md bg-white border border-[#E2E8F0] text-[#4F46E5] flex items-center justify-center shrink-0">
                    <Icon size={16} strokeWidth={1.75} />
                  </div>
                  <h4 className="text-xs font-bold text-[#0F172A]">{m.title}</h4>
                  <p className="text-[11px] text-[#64748B] leading-relaxed">{m.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. FOOTER SOBRE */}
      <footer className="py-8 text-center text-xs text-[#64748B]">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#0F172A]">NETIX SIRH</span>
            <span>•</span>
            <span>Version 1.0 (Conforme Loi 90-11)</span>
          </div>
          <div>Created by Kharrouby Kheireddine</div>
        </div>
      </footer>
    </div>
  );
}
