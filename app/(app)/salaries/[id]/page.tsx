import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getSalarie,
  listerContratsSalarie,
  listerCongesSalarie,
  listerInscriptionsSalarie,
  listerBulletinsSalarie,
} from "../actions";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
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
      color: "var(--accent)",
    },
    {
      title: "Contrats & Documents",
      desc: "Gérer le contrat CDI/CDD, imprimer PV et attestation.",
      href: `/salaries/${salarie.id}/contrat`,
      color: "var(--teal)",
    },
    {
      title: "Congés & Absences",
      desc: "Valider les demandes de congés et suivre le reliquat.",
      href: `/salaries/${salarie.id}/conges`,
      color: "var(--amber)",
    },
    {
      title: "Ordres de Mission",
      desc: "Saisir les déplacements et imprimer l'ordre de mission.",
      href: `/salaries/${salarie.id}/missions`,
      color: "#6366f1",
    },
    {
      title: "Carrière & Discipline",
      desc: "Suivre les promotions et notifier les sanctions disciplinaires.",
      href: `/salaries/${salarie.id}/carriere`,
      color: "#ec4899",
    },
    {
      title: "Formations & Talent",
      desc: "Gérer les formations et imprimer les évaluations.",
      href: `/salaries/${salarie.id}/formations`,
      color: "#8b5cf6",
    },
    {
      title: "Rubriques du Catalogue",
      desc: "Activer ou désactiver des primes et indemnités du catalogue.",
      href: `/salaries/${salarie.id}/rubriques`,
      color: "#06b6d4",
    },
    {
      title: "Historique des Bulletins",
      desc: "Consulter et imprimer les anciens bulletins de paie PDF.",
      href: `/salaries/${salarie.id}/historique`,
      color: "#f59e0b",
    },
  ];


  return (
    <div className="space-y-6">
      {/* En-tête du profil */}
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <span style={{ fontSize: "var(--t2xs)", color: "var(--text-muted)", fontWeight: "bold", textTransform: "uppercase" }}>Fiche Collaborateur</span>
          <h1 style={{ marginTop: 4 }}>{salarie.nom_prenom}</h1>
          <p style={{ color: "var(--text-muted)" }}>
            {salarie.fonction || "Pas de fonction renseignée"} · Matricule : {salarie.matricule || "—"}
          </p>
        </div>
        <Link href="/salaries" className="btn btn-secondary btn-sm">
          ← Retour à la liste
        </Link>
      </div>

      {/* Résumé rapide */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--s4)" }}>
        <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <strong style={{ fontSize: "var(--t2xs)", color: "var(--text-muted)", textTransform: "uppercase" }}>Contrat Actif</strong>
          <p style={{ fontSize: "var(--tmd)", fontWeight: "bold", margin: "4px 0" }}>
            {contratActif ? `${contratActif.type_contrat} (${contratActif.statut})` : "Aucun contrat"}
          </p>
          {contratActif && <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Début : {contratActif.date_debut.split("-").reverse().join("/")}</span>}
        </div>

        <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <strong style={{ fontSize: "var(--t2xs)", color: "var(--text-muted)", textTransform: "uppercase" }}>Solde de Congés</strong>
          <p style={{ fontSize: "var(--tmd)", fontWeight: "bold", margin: "4px 0" }}>{reliquatConges} jours</p>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Acquis : {congesAcquis}j · Pris : {congesPris}j</span>
        </div>

        <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <strong style={{ fontSize: "var(--t2xs)", color: "var(--text-muted)", textTransform: "uppercase" }}>Rémunération de base</strong>
          <p style={{ fontSize: "var(--tmd)", fontWeight: "bold", margin: "4px 0" }}>
            {salarie.salaire_base_theorique.toLocaleString("fr-FR").replace(/[\u202F\u00A0]/g, ' ')} DA
          </p>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Mensuel brut réglementaire</span>
        </div>
      </div>

      {/* Grille des modules */}
      <h2 style={{ fontSize: "var(--tmd)", marginTop: "var(--s6)", marginBottom: "var(--s2)" }}>Modules RH disponibles pour ce salarié :</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "var(--s4)" }}>
        {modules.map((m) => (
          <Link
            key={m.title}
            href={m.href}
            className="card hover-card"
            style={{
              textDecoration: "none",
              color: "inherit",
              borderTop: `4px solid ${m.color}`,
              padding: "var(--s4)",
              transition: "transform 0.2s, box-shadow 0.2s",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <h3 style={{ fontSize: "var(--tmd)", fontWeight: "bold", color: "var(--text)", marginBottom: "8px" }}>
                {m.title}
              </h3>
              <p style={{ fontSize: "var(--tsm)", color: "var(--text-muted)", lineHeight: 1.4 }}>
                {m.desc}
              </p>
            </div>
            <div style={{ textAlign: "right", marginTop: "16px", color: m.color, fontWeight: "bold", fontSize: "12px" }}>
              Ouvrir →
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
