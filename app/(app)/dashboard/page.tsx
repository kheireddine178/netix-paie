import Link from "next/link";
import {
  IconUsers,
  IconCalculator,
  IconFileText,
  IconCalendar,
  IconPlane,
  IconTrendingUp,
  IconGraduation,
  IconBarChart,
  IconBook,
  IconSettings,
  IconAlertTriangle,
  IconCheckCircle,
} from "@/components/Icons";
import { listerSalaries, listerTousContrats } from "../salaries/actions";
import OdooControlPanel from "@/components/odoo/OdooControlPanel";

export const dynamic = "force-dynamic";

function formatDA(n: number) {
  return (n || 0).toLocaleString("fr-FR").replace(/[\u202F\u00A0]/g, " ") + " DA";
}

export default async function DashboardPage() {
  const [salaries, contrats] = await Promise.all([
    listerSalaries(),
    listerTousContrats(),
  ]);

  const totalCollaborateurs = salaries.length;
  const actifs = salaries.filter((s) => s.actif).length;
  const inactifs = totalCollaborateurs - actifs;

  const masseSalarialeTheorique = salaries
    .filter((s) => s.actif)
    .reduce((acc, s) => acc + (s.salaire_base_theorique || 0), 0);

  const salaireMoyen = actifs > 0 ? Math.round(masseSalarialeTheorique / actifs) : 0;

  const contratsEnCours = contrats.filter((c) => c.statut === "En cours");
  const cdiActifs = contratsEnCours.filter((c) => c.type_contrat === "CDI").length;
  const cddActifs = contratsEnCours.filter((c) => c.type_contrat === "CDD").length;

  const dateAujourdhui = new Date();
  const limiteAlertes = new Date();
  limiteAlertes.setDate(dateAujourdhui.getDate() + 30); // Échéances sous 30 jours

  // 1. Détecter les CDD se terminant sous 30 jours
  const cddExpirations = contrats.filter((c) => {
    if (c.type_contrat !== "CDD" || c.statut !== "En cours" || !c.date_fin) return false;
    const dateFin = new Date(c.date_fin);
    return dateFin >= dateAujourdhui && dateFin <= limiteAlertes;
  });

  // 2. Détecter les visites médicales expirant ou manquantes
  const visitesMedicalesExpirations = salaries.filter((s) => {
    if (!s.actif) return false;
    if (!s.date_visite_medicale) return true;
    const derniereVisite = new Date(s.date_visite_medicale);
    const dateEcheance = new Date(derniereVisite);
    dateEcheance.setFullYear(dateEcheance.getFullYear() + 1);
    return dateEcheance <= limiteAlertes;
  });

  const totalAlertes = cddExpirations.length + visitesMedicalesExpirations.length;

  const MODULES = [
    {
      title: "Collaborateurs",
      desc: "Gestion de l'annuaire, fiches matriculaires, dossiers et coordonnées.",
      href: "/salaries",
      badge: `${totalCollaborateurs} collaborateurs`,
      color: "var(--odoo-purple, #714B67)",
      icon: <IconUsers size={20} />,
      quickAction: "Annuaire",
    },
    {
      title: "Paie & Salaires",
      desc: "Variables mensuelles, primes, acomptes, calcul IRG et bulletins PDF.",
      href: "/saisie",
      badge: "Période active",
      color: "var(--odoo-purple, #714B67)",
      icon: <IconCalculator size={20} />,
      quickAction: "Calculer la paie",
    },
    {
      title: "Contrats & Core RH",
      desc: "Gestion des CDI, CDD, périodes d'essai, PV d'installation et attestations.",
      href: "/contrats",
      badge: `${contratsEnCours.length} contrats`,
      color: "var(--odoo-teal, #017E84)",
      icon: <IconFileText size={20} />,
      quickAction: "Gérer",
    },
    {
      title: "Congés & Absences",
      desc: "Workflow de validation, autorisations et soldes légaux loi 90-11.",
      href: "/conges",
      badge: "Soldes en temps réel",
      color: "var(--amber, #D97706)",
      icon: <IconCalendar size={20} />,
      quickAction: "Consulter",
    },
    {
      title: "Missions & Ordres",
      desc: "Suivi des déplacements professionnels et génération des ordres de mission.",
      href: "/missions",
      badge: "Documents officiels",
      color: "#2563EB",
      icon: <IconPlane size={20} />,
      quickAction: "Ordres de mission",
    },
    {
      title: "Carrière & Échelons",
      desc: "Historique des promotions, avancements, changements de poste et sanctions.",
      href: "/carriere",
      badge: "Traçabilité",
      color: "#DB2777",
      icon: <IconTrendingUp size={20} />,
      quickAction: "Historique",
    },
    {
      title: "Formations & Talent",
      desc: "Catalogue de formations, plan annuel et grilles d'évaluation des compétences.",
      href: "/formations",
      badge: "Compétences",
      color: "#7C3AED",
      icon: <IconGraduation size={20} />,
      quickAction: "Talents",
    },
    {
      title: "États & Déclarations",
      desc: "Récapitulatifs mensuels, journal de paie, export comptable et bordereaux CNAS.",
      href: "/rapports",
      badge: "Rapports légaux",
      color: "#059669",
      icon: <IconBarChart size={20} />,
      quickAction: "États de paie",
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* 1. ODOO CONTROL PANEL */}
      <OdooControlPanel
        breadcrumbs={[{ label: "Tableau de Bord SIRH" }]}
        primaryAction={{
          label: "+ Nouveau collaborateur",
          href: "/salaries/nouveau",
        }}
        secondaryActions={[
          {
            label: "💰 Saisie de paie",
            href: "/saisie",
          },
          {
            label: "⚡ Saisie collective",
            href: "/saisie/collective",
          },
          {
            label: "📊 États de paie",
            href: "/rapports",
          },
        ]}
        extraRight={
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded"
              style={{
                background: "var(--surface-2)",
                color: "var(--text-2)",
                border: "1px solid var(--border)",
              }}
            >
              👥 {totalCollaborateurs} collaborateurs
            </span>
            {totalAlertes > 0 ? (
              <span
                className="text-xs font-bold px-2.5 py-1 rounded"
                style={{
                  background: "#FEF2F2",
                  color: "#991B1B",
                  border: "1px solid #FECACA",
                }}
              >
                ⚠️ {totalAlertes} échéance(s)
              </span>
            ) : (
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded"
                style={{
                  background: "#ECFDF5",
                  color: "#065F46",
                  border: "1px solid #A7F3D0",
                }}
              >
                ✓ Conformité OK
              </span>
            )}
          </div>
        }
      />

      {/* 2. STATS & KPIS BAR (ODOO ENTERPRISE KPI CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* KPI 1 : Effectif */}
        <Link
          href="/salaries"
          className="group rounded-xl border p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                Effectif Actif
              </span>
              <div className="text-2xl font-extrabold mt-1" style={{ color: "var(--text)" }}>
                {actifs}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  / {totalCollaborateurs}
                </span>
              </div>
            </div>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: "var(--accent-bg)",
                color: "var(--accent)",
              }}
            >
              <IconUsers size={20} />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t text-[11px] font-medium text-muted-foreground flex items-center justify-between" style={{ borderColor: "var(--border-soft)" }}>
            <span>{inactifs > 0 ? `${inactifs} inactif(s)` : "100% de l'effectif actif"}</span>
            <span className="text-purple-700 dark:text-purple-300 font-semibold group-hover:underline">
              Annuaire →
            </span>
          </div>
        </Link>

        {/* KPI 2 : Masse Salariale */}
        <Link
          href="/saisie"
          className="group rounded-xl border p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                Masse Salariale Base
              </span>
              <div className="text-xl font-extrabold mt-1" style={{ color: "var(--text)" }}>
                {formatDA(masseSalarialeTheorique)}
              </div>
            </div>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: "var(--teal-bg)",
                color: "var(--teal)",
              }}
            >
              <IconCalculator size={20} />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t text-[11px] font-medium text-muted-foreground flex items-center justify-between" style={{ borderColor: "var(--border-soft)" }}>
            <span>Moyenne : {formatDA(salaireMoyen)}</span>
            <span className="text-teal-700 dark:text-teal-300 font-semibold group-hover:underline">
              Paie du mois →
            </span>
          </div>
        </Link>

        {/* KPI 3 : Contrats */}
        <Link
          href="/contrats"
          className="group rounded-xl border p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                Contrats en Cours
              </span>
              <div className="text-2xl font-extrabold mt-1" style={{ color: "var(--text)" }}>
                {contratsEnCours.length}
              </div>
            </div>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: "var(--amber-bg)",
                color: "var(--amber)",
              }}
            >
              <IconFileText size={20} />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t text-[11px] font-medium text-muted-foreground flex items-center justify-between" style={{ borderColor: "var(--border-soft)" }}>
            <span>{cdiActifs} CDI · {cddActifs} CDD</span>
            <span className="text-amber-700 dark:text-amber-300 font-semibold group-hover:underline">
              Contrats →
            </span>
          </div>
        </Link>

        {/* KPI 4 : Alertes RH */}
        <div
          className="rounded-xl border p-4 flex flex-col justify-between transition-all"
          style={{
            background: totalAlertes > 0 ? "rgba(254, 242, 242, 0.6)" : "var(--surface)",
            borderColor: totalAlertes > 0 ? "#FECACA" : "var(--border)",
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                Vigilance RH
              </span>
              <div
                className="text-2xl font-extrabold mt-1"
                style={{ color: totalAlertes > 0 ? "#991B1B" : "var(--teal)" }}
              >
                {totalAlertes}
              </div>
            </div>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: totalAlertes > 0 ? "#FEE2E2" : "#ECFDF5",
                color: totalAlertes > 0 ? "#DC2626" : "#059669",
              }}
            >
              {totalAlertes > 0 ? <IconAlertTriangle size={20} /> : <IconCheckCircle size={20} />}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t text-[11px] font-medium text-muted-foreground flex items-center justify-between" style={{ borderColor: "var(--border-soft)" }}>
            <span>
              {cddExpirations.length} fin(s) CDD · {visitesMedicalesExpirations.length} visite(s)
            </span>
            {totalAlertes > 0 ? (
              <a href="#alertes-rh" className="text-red-700 font-semibold hover:underline">
                Examiner ↓
              </a>
            ) : (
              <span className="text-emerald-700 font-semibold">À jour</span>
            )}
          </div>
        </div>
      </div>

      {/* 3. SECTION ALERTES RH (Si échéances en cours) */}
      {totalAlertes > 0 && (
        <div
          id="alertes-rh"
          className="p-4 rounded-xl border border-l-4 text-xs transition-all"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
            borderLeftColor: "#DC2626",
          }}
        >
          <div className="flex items-center gap-2 font-bold mb-3 text-red-700 dark:text-red-400">
            <IconAlertTriangle size={18} />
            <h3 className="m-0 text-sm font-bold">Échéances & Points de Vigilance RH ({totalAlertes})</h3>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {cddExpirations.length > 0 && (
              <div className="p-3 rounded-lg bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30">
                <strong className="text-red-900 dark:text-red-300 block mb-2 font-bold">
                  Contrats CDD à terme sous 30 jours :
                </strong>
                <ul className="space-y-1.5 m-0 pl-0 list-none">
                  {cddExpirations.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {c.salaries?.nom_prenom}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/50 px-2 py-0.5 rounded">
                          Fin : {c.date_fin?.split("-").reverse().join("/")}
                        </span>
                        <Link
                          href={`/salaries/${c.salarie_id}/contrat`}
                          className="text-[11px] font-bold text-purple-700 hover:underline"
                        >
                          Dossier →
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {visitesMedicalesExpirations.length > 0 && (
              <div className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                <strong className="text-amber-900 dark:text-amber-300 block mb-2 font-bold">
                  Visites médicales obligatoires à planifier :
                </strong>
                <p className="text-amber-800 dark:text-amber-200 text-xs mb-2">
                  <strong>{visitesMedicalesExpirations.length} collaborateur(s)</strong> nécessitent une visite médicale périodique de travail conforme à la loi 90-11.
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  {visitesMedicalesExpirations.slice(0, 4).map((s) => (
                    <Link
                      key={s.id}
                      href={`/salaries/${s.id}`}
                      className="text-[11px] px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-amber-200 text-amber-900 dark:text-amber-100 font-medium hover:border-amber-400"
                    >
                      {s.nom_prenom}
                    </Link>
                  ))}
                  {visitesMedicalesExpirations.length > 4 && (
                    <span className="text-[11px] text-muted-foreground">
                      +{visitesMedicalesExpirations.length - 4} autres
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. GRILLE DES MODULES SIRH (ODOO APP TILES) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold tracking-tight uppercase text-muted-foreground">
            Applications & Modules SIRH
          </h2>
          <span className="text-xs text-muted-foreground font-medium">
            Odoo 17/18 Enterprise Hub
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {MODULES.map((m) => (
            <Link
              key={m.title}
              href={m.href}
              className="group rounded-xl border p-4.5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
              }}
            >
              <div>
                {/* Entête Carte Module */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
                    style={{
                      background: "var(--surface-2)",
                      color: m.color,
                      border: "1px solid var(--border)",
                    }}
                  >
                    {m.icon}
                  </div>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: "var(--surface-2)",
                      color: "var(--text-muted)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {m.badge}
                  </span>
                </div>

                <h3
                  className="text-sm font-bold group-hover:text-purple-900 dark:group-hover:text-purple-300 transition-colors m-0 mb-1.5"
                  style={{ color: "var(--text)" }}
                >
                  {m.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {m.desc}
                </p>
              </div>

              {/* Action rapide Odoo */}
              <div
                className="mt-4 pt-2.5 border-t flex items-center justify-between text-xs font-semibold"
                style={{ borderColor: "var(--border-soft)" }}
              >
                <span className="text-[11px] text-muted-foreground group-hover:text-foreground transition-colors">
                  {m.quickAction}
                </span>
                <span
                  className="text-[11px] transition-transform group-hover:translate-x-0.5"
                  style={{ color: m.color }}
                >
                  Ouvrir →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 5. RESSOURCES RÉGLEMENTAIRES & BARÈMES OFFICIELS */}
      <div className="grid sm:grid-cols-2 gap-3.5">
        <Link
          href="/guide"
          className="group p-4 rounded-xl border transition-all duration-200 hover:shadow-md hover:border-teal-300 flex items-start gap-3.5"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "var(--teal-bg)", color: "var(--teal)" }}
          >
            <IconBook size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-bold m-0" style={{ color: "var(--text)" }}>
                Guide Réglementaire & Droit du Travail
              </h3>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                Loi 90-11
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-2">
              Articles officiels sur les congés, indemnités de licenciement, préavis et barème IRG 2024.
            </p>
            <span className="text-xs font-bold text-teal-700 dark:text-teal-400 group-hover:underline">
              Consulter le référentiel juridique →
            </span>
          </div>
        </Link>

        <Link
          href="/parametres"
          className="group p-4 rounded-xl border transition-all duration-200 hover:shadow-md hover:border-purple-300 flex items-start gap-3.5"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "var(--accent-bg)", color: "var(--accent)" }}
          >
            <IconSettings size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-bold m-0" style={{ color: "var(--text)" }}>
                Paramètres & Barèmes de Paie
              </h3>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800">
                SNMG 20 000 DA
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-2">
              Taux CNAS (9% salarié / 26% patronal), abattements d&apos;impôt et seuils d&apos;exonération.
            </p>
            <span className="text-xs font-bold text-purple-700 dark:text-purple-400 group-hover:underline">
              Ajuster les barèmes de calcul →
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}
