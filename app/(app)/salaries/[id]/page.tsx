import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getSalarie,
  listerContratsSalarie,
  listerCongesSalarie,
  listerInscriptionsSalarie,
  listerBulletinsSalarie,
} from "../actions";
import OdooControlPanel from "@/components/odoo/OdooControlPanel";
import OdooSheet from "@/components/odoo/OdooSheet";
import OdooStatusbar from "@/components/odoo/OdooStatusbar";
import OdooNotebook from "@/components/odoo/OdooNotebook";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

function formatDA(n: number) {
  return n.toLocaleString("fr-FR").replace(/[\u202F\u00A0]/g, " ") + " DA";
}

export default async function SalarieHubPage({ params }: Props) {
  const { id } = await params;
  const salarieId = parseInt(id, 10);
  if (isNaN(salarieId)) notFound();

  const salarie = await getSalarie(salarieId);
  if (!salarie) notFound();

  const [contrats, conges, inscriptions, bulletins] = await Promise.all([
    listerContratsSalarie(salarieId),
    listerCongesSalarie(salarieId),
    listerInscriptionsSalarie(salarieId),
    listerBulletinsSalarie(salarieId),
  ]);

  const contratActif = contrats.find((c) => c.statut === "En cours") || contrats[0] || null;
  const approvedConges = conges.filter((c) => c.type_conge === "Annuel" && c.statut === "Approuvé");
  const congesPris = approvedConges.reduce((sum, c) => sum + c.jours_ouvrables, 0);

  // Calcul théorique des congés acquis (2.5 jours par mois)
  const dateDebut = contrats.length > 0
    ? new Date(Math.min(...contrats.map((c) => new Date(c.date_debut).getTime())))
    : new Date();
  const diffMonths = (new Date().getTime() - dateDebut.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
  const congesAcquis = Math.max(0, Math.floor(diffMonths * 2.5 * 2) / 2);
  const reliquatConges = Math.max(0, congesAcquis - congesPris);

  const modules = [
    {
      title: "Paie Mensuelle",
      desc: "Saisir les variables du mois et calculer le bulletin.",
      href: `/saisie?salarieId=${salarie.id}`,
      badge: "Saisie directe",
      color: "var(--accent)",
    },
    {
      title: "Contrats & Documents",
      desc: "Gérer le contrat CDI/CDD, imprimer PV et attestation.",
      href: `/salaries/${salarie.id}/contrat`,
      badge: `${contrats.length} document(s)`,
      color: "var(--teal)",
    },
    {
      title: "Congés & Absences",
      desc: "Valider les demandes de congés et suivre le reliquat.",
      href: `/salaries/${salarie.id}/conges`,
      badge: `${reliquatConges}j solde`,
      color: "var(--amber)",
    },
    {
      title: "Ordres de Mission",
      desc: "Saisir les déplacements et imprimer l'ordre de mission.",
      href: `/salaries/${salarie.id}/missions`,
      badge: "Déplacements",
      color: "#6366f1",
    },
    {
      title: "Carrière & Discipline",
      desc: "Suivre les promotions et notifier les sanctions.",
      href: `/salaries/${salarie.id}/carriere`,
      badge: "Historique",
      color: "#ec4899",
    },
    {
      title: "Formations & Talent",
      desc: "Gérer les formations et imprimer les évaluations.",
      href: `/salaries/${salarie.id}/formations`,
      badge: `${inscriptions.length} inscription(s)`,
      color: "#8b5cf6",
    },
    {
      title: "Rubriques du Catalogue",
      desc: "Activer ou désactiver des primes et indemnités.",
      href: `/salaries/${salarie.id}/rubriques`,
      badge: "Paramètres paie",
      color: "#06b6d4",
    },
    {
      title: "Historique des Bulletins",
      desc: "Consulter et imprimer les anciens bulletins PDF.",
      href: `/salaries/${salarie.id}/historique`,
      badge: `${bulletins.length} bulletin(s)`,
      color: "#f59e0b",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* 1. ODOO CONTROL PANEL */}
      <OdooControlPanel
        breadcrumbs={[
          { label: "Collaborateurs", href: "/salaries" },
          { label: salarie.nom_prenom },
        ]}
        primaryAction={{
          label: "💰 Calculer la paie",
          href: `/saisie?salarieId=${salarie.id}`,
        }}
        secondaryActions={[
          {
            label: "Modifier la fiche",
            href: `/salaries/${salarie.id}/modifier`,
          },
          {
            label: "Retour à la liste",
            href: "/salaries",
          },
        ]}
      />

      {/* 2. ODOO FORM SHEET (Fiche Document) */}
      <OdooSheet
        statusbar={
          <OdooStatusbar
            steps={[
              { id: "active", label: salarie.actif ? "En activité" : "Inactif" },
              { id: "contract", label: contratActif ? `Contrat : ${contratActif.type_contrat}` : "Sans contrat" },
            ]}
            currentStep={salarie.actif ? "active" : "inactive"}
            actions={
              <div className="flex items-center gap-2">
                <Link
                  href={`/salaries/${salarie.id}/modifier`}
                  className="btn btn-secondary btn-sm text-xs font-semibold"
                >
                  Modifier
                </Link>
                <Link
                  href={`/saisie?salarieId=${salarie.id}`}
                  className="btn btn-primary btn-sm text-xs font-semibold"
                >
                  Saisie de paie
                </Link>
              </div>
            }
          />
        }
        avatar={
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold shadow-sm"
            style={{
              background: "var(--accent-bg)",
              color: "var(--accent-ink)",
              border: "2px solid var(--accent)",
            }}
          >
            {salarie.nom_prenom.slice(0, 2).toUpperCase()}
          </div>
        }
        title={salarie.nom_prenom}
        subtitle={`Matricule : ${salarie.matricule || "—"} • Fonction : ${salarie.fonction || "Non défini"}`}
        smartButtons={[
          {
            id: "sb-bulletins",
            label: "Bulletins PDF",
            count: bulletins.length,
            href: `/salaries/${salarie.id}/historique`,
            icon: "📄",
          },
          {
            id: "sb-contrats",
            label: "Contrat actif",
            count: contratActif ? contratActif.type_contrat : "0",
            href: `/salaries/${salarie.id}/contrat`,
            icon: "📝",
          },
          {
            id: "sb-conges",
            label: "Reliquat Congés",
            count: `${reliquatConges} j`,
            href: `/salaries/${salarie.id}/conges`,
            icon: "🏖️",
          },
          {
            id: "sb-formations",
            label: "Formations",
            count: inscriptions.length,
            href: `/salaries/${salarie.id}/formations`,
            icon: "🎓",
          },
        ]}
      >
        {/* SYSTÈME D'ONGLETS ODOO NOTEBOOK */}
        <OdooNotebook
          tabs={[
            {
              id: "infos_pro",
              label: "Informations Professionnelles",
              content: (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  <div className="flex flex-col gap-3 p-4 rounded-lg border" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
                    <h4 className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground pb-2 border-b" style={{ borderColor: "var(--border-soft)" }}>
                      Poste & Rémunération
                    </h4>
                    <div className="flex justify-between py-1 border-b" style={{ borderColor: "var(--border-soft)" }}>
                      <span className="text-muted-foreground">Intitulé du poste :</span>
                      <strong style={{ color: "var(--text)" }}>{salarie.fonction || "—"}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b" style={{ borderColor: "var(--border-soft)" }}>
                      <span className="text-muted-foreground">Salaire de base théorique :</span>
                      <strong className="text-sm font-bold" style={{ color: "var(--accent)" }}>
                        {formatDA(salarie.salaire_base_theorique)}
                      </strong>
                    </div>
                    <div className="flex justify-between py-1 border-b" style={{ borderColor: "var(--border-soft)" }}>
                      <span className="text-muted-foreground">Matricule interne :</span>
                      <strong className="font-mono">{salarie.matricule || "—"}</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-muted-foreground">Statut du collaborateur :</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${salarie.actif ? "bg-teal-100 text-teal-800" : "bg-gray-100 text-gray-700"}`}>
                        {salarie.actif ? "Actif dans l'effectif" : "Inactif / Sorti"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 p-4 rounded-lg border" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
                    <h4 className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground pb-2 border-b" style={{ borderColor: "var(--border-soft)" }}>
                      Suivi Administratif & Médical
                    </h4>
                    <div className="flex justify-between py-1 border-b" style={{ borderColor: "var(--border-soft)" }}>
                      <span className="text-muted-foreground">Dernière visite médicale :</span>
                      <strong>{salarie.date_visite_medicale ? salarie.date_visite_medicale.split("-").reverse().join("/") : "Non programmée"}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b" style={{ borderColor: "var(--border-soft)" }}>
                      <span className="text-muted-foreground">Type de contrat en cours :</span>
                      <strong>{contratActif ? `${contratActif.type_contrat} (${contratActif.statut})` : "Aucun contrat"}</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-muted-foreground">Solde congés payés :</span>
                      <strong className="text-teal-700">{reliquatConges} jours ouvrables</strong>
                    </div>
                  </div>
                </div>
              ),
            },
            {
              id: "banque",
              label: "Banque & Paiement",
              content: (
                <div className="max-w-md p-4 rounded-lg border text-xs flex flex-col gap-3" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
                  <h4 className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground pb-2 border-b" style={{ borderColor: "var(--border-soft)" }}>
                    Coordonnées Bancaires (Virement Paie)
                  </h4>
                  <div className="flex justify-between py-1 border-b" style={{ borderColor: "var(--border-soft)" }}>
                    <span className="text-muted-foreground">Compte CCP / RIP :</span>
                    <strong className="font-mono">{salarie.ccp_rib || "Non renseigné"}</strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Mode de règlement :</span>
                    <strong>{salarie.ccp_rib ? "Virement Bancaire / CCP" : "Espèces / Chèque"}</strong>
                  </div>
                </div>
              ),
            },
            {
              id: "modules_rh",
              label: "Modules RH Associés",
              count: modules.length,
              content: (
                <div className="odoo-kanban-grid">
                  {modules.map((m) => (
                    <Link
                      key={m.title}
                      href={m.href}
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      <div
                        className="p-4 rounded-lg border transition-all hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between h-full"
                        style={{
                          background: "var(--surface)",
                          borderColor: "var(--border)",
                          borderLeft: `4px solid ${m.color}`,
                        }}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <h4 className="font-bold text-sm" style={{ color: "var(--text)" }}>
                              {m.title}
                            </h4>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                              {m.badge}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {m.desc}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-right block mt-3" style={{ color: m.color }}>
                          Accéder →
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ),
            },
          ]}
        />
      </OdooSheet>
    </div>
  );
}
