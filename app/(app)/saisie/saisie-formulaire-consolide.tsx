"use client";

import React, { useMemo, useState, useTransition, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Salarie, BulletinPourSaisie } from "../salaries/actions";
import {
  creerBulletin,
  ajouterRubriqueSalarie,
  retirerRubriqueSalarie,
  supprimerBulletin,
  chargerBulletinPourSaisie,
  copierMoisPrecedentMasse,
} from "../salaries/actions";
import type {
  ResultatBulletin,
  RubriqueAssignee,
  RubriqueCatalogue,
} from "../salaries/actions";
import type { Parametres, LigneRubriqueDynamique } from "@/lib/paieCalcul";
import { calculerPaie, calculerBaseAvantRubriques, SAISIE_VIDE } from "@/lib/paieCalcul";
import { resoudreLigneRubrique } from "@/lib/rubriquesDynamiques";

const MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const LABELS_CATEGORIE: Record<string, string> = {
  pourcentage: "%",
  nombre_x_taux: "Nombre × taux",
  montant_fixe: "DA",
  regularisation: "DA",
};

const CHAMPS_ABSENCES = [
  { name: "maladie_h", label: "MALADIE" },
  { name: "mise_a_pied_h", label: "MISE À PIED" },
  { name: "accident_travail_h", label: "ACCIDENT TRAVAIL" },
  { name: "retard_h", label: "RETARD" },
  { name: "absence_irreguliere_h", label: "ABS. IRRÉGULIÈRE" },
];

const CHAMPS_HEURES_SUP = [
  { name: "heures_sup_1", label: "PALIER 1 (H)" },
  { name: "heures_sup_2", label: "PALIER 2 (H)" },
  { name: "heures_sup_3", label: "PALIER 3 (H)" },
];

const CHAMPS_PRIMES_MONTANT = [
  { name: "icr", label: "I.C.R (DA)" },
  { name: "panier_jours", label: "Panier — jours" },
  { name: "panier_forfait_jour", label: "Panier — forfait/jour (DA)" },
  { name: "autre_prime_fixe", label: "Autre prime fixe (DA)" },
];

const CHAMPS_PRIMES_POURCENTAGE = [
  { name: "taux_iep", label: "Taux I.E.P (%)" },
  { name: "taux_nuisance", label: "Taux nuisance (%)" },
  { name: "taux_responsabilite", label: "Taux responsabilité (%)" },
  { name: "taux_disponibilite", label: "Taux disponibilité (%)" },
  { name: "taux_pri", label: "Taux P.R.I (%)" },
  { name: "taux_prc", label: "Taux P.R.C (%)" },
];

const CHAMPS_RETENUES = [
  { name: "cotis_mutuelle", label: "Cotisation mutuelle (DA)" },
  { name: "autres_retenues", label: "Autres retenues (DA)" },
];

const CHAMPS_TAUX_POURCENTAGE = new Set(CHAMPS_PRIMES_POURCENTAGE.map((c) => c.name));
const CHAMPS_TAUX_NOMS = CHAMPS_PRIMES_POURCENTAGE.map((c) => c.name);

function formatDA(n: number) {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/[\u202F\u00A0]/g, ' ') + " DA";
}

interface LigneEtat {
  code: string;
  libelle: string | null;
  categorie: RubriqueCatalogue["categorie"];
  type_valeur: string | null;
  valeur_1: number;
  valeur_2: number;
}

function ligneDepuisAssignee(r: RubriqueAssignee): LigneEtat {
  return {
    code: r.code,
    libelle: r.libelle,
    categorie: r.categorie,
    type_valeur: r.type_valeur,
    valeur_1: r.categorie === "pourcentage" ? (r.valeur_defaut || 0) * 100 : r.valeur_defaut || 0,
    valeur_2: 0,
  };
}

function ligneVide(r: RubriqueCatalogue): LigneEtat {
  return {
    code: r.code,
    libelle: r.libelle,
    categorie: r.categorie,
    type_valeur: r.type_valeur,
    valeur_1: 0,
    valeur_2: 0,
  };
}

export default function SaisieFormulaireConsolide({
  salaries,
  salarieActive,
  anneeActive,
  moisActive,
  rubriquesAssignees,
  catalogueRubriques,
  parametres,
  initialBulletin,
}: {
  salaries: Salarie[];
  salarieActive?: Salarie | null;
  anneeActive: number;
  moisActive: number;
  rubriquesAssignees: RubriqueAssignee[];
  catalogueRubriques: RubriqueCatalogue[];
  parametres: Parametres;
  initialBulletin: BulletinPourSaisie | null;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const calculTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [resultat, setResultat] = useState<ResultatBulletin | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [messageCharge, setMessageCharge] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [salarieId, setSalarieId] = useState<number | string>(salarieActive?.id || "");
  const [annee, setAnnee] = useState(anneeActive);
  const [mois, setMois] = useState(moisActive);

  const [formKey, setFormKey] = useState(0);
  const [initialValues, setInitialValues] = useState<Record<string, number>>({});
  const [lignes, setLignes] = useState<LigneEtat[]>([]);
  const [recherche, setRecherche] = useState("");
  const [estEnregistre, setEstEnregistre] = useState(false);

  // Nouveaux états UX
  const [saveStatus, setSaveStatus] = useState<"idle" | "modified" | "saving" | "saved" | "error">("idle");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [prevMonthValues, setPrevMonthValues] = useState<Record<string, number>>({});
  const [prevMonthLignes, setPrevMonthLignes] = useState<{ code: string; valeur_1: number; valeur_2: number }[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  // Sync state during render when salarieActive or initialBulletin changes
  const [prevKey, setPrevKey] = useState("");
  const currentKey = `${salarieActive?.id || ""}_${anneeActive}_${moisActive}`;

  if (prevKey !== currentKey) {
    setPrevKey(currentKey);
    if (salarieActive) {
      if (initialBulletin) {
        const champs = { ...initialBulletin.champs };
        for (const nom of CHAMPS_TAUX_NOMS) {
          champs[nom] = (champs[nom] ?? 0) * 100;
        }

        const lignesChargees: LigneEtat[] = initialBulletin.rubriques.map((r) => ({
          code: r.code,
          libelle: r.libelle,
          categorie: r.categorie,
          type_valeur: catalogueRubriques.find((cr) => cr.code === r.code)?.type_valeur || null,
          valeur_1: r.categorie === "pourcentage" ? r.valeur_1 * 100 : r.valeur_1,
          valeur_2: r.valeur_2,
        })).sort((a: LigneEtat, b: LigneEtat) => a.code.localeCompare(b.code, undefined, { numeric: true }));

        setInitialValues(champs);
        setLignes(lignesChargees);
        setEstEnregistre(true);
        setSaveStatus("idle");
      } else {
        setInitialValues({});
        setLignes(rubriquesAssignees.map(ligneDepuisAssignee).sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true })));
        setEstEnregistre(false);
        setSaveStatus("idle");
      }
      setFormKey((k) => k + 1);
    } else {
      setInitialValues({});
      setLignes([]);
      setResultat(null);
      setEstEnregistre(false);
      setSaveStatus("idle");
    }
  }

  // Charger le mois précédent pour comparaison inline
  useEffect(() => {
    if (!salarieActive) {
      setPrevMonthValues({});
      setPrevMonthLignes([]);
      return;
    }
    const prevMois = mois === 1 ? 12 : mois - 1;
    const prevAnnee = mois === 1 ? annee - 1 : annee;
    
    chargerBulletinPourSaisie(salarieActive.id, prevAnnee, prevMois).then((donnees) => {
      if (donnees) {
        const champs = { ...donnees.champs };
        for (const nom of CHAMPS_TAUX_NOMS) {
          champs[nom] = (champs[nom] ?? 0) * 100;
        }
        setPrevMonthValues({
          ...champs,
          salaire_base_theorique: donnees.champs.salaire_base_theorique,
        });
        setPrevMonthLignes(donnees.rubriques.map((r) => ({
          code: r.code,
          valeur_1: r.categorie === "pourcentage" ? r.valeur_1 * 100 : r.valeur_1,
          valeur_2: r.valeur_2,
        })));
      } else {
        setPrevMonthValues({});
        setPrevMonthLignes([]);
      }
    });
  }, [salarieActive?.id, mois, annee]);

  const codesDejaAjoutes = useMemo(() => new Set(lignes.map((l) => l.code)), [lignes]);

  const resultatsRecherche = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return [];
    return catalogueRubriques
      .filter((r) => !codesDejaAjoutes.has(r.code))
      .filter((r) => r.code.toLowerCase().includes(q) || (r.libelle ?? "").toLowerCase().includes(q))
      .slice(0, 8);
  }, [recherche, catalogueRubriques, codesDejaAjoutes]);

  // Execute live calculation from DOM form values & Trigger auto-save
  const executerCalculLive = () => {
    if (!formRef.current || !salarieActive) return;
    const formData = new FormData(formRef.current);
    const num = (name: string) => {
      const val = formData.get(name);
      return val ? parseFloat(val.toString()) || 0 : 0;
    };

    const champsAbsences = {
      salaire_base_theorique: num("salaire_base_theorique") || salarieActive.salaire_base_theorique,
      maladie_h: num("maladie_h"),
      mise_a_pied_h: num("mise_a_pied_h"),
      accident_travail_h: num("accident_travail_h"),
      retard_h: num("retard_h"),
      absence_irreguliere_h: num("absence_irreguliere_h"),
    };

    // Smart Guardrails / Warnings
    const warnings: string[] = [];
    if (champsAbsences.salaire_base_theorique < 24000) {
      warnings.push("Salaire théorique inférieur au SNMG légal (24 000 DA).");
    }
    const totAbs = champsAbsences.maladie_h + champsAbsences.mise_a_pied_h + champsAbsences.accident_travail_h + champsAbsences.retard_h + champsAbsences.absence_irreguliere_h;
    if (totAbs > 173.33) {
      warnings.push("Le total des absences dépasse la durée légale mensuelle (173.33 h).");
    }
    const hs1 = num("heures_sup_1");
    const hs2 = num("heures_sup_2");
    const hs3 = num("heures_sup_3");
    if (hs1 + hs2 + hs3 > 80) {
      warnings.push("Attention : cumul d'heures supplémentaires très élevé (> 80 h).");
    }
    setValidationWarnings(warnings);

    const { salaire_base_reel } = calculerBaseAvantRubriques(champsAbsences, parametres);

    const rubriques_dynamiques: LigneRubriqueDynamique[] = [];
    for (const ligne of lignes) {
      const catRow = catalogueRubriques.find((cr) => cr.code === ligne.code);
      if (!catRow) continue;
      const rawV1 = num(`dyn_${ligne.code}_v1`);
      const v1 = ligne.categorie === "pourcentage" ? rawV1 / 100 : rawV1;
      const v2 = ligne.categorie === "nombre_x_taux" ? num(`dyn_${ligne.code}_v2`) : 0;

      const res = resoudreLigneRubrique(catRow, v1, v2, salaire_base_reel);
      if (res) {
        rubriques_dynamiques.push(res);
      }
    }

    const saisie = {
      ...SAISIE_VIDE,
      ...champsAbsences,
      heures_sup_1: hs1,
      heures_sup_2: hs2,
      heures_sup_3: hs3,
      icr: num("icr"),
      taux_iep: num("taux_iep") / 100,
      taux_nuisance: num("taux_nuisance") / 100,
      taux_responsabilite: num("taux_responsabilite") / 100,
      taux_disponibilite: num("taux_disponibilite") / 100,
      taux_pri: num("taux_pri") / 100,
      taux_prc: num("taux_prc") / 100,
      panier_jours: num("panier_jours"),
      panier_forfait_jour: num("panier_forfait_jour"),
      autre_prime_fixe: num("autre_prime_fixe"),
      cotis_mutuelle: num("cotis_mutuelle"),
      autres_retenues: num("autres_retenues"),
      rubriques_dynamiques,
    };

    const res = calculerPaie(saisie, parametres);
    setResultat({
      ...res,
      bulletin_id: initialBulletin?.bulletin_id ?? 0,
      annee,
      mois,
    });
    setEstEnregistre(false);
    
    // Déclencher la sauvegarde automatique après 1.5s
    setSaveStatus("modified");
    triggerAutoSave();
  };

  const debouncedCalcul = () => {
    if (calculTimeoutRef.current) clearTimeout(calculTimeoutRef.current);
    calculTimeoutRef.current = setTimeout(() => {
      executerCalculLive();
    }, 350);
  };

  const triggerAutoSave = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      if (!formRef.current || !salarieActive) return;
      setSaveStatus("saving");
      const formData = new FormData(formRef.current);

      // Convert percentage values back to fractional values (0-1 scale)
      for (const nom of CHAMPS_TAUX_POURCENTAGE) {
        const brut = formData.get(nom);
        if (brut !== null) {
          const valeur = parseFloat(brut.toString().replace(",", "."));
          formData.set(nom, isNaN(valeur) ? "0" : String(valeur / 100));
        }
      }
      for (const ligne of lignes) {
        if (ligne.categorie !== "pourcentage") continue;
        const champ = `dyn_${ligne.code}_v1`;
        const brut = formData.get(champ);
        if (brut !== null) {
          const valeur = parseFloat(brut.toString().replace(",", "."));
          formData.set(champ, isNaN(valeur) ? "0" : String(valeur / 100));
        }
      }

      try {
        const r = await creerBulletin(salarieActive.id, formData);
        setResultat(r);
        setEstEnregistre(true);
        setSaveStatus("saved");
      } catch (err) {
        setSaveStatus("error");
      }
    }, 1500);
  };

  useEffect(() => {
    executerCalculLive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formKey, lignes.length]);

  // Keyboard navigation vertical focus
  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter" || e.key === "ArrowDown" || e.key === "ArrowUp") {
      // Ignorer Enter dans la recherche de rubriques
      if (document.activeElement === formRef.current?.querySelector("input[placeholder='Rechercher par code ou libellé...']")) {
        return;
      }
      
      const elements = Array.from(
        formRef.current?.querySelectorAll("input:not([type=hidden]):not([disabled]), select") || []
      ) as HTMLElement[];
      const currentIndex = elements.indexOf(document.activeElement as HTMLElement);
      
      if (currentIndex > -1) {
        e.preventDefault();
        let nextIndex = currentIndex;
        if (e.key === "ArrowUp") {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : elements.length - 1;
        } else {
          nextIndex = currentIndex < elements.length - 1 ? currentIndex + 1 : 0;
        }
        elements[nextIndex]?.focus();
      }
    }
  };

  function naviguerVersSaisie(nouveauSalarieId: number | string, nouvelleAnnee: number, nouveauMois: number) {
    if (!nouveauSalarieId) return;
    setErreur(null);
    setMessageCharge(null);
    router.push(`/saisie?salarieId=${nouveauSalarieId}&annee=${nouvelleAnnee}&mois=${nouveauMois}`);
  }

  function handleChangerSalarie(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    setSalarieId(val);
    naviguerVersSaisie(val, annee, mois);
  }

  function handleChangerMois(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = parseInt(e.target.value, 10);
    setMois(val);
    naviguerVersSaisie(salarieId, annee, val);
  }

  function handleChangerAnnee(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseInt(e.target.value, 10) || anneeActive;
    setAnnee(val);
    naviguerVersSaisie(salarieId, val, mois);
  }

  function handleCopierMoisPrecedent() {
    if (!salarieActive) return;
    setErreur(null);
    setMessageCharge(null);
    const prevMois = mois === 1 ? 12 : mois - 1;
    const prevAnnee = mois === 1 ? annee - 1 : annee;

    startTransition(async () => {
      try {
        const donnees = await chargerBulletinPourSaisie(salarieActive.id, prevAnnee, prevMois);
        if (!donnees) {
          setErreur(`Aucun bulletin trouvé pour le mois précédent (${MOIS[prevMois - 1]} ${prevAnnee}).`);
          return;
        }

        const champs = { ...donnees.champs };
        for (const nom of CHAMPS_TAUX_NOMS) {
          champs[nom] = (champs[nom] ?? 0) * 100;
        }

        const lignesChargees: LigneEtat[] = donnees.rubriques.map((r) => ({
          code: r.code,
          libelle: r.libelle,
          categorie: r.categorie,
          type_valeur: catalogueRubriques.find((cr) => cr.code === r.code)?.type_valeur || null,
          valeur_1: r.categorie === "pourcentage" ? r.valeur_1 * 100 : r.valeur_1,
          valeur_2: r.valeur_2,
        })).sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));

        setInitialValues(champs);
        setLignes(lignesChargees);
        setFormKey((k) => k + 1);
        setEstEnregistre(false);
        setMessageCharge(`Données copiées depuis ${MOIS[prevMois - 1]} ${prevAnnee}.`);
      } catch (e) {
        setErreur(e instanceof Error ? e.message : "Erreur lors de la copie");
      }
    });
  }

  // Copier le mois précédent en masse
  const handleCopierMasse = () => {
    if (!confirm(`Voulez-vous copier toutes les saisies du mois précédent pour la période ${MOIS[mois - 1]} ${annee} ?`)) {
      return;
    }
    setErreur(null);
    setMessageCharge(null);
    startTransition(async () => {
      try {
        const res = await copierMoisPrecedentMasse(annee, mois);
        setMessageCharge(`Copie de masse effectuée : ${res.copies} bulletins créés.`);
        router.refresh();
      } catch (e) {
        setErreur(e instanceof Error ? e.message : "Erreur lors de la copie globale");
      }
    });
  };

  function ajouterRubrique(r: RubriqueCatalogue) {
    if (!salarieActive) return;
    setLignes((prev) => {
      const next = [...prev, ligneVide(r)];
      return next.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
    });
    setRecherche("");
    ajouterRubriqueSalarie(salarieActive.id, r.code).catch((e) => {
      setErreur(e instanceof Error ? e.message : "Erreur lors de l'ajout de la rubrique");
    });
  }

  function retirerRubrique(code: string) {
    if (!salarieActive) return;
    setLignes((prev) => prev.filter((l) => l.code !== code));
    retirerRubriqueSalarie(salarieActive.id, code).catch((e) => {
      setErreur(e instanceof Error ? e.message : "Erreur lors du retrait de la rubrique");
    });
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!salarieActive) return;
    setErreur(null);
    setMessageCharge(null);

    const formData = new FormData(e.currentTarget);
    for (const nom of CHAMPS_TAUX_POURCENTAGE) {
      const brut = formData.get(nom);
      if (brut !== null) {
        const valeur = parseFloat(brut.toString().replace(",", "."));
        formData.set(nom, isNaN(valeur) ? "0" : String(valeur / 100));
      }
    }
    for (const ligne of lignes) {
      if (ligne.categorie !== "pourcentage") continue;
      const champ = `dyn_${ligne.code}_v1`;
      const brut = formData.get(champ);
      if (brut !== null) {
        const valeur = parseFloat(brut.toString().replace(",", "."));
        formData.set(champ, isNaN(valeur) ? "0" : String(valeur / 100));
      }
    }

    startTransition(async () => {
      try {
        const r = await creerBulletin(salarieActive.id, formData);
        setResultat(r);
        setEstEnregistre(true);
        setSaveStatus("saved");
        setMessageCharge("Le bulletin a été enregistré avec succès en base de données.");
        router.refresh();
      } catch (e) {
        setErreur(e instanceof Error ? e.message : "Erreur inconnue");
      }
    });
  }

  async function handleSupprimer() {
    if (!salarieActive || !initialBulletin?.bulletin_id) return;
    if (!confirm("Voulez-vous vraiment supprimer ce bulletin ?")) return;

    startTransition(async () => {
      try {
        await supprimerBulletin(salarieActive.id, initialBulletin.bulletin_id);
        router.refresh();
        setMessageCharge("Le bulletin a été supprimé.");
        setResultat(null);
        setLignes([]);
        setFormKey((k) => k + 1);
        setEstEnregistre(false);
      } catch (e) {
        setErreur(e instanceof Error ? e.message : "Erreur de suppression");
      }
    });
  }

  // Export CSV
  const handleExportCSV = () => {
    if (!salarieActive) return;
    const rows = [
      ["Propriete", "Valeur"],
      ["matricule", salarieActive.matricule || ""],
      ["nom_prenom", salarieActive.nom_prenom],
      ["salaire_base_theorique", String(initialValues["salaire_base_theorique"] ?? salarieActive.salaire_base_theorique)],
      ...CHAMPS_ABSENCES.map((c) => [c.name, String(initialValues[c.name] ?? 0)]),
      ...CHAMPS_HEURES_SUP.map((c) => [c.name, String(initialValues[c.name] ?? 0)]),
      ...lignes.map((l) => [`dyn_${l.code}_v1`, String(l.valeur_1)]),
      ...lignes.filter(l => l.categorie === "nombre_x_taux").map((l) => [`dyn_${l.code}_v2`, String(l.valeur_2)]),
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Variables_${salarieActive.matricule || "Salarie"}_${mois}_${annee}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import CSV
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;
      const parsedValues: Record<string, number> = {};
      const linesArr = text.split("\n");
      const nextLignes = [...lignes];

      for (const line of linesArr) {
        const parts = line.split(",");
        if (parts.length < 2) continue;
        const key = parts[0].trim();
        const val = parseFloat(parts[1].trim()) || 0;
        
        if (key.startsWith("dyn_")) {
          const m = key.match(/dyn_([^_]+)_(v1|v2)/);
          if (m) {
            const code = m[1];
            const field = m[2];
            const idx = nextLignes.findIndex(l => l.code === code);
            if (idx > -1) {
              if (field === "v1") nextLignes[idx].valeur_1 = val;
              if (field === "v2") nextLignes[idx].valeur_2 = val;
            }
          }
        } else {
          parsedValues[key] = val;
        }
      }

      setInitialValues((prev) => ({ ...prev, ...parsedValues }));
      setLignes(nextLignes);
      setFormKey((k) => k + 1);
      setMessageCharge("Variables CSV importées avec succès.");
      setSaveStatus("modified");
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s4)" }}>
      {/* Top Selector Bar Card */}
      <div className="card" style={{ padding: "var(--s4)" }}>
        <div style={{ display: "flex", gap: "var(--s4)", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div className="field" style={{ flex: "2 1 250px", marginBottom: 0 }}>
            <label style={{ fontSize: "var(--t2xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em" }}>SALARIÉ</label>
            <select
              value={salarieId}
              onChange={handleChangerSalarie}
              style={{ width: "100%", height: "42px" }}
            >
              <option value="">Sélectionner un salarié…</option>
              {salaries.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nom_prenom} {s.matricule ? ` (${s.matricule})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="field" style={{ flex: "1 1 120px", marginBottom: 0 }}>
            <label style={{ fontSize: "var(--t2xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em" }}>MOIS</label>
            <select
              value={mois}
              onChange={handleChangerMois}
              style={{ width: "100%", height: "42px" }}
            >
              {MOIS.map((m, i) => (
                <option key={i} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="field" style={{ flex: "1 1 100px", marginBottom: 0 }}>
            <label style={{ fontSize: "var(--t2xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em" }}>ANNÉE</label>
            <input
              type="number"
              value={annee}
              onChange={handleChangerAnnee}
              style={{ width: "100%", height: "42px" }}
            />
          </div>

          <div style={{ display: "flex", gap: "var(--s2)" }}>
            {salarieActive && (
              <button
                type="button"
                onClick={handleCopierMoisPrecedent}
                disabled={isPending}
                className="btn btn-secondary"
                style={{ height: "42px", fontWeight: "bold" }}
                title="Copier les données saisies le mois précédent pour ce salarié"
              >
                Copier mois précédent
              </button>
            )}
            
            <button
              type="button"
              onClick={handleCopierMasse}
              disabled={isPending}
              className="btn btn-secondary"
              style={{ height: "42px", fontWeight: "bold", border: "1px dashed var(--accent)" }}
              title="Copier en masse les bulletins de tous les salariés pour la période précédente"
            >
              Copier masse
            </button>
          </div>
        </div>

        {/* Barre de status Auto-save & CSV Actions */}
        {salarieActive && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "var(--s3)", fontSize: "var(--txs)", borderTop: "1px solid var(--border-soft)", paddingTop: "var(--s2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--s2)" }}>
              {saveStatus === "saving" && <span style={{ color: "var(--text-muted)", animation: "pulse 1s infinite" }}>● Enregistrement automatique...</span>}
              {saveStatus === "saved" && <span style={{ color: "var(--teal)", fontWeight: "bold" }}>✓ Enregistré automatiquement</span>}
              {saveStatus === "modified" && <span style={{ color: "var(--amber-700)" }}>● Saisie modifiée...</span>}
              {saveStatus === "error" && <span style={{ color: "var(--red)" }}>Échec de sauvegarde</span>}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "var(--s3)" }}>
              <button onClick={handleExportCSV} className="btn-link" style={{ fontSize: "var(--txs)", cursor: "pointer", background: "none", border: "none" }}>
                Exporter CSV
              </button>
              <label className="btn-link" style={{ fontSize: "var(--txs)", cursor: "pointer" }}>
                Importer CSV
                <input type="file" accept=".csv" onChange={handleImportCSV} style={{ display: "none" }} />
              </label>
            </div>
          </div>
        )}
      </div>

      {erreur && (
        <div className="badge badge-red" style={{ padding: "var(--s3)", borderRadius: "var(--r)", display: "block" }}>
          {erreur}
        </div>
      )}

      {messageCharge && (
        <div className="badge badge-green" style={{ padding: "var(--s3)", borderRadius: "var(--r)", display: "block" }}>
          {messageCharge}
        </div>
      )}

      {/* Warnings / Smart Guardrails */}
      {validationWarnings.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {validationWarnings.map((w, idx) => (
            <div key={idx} style={{ background: "#fffbeb", borderLeft: "3px solid #d97706", color: "#b45309", padding: "8px 12px", borderRadius: "4px", fontSize: "var(--txs)", fontWeight: 600 }}>
              {w}
            </div>
          ))}
        </div>
      )}

      {salarieActive ? (
        <div style={{ display: "grid", gap: "var(--s6)", alignItems: "start" }} className="grid grid-cols-1 lg:grid-cols-3">

          {/* Main Form Column (BULLETIN DE PAIE) */}
          <div className="lg:col-span-2" style={{ display: "flex", flexDirection: "column", gap: "var(--s4)" }}>

            <div style={{
              background: "#0f233c",
              color: "white",
              padding: "var(--s3) var(--s5)",
              borderTopLeftRadius: "var(--rlg)",
              borderTopRightRadius: "var(--rlg)",
              fontWeight: 700,
              fontSize: "var(--t2xs)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "-20px",
              zIndex: 2
            }}>
              BULLETIN DE PAIE
            </div>

            <form key={formKey} ref={formRef} onSubmit={onSubmit} onKeyDown={handleKeyDown} onChange={debouncedCalcul} className="card" style={{ display: "flex", flexDirection: "column", gap: "var(--s5)", paddingTop: "var(--s8)" }}>
              <input type="hidden" name="annee" value={annee} />
              <input type="hidden" name="mois" value={mois} />

              {/* SALAIRE DE BASE */}
              <div style={{ borderBottom: "var(--hairline)", paddingBottom: "var(--s4)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--s2)", marginBottom: "var(--s3)" }}>
                  <h4 style={{ fontSize: "var(--txs)", fontWeight: 700, textTransform: "uppercase", color: "var(--text)", letterSpacing: "0.04em" }}>
                    SALAIRE DE BASE
                  </h4>
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: "10px", color: "var(--text-muted)" }}>SALAIRE DE BASE THÉORIQUE (DA)</label>
                  <input
                    name="salaire_base_theorique"
                    type="number"
                    step="0.01"
                    defaultValue={initialValues["salaire_base_theorique"] ?? salarieActive.salaire_base_theorique}
                    onFocus={(e) => e.target.select()}
                    style={{ fontWeight: "bold" }}
                  />
                  {prevMonthValues["salaire_base_theorique"] !== undefined && (
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "block", marginTop: 4 }}>
                      Mois dernier : {formatDA(prevMonthValues["salaire_base_theorique"])}
                    </span>
                  )}
                </div>
              </div>

              {/* ABSENCES */}
              <div style={{ borderBottom: "var(--hairline)", paddingBottom: "var(--s4)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--s2)", marginBottom: "var(--s4)" }}>
                  <h4 style={{ fontSize: "var(--txs)", fontWeight: 700, textTransform: "uppercase", color: "var(--text)", letterSpacing: "0.04em" }}>
                    ABSENCES (HEURES)
                  </h4>
                  <span className="badge badge-red" style={{ fontSize: "9px", padding: "2px 8px" }}>RÉDUISENT LE SALAIRE</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "var(--s3)" }}>
                  {CHAMPS_ABSENCES.map((c) => (
                    <div key={c.name} className="field" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: "9px" }}>{c.label}</label>
                      <input
                        name={c.name}
                        type="number"
                        step="0.01"
                        defaultValue={initialValues[c.name] ?? 0}
                        onFocus={(e) => e.target.select()}
                        style={{ textAlign: "center" }}
                      />
                      {prevMonthValues[c.name] !== undefined && prevMonthValues[c.name] > 0 && (
                        <span style={{ fontSize: "8px", color: "var(--text-muted)", display: "block", marginTop: 4, textAlign: "center" }}>
                          Mois dernier : {prevMonthValues[c.name]} h
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* HEURES SUPPLEMENTAIRES */}
              <div style={{ borderBottom: "var(--hairline)", paddingBottom: "var(--s4)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--s2)", marginBottom: "var(--s4)" }}>
                  <h4 style={{ fontSize: "var(--txs)", fontWeight: 700, textTransform: "uppercase", color: "var(--text)", letterSpacing: "0.04em" }}>
                    HEURES SUPPLÉMENTAIRES
                  </h4>
                  <span className="badge badge-accent" style={{ fontSize: "9px", padding: "2px 8px" }}>MAJORATIONS PARAMÉTRABLES</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--s3)" }}>
                  {CHAMPS_HEURES_SUP.map((c) => (
                    <div key={c.name} className="field" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: "9px" }}>{c.label}</label>
                      <input
                        name={c.name}
                        type="number"
                        step="0.01"
                        defaultValue={initialValues[c.name] ?? 0}
                        onFocus={(e) => e.target.select()}
                        style={{ textAlign: "center" }}
                      />
                      {prevMonthValues[c.name] !== undefined && prevMonthValues[c.name] > 0 && (
                        <span style={{ fontSize: "8px", color: "var(--text-muted)", display: "block", marginTop: 4, textAlign: "center" }}>
                          Mois dernier : {prevMonthValues[c.name]} h
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Champs masqués pour préserver la compatibilité et les valeurs existantes */}
              {CHAMPS_PRIMES_MONTANT.map((c) => (
                <input key={c.name} type="hidden" name={c.name} value={initialValues[c.name] ?? 0} />
              ))}
              {CHAMPS_PRIMES_POURCENTAGE.map((c) => (
                <input key={c.name} type="hidden" name={c.name} value={initialValues[c.name] ?? 0} />
              ))}
              {CHAMPS_RETENUES.map((c) => (
                <input key={c.name} type="hidden" name={c.name} value={initialValues[c.name] ?? 0} />
              ))}

              {/* PRIMES, INDEMNITÉS ET RETENUES — CATALOGUE DYNAMIQUE */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--s2)", marginBottom: "var(--s4)" }}>
                  <h4 style={{ fontSize: "var(--txs)", fontWeight: 700, textTransform: "uppercase", color: "var(--text)", letterSpacing: "0.04em" }}>
                    RUBRIQUES DU CATALOGUE
                  </h4>
                  <span className="badge badge-teal" style={{ fontSize: "9px", padding: "2px 8px" }}>PERSONNALISÉES PAR SALARIÉ</span>
                </div>

                {/* Add Rubric Input search bar */}
                <div style={{ position: "relative", marginBottom: "var(--s4)", border: "1px dashed var(--amber)", borderRadius: "var(--r)", padding: "12px", background: "var(--amber-50)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--s2)" }}>
                    <span style={{ fontSize: "var(--t2xs)", fontWeight: "bold", color: "var(--amber-800)", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                      + AJOUTER UNE RUBRIQUE
                    </span>
                    <div style={{ flex: 1, position: "relative" }}>
                      <input
                        type="text"
                        value={recherche}
                        onChange={(e) => setRecherche(e.target.value)}
                        placeholder="Rechercher par code ou libellé..."
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "4px", border: "1px solid var(--border)", fontSize: "var(--tsm)", background: "var(--surface)" }}
                      />
                    </div>
                  </div>

                  {resultatsRecherche.length > 0 && (
                    <div
                      className="card"
                      style={{
                        position: "absolute",
                        zIndex: 10,
                        top: "100%",
                        left: 0,
                        right: 0,
                        marginTop: 4,
                        padding: "var(--s1)",
                        maxHeight: 260,
                        overflowY: "auto",
                        boxShadow: "var(--shmd)",
                      }}
                    >
                      {resultatsRecherche.map((r) => {
                        const isGain = r.type_valeur === "Gain (+)";
                        const badgeClass = isGain ? "badge-teal" : "badge-red";
                        const badgeText = isGain ? "Gain" : "Retenue";
                        const catLabel = LABELS_CATEGORIE[r.categorie] || r.categorie;
                        return (
                          <button
                            key={r.code}
                            type="button"
                            onClick={() => ajouterRubrique(r)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              width: "100%",
                              padding: "8px 12px",
                              background: "none",
                              border: "none",
                              borderBottom: "1px solid var(--border-soft)",
                              cursor: "pointer",
                              fontSize: "var(--tsm)",
                              textAlign: "left",
                            }}
                          >
                            <div>
                              <strong style={{ fontFamily: "var(--mono)", color: "var(--accent)" }}>{r.code}</strong>{" "}
                              <span style={{ color: "var(--text)" }}>— {r.libelle}</span>
                            </div>
                            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                              <span className={`badge ${badgeClass}`} style={{ fontSize: "10px", padding: "2px 6px" }}>{badgeText}</span>
                              <span className="badge" style={{ fontSize: "10px", padding: "2px 6px", border: "1px solid var(--border)" }}>{catLabel}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Rubrics list */}
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--s2)" }}>
                  {lignes.map((ligne) => {
                    const isGain = ligne.type_valeur === "Gain (+)" || !ligne.type_valeur?.includes("Retenue");
                    const prevL = prevMonthLignes.find(pl => pl.code === ligne.code);

                    return (
                      <div
                        key={ligne.code}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "var(--s3)",
                          padding: "var(--s2) var(--s3)",
                          background: "var(--surface-2)",
                          borderRadius: "var(--r)",
                          border: "1px solid var(--border-soft)",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "var(--s3)", flex: "1 1 auto" }}>
                          <div style={{
                            background: "var(--amber-100)",
                            color: "var(--amber-800)",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontWeight: "bold",
                            fontFamily: "var(--mono)",
                            fontSize: "var(--txs)",
                            minWidth: "60px",
                            textAlign: "center"
                          }}>
                            {ligne.code}
                          </div>

                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <div style={{ fontWeight: 600, fontSize: "var(--tsm)" }}>
                              {ligne.libelle}
                            </div>
                            {prevL && (
                              <span style={{ fontSize: "8px", color: "var(--text-muted)" }}>
                                Mois dernier : {prevL.valeur_1} {prevL.valeur_2 > 0 ? ` x ${prevL.valeur_2}` : ""}
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "var(--s3)", flexWrap: "nowrap" }}>
                          <div style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "50%",
                            background: isGain ? "var(--green-100)" : "var(--red-100)",
                            color: isGain ? "var(--green-700)" : "var(--red-700)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "bold",
                            fontSize: "14px"
                          }}>
                            {isGain ? "+" : "-"}
                          </div>

                          {ligne.categorie === "nombre_x_taux" ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <input
                                name={`dyn_${ligne.code}_v1`}
                                type="number"
                                step="0.01"
                                defaultValue={ligne.valeur_1}
                                onFocus={(e) => e.target.select()}
                                style={{ width: "60px", padding: "6px", textAlign: "center", height: "34px" }}
                                placeholder="Nbr"
                              />
                              <span style={{ fontSize: "var(--txs)", color: "var(--text-muted)" }}>×</span>
                              <input
                                name={`dyn_${ligne.code}_v2`}
                                type="number"
                                step="0.01"
                                defaultValue={ligne.valeur_2}
                                onFocus={(e) => e.target.select()}
                                style={{ width: "80px", padding: "6px", textAlign: "center", height: "34px" }}
                                placeholder="Taux"
                              />
                            </div>
                          ) : (
                            <input
                              name={`dyn_${ligne.code}_v1`}
                              type="number"
                              step="0.01"
                              defaultValue={ligne.valeur_1}
                              onFocus={(e) => e.target.select()}
                              style={{ width: "90px", padding: "6px", textAlign: "center", height: "34px" }}
                            />
                          )}

                          <span style={{ fontSize: "var(--tsm)", fontWeight: "bold", color: "var(--text-muted)", width: "30px" }}>
                            {LABELS_CATEGORIE[ligne.categorie] || "DA"}
                          </span>

                          <button
                            type="button"
                            onClick={() => retirerRubrique(ligne.code)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "var(--text-muted)",
                              cursor: "pointer",
                              fontSize: "16px",
                              padding: "4px"
                            }}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {lignes.length === 0 && (
                    <p style={{ fontSize: "var(--txs)", color: "var(--text-muted)", textAlign: "center", padding: "var(--s3)" }}>
                      Aucune rubrique additionnelle ajoutée pour ce salarié.
                    </p>
                  )}
                </div>
              </div>

              {/* Form Buttons */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "var(--s4)", borderTop: "var(--hairline)", paddingTop: "var(--s4)" }}>
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn btn-primary"
                  style={{ background: "#0f233c", border: "none", display: "flex", alignItems: "center", gap: "8px" }}
                >
                  Enregistrer le bulletin
                </button>

                {initialBulletin?.bulletin_id && (
                  <button
                    type="button"
                    onClick={handleSupprimer}
                    disabled={isPending}
                    className="btn"
                    style={{ color: "var(--red-600)", background: "transparent", border: "none", fontSize: "var(--tsm)", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    Supprimer ce bulletin
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Right Column (RÉSULTAT DU CALCUL) */}
          <div className="lg:col-span-1" style={{ display: "flex", flexDirection: "column", gap: "var(--s4)", position: "sticky", top: "var(--s6)" }}>

            <div style={{
              background: "#0f233c",
              color: "white",
              padding: "var(--s3) var(--s5)",
              borderTopLeftRadius: "var(--rlg)",
              borderTopRightRadius: "var(--rlg)",
              fontWeight: 700,
              fontSize: "var(--t2xs)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "-20px",
              zIndex: 2
            }}>
              RÉSULTAT DU CALCUL
            </div>

            <div className="card" style={{ display: "flex", flexDirection: "column", gap: "var(--s4)", paddingTop: "var(--s8)" }}>
              {resultat ? (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", borderBottom: "var(--hairline)", paddingBottom: "var(--s3)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--tsm)" }}>
                      <span style={{ color: "var(--text-muted)" }}>Heures travaillées</span>
                      <strong style={{ color: "var(--text)" }}>{resultat.heures_travaillees.toFixed(2)} h</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--tsm)" }}>
                      <span style={{ color: "var(--text-muted)" }}>Salaire de base réel</span>
                      <strong style={{ color: "var(--text)" }}>{formatDA(resultat.salaire_base_reel)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--tsm)" }}>
                      <span style={{ color: "var(--text-muted)" }}>Heures supplémentaires</span>
                      <strong style={{ color: "var(--text)" }}>{formatDA(resultat.total_heures_sup_da)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--tsm)", borderTop: "1px dashed var(--border-soft)", paddingTop: "8px", marginTop: "4px" }}>
                      <span style={{ color: "var(--text)", fontWeight: "bold" }}>Total des gains</span>
                      <strong style={{ color: "var(--marine-900)", fontWeight: "bold" }}>{formatDA(resultat.total_gains)}</strong>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", borderBottom: "var(--hairline)", paddingBottom: "var(--s3)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--tsm)" }}>
                      <span style={{ color: "var(--text-muted)" }}>Base CNAS</span>
                      <strong style={{ color: "var(--text)" }}>{formatDA(resultat.base_cnas)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--tsm)" }}>
                      <span style={{ color: "var(--text-muted)" }}>Retenue CNAS (9%)</span>
                      <strong style={{ color: "var(--text)" }}>{formatDA(resultat.retenue_cnas)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--tsm)" }}>
                      <span style={{ color: "var(--text-muted)" }}>Base imposable IRG</span>
                      <strong style={{ color: "var(--text)" }}>{formatDA(resultat.base_imposable_irg)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--tsm)" }}>
                      <span style={{ color: "var(--text-muted)" }}>IRG brut</span>
                      <strong style={{ color: "var(--text)" }}>{formatDA(resultat.irg_brut)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--tsm)" }}>
                      <span style={{ color: "var(--text-muted)" }}>Abattement IRG (40%)</span>
                      <strong style={{ color: "var(--text)" }}>{formatDA(resultat.abattement_irg)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--tsm)" }}>
                      <span style={{ color: "var(--text-muted)" }}>Retenue IRG nette</span>
                      <strong style={{ color: "var(--text)" }}>{formatDA(resultat.retenue_irg_nette)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--tsm)", borderTop: "1px dashed var(--border-soft)", paddingTop: "8px", marginTop: "4px" }}>
                      <span style={{ color: "var(--text)", fontWeight: "bold" }}>Total retenues</span>
                      <strong style={{ color: "var(--text)", fontWeight: "bold" }}>{formatDA(resultat.total_retenues)}</strong>
                    </div>
                  </div>

                  {/* NET A PAYER BANNER */}
                  <div style={{
                    background: "#0f233c",
                    color: "white",
                    padding: "var(--s4)",
                    borderRadius: "var(--r)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontWeight: "bold"
                  }}>
                    <span>NET À PAYER</span>
                    <span style={{ fontSize: "20px" }}>{formatDA(resultat.net_a_payer)}</span>
                  </div>

                  {/* Drawer trigger button */}
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(true)}
                    className="btn btn-secondary"
                    style={{ width: "100%", justifyContent: "center", border: "1px solid var(--accent)" }}
                  >
                    Inspecter le détail du calcul
                  </button>

                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--s2)", marginTop: "var(--s2)" }}>
                    {estEnregistre ? (
                      <>
                        <a
                          href={`/salaries/${salarieActive.id}/bulletin/pdf?annee=${resultat.annee}&mois=${resultat.mois}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary"
                          style={{ width: "100%", justifyContent: "center" }}
                        >
                          Voir bulletin salarié
                        </a>
                        <a
                          href={`/salaries/${salarieActive.id}/bulletin/pdf?annee=${resultat.annee}&mois=${resultat.mois}&variante=employeur`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary"
                          style={{ width: "100%", justifyContent: "center" }}
                        >
                          Voir bulletin employeur
                        </a>
                        <Link
                          href={`/salaries/${salarieActive.id}/bulletin/explication?annee=${resultat.annee}&mois=${resultat.mois}`}
                          className="btn btn-secondary"
                          style={{ width: "100%", textAlign: "center", justifyContent: "center" }}
                        >
                          Voir l&apos;explication détaillée du calcul
                        </Link>
                      </>
                    ) : (
                      <>
                        <button disabled className="btn btn-secondary" style={{ width: "100%", opacity: 0.5, cursor: "not-allowed" }}>
                          Voir bulletin salarié
                        </button>
                        <button disabled className="btn btn-secondary" style={{ width: "100%", opacity: 0.5, cursor: "not-allowed" }}>
                          Voir bulletin employeur
                        </button>
                        <button disabled className="btn btn-secondary" style={{ width: "100%", opacity: 0.5, cursor: "not-allowed" }}>
                          Voir l&apos;explication détaillée du calcul
                        </button>
                        <p style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "center" }}>
                          Enregistrez d&apos;abord le bulletin.
                        </p>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <p style={{ fontSize: "var(--tsm)", color: "var(--text-muted)", textAlign: "center", padding: "var(--s4)" }}>
                  Le résultat du calcul s&apos;affichera en temps réel ici.
                </p>
              )}
            </div>

          </div>

        </div>
      ) : (
        <div className="card" style={{ textAlign: "center", padding: "var(--s6)", color: "var(--text-muted)" }}>
          Sélectionnez un salarié ci-dessus pour afficher et saisir ses données mensuelles de paie.
        </div>
      )}

      {/* 4. Cascade de Calcul Interactive en Direct (Live Math Drawer) */}
      {isDrawerOpen && salarieActive && resultat && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 35, 60, 0.4)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            justifyContent: "flex-end"
          }}
          onClick={() => setIsDrawerOpen(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "500px",
              height: "100%",
              background: "var(--surface)",
              boxShadow: "var(--shlg)",
              padding: "var(--s5)",
              display: "flex",
              flexDirection: "column",
              gap: "var(--s4)",
              overflowY: "auto",
              animation: "slideIn 0.3s ease-out"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid var(--border-soft)", paddingBottom: "var(--s3)" }}>
              <h3 style={{ fontSize: "var(--tlg)" }}>Détails du calcul (Live)</h3>
              <button
                onClick={() => setIsDrawerOpen(false)}
                style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "var(--text)" }}
              >
                ×
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--s4)", fontSize: "var(--tsm)" }}>
              <div>
                <strong style={{ textTransform: "uppercase", fontSize: "var(--txs)", color: "var(--accent)" }}>1. Base de calcul</strong>
                <div style={{ background: "var(--surface-2)", padding: "12px", borderRadius: "6px", marginTop: "6px", fontFamily: "var(--mono)", fontSize: "var(--txs)", lineHeight: "1.6" }}>
                  Salaire Base Théorique : {formatDA(resultat.salaire_base_reel + (resultat.total_heures_absence * (resultat.salaire_base_reel / 173.33)))} <br />
                  Heures d'absences déduites : {resultat.total_heures_absence} h<br />
                  Taux horaire : {((resultat.salaire_base_reel) / (173.33 - resultat.total_heures_absence || 1)).toFixed(2)} DA / h<br />
                  <strong>Salaire de base réel : {formatDA(resultat.salaire_base_reel)}</strong>
                </div>
              </div>

              <div>
                <strong style={{ textTransform: "uppercase", fontSize: "var(--txs)", color: "var(--accent)" }}>2. Primes & Gains</strong>
                <div style={{ background: "var(--surface-2)", padding: "12px", borderRadius: "6px", marginTop: "6px", fontFamily: "var(--mono)", fontSize: "var(--txs)", lineHeight: "1.6" }}>
                  Heures supplémentaires : {formatDA(resultat.total_heures_sup_da)}<br />
                  Total primes fixes : {formatDA(resultat.total_gains - resultat.salaire_base_reel - resultat.total_heures_sup_da)}<br />
                  <strong>Total Gains (Brut) : {formatDA(resultat.total_gains)}</strong>
                </div>
              </div>

              <div>
                <strong style={{ textTransform: "uppercase", fontSize: "var(--txs)", color: "var(--accent)" }}>3. Cotisations Sociales (CNAS)</strong>
                <div style={{ background: "var(--surface-2)", padding: "12px", borderRadius: "6px", marginTop: "6px", fontFamily: "var(--mono)", fontSize: "var(--txs)", lineHeight: "1.6" }}>
                  Assiette CNAS : {formatDA(resultat.base_cnas)}<br />
                  Part salariale (9%) : {formatDA(resultat.retenue_cnas)}<br />
                  Part patronale (26%) : {formatDA(resultat.base_cnas * 0.26)}
                </div>
              </div>

              <div>
                <strong style={{ textTransform: "uppercase", fontSize: "var(--txs)", color: "var(--accent)" }}>4. Impôt sur le Revenu (IRG)</strong>
                <div style={{ background: "var(--surface-2)", padding: "12px", borderRadius: "6px", marginTop: "6px", fontFamily: "var(--mono)", fontSize: "var(--txs)", lineHeight: "1.6" }}>
                  Base imposable IRG : {formatDA(resultat.base_imposable_irg)} <br />
                  IRG Brut calculé : {formatDA(resultat.irg_brut)} <br />
                  Abattement calculé (40%) : {formatDA(resultat.abattement_irg)} <br />
                  <strong>IRG Net prélevé : {formatDA(resultat.retenue_irg_nette)}</strong>
                </div>
              </div>

              <div>
                <strong style={{ textTransform: "uppercase", fontSize: "var(--txs)", color: "var(--accent)" }}>5. Total & Coût Employeur</strong>
                <div style={{ background: "var(--surface-2)", padding: "12px", borderRadius: "6px", marginTop: "6px", fontFamily: "var(--mono)", fontSize: "var(--txs)", lineHeight: "1.6" }}>
                  Gains versés : {formatDA(resultat.total_gains)}<br />
                  Charges patronales (26%) : {formatDA(resultat.base_cnas * 0.26)}<br />
                  <strong>Coût global employeur : {formatDA(resultat.cout_total_employeur)}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Style animation pour le Drawer */}
      <style jsx global>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .btn-link {
          color: var(--accent);
          text-decoration: underline;
          padding: 0;
          font-weight: 600;
        }
        .btn-link:hover {
          color: var(--accent-hover);
        }
      `}</style>
    </div>
  );
}
