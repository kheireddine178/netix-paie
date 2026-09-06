import type { RubriqueCatalogueRow } from "@/lib/rubriquesDynamiques";
import type { ResultatPaie } from "@/lib/paieCalcul";

// ==================================================================
// MODULE 0 : SALARIÉS (CORE RH)
// ==================================================================

export interface Salarie {
  id: number;
  matricule: string | null;
  nom_prenom: string;
  fonction: string | null;
  salaire_base_theorique: number;
  actif: boolean;
  date_visite_medicale?: string | null;
  ccp_rib?: string | null;
}

export interface ListerSalariesParams {
  search?: string;
  actifOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface ListerSalariesResult {
  salaries: Salarie[];
  totalCount: number;
}

// ==================================================================
// MODULE 1 : CONTRATS & DOSSIERS COLLABORATEURS
// ==================================================================

export interface ContratRow {
  id: number;
  salarie_id: number;
  type_contrat: string;
  date_debut: string;
  date_fin: string | null;
  periode_essai_mois: number;
  statut: string;
  salaire_base_contrat: number;
  cree_le: string;
}

export interface DocumentSalarieRow {
  id: number;
  salarie_id: number;
  nom_document: string;
  categorie: string;
  fichier_url: string;
  cree_le: string;
}

// ==================================================================
// MODULE 2 : ABSENCES & CONGÉS
// ==================================================================

export interface CongeRow {
  id: number;
  salarie_id: number;
  type_conge: string;
  date_debut: string;
  date_fin: string;
  jours_ouvrables: number;
  statut: string;
  motif: string | null;
  justificatif_url: string | null;
  cree_le: string;
}

// ==================================================================
// MODULE 3 : MISSIONS & DÉPLACEMENTS
// ==================================================================

export interface MissionRow {
  id: number;
  salarie_id: number;
  objet: string;
  destination: string;
  date_debut: string;
  date_fin: string;
  moyen_transport: string;
  statut: string;
  cree_le: string;
}

// ==================================================================
// MODULE 4 : HISTORIQUE DE CARRIÈRE & DISCIPLINE
// ==================================================================

export interface PromotionRow {
  id: number;
  salarie_id: number;
  ancien_poste: string | null;
  nouveau_poste: string;
  ancienne_categorie: string | null;
  nouvelle_categorie: string | null;
  date_effet: string;
  salaire_base_nouveau: number;
  cree_le: string;
}

export interface SanctionRow {
  id: number;
  salarie_id: number;
  type_sanction: string;
  motif: string;
  date_sanction: string;
  duree_mise_a_pied: number | null;
  cree_le: string;
}

// ==================================================================
// MODULE 5 : FORMATIONS & ÉVALUATIONS
// ==================================================================

export interface FormationRow {
  id: number;
  titre: string;
  theme: string;
  organisme: string;
  duree_jours: number;
  prix_da: number;
}

export interface InscriptionRow {
  id: number;
  formation_id: number;
  salarie_id: number;
  date_debut: string;
  statut: string;
  cree_le: string;
  formation?: FormationRow;
}

// ==================================================================
// MODULE 6 : AVANCES SUR SALAIRE
// ==================================================================

export interface AvanceSalaireRow {
  id: number;
  salarie_id: number;
  montant: number;
  mois: number;
  annee: number;
  statut: string;
  motif: string | null;
  cree_le: string;
}

// ==================================================================
// MODULE 7 : OBJECTIFS & ÉVALUATIONS DE PERFORMANCE
// ==================================================================

export interface ObjectifRow {
  id: number;
  salarie_id: number;
  annee: number;
  titre: string;
  poids: number;
  cible: string | null;
  realise: string | null;
  taux_reussite: number;
  cree_le: string;
}

// ==================================================================
// MODULE 8 : PAIE & RUBRIQUES
// ==================================================================

export interface RubriqueCatalogue extends RubriqueCatalogueRow {
  formule?: string | null;
}

export interface RubriqueAssignee extends RubriqueCatalogue {
  valeur_saisie: number | null;
  taux_personnalise: number | null;
  actif: boolean;
  ordre_affichage: number;
}

export interface ResultatBulletin extends ResultatPaie {
  nom_prenom: string;
  matricule: string | null;
  fonction: string | null;
  mois: number;
  annee: number;
}

export interface DonneesPourPdf {
  salarie: Salarie;
  mois: number;
  annee: number;
  resultat: ResultatBulletin;
}

export interface LigneRubriqueSaisie {
  code: string;
  valeur: number;
  taux?: number;
}

export interface BulletinPourSaisie {
  id?: number;
  mois: number;
  annee: number;
  jours_travailles: number;
  heures_sup: number;
  primes: number;
  retenues: number;
  mode_calcul_irg: "normal" | "forfaitaire" | "abattement_specifique";
  donnees_brutes?: Record<string, unknown>;
  lignes_rubriques?: LigneRubriqueSaisie[];
}

export interface BulletinResume {
  id: number;
  salarie_id: number;
  mois: number;
  annee: number;
  salaire_net: number;
  salaire_brut: number;
  cree_le: string;
}

export interface VariableBulletinCollective {
  salarieId: number;
  jours_travailles: number;
  heures_sup: number;
  primes: number;
  retenues: number;
  lignes_rubriques: LigneRubriqueSaisie[];
}
