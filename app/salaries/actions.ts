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
  const rubriquesAssignees = await listerRubriquesSalarie(salarieId);

  const champsAbsences = {
    salaire_base_theorique: salarie.salaire_base_theorique,
    maladie_h: num("maladie_h"),
    mise_a_pied_h: num("mise_a_pied_h"),
    accident_travail_h: num("accident_travail_h"),
    retard_h: num("retard_h"),
    absence_irreguliere_h: num("absence_irreguliere_h"),
  };
  const { salaire_base_reel } = calculerBaseAvantRubriques(champsAbsences, params);

  // Résolution des rubriques dynamiques cochées pour ce salarié à partir des champs
  // dyn_<code>_v1 (et _v2 pour la catégorie "nombre_x_taux") du formulaire.
  const valeursRubriques: { code: string; valeur_1: number; valeur_2: number }[] = [];
  const rubriques_dynamiques: LigneRubriqueDynamique[] = [];
  for (const r of rubriquesAssignees) {
    const v1 = num(`dyn_${r.code}_v1`);
    const v2 = r.categorie === "nombre_x_taux" ? num(`dyn_${r.code}_v2`) : 0;
    valeursRubriques.push({ code: r.code, valeur_1: v1, valeur_2: v2 });
    const ligne = resoudreLigneRubrique(r, v1, v2, salaire_base_reel);
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
