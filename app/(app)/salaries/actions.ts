"use server";

import { supabase } from "@/lib/supabaseClient";
import {
  calculerPaie,
  calculerBaseAvantRubriques,
  categorieRubrique,
  CODES_GERES_NATIVEMENT,
  PARAMETRES_PAR_DEFAUT,
  SAISIE_VIDE,
  type CategorieRubrique,
  type LigneRubriqueDynamique,
  type Parametres,
  type ResultatPaie,
  type SaisieMensuelle,
} from "@/lib/paieCalcul";
import { resoudreLigneRubrique, type RubriqueCatalogueRow } from "@/lib/rubriquesDynamiques";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export interface Salarie {
  id: number;
  matricule: string | null;
  nom_prenom: string;
  fonction: string | null;
  salaire_base_theorique: number;
  actif: boolean;
}

export async function listerSalaries(): Promise<Salarie[]> {
  const { data, error } = await supabase
    .from("salaries")
    .select("*")
    .order("nom_prenom");

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function creerSalarie(formData: FormData) {
  const nom_prenom = formData.get("nom_prenom") as string;
  const matricule = (formData.get("matricule") as string) || null;
  const fonction = (formData.get("fonction") as string) || null;
  const salaire_base_theorique = parseFloat(formData.get("salaire_base_theorique") as string) || 0;

  const { error } = await supabase.from("salaries").insert({
    nom_prenom,
    matricule,
    fonction,
    salaire_base_theorique,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/salaries");
  redirect("/salaries");
}

/** Met à jour les informations de base d'un salarié existant. */
export async function modifierSalarie(id: number, formData: FormData) {
  const nom_prenom = formData.get("nom_prenom") as string;
  const matricule = (formData.get("matricule") as string) || null;
  const fonction = (formData.get("fonction") as string) || null;
  const salaire_base_theorique = parseFloat(formData.get("salaire_base_theorique") as string) || 0;

  const { error } = await supabase
    .from("salaries")
    .update({
      nom_prenom,
      matricule,
      fonction,
      salaire_base_theorique,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/salaries");
  redirect("/salaries");
}

/** Désactive un salarié (soft delete) : son historique de bulletins est conservé. */
export async function desactiverSalarie(id: number) {
  const { error } = await supabase.from("salaries").update({ actif: false }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/salaries");
}

/** Réactive un salarié précédemment désactivé. */
export async function reactiverSalarie(id: number) {
  const { error } = await supabase.from("salaries").update({ actif: true }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/salaries");
}

/**
 * Supprime définitivement un salarié et tout son historique
 * (bulletins, rubriques de bulletins, rubriques assignées).
 * Action irréversible — la confirmation doit être faite côté client.
 */
export async function supprimerSalarieDefinitif(id: number) {
  const { data: bulletins, error: bulletinsError } = await supabase
    .from("bulletins")
    .select("id")
    .eq("salarie_id", id);

  if (bulletinsError) throw new Error(bulletinsError.message);

  const bulletinIds = (bulletins ?? []).map((b) => b.id);

  if (bulletinIds.length > 0) {
    const { error: brError } = await supabase
      .from("bulletin_rubriques")
      .delete()
      .in("bulletin_id", bulletinIds);
    if (brError) throw new Error(brError.message);
  }

  const { error: bError } = await supabase.from("bulletins").delete().eq("salarie_id", id);
  if (bError) throw new Error(bError.message);

  const { error: srError } = await supabase.from("salarie_rubriques").delete().eq("salarie_id", id);
  if (srError) throw new Error(srError.message);

  const { error: sError } = await supabase.from("salaries").delete().eq("id", id);
  if (sError) throw new Error(sError.message);

  revalidatePath("/salaries");
}

export async function getSalarie(id: number): Promise<Salarie | null> {
  const { data, error } = await supabase
    .from("salaries")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

/** Récupère les paramètres de paie (SNMG, barème IRG, infos employeur, etc.) depuis Supabase. */
export async function getParametres(): Promise<Parametres> {
  const { data, error } = await supabase.from("parametres").select("data").single();
  if (error || !data) return PARAMETRES_PAR_DEFAUT;
  return data.data;
}

// ------------------------------------------------------------------
// Étape 7 — Rubriques dynamiques du catalogue (402 codes)
// ------------------------------------------------------------------

export interface RubriqueCatalogue extends RubriqueCatalogueRow {
  categorie: CategorieRubrique;
}

export interface RubriqueAssignee extends RubriqueCatalogue {
  valeur_defaut: number;
}

/**
 * Liste les rubriques du catalogue qui peuvent être assignées à un salarié : uniquement
 * les codes "saisissables" (Gain (+) / Retenue (-)) qui ne sont pas déjà gérés nativement
 * par les champs V1 du formulaire de bulletin (CODES_GERES_NATIVEMENT dans paieCalcul.ts).
 */
export async function listerCatalogueRubriques(): Promise<RubriqueCatalogue[]> {
  const { data, error } = await supabase
    .from("rubriques_catalogue")
    .select("code, libelle, type_valeur, cotisable, imposable")
    .in("type_valeur", ["Gain (+)", "Retenue (-)"])
    .order("code");

  if (error) throw new Error(error.message);

  return (data ?? [])
    .filter((r) => !CODES_GERES_NATIVEMENT.has(r.code))
    .map((r) => ({ ...r, categorie: categorieRubrique(r.code) }));
}

/** Rubriques du catalogue actuellement cochées/assignées à un salarié donné. */
export async function listerRubriquesSalarie(salarieId: number): Promise<RubriqueAssignee[]> {
  const { data, error } = await supabase
    .from("salarie_rubriques")
    .select("rubrique_code, valeur_defaut, rubriques_catalogue(code, libelle, type_valeur, cotisable, imposable)")
    .eq("salarie_id", salarieId);

  if (error) throw new Error(error.message);

  return (data ?? [])
    .map((r) => {
      const cat = Array.isArray(r.rubriques_catalogue) ? r.rubriques_catalogue[0] : r.rubriques_catalogue;
      if (!cat) return null;
      return {
        code: cat.code,
        libelle: cat.libelle,
        type_valeur: cat.type_valeur,
        cotisable: cat.cotisable,
        imposable: cat.imposable,
        valeur_defaut: r.valeur_defaut ?? 0,
        categorie: categorieRubrique(cat.code),
      };
    })
    .filter((r): r is RubriqueAssignee => r !== null)
    .sort((a, b) => a.code.localeCompare(b.code));
}

/**
 * Enregistre les rubriques cochées pour un salarié (page /salaries/[id]/rubriques).
 * Champs de formulaire attendus, pour chaque code coché : `rub_<code>`="on" et
 * `defaut_<code>`=valeur par défaut (peut être 0).
 * Remplace entièrement la sélection précédente (les cases décochées sont retirées).
 */
export async function assignerRubriquesSalarie(salarieId: number, formData: FormData) {
  const codesCoches: { code: string; valeur_defaut: number }[] = [];
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("rub_") && value === "on") {
      const code = key.slice(4);
      const valeurDefaut = parseFloat((formData.get(`defaut_${code}`) as string) || "0") || 0;
      codesCoches.push({ code, valeur_defaut: valeurDefaut });
    }
  }

  const { error: delError } = await supabase
    .from("salarie_rubriques")
    .delete()
    .eq("salarie_id", salarieId);
  if (delError) throw new Error(delError.message);

  if (codesCoches.length > 0) {
    const { error: insError } = await supabase.from("salarie_rubriques").insert(
      codesCoches.map((c) => ({
        salarie_id: salarieId,
        rubrique_code: c.code,
        valeur_defaut: c.valeur_defaut,
      })),
    );
    if (insError) throw new Error(insError.message);
  }

  revalidatePath(`/salaries/${salarieId}/rubriques`);
  revalidatePath(`/salaries/${salarieId}/bulletin`);
}

/**
 * Rattache une rubrique du catalogue à un salarié de façon incrémentale (sans toucher
 * aux autres rubriques déjà assignées), appelée quand l'utilisateur ajoute une rubrique
 * à la volée depuis la recherche du formulaire de saisie mensuelle. Une fois rattachée,
 * la rubrique suit le salarié d'un mois à l'autre, comme dans la version Python.
 * Idempotent : n'insère rien si la rubrique est déjà assignée à ce salarié.
 */
export async function ajouterRubriqueSalarie(salarieId: number, code: string) {
  const { data: existant, error: selError } = await supabase
    .from("salarie_rubriques")
    .select("id")
    .eq("salarie_id", salarieId)
    .eq("rubrique_code", code)
    .maybeSingle();
  if (selError) throw new Error(selError.message);

  if (!existant) {
    const { error } = await supabase
      .from("salarie_rubriques")
      .insert({ salarie_id: salarieId, rubrique_code: code, valeur_defaut: 0 });
    if (error) throw new Error(error.message);
  }

  revalidatePath(`/salaries/${salarieId}/rubriques`);
  revalidatePath(`/salaries/${salarieId}/bulletin`);
}

/**
 * Détache une rubrique du catalogue d'un salarié (symétrique de ajouterRubriqueSalarie),
 * appelée quand l'utilisateur retire une rubrique depuis le formulaire de saisie mensuelle.
 */
export async function retirerRubriqueSalarie(salarieId: number, code: string) {
  const { error } = await supabase
    .from("salarie_rubriques")
    .delete()
    .eq("salarie_id", salarieId)
    .eq("rubrique_code", code);
  if (error) throw new Error(error.message);

  revalidatePath(`/salaries/${salarieId}/rubriques`);
  revalidatePath(`/salaries/${salarieId}/bulletin`);
}

// ------------------------------------------------------------------
// Bulletin mensuel (V1 + rubriques dynamiques)
// ------------------------------------------------------------------

export interface ResultatBulletin extends ResultatPaie {
  bulletin_id: number;
  annee: number;
  mois: number;
}

/**
 * Calcule et enregistre un bulletin de paie mensuel pour un salarié.
 * Reçoit les champs du formulaire (champs V1 + champs dynamiques `dyn_<code>_v1`/`_v2`
 * pour chaque rubrique du catalogue cochée pour ce salarié), construit une
 * SaisieMensuelle complète, appelle calculerPaie(), puis sauvegarde à la fois les
 * données saisies (table `bulletins`) et le détail des rubriques dynamiques
 * (table `bulletin_rubriques`).
 */
export async function creerBulletin(salarieId: number, formData: FormData): Promise<ResultatBulletin> {
  const num = (name: string) => parseFloat(formData.get(name) as string) || 0;

  const annee = parseInt(formData.get("annee") as string, 10);
  const mois = parseInt(formData.get("mois") as string, 10);

  const salarie = await getSalarie(salarieId);
  if (!salarie) throw new Error("Salarié introuvable");

  const params = await getParametres();

  const champsAbsences = {
    salaire_base_theorique: num("salaire_base_theorique") || salarie.salaire_base_theorique,
    maladie_h: num("maladie_h"),
    mise_a_pied_h: num("mise_a_pied_h"),
    accident_travail_h: num("accident_travail_h"),
    retard_h: num("retard_h"),
    absence_irreguliere_h: num("absence_irreguliere_h"),
  };
  const { salaire_base_reel } = calculerBaseAvantRubriques(champsAbsences, params);

  // Résolution des rubriques dynamiques présentes dans le formulaire, à partir des
  // champs dyn_<code>_v1 (et _v2 pour la catégorie "nombre_x_taux"). On ne se limite
  // plus aux rubriques préassignées au salarié : n'importe quel code du catalogue peut
  // avoir été ajouté à la volée depuis la recherche dans le formulaire de saisie.
  const codesPostes = new Set<string>();
  for (const key of formData.keys()) {
    const m = key.match(/^dyn_(.+)_v1$/);
    if (m) codesPostes.add(m[1]);
  }

  let catalogueMap = new Map<string, RubriqueCatalogueRow>();
  if (codesPostes.size > 0) {
    const { data: catalogueRows, error: catError } = await supabase
      .from("rubriques_catalogue")
      .select("code, libelle, type_valeur, cotisable, imposable")
      .in("code", Array.from(codesPostes));
    if (catError) throw new Error(catError.message);
    catalogueMap = new Map((catalogueRows ?? []).map((r) => [r.code, r]));
  }

  const valeursRubriques: { code: string; valeur_1: number; valeur_2: number }[] = [];
  const rubriques_dynamiques: LigneRubriqueDynamique[] = [];
  for (const code of codesPostes) {
    const cat = catalogueMap.get(code);
    if (!cat) continue; // code inconnu du catalogue : ignoré par sécurité
    const categorie = categorieRubrique(code);
    const v1 = num(`dyn_${code}_v1`);
    const v2 = categorie === "nombre_x_taux" ? num(`dyn_${code}_v2`) : 0;
    valeursRubriques.push({ code, valeur_1: v1, valeur_2: v2 });
    const ligne = resoudreLigneRubrique(cat, v1, v2, salaire_base_reel);
    if (ligne) rubriques_dynamiques.push(ligne);
  }

  const saisie: SaisieMensuelle = {
    ...SAISIE_VIDE,
    ...champsAbsences,
    heures_sup_1: num("heures_sup_1"),
    heures_sup_2: num("heures_sup_2"),
    heures_sup_3: num("heures_sup_3"),
    icr: num("icr"),
    taux_iep: num("taux_iep"),
    taux_nuisance: num("taux_nuisance"),
    taux_responsabilite: num("taux_responsabilite"),
    taux_disponibilite: num("taux_disponibilite"),
    taux_pri: num("taux_pri"),
    taux_prc: num("taux_prc"),
    panier_jours: num("panier_jours"),
    panier_forfait_jour: num("panier_forfait_jour"),
    autre_prime_fixe: num("autre_prime_fixe"),
    cotis_mutuelle: num("cotis_mutuelle"),
    autres_retenues: num("autres_retenues"),
    rubriques_dynamiques,
  };

  const resultat = calculerPaie(saisie, params);

  const { data: bulletinRow, error } = await supabase
    .from("bulletins")
    .upsert(
      {
        salarie_id: salarieId,
        annee,
        mois,
        salaire_base_theorique: saisie.salaire_base_theorique,
        maladie_h: saisie.maladie_h,
        mise_a_pied_h: saisie.mise_a_pied_h,
        accident_travail_h: saisie.accident_travail_h,
        retard_h: saisie.retard_h,
        absence_irreguliere_h: saisie.absence_irreguliere_h,
        heures_sup_1: saisie.heures_sup_1,
        heures_sup_2: saisie.heures_sup_2,
        heures_sup_3: saisie.heures_sup_3,
        icr: saisie.icr,
        taux_iep: saisie.taux_iep,
        taux_nuisance: saisie.taux_nuisance,
        taux_responsabilite: saisie.taux_responsabilite,
        taux_disponibilite: saisie.taux_disponibilite,
        taux_pri: saisie.taux_pri,
        taux_prc: saisie.taux_prc,
        panier_jours: saisie.panier_jours,
        panier_forfait_jour: saisie.panier_forfait_jour,
        autre_prime_fixe: saisie.autre_prime_fixe,
        cotis_mutuelle: saisie.cotis_mutuelle,
        autres_retenues: saisie.autres_retenues,
        modifie_le: new Date().toISOString(),
      },
      { onConflict: "salarie_id,annee,mois" },
    )
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  const bulletinId = bulletinRow.id as number;

  // Sauvegarde des valeurs de rubriques dynamiques saisies ce mois-ci (remplace les
  // valeurs d'un éventuel bulletin déjà enregistré pour ce salarié/mois/année).
  const { error: delRubError } = await supabase
    .from("bulletin_rubriques")
    .delete()
    .eq("bulletin_id", bulletinId);
  if (delRubError) throw new Error(delRubError.message);

  const valeursNonNulles = valeursRubriques.filter((v) => v.valeur_1 !== 0 || v.valeur_2 !== 0);
  if (valeursNonNulles.length > 0) {
    const { error: insRubError } = await supabase.from("bulletin_rubriques").insert(
      valeursNonNulles.map((v) => ({
        bulletin_id: bulletinId,
        rubrique_code: v.code,
        valeur_1: v.valeur_1,
        valeur_2: v.valeur_2,
      })),
    );
    if (insRubError) throw new Error(insRubError.message);
  }

  revalidatePath(`/salaries/${salarieId}/bulletin`);
  return { ...resultat, bulletin_id: bulletinId, annee, mois };
}

// ------------------------------------------------------------------
// Étape 6 — Génération du PDF
// ------------------------------------------------------------------

export interface DonneesPourPdf {
  salarie: Salarie;
  params: Parametres;
  saisie: SaisieMensuelle;
  resultat: ResultatPaie;
}

/**
 * Recharge un bulletin déjà enregistré (table `bulletins` + `bulletin_rubriques`) et
 * reconstruit la SaisieMensuelle et le ResultatPaie correspondants, pour la génération
 * du PDF à la volée (voir app/salaries/[id]/bulletin/pdf/route.ts).
 * Retourne `null` si aucun bulletin n'existe pour ce salarié / cette période.
 */
export async function getBulletinPourPdf(
  salarieId: number,
  annee: number,
  mois: number,
): Promise<DonneesPourPdf | null> {
  const salarie = await getSalarie(salarieId);
  if (!salarie) return null;

  const { data: bulletin, error } = await supabase
    .from("bulletins")
    .select("*")
    .eq("salarie_id", salarieId)
    .eq("annee", annee)
    .eq("mois", mois)
    .single();

  if (error || !bulletin) return null;

  const params = await getParametres();

  const { data: bulletinRubriques } = await supabase
    .from("bulletin_rubriques")
    .select("rubrique_code, valeur_1, valeur_2, rubriques_catalogue(code, libelle, type_valeur, cotisable, imposable)")
    .eq("bulletin_id", bulletin.id);

  const champsAbsences = {
    salaire_base_theorique: bulletin.salaire_base_theorique,
    maladie_h: bulletin.maladie_h,
    mise_a_pied_h: bulletin.mise_a_pied_h,
    accident_travail_h: bulletin.accident_travail_h,
    retard_h: bulletin.retard_h,
    absence_irreguliere_h: bulletin.absence_irreguliere_h,
  };
  const { salaire_base_reel } = calculerBaseAvantRubriques(champsAbsences, params);

  const rubriques_dynamiques: LigneRubriqueDynamique[] = [];
  for (const br of bulletinRubriques ?? []) {
    const cat = Array.isArray(br.rubriques_catalogue) ? br.rubriques_catalogue[0] : br.rubriques_catalogue;
    if (!cat) continue;
    const ligne = resoudreLigneRubrique(cat, br.valeur_1 ?? 0, br.valeur_2 ?? 0, salaire_base_reel);
    if (ligne) rubriques_dynamiques.push(ligne);
  }

  const saisie: SaisieMensuelle = {
    ...SAISIE_VIDE,
    ...champsAbsences,
    heures_sup_1: bulletin.heures_sup_1,
    heures_sup_2: bulletin.heures_sup_2,
    heures_sup_3: bulletin.heures_sup_3,
    icr: bulletin.icr,
    taux_iep: bulletin.taux_iep,
    taux_nuisance: bulletin.taux_nuisance,
    taux_responsabilite: bulletin.taux_responsabilite,
    taux_disponibilite: bulletin.taux_disponibilite,
    taux_pri: bulletin.taux_pri,
    taux_prc: bulletin.taux_prc,
    panier_jours: bulletin.panier_jours,
    panier_forfait_jour: bulletin.panier_forfait_jour,
    autre_prime_fixe: bulletin.autre_prime_fixe,
    cotis_mutuelle: bulletin.cotis_mutuelle,
    autres_retenues: bulletin.autres_retenues,
    rubriques_dynamiques,
  };

  const resultat = calculerPaie(saisie, params);

  return { salarie, params, saisie, resultat };
}

// ------------------------------------------------------------------
// Rechargement d'un bulletin existant pour édition (bouton "Charger")
// ------------------------------------------------------------------

export interface LigneRubriqueSaisie {
  code: string;
  libelle: string | null;
  categorie: CategorieRubrique;
  valeur_1: number;
  valeur_2: number;
}

export interface BulletinPourSaisie {
  bulletin_id: number;
  champs: Record<string, number>;
  rubriques: LigneRubriqueSaisie[];
}

/**
 * Relit un bulletin déjà enregistré (table `bulletins` + `bulletin_rubriques`) pour
 * repréremplir le formulaire de saisie mensuelle (bouton "Charger"), y compris les
 * rubriques dynamiques ajoutées à la volée qui ne font pas partie des rubriques
 * préassignées au salarié. Retourne `null` si aucun bulletin n'existe pour cette
 * période : le formulaire de saisie repart alors vierge pour un nouveau bulletin.
 */
export async function chargerBulletinPourSaisie(
  salarieId: number,
  annee: number,
  mois: number,
): Promise<BulletinPourSaisie | null> {
  const { data: bulletin, error } = await supabase
    .from("bulletins")
    .select("*")
    .eq("salarie_id", salarieId)
    .eq("annee", annee)
    .eq("mois", mois)
    .maybeSingle();

  if (error) throw new Error(error.message);

  if (!bulletin) {
    // Si aucun bulletin n'existe, on pré-remplit les absences à partir des congés approuvés
    const { data: congesApprouves } = await supabase
      .from("conges")
      .select("type_conge, date_debut, date_fin, jours_ouvrables")
      .eq("salarie_id", salarieId)
      .eq("statut", "Approuvé");

    let maladieHrs = 0;
    let absIrrHrs = 0;

    if (congesApprouves && congesApprouves.length > 0) {
      const debutTarget = new Date(annee, mois - 1, 1);
      const finTarget = new Date(annee, mois, 0);

      for (const c of congesApprouves) {
        const debut = new Date(c.date_debut);
        const fin = new Date(c.date_fin);

        if (debut <= finTarget && fin >= debutTarget) {
          const hrs = (c.jours_ouvrables ?? 0) * 8;
          if (c.type_conge === "Maladie") {
            maladieHrs += hrs;
          } else if (c.type_conge === "Sans solde") {
            absIrrHrs += hrs;
          }
        }
      }
    }

    const sal = await getSalarie(salarieId);
    const baseTheorique = sal ? sal.salaire_base_theorique : 0;

    return {
      bulletin_id: 0,
      champs: {
        salaire_base_theorique: baseTheorique,
        maladie_h: maladieHrs,
        mise_a_pied_h: 0,
        accident_travail_h: 0,
        retard_h: 0,
        absence_irreguliere_h: absIrrHrs,
        heures_sup_1: 0,
        heures_sup_2: 0,
        heures_sup_3: 0,
        icr: 0,
        taux_iep: 0,
        taux_nuisance: 0,
        taux_responsabilite: 0,
        taux_disponibilite: 0,
        taux_pri: 0,
        taux_prc: 0,
        panier_jours: 0,
        panier_forfait_jour: 0,
        autre_prime_fixe: 0,
        cotis_mutuelle: 0,
        autres_retenues: 0,
      },
      rubriques: [],
    };
  }

  const { data: bulletinRubriques } = await supabase
    .from("bulletin_rubriques")
    .select("rubrique_code, valeur_1, valeur_2, rubriques_catalogue(code, libelle)")
    .eq("bulletin_id", bulletin.id);

  const rubriques: LigneRubriqueSaisie[] = (bulletinRubriques ?? []).map((br) => {
    const cat = Array.isArray(br.rubriques_catalogue) ? br.rubriques_catalogue[0] : br.rubriques_catalogue;
    const code = cat?.code ?? br.rubrique_code;
    return {
      code,
      libelle: cat?.libelle ?? code,
      categorie: categorieRubrique(code),
      valeur_1: br.valeur_1 ?? 0,
      valeur_2: br.valeur_2 ?? 0,
    };
  });

  return {
    bulletin_id: bulletin.id,
    champs: {
      salaire_base_theorique: bulletin.salaire_base_theorique,
      maladie_h: bulletin.maladie_h,
      mise_a_pied_h: bulletin.mise_a_pied_h,
      accident_travail_h: bulletin.accident_travail_h,
      retard_h: bulletin.retard_h,
      absence_irreguliere_h: bulletin.absence_irreguliere_h,
      heures_sup_1: bulletin.heures_sup_1,
      heures_sup_2: bulletin.heures_sup_2,
      heures_sup_3: bulletin.heures_sup_3,
      icr: bulletin.icr,
      taux_iep: bulletin.taux_iep,
      taux_nuisance: bulletin.taux_nuisance,
      taux_responsabilite: bulletin.taux_responsabilite,
      taux_disponibilite: bulletin.taux_disponibilite,
      taux_pri: bulletin.taux_pri,
      taux_prc: bulletin.taux_prc,
      panier_jours: bulletin.panier_jours,
      panier_forfait_jour: bulletin.panier_forfait_jour,
      autre_prime_fixe: bulletin.autre_prime_fixe,
      cotis_mutuelle: bulletin.cotis_mutuelle,
      autres_retenues: bulletin.autres_retenues,
    },
    rubriques,
  };
}

// ------------------------------------------------------------------
// Historique des bulletins
// ------------------------------------------------------------------

export interface BulletinResume {
  id: number;
  annee: number;
  mois: number;
  net_a_payer: number;
  modifie_le: string | null;
}

/**
 * Liste tous les bulletins déjà enregistrés pour un salarié (du plus récent au plus
 * ancien), avec le net à payer recalculé pour affichage dans l'historique.
 * Ne modifie rien en base — lecture seule.
 */
export async function listerBulletinsSalarie(salarieId: number): Promise<BulletinResume[]> {
  const salarie = await getSalarie(salarieId);
  if (!salarie) return [];

  const params = await getParametres();

  const { data: bulletins, error } = await supabase
    .from("bulletins")
    .select("*")
    .eq("salarie_id", salarieId)
    .order("annee", { ascending: false })
    .order("mois", { ascending: false });

  if (error) throw new Error(error.message);
  if (!bulletins || bulletins.length === 0) return [];

  const bulletinIds = bulletins.map((b) => b.id);

  const { data: toutesRubriques, error: rubError } = await supabase
    .from("bulletin_rubriques")
    .select(
      "bulletin_id, rubrique_code, valeur_1, valeur_2, rubriques_catalogue(code, libelle, type_valeur, cotisable, imposable)",
    )
    .in("bulletin_id", bulletinIds);

  if (rubError) throw new Error(rubError.message);

  const rubriquesParBulletin = new Map<number, typeof toutesRubriques>();
  for (const r of toutesRubriques ?? []) {
    const liste = rubriquesParBulletin.get(r.bulletin_id) ?? [];
    liste.push(r);
    rubriquesParBulletin.set(r.bulletin_id, liste);
  }

  return bulletins.map((bulletin) => {
    const champsAbsences = {
      salaire_base_theorique: bulletin.salaire_base_theorique,
      maladie_h: bulletin.maladie_h,
      mise_a_pied_h: bulletin.mise_a_pied_h,
      accident_travail_h: bulletin.accident_travail_h,
      retard_h: bulletin.retard_h,
      absence_irreguliere_h: bulletin.absence_irreguliere_h,
    };
    const { salaire_base_reel } = calculerBaseAvantRubriques(champsAbsences, params);

    const rubriques_dynamiques: LigneRubriqueDynamique[] = [];
    for (const br of rubriquesParBulletin.get(bulletin.id) ?? []) {
      const cat = Array.isArray(br.rubriques_catalogue) ? br.rubriques_catalogue[0] : br.rubriques_catalogue;
      if (!cat) continue;
      const ligne = resoudreLigneRubrique(cat, br.valeur_1 ?? 0, br.valeur_2 ?? 0, salaire_base_reel);
      if (ligne) rubriques_dynamiques.push(ligne);
    }

    const saisie: SaisieMensuelle = {
      ...SAISIE_VIDE,
      ...champsAbsences,
      heures_sup_1: bulletin.heures_sup_1,
      heures_sup_2: bulletin.heures_sup_2,
      heures_sup_3: bulletin.heures_sup_3,
      icr: bulletin.icr,
      taux_iep: bulletin.taux_iep,
      taux_nuisance: bulletin.taux_nuisance,
      taux_responsabilite: bulletin.taux_responsabilite,
      taux_disponibilite: bulletin.taux_disponibilite,
      taux_pri: bulletin.taux_pri,
      taux_prc: bulletin.taux_prc,
      panier_jours: bulletin.panier_jours,
      panier_forfait_jour: bulletin.panier_forfait_jour,
      autre_prime_fixe: bulletin.autre_prime_fixe,
      cotis_mutuelle: bulletin.cotis_mutuelle,
      autres_retenues: bulletin.autres_retenues,
      rubriques_dynamiques,
    };

    const resultat = calculerPaie(saisie, params);

    return {
      id: bulletin.id,
      annee: bulletin.annee,
      mois: bulletin.mois,
      net_a_payer: resultat.net_a_payer,
      modifie_le: bulletin.modifie_le ?? null,
    };
  });
}

/**
 * Supprime définitivement un bulletin (et ses rubriques dynamiques associées).
 * Action irréversible — la confirmation doit être faite côté client.
 */
export async function supprimerBulletin(salarieId: number, bulletinId: number) {
  const { error: brError } = await supabase
    .from("bulletin_rubriques")
    .delete()
    .eq("bulletin_id", bulletinId);
  if (brError) throw new Error(brError.message);

  const { error } = await supabase
    .from("bulletins")
    .delete()
    .eq("id", bulletinId)
    .eq("salarie_id", salarieId);
  if (error) throw new Error(error.message);

  revalidatePath(`/salaries/${salarieId}/historique`);
  revalidatePath("/historique");
}

/**
 * Copie en masse les bulletins du mois précédent pour le mois cible.
 */
export async function copierMoisPrecedentMasse(anneeCible: number, moisCible: number): Promise<{ copies: number }> {
  const prevMois = moisCible === 1 ? 12 : moisCible - 1;
  const prevAnnee = moisCible === 1 ? anneeCible - 1 : anneeCible;

  const { data: bulletinsPrev, error: bError } = await supabase
    .from("bulletins")
    .select("*")
    .eq("annee", prevAnnee)
    .eq("mois", prevMois);

  if (bError) throw new Error(bError.message);
  if (!bulletinsPrev || bulletinsPrev.length === 0) {
    throw new Error(`Aucun bulletin trouvé pour le mois précédent (${prevMois}/${prevAnnee})`);
  }

  const { data: bulletinsExistent } = await supabase
    .from("bulletins")
    .select("salarie_id")
    .eq("annee", anneeCible)
    .eq("mois", moisCible);

  const salariesExistent = new Set((bulletinsExistent ?? []).map((b) => b.salarie_id));
  let count = 0;

  for (const b of bulletinsPrev) {
    if (salariesExistent.has(b.salarie_id)) continue;

    const { data: rubriquesSource } = await supabase
      .from("bulletin_rubriques")
      .select("rubrique_code, valeur_1, valeur_2")
      .eq("bulletin_id", b.id);

    const { data: nouveauB, error: insError } = await supabase
      .from("bulletins")
      .insert({
        salarie_id: b.salarie_id,
        annee: anneeCible,
        mois: moisCible,
        salaire_base_theorique: b.salaire_base_theorique,
        maladie_h: b.maladie_h,
        mise_a_pied_h: b.mise_a_pied_h,
        accident_travail_h: b.accident_travail_h,
        retard_h: b.retard_h,
        absence_irreguliere_h: b.absence_irreguliere_h,
        heures_sup_1: b.heures_sup_1,
        heures_sup_2: b.heures_sup_2,
        heures_sup_3: b.heures_sup_3,
        icr: b.icr,
        taux_iep: b.taux_iep,
        taux_nuisance: b.taux_nuisance,
        taux_responsabilite: b.taux_responsabilite,
        taux_disponibilite: b.taux_disponibilite,
        taux_pri: b.taux_pri,
        taux_prc: b.taux_prc,
        panier_jours: b.panier_jours,
        panier_forfait_jour: b.panier_forfait_jour,
        autre_prime_fixe: b.autre_prime_fixe,
        cotis_mutuelle: b.cotis_mutuelle,
        autres_retenues: b.autres_retenues,
      })
      .select()
      .single();

    if (insError) continue;

    if (rubriquesSource && rubriquesSource.length > 0 && nouveauB) {
      await supabase.from("bulletin_rubriques").insert(
        rubriquesSource.map((r) => ({
          bulletin_id: nouveauB.id,
          rubrique_code: r.rubrique_code,
          valeur_1: r.valeur_1,
          valeur_2: r.valeur_2,
        }))
      );
    }
    count++;
  }

  revalidatePath("/saisie");
  return { copies: count };
}

export interface ContratRow {
  id: number;
  salarie_id: number;
  type_contrat: string;
  date_debut: string;
  date_fin: string | null;
  periode_essai_mois: number;
  statut: string;
  salaire_base_contrat: number;
}

export interface DocumentSalarieRow {
  id: number;
  salarie_id: number;
  nom_document: string;
  categorie: string;
  fichier_url: string;
  cree_le: string;
}

export async function listerContratsSalarie(salarieId: number): Promise<ContratRow[]> {
  const { data, error } = await supabase
    .from("contrats")
    .select("*")
    .eq("salarie_id", salarieId)
    .order("date_debut", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listerDocumentsSalarie(salarieId: number): Promise<DocumentSalarieRow[]> {
  const { data, error } = await supabase
    .from("documents_salaries")
    .select("*")
    .eq("salarie_id", salarieId)
    .order("cree_le", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function creerContratSalarie(salarieId: number, formData: FormData): Promise<ContratRow> {
  const type_contrat = formData.get("type_contrat") as string;
  const date_debut = formData.get("date_debut") as string;
  const date_fin = (formData.get("date_fin") as string) || null;
  const periode_essai_mois = parseInt(formData.get("periode_essai_mois") as string, 10) || 0;
  const salaire_base_contrat = parseFloat(formData.get("salaire_base_contrat") as string) || 0;
  const statut = formData.get("statut") as string || "En cours";

  const { data, error } = await supabase
    .from("contrats")
    .insert({
      salarie_id: salarieId,
      type_contrat,
      date_debut,
      date_fin,
      periode_essai_mois,
      salaire_base_contrat,
      statut,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath(`/salaries/${salarieId}/contrat`);
  return data;
}

export async function supprimerContratSalarie(contratId: number, salarieId: number): Promise<void> {
  const { error } = await supabase
    .from("contrats")
    .delete()
    .eq("id", contratId)
    .eq("salarie_id", salarieId);

  if (error) throw new Error(error.message);
  revalidatePath(`/salaries/${salarieId}/contrat`);
}

export async function creerDocumentSalarie(
  salarieId: number,
  nomDocument: string,
  categorie: string,
  fichierUrl: string
): Promise<DocumentSalarieRow> {
  const { data, error } = await supabase
    .from("documents_salaries")
    .insert({
      salarie_id: salarieId,
      nom_document: nomDocument,
      categorie,
      fichier_url: fichierUrl,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath(`/salaries/${salarieId}/contrat`);
  return data;
}

export async function supprimerDocumentSalarie(documentId: number, salarieId: number): Promise<void> {
  const { error } = await supabase
    .from("documents_salaries")
    .delete()
    .eq("id", documentId)
    .eq("salarie_id", salarieId);

  if (error) throw new Error(error.message);
  revalidatePath(`/salaries/${salarieId}/contrat`);
}

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

export async function listerCongesSalarie(salarieId: number): Promise<CongeRow[]> {
  const { data, error } = await supabase
    .from("conges")
    .select("*")
    .eq("salarie_id", salarieId)
    .order("date_debut", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function creerCongeSalarie(salarieId: number, formData: FormData): Promise<CongeRow> {
  const type_conge = formData.get("type_conge") as string;
  const date_debut = formData.get("date_debut") as string;
  const date_fin = formData.get("date_fin") as string;
  const jours_ouvrables = parseInt(formData.get("jours_ouvrables") as string, 10) || 0;
  const motif = (formData.get("motif") as string) || null;
  const justificatif_url = (formData.get("justificatif_url") as string) || null;
  const statut = (formData.get("statut") as string) || "En attente";

  const { data, error } = await supabase
    .from("conges")
    .insert({
      salarie_id: salarieId,
      type_conge,
      date_debut,
      date_fin,
      jours_ouvrables,
      motif,
      justificatif_url,
      statut,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath(`/salaries/${salarieId}/conges`);
  return data;
}

export async function supprimerCongeSalarie(congeId: number, salarieId: number): Promise<void> {
  const { error } = await supabase
    .from("conges")
    .delete()
    .eq("id", congeId)
    .eq("salarie_id", salarieId);

  if (error) throw new Error(error.message);
  revalidatePath(`/salaries/${salarieId}/conges`);
}

export async function changerStatutConge(congeId: number, statut: string, salarieId: number): Promise<void> {
  const { error } = await supabase
    .from("conges")
    .update({ statut })
    .eq("id", congeId)
    .eq("salarie_id", salarieId);

  if (error) throw new Error(error.message);
  revalidatePath(`/salaries/${salarieId}/conges`);
}

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

export async function listerMissionsSalarie(salarieId: number): Promise<MissionRow[]> {
  const { data, error } = await supabase
    .from("missions")
    .select("*")
    .eq("salarie_id", salarieId)
    .order("date_debut", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function creerMissionSalarie(salarieId: number, formData: FormData): Promise<MissionRow> {
  const objet = formData.get("objet") as string;
  const destination = formData.get("destination") as string;
  const date_debut = formData.get("date_debut") as string;
  const date_fin = formData.get("date_fin") as string;
  const moyen_transport = formData.get("moyen_transport") as string;
  const statut = (formData.get("statut") as string) || "En attente";

  const { data, error } = await supabase
    .from("missions")
    .insert({
      salarie_id: salarieId,
      objet,
      destination,
      date_debut,
      date_fin,
      moyen_transport,
      statut,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath(`/salaries/${salarieId}/missions`);
  return data;
}

export async function supprimerMissionSalarie(missionId: number, salarieId: number): Promise<void> {
  const { error } = await supabase
    .from("missions")
    .delete()
    .eq("id", missionId)
    .eq("salarie_id", salarieId);

  if (error) throw new Error(error.message);
  revalidatePath(`/salaries/${salarieId}/missions`);
}

export async function changerStatutMission(missionId: number, statut: string, salarieId: number): Promise<void> {
  const { error } = await supabase
    .from("missions")
    .update({ statut })
    .eq("id", missionId)
    .eq("salarie_id", salarieId);

  if (error) throw new Error(error.message);
  revalidatePath(`/salaries/${salarieId}/missions`);
}