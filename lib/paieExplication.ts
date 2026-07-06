import type { Parametres, ResultatPaie, SaisieMensuelle } from "./paieCalcul";

export interface AbsenceLigne {
  libelle: string;
  heures: number;
}

export interface GainLigne {
  libelle: string;
  formule: string;
  montant: number;
}

export interface RetenueLigne {
  libelle: string;
  formule: string;
  montant: number;
}

export interface TrancheIrgLigne {
  tranche: string;
  taux: string;
  montantTranche: number;
  impotPartiel: number;
  detail: string;
}

export interface ExplicationDonnees {
  nom: string;
  matricule: string;
  fonction: string;
  annee: number;
  mois: number;
  moisNom: string;
  
  // 1. Base
  salaireBaseTheorique: number;
  dureeLegaleMensuelle: number;
  tauxHoraire: number;
  heuresTravaillees: number;
  salaireBaseReel: number;
  absences: AbsenceLigne[];
  totalHeuresAbsence: number;
  
  // 2. Gains
  gains: GainLigne[];
  totalGains: number;
  totalNonCotisable: number;
  
  // 3. CNAS
  baseCnas: number;
  tauxCnasSalarie: number;
  retenueCnas: number;
  tauxCnasEmployeur: number;
  chargePatronaleCnas: number;
  
  // 4. IRG
  baseImposableIrg: number;
  seuilExonerationIrg: number;
  estExonereIrg: boolean;
  tranchesIrg: TrancheIrgLigne[];
  irgBrut: number;
  tauxAbattementIrg: number;
  abattementTheorique: number;
  abattementMin: number;
  abattementMax: number;
  abattementRetenu: number;
  abattementStatus: "plancher" | "plafond" | "normal" | "zero";
  retenueIrgNette: number;
  
  // 4.2 IRG 10%
  baseImposable10pct: number;
  retenue10pct: number;
  
  // 5. Synthèse
  totalRetenues: number;
  netAPayer: number;
  coutTotalEmployeur: number;
}

export const MOIS_FR = [
  "", "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

export function fmtDa(v: number): string {
  if (v === undefined || v === null) return "—";
  const formatted = Math.abs(v).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const sign = v < 0 ? "− " : "";
  return `${sign}${formatted} DA`;
}

export function fmtPct(v: number): string {
  return `${(v * 100).toFixed(2)} %`;
}

export function fmtH(v: number): string {
  return `${v.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} h`;
}

export function genererExplicationDonnees(
  salarie: { nom_prenom: string; matricule: string | null; fonction: string | null },
  annee: number,
  mois: number,
  saisie: SaisieMensuelle,
  resultat: ResultatPaie,
  params: Parametres
): ExplicationDonnees {
  const nom = salarie.nom_prenom || "—";
  const matricule = salarie.matricule || "";
  const fonction = salarie.fonction || "";
  const moisNom = MOIS_FR[mois] || String(mois);

  // 1. Absences
  const absences: AbsenceLigne[] = [];
  if (saisie.maladie_h) absences.push({ libelle: "Maladie", heures: saisie.maladie_h });
  if (saisie.mise_a_pied_h) absences.push({ libelle: "Mise à pied", heures: saisie.mise_a_pied_h });
  if (saisie.accident_travail_h) absences.push({ libelle: "Accident de travail", heures: saisie.accident_travail_h });
  if (saisie.retard_h) absences.push({ libelle: "Retard", heures: saisie.retard_h });
  if (saisie.absence_irreguliere_h) absences.push({ libelle: "Absence irrégulière", heures: saisie.absence_irreguliere_h });

  // 2. Gains
  const gains: GainLigne[] = [];
  gains.push({
    libelle: "Salaire de base réel",
    formule: `${fmtDa(resultat.taux_horaire)}/h × ${fmtH(resultat.heures_travaillees)}`,
    montant: resultat.salaire_base_reel,
  });

  if (resultat.total_heures_sup_da) {
    const totalHs = saisie.heures_sup_1 + saisie.heures_sup_2 + saisie.heures_sup_3;
    gains.push({
      libelle: "Heures supplémentaires",
      formule: `${fmtH(totalHs)} (paliers ×${params.majoration_hs_1} / ×${params.majoration_hs_2} / ×${params.majoration_hs_3})`,
      montant: resultat.total_heures_sup_da,
    });
  }

  const sb = resultat.salaire_base_reel;
  if (saisie.taux_iep) {
    gains.push({
      libelle: "Indemnité d'Expérience Professionnelle (I.E.P)",
      formule: `${fmtDa(sb)} × ${fmtPct(saisie.taux_iep)}`,
      montant: sb * saisie.taux_iep,
    });
  }
  if (saisie.taux_nuisance) {
    gains.push({
      libelle: "Indemnité de Nuisance",
      formule: `${fmtDa(sb)} × ${fmtPct(saisie.taux_nuisance)}`,
      montant: sb * saisie.taux_nuisance,
    });
  }
  if (saisie.taux_responsabilite) {
    gains.push({
      libelle: "Indemnité de Responsabilité",
      formule: `${fmtDa(sb)} × ${fmtPct(saisie.taux_responsabilite)}`,
      montant: sb * saisie.taux_responsabilite,
    });
  }
  if (saisie.taux_disponibilite) {
    gains.push({
      libelle: "Indemnité de Disponibilité",
      formule: `${fmtDa(sb)} × ${fmtPct(saisie.taux_disponibilite)}`,
      montant: sb * saisie.taux_disponibilite,
    });
  }
  if (saisie.taux_pri) {
    gains.push({
      libelle: "Prime de Rendement Individuelle (P.R.I)",
      formule: `${fmtDa(sb)} × ${fmtPct(saisie.taux_pri)}`,
      montant: sb * saisie.taux_pri,
    });
  }
  if (saisie.taux_prc) {
    gains.push({
      libelle: "Prime de Rendement Collective (P.R.C)",
      formule: `${fmtDa(sb)} × ${fmtPct(saisie.taux_prc)}`,
      montant: sb * saisie.taux_prc,
    });
  }
  if (saisie.icr) {
    gains.push({
      libelle: "Indemnité de Compensation Régionale (I.C.R)",
      formule: "Montant fixe",
      montant: saisie.icr,
    });
  }
  
  const panierV1 = saisie.panier_jours * saisie.panier_forfait_jour;
  if (panierV1) {
    gains.push({
      libelle: "Panier / Restauration",
      formule: `${saisie.panier_jours} jours × ${fmtDa(saisie.panier_forfait_jour)}/jour (Exclu CNAS)`,
      montant: panierV1,
    });
  }
  if (saisie.autre_prime_fixe) {
    gains.push({
      libelle: "Autre prime fixe",
      formule: "Montant fixe",
      montant: saisie.autre_prime_fixe,
    });
  }

  let rubNonCotis = 0;
  for (const lr of saisie.rubriques_dynamiques) {
    if (lr.montant && lr.type_valeur !== "Retenue (-)") {
      const cotisLabel = lr.cotisable_cnas ? "Cotisable CNAS" : "Non cotisable CNAS";
      gains.push({
        libelle: `${lr.libelle} (${lr.code})`,
        formule: cotisLabel,
        montant: lr.montant,
      });
      if (!lr.cotisable_cnas) {
        rubNonCotis += lr.montant;
      }
    }
  }

  const totalNonCotisable = panierV1 + rubNonCotis;

  // 3. CNAS
  const baseCnas = resultat.base_cnas;
  const retenueCnas = resultat.retenue_cnas;
  const chargePatronaleCnas = baseCnas * params.taux_cnas_employeur;

  // 4. IRG Barème Progressif
  const baseImposableIrg = resultat.base_imposable_irg;
  const estExonereIrg = baseImposableIrg <= params.seuil_exoneration_irg;
  const tranchesIrg: TrancheIrgLigne[] = [];
  
  if (!estExonereIrg) {
    for (const [de, a, taux] of params.bareme_irg) {
      if (taux === 0 && a !== null && baseImposableIrg <= a) {
        tranchesIrg.push({
          tranche: `De ${de.toLocaleString("fr-FR")} à ${a.toLocaleString("fr-FR")} DA`,
          taux: "0 %",
          montantTranche: baseImposableIrg - de,
          impotPartiel: 0,
          detail: "Exonérée",
        });
        break;
      }
      const aDisplay = a === null ? "illimité" : `${a.toLocaleString("fr-FR")} DA`;
      const deDisplay = `${de.toLocaleString("fr-FR")} DA`;
      const deVal = de;
      const aVal = a;
      
      const montantTranche = Math.max(0, (aVal === null ? baseImposableIrg : Math.min(baseImposableIrg, aVal)) - deVal);
      if (montantTranche <= 0) continue;
      
      const impotPartiel = montantTranche * taux;
      tranchesIrg.push({
        tranche: `De ${deDisplay} à ${aDisplay}`,
        taux: fmtPct(taux),
        montantTranche,
        impotPartiel,
        detail: `${fmtDa(montantTranche)} × ${fmtPct(taux)} = ${fmtDa(impotPartiel)}`,
      });
      
      if (aVal !== null && baseImposableIrg <= aVal) {
        break;
      }
    }
  }

  const irgBrut = resultat.irg_brut;
  const abat40 = irgBrut * params.taux_abattement_irg;
  
  let abattementRetenu = 0;
  let abattementStatus: "plancher" | "plafond" | "normal" | "zero" = "zero";
  
  if (irgBrut > 0) {
    if (abat40 > params.abattement_irg_max) {
      abattementRetenu = params.abattement_irg_max;
      abattementStatus = "plafond";
    } else if (abat40 < params.abattement_irg_min) {
      abattementRetenu = params.abattement_irg_min;
      abattementStatus = "plancher";
    } else {
      abattementRetenu = abat40;
      abattementStatus = "normal";
    }
  }

  const baseImposable10pct = resultat.base_imposable_10pct;
  const retenue10pct = resultat.retenue_10pct;

  return {
    nom,
    matricule,
    fonction,
    annee,
    mois,
    moisNom,
    salaireBaseTheorique: saisie.salaire_base_theorique,
    dureeLegaleMensuelle: params.duree_legale_mensuelle,
    tauxHoraire: resultat.taux_horaire,
    heuresTravaillees: resultat.heures_travaillees,
    salaireBaseReel: resultat.salaire_base_reel,
    absences,
    totalHeuresAbsence: resultat.total_heures_absence,
    gains,
    totalGains: resultat.total_gains,
    totalNonCotisable,
    baseCnas,
    tauxCnasSalarie: params.taux_cnas_salarie,
    retenueCnas,
    tauxCnasEmployeur: params.taux_cnas_employeur,
    chargePatronaleCnas,
    baseImposableIrg,
    seuilExonerationIrg: params.seuil_exoneration_irg,
    estExonereIrg,
    tranchesIrg,
    irgBrut,
    tauxAbattementIrg: params.taux_abattement_irg,
    abattementTheorique: abat40,
    abattementMin: params.abattement_irg_min,
    abattementMax: params.abattement_irg_max,
    abattementRetenu,
    abattementStatus,
    retenueIrgNette: resultat.retenue_irg_nette,
    baseImposable10pct,
    retenue10pct,
    totalRetenues: resultat.total_retenues,
    netAPayer: resultat.net_a_payer,
    coutTotalEmployeur: resultat.cout_total_employeur,
  };
}

export function genererExplicationMarkdown(d: ExplicationDonnees): string {
  const lines: string[] = [];
  const A = (line: string) => lines.push(line);

  A(`# 📊 Explication détaillée du bulletin de paie`);
  A(``);
  A(`**Salarié :** ${d.nom}` + (d.matricule ? ` · Matr. ${d.matricule}` : "") + (d.fonction ? ` · ${d.fonction}` : ""));
  A(`**Période :** ${d.moisNom} ${d.annee}`);
  A(`**Cadre légal :** CIDTA — Art. 104 · Loi n°90‑11 · LF 2024`);
  A(``);
  A(`---`);
  A(``);

  A(`## 1️⃣ Salaire de base réel après absences`);
  A(``);
  A(`Le salaire de base **théorique** est ${fmtDa(d.salaireBaseTheorique)}, calculé pour une durée légale mensuelle de **${fmtH(d.dureeLegaleMensuelle)}**.`);
  A(``);

  if (d.absences.length > 0) {
    A(`### Absences du mois`);
    A(``);
    A(`| Type d'absence | Heures |`);
    A(`| --- | --- |`);
    for (const ab of d.absences) {
      A(`| ${ab.libelle} | ${fmtH(ab.heures)} |`);
    }
    A(`| **Total absences** | **${fmtH(d.totalHeuresAbsence)}** |`);
    A(``);
    A(`> Les absences représentent **${fmtH(d.totalHeuresAbsence)}**, réduisant les heures travaillées à **${fmtH(d.heuresTravaillees)}**.`);
    A(``);
  }

  A(`### Calcul du salaire de base réel`);
  A(``);
  A(`\`\`\``);
  A(`Taux horaire  = ${fmtDa(d.salaireBaseTheorique)} ÷ ${fmtH(d.dureeLegaleMensuelle)}`);
  A(`              = ${fmtDa(d.tauxHoraire)}/heure`);
  A(``);
  A(`Salaire réel  = ${fmtDa(d.tauxHoraire)}/h × ${fmtH(d.heuresTravaillees)} travaillées`);
  A(`              = ${fmtDa(d.salaireBaseReel)}`);
  A(`\`\`\``);
  A(``);
  if (d.absences.length === 0) {
    A(`> ✅ Aucune absence ce mois — salaire de base réel = salaire théorique = **${fmtDa(d.salaireBaseReel)}**`);
    A(``);
  }
  A(`---`);
  A(``);

  A(`## 2️⃣ Total des gains bruts`);
  A(``);
  A(`| Rubrique | Base / Formule | Montant |`);
  A(`| --- | --- | --- |`);
  for (const g of d.gains) {
    A(`| ${g.libelle} | ${g.formule} | **${fmtDa(g.montant)}** |`);
  }
  A(`| | | |`);
  A(`| **🟰 TOTAL BRUT** | | **${fmtDa(d.totalGains)}** |`);
  A(``);

  if (d.totalNonCotisable > 0) {
    A(`> ⚠️ **Dont ${fmtDa(d.totalNonCotisable)} d'avantages non cotisables** (panier, transport…) : ces montants sont exclus de l'assiette CNAS.`);
    A(``);
  }
  A(`---`);
  A(``);

  A(`## 3️⃣ Cotisation de Sécurité Sociale — CNAS salariale (${(d.tauxCnasSalarie * 100).toFixed(0)} %)`);
  A(``);
  A(`### Base de cotisation`);
  A(``);
  A(`\`\`\``);
  A(`Base CNAS = Total brut − Éléments non cotisables`);
  if (d.totalNonCotisable > 0) {
    A(`          = ${fmtDa(d.totalGains)} − ${fmtDa(d.totalNonCotisable)}`);
  }
  A(`          = ${fmtDa(d.baseCnas)}`);
  A(`\`\`\``);
  A(``);
  A(`### Calcul de la retenue`);
  A(``);
  A(`\`\`\``);
  A(`Retenue CNAS = ${fmtDa(d.baseCnas)} × ${(d.tauxCnasSalarie * 100).toFixed(0)} %`);
  A(`             = ${fmtDa(d.retenueCnas)}`);
  A(`\`\`\``);
  A(``);
  A(`L'employeur verse également une cotisation patronale de **${fmtPct(d.tauxCnasEmployeur)}** soit **${fmtDa(d.chargePatronaleCnas)}**.`);
  A(``);
  A(`---`);
  A(``);

  A(`## 4️⃣ Impôt sur le Revenu Global — IRG (Art. 104 CIDTA)`);
  A(``);
  A(`### 4.1 Assiette imposable`);
  A(``);
  A(`\`\`\``);
  A(`Base imposable IRG = Total brut − Retenue CNAS`);
  A(`                   = ${fmtDa(d.totalGains)} − ${fmtDa(d.retenueCnas)}`);
  A(`                   = ${fmtDa(d.baseImposableIrg)}`);
  A(`\`\`\``);
  A(``);

  if (d.estExonereIrg) {
    A(`### 4.2 Exonération totale`);
    A(``);
    A(`> ✅ La base imposable (${fmtDa(d.baseImposableIrg)}) est inférieure ou égale au seuil d'exonération de **${fmtDa(d.seuilExonerationIrg)}**. Aucun IRG n'est dû.`);
    A(``);
  } else {
    A(`### 4.2 Calcul par tranches`);
    A(``);
    A(`| Tranche | Taux | Montant dans la tranche | Impôt partiel |`);
    A(`| --- | --- | --- | --- |`);
    for (const t of d.tranchesIrg) {
      A(`| ${t.tranche} | ${t.taux} | ${fmtDa(t.montantTranche)} | **${fmtDa(t.impotPartiel)}** |`);
    }
    A(`| **Total Brut** | | | **${fmtDa(d.irgBrut)}** |`);
    A(``);

    A(`### 4.3 Abattement de 40 % (Art. 104-3 CIDTA)`);
    A(``);
    A(`\`\`\``);
    A(`Abattement théorique = ${fmtDa(d.irgBrut)} × 40 % = ${fmtDa(d.abattementTheorique)}`);
    A(`Limites de l'abattement : Min ${fmtDa(d.abattementMin)} / Max ${fmtDa(d.abattementMax)}`);
    A(`Abattement retenu : ${fmtDa(d.abattementRetenu)} (${d.abattementStatus === "plafond" ? "Plafonné au Max" : d.abattementStatus === "plancher" ? "Planché au Min" : "Normal"})`);
    A(`\`\`\``);
    A(``);
    A(`### 4.4 IRG Net`);
    A(``);
    A(`\`\`\``);
    A(`IRG net = IRG brut − Abattement`);
    A(`        = ${fmtDa(d.irgBrut)} − ${fmtDa(d.abattementRetenu)}`);
    A(`        = ${fmtDa(d.retenueIrgNette)}`);
    A(`\`\`\``);
    A(``);
  }

  if (d.baseImposable10pct > 0) {
    A(`### 4.5 Retenue IRG forfaitaire 10 %`);
    A(``);
    A(`\`\`\``);
    A(`Base imposable à 10 % = ${fmtDa(d.baseImposable10pct)}`);
    A(`Retenue à 10 %        = ${fmtDa(d.retenue10pct)}`);
    A(`\`\`\``);
    A(``);
  }
  A(`---`);
  A(``);

  A(`## 5️⃣ Synthèse finale`);
  A(``);
  A(`*   **Total des Gains :** ${fmtDa(d.totalGains)}`);
  A(`*   **Total des Retenues :** ${fmtDa(d.totalRetenues)}`);
  A(`*   **🟢 NET À PAYER :** **${fmtDa(d.netAPayer)}**`);
  A(`*   **Coût total employeur :** ${fmtDa(d.coutTotalEmployeur)}`);
  A(``);

  return lines.join("\n");
}
