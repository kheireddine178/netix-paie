import { describe, it, expect } from "vitest";
import { calculerPaie, PARAMETRES_PAR_DEFAUT, SAISIE_VIDE } from "./paieCalcul";

describe("Moteur de Calcul de Paie Algérienne", () => {
  it("devrait calculer correctement un bulletin simple sans absence", () => {
    const saisie = {
      ...SAISIE_VIDE,
      salaire_base_theorique: 40000.0, // Salaire brut standard
    };

    const res = calculerPaie(saisie, PARAMETRES_PAR_DEFAUT);

    // 1. Absences : 0
    expect(res.total_heures_absence).toBe(0);
    expect(res.heures_travaillees).toBe(173.33);
    expect(res.salaire_base_reel).toBe(40000.0);

    // 2. Base CNAS : salaire de base réel car pas de panier ni primes %
    expect(res.base_cnas).toBe(40000.0);
    // Retenue CNAS 9% : 40000 * 0.09 = 3600
    expect(res.retenue_cnas).toBe(3600.0);

    // 3. Base imposable IRG : 40000 - 3600 = 36400
    expect(res.base_imposable_irg).toBe(36400.0);

    // 4. IRG brut sur 36400 (base arrondie à la dizaine de DA inférieure -> 36400) :
    // - Tranche 0 à 20000 : 0
    // - Tranche 20000 à 40000 (16400 dans cette tranche) : 16400 * 23% = 3772
    // IRG brut = 3772
    expect(res.irg_brut).toBe(3772.0);

    // 5. Abattement 40% sur 3772 : 3772 * 0.40 = 1508.8, plafonné au max de 1500
    // IRG Net = 3772 - 1500 = 2272. Arrondi à la dizaine la plus proche : 2272
    expect(res.abattement_irg).toBe(1500.0);
    expect(res.retenue_irg_nette).toBe(2272.0);

    // 6. Net à payer : 40000 - 3600 (CNAS) - 2272 (IRG) = 34128
    expect(res.net_a_payer).toBe(34128.0);
  });

  it("devrait appliquer la zone de lissage de transition IRG entre 30 000 et 35 000 DA de base imposable", () => {
    // Prenons un cas où le brut imposable après CNAS tombe à 32 000 DA.
    // Ex: Salaire de base théorique de 35 165 DA
    // Base CNAS = 35165. CNAS = 35165 * 0.09 = 3164.85
    // Base IRG = 35165 - 3164.85 = 32000.15. Arrondi dizaine inférieure -> 32000
    const baseImposable = 32000;
    
    // Pour une base de 32000, l'IRG net transition est calculé via irgNetZoneTransition dans baremeIrgTransition
    // Vérifions que le lissage renvoie bien la valeur attendue
    const saisie = {
      ...SAISIE_VIDE,
      salaire_base_theorique: 35164.84, // Produit une base imposable après CNAS de 32000 DA pile
    };

    const res = calculerPaie(saisie, PARAMETRES_PAR_DEFAUT);
    expect(Math.floor(res.base_imposable_irg / 10) * 10).toBe(32000);
    
    // L'IRG net lissé doit être supérieur à 0 mais inférieur au barème standard brut
    expect(res.retenue_irg_nette).toBeGreaterThan(0);
    expect(res.retenue_irg_nette).toBeLessThan(res.irg_brut);
  });

  it("devrait imputer correctement les heures d'absences du salaire de base", () => {
    const saisie = {
      ...SAISIE_VIDE,
      salaire_base_theorique: 34666.0, // 200 DA de l'heure pour 173.33 heures
      absence_irreguliere_h: 8, // Une journée de 8 heures d'absence
    };

    const res = calculerPaie(saisie, PARAMETRES_PAR_DEFAUT);
    
    // Heures travaillées : 173.33 - 8 = 165.33
    expect(res.total_heures_absence).toBe(8);
    expect(res.heures_travaillees).toBe(165.33);
    
    // Salaire de base réel : 34666 / 173.33 * 165.33 = ~33066 DA
    expect(Math.round(res.salaire_base_reel)).toBe(33066);
  });

  it("devrait calculer les majorations d'heures supplémentaires", () => {
    const saisie = {
      ...SAISIE_VIDE,
      salaire_base_theorique: 34666.0, // Taux horaire de 200 DA
      heures_sup_1: 4, // majoration 50% (x1.5) -> 4 * 200 * 1.5 = 1200 DA
      heures_sup_2: 4, // majoration 75% (x1.75) -> 4 * 200 * 1.75 = 1400 DA
      heures_sup_3: 2, // majoration 100% (x2.0) -> 2 * 200 * 2.0 = 800 DA
    };

    const res = calculerPaie(saisie, PARAMETRES_PAR_DEFAUT);
    // Total heures sup attendu = 1200 + 1400 + 800 = 3400 DA
    expect(res.total_heures_sup_da).toBeCloseTo(3400.0, 2);
  });
});
