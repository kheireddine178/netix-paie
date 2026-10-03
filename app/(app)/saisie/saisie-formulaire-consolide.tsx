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

// Odoo UI Toolkit
import OdooControlPanel from "@/components/odoo/OdooControlPanel";
import OdooSheet from "@/components/odoo/OdooSheet";
import OdooStatusbar from "@/components/odoo/OdooStatusbar";
import OdooNotebook from "@/components/odoo/OdooNotebook";
import OdooSubNav from "@/components/odoo/OdooSubNav";

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
  { name: "maladie_h", label: "Maladie (h)" },
  { name: "mise_a_pied_h", label: "Mise à pied (h)" },
  { name: "accident_travail_h", label: "Accident travail (h)" },
  { name: "retard_h", label: "Retard (h)" },
  { name: "absence_irreguliere_h", label: "Abs. irrégulière (h)" },
];

const CHAMPS_HEURES_SUP = [
  { name: "heures_sup_1", label: "Palier 1 (+50%)" },
  { name: "heures_sup_2", label: "Palier 2 (+75%)" },
  { name: "heures_sup_3", label: "Palier 3 (+100%)" },
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

export interface SaisieFormulaireConsolideProps {
  salaries: Salarie[];
  salarieActive?: Salarie | null;
  anneeActive: number;
  moisActive: number;
  rubriquesAssignees: RubriqueAssignee[];
  catalogueRubriques: RubriqueCatalogue[];
  parametres: Parametres;
  initialBulletin: BulletinPourSaisie | null;
  pagerInfo?: {
    current: number;
    total: number;
    prevId: number | null;
    nextId: number | null;
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
  pagerInfo,
}: SaisieFormulaireConsolideProps) {
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
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
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
    if (!q) return catalogueRubriques.filter((r) => !codesDejaAjoutes.has(r.code)).slice(0, 10);
    return catalogueRubriques
      .filter((r) => !codesDejaAjoutes.has(r.code))
      .filter((r) => r.code.toLowerCase().includes(q) || (r.libelle ?? "").toLowerCase().includes(q))
      .slice(0, 10);
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
      nom_prenom: salarieActive.nom_prenom,
      matricule: salarieActive.matricule,
      fonction: salarieActive.fonction,
      mois,
      annee,
    });
  };

  const debouncedCalcul = () => {
    if (calculTimeoutRef.current) clearTimeout(calculTimeoutRef.current);
    calculTimeoutRef.current = setTimeout(() => {
      executerCalculLive();
      setSaveStatus("modified");
    }, 150);
  };

  useEffect(() => {
    if (salarieActive) {
      executerCalculLive();
    }
  }, [formKey, lignes, salarieActive?.id, parametres]);

  function handleChangerSalarie(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    setSalarieId(id);
    if (id) {
      router.push(`/saisie?salarieId=${id}&annee=${annee}&mois=${mois}`);
    } else {
      router.push(`/saisie?annee=${annee}&mois=${mois}`);
    }
  }

  function handleChangerMois(e: React.ChangeEvent<HTMLSelectElement>) {
    const m = parseInt(e.target.value, 10);
    setMois(m);
    if (salarieId) {
      router.push(`/saisie?salarieId=${salarieId}&annee=${annee}&mois=${m}`);
    } else {
      router.push(`/saisie?annee=${annee}&mois=${m}`);
    }
  }

  function handleChangerAnnee(e: React.ChangeEvent<HTMLInputElement>) {
    const a = parseInt(e.target.value, 10) || new Date().getFullYear();
    setAnnee(a);
    if (salarieId) {
      router.push(`/saisie?salarieId=${salarieId}&annee=${a}&mois=${mois}`);
    } else {
      router.push(`/saisie?annee=${a}&mois=${mois}`);
    }
  }

  function handleCopierMoisPrecedent() {
    if (!salarieActive) return;
    const prevMois = mois === 1 ? 12 : mois - 1;
    const prevAnnee = mois === 1 ? annee - 1 : annee;

    startTransition(async () => {
      try {
        const donnees = await chargerBulletinPourSaisie(salarieActive.id, prevAnnee, prevMois);
        if (!donnees) {
          setErreur(`Aucun bulletin trouvé pour ${MOIS[prevMois - 1]} ${prevAnnee}.`);
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
        })).sort((a: LigneEtat, b: LigneEtat) => a.code.localeCompare(b.code, undefined, { numeric: true }));

        setInitialValues(champs);
        setLignes(lignesChargees);
        setFormKey((k) => k + 1);
        setMessageCharge(`Données copiées depuis ${MOIS[prevMois - 1]} ${prevAnnee}.`);
        setErreur(null);
        setEstEnregistre(false);
      } catch (e) {
        setErreur(e instanceof Error ? e.message : "Erreur de copie");
      }
    });
  }

  async function handleCopierMasse() {
    if (!confirm(`Voulez-vous copier les bulletins de TOUS les salariés du mois précédent vers ${MOIS[mois - 1]} ${annee} ?`)) return;
    startTransition(async () => {
      try {
        const res = await copierMoisPrecedentMasse(annee, mois);
        setMessageCharge(`${res.nbCopies} bulletins ont été copiés en masse avec succès.`);
        router.refresh();
      } catch (e) {
        setErreur(e instanceof Error ? e.message : "Erreur lors de la copie de masse");
      }
    });
  }

  function ajouterRubrique(r: RubriqueCatalogue) {
    if (codesDejaAjoutes.has(r.code)) return;
    const nouvelleLigne = ligneVide(r);
    setLignes((prev) => [...prev, nouvelleLigne].sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true })));
    setRecherche("");
    setIsAddMenuOpen(false);

    if (salarieActive) {
      startTransition(async () => {
        try {
          await ajouterRubriqueSalarie(salarieActive.id, r.code);
        } catch {
          // Échec silencieux
        }
      });
    }
  }

  function retirerRubrique(code: string) {
    setLignes((prev) => prev.filter((l) => l.code !== code));
    if (salarieActive) {
      startTransition(async () => {
        try {
          await retirerRubriqueSalarie(salarieActive.id, code);
        } catch {
          // Échec silencieux
        }
      });
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
    if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") {
      e.preventDefault();
      const form = formRef.current;
      if (!form) return;
      const inputs = Array.from(
        form.querySelectorAll<HTMLInputElement>('input:not([type="hidden"]):not([disabled])')
      );
      const idx = inputs.indexOf(e.target as HTMLInputElement);
      if (idx > -1 && idx < inputs.length - 1) {
        inputs[idx + 1].focus();
        inputs[idx + 1].select();
      } else {
        inputs[0]?.focus();
      }
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!salarieActive) return;

    setErreur(null);
    setMessageCharge(null);
    setSaveStatus("saving");

    const formData = new FormData(e.currentTarget);
    for (const champ of CHAMPS_TAUX_POURCENTAGE) {
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
        setMessageCharge("Le bulletin a été validé et enregistré avec succès en base de données.");
        router.refresh();
      } catch (e) {
        setErreur(e instanceof Error ? e.message : "Erreur inconnue");
        setSaveStatus("error");
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

  // Handlers pour le Pager Odoo
  const handlePrevEmployee = () => {
    if (pagerInfo?.prevId) {
      router.push(`/saisie?salarieId=${pagerInfo.prevId}&annee=${annee}&mois=${mois}`);
    }
  };

  const handleNextEmployee = () => {
    if (pagerInfo?.nextId) {
      router.push(`/saisie?salarieId=${pagerInfo.nextId}&annee=${annee}&mois=${mois}`);
    }
  };

  return (
    <div className="odoo-saisie-wrapper flex flex-col gap-4">
      {/* 0. ODOO SUBNAV TABS */}
      <OdooSubNav
        items={[
          { label: "👤 Saisie individuelle", href: "/saisie" },
          { label: "📊 Grille collective en masse", href: "/saisie/collective" },
          { label: "💳 Acomptes & Avances", href: "/saisie/avances" },
        ]}
      />

      {/* 1. ODOO CONTROL PANEL (Breadcrumbs, Actions & Switcher Pager) */}
      <OdooControlPanel
        breadcrumbs={[
          { label: "Saisie Mensuelle", href: "/saisie" },
          { label: `${MOIS[mois - 1]} ${annee}` },
          { label: salarieActive ? salarieActive.nom_prenom : "Sélection" },
        ]}
        primaryAction={{
          label: isPending ? "Enregistrement…" : "Enregistrer le bulletin",
          onClick: () => formRef.current?.requestSubmit(),
          icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
          ),
        }}
        secondaryActions={[
          {
            label: "Copier mois précédent",
            onClick: handleCopierMoisPrecedent,
            icon: (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            ),
          },
          {
            label: "Saisie collective",
            href: "/saisie/collective",
          },
          {
            label: "Inspecter le calcul (Live)",
            onClick: () => setIsDrawerOpen(true),
          },
        ]}
        pager={
          pagerInfo
            ? {
                current: pagerInfo.current,
                total: pagerInfo.total,
                onPrev: handlePrevEmployee,
                onNext: handleNextEmployee,
                hasPrev: !!pagerInfo.prevId,
                hasNext: !!pagerInfo.nextId,
                enableShortcuts: true,
              }
            : undefined
        }
      />

      {/* 2. BARRE COMPACTE DE SÉLECTION PÉRIODE & SALARIÉ */}
      <div
        className="odoo-selector-strip px-4 py-3 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-3 flex-wrap flex-1 min-w-[280px]">
          {/* Select Salarié */}
          <div className="flex items-center gap-2 flex-1 sm:flex-initial">
            <span className="font-bold text-[11px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              COLLABORATEUR
            </span>
            <select
              value={salarieId}
              onChange={handleChangerSalarie}
              className="text-xs px-2.5 py-1.5 rounded border font-semibold min-w-[180px]"
              style={{
                background: "var(--surface-2)",
                borderColor: "var(--border)",
                color: "var(--text)",
              }}
            >
              <option value="">Choisir un salarié…</option>
              {salaries.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nom_prenom} {s.matricule ? `(${s.matricule})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Select Mois & Année */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-[11px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              PÉRIODE
            </span>
            <select
              value={mois}
              onChange={handleChangerMois}
              className="text-xs px-2 py-1.5 rounded border font-medium"
              style={{
                background: "var(--surface-2)",
                borderColor: "var(--border)",
                color: "var(--text)",
              }}
            >
              {MOIS.map((m, i) => (
                <option key={i} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={annee}
              onChange={handleChangerAnnee}
              className="text-xs px-2 py-1.5 rounded border w-18 text-center font-medium"
              style={{
                background: "var(--surface-2)",
                borderColor: "var(--border)",
                color: "var(--text)",
              }}
            />
          </div>
        </div>

        {/* Status et outils CSV */}
        <div className="flex items-center gap-3 ml-auto">
          {saveStatus === "saving" && (
            <span className="text-xs font-medium text-amber-600 animate-pulse">● Enregistrement…</span>
          )}
          {saveStatus === "saved" && (
            <span className="text-xs font-bold text-teal-600">✓ Enregistré</span>
          )}
          {saveStatus === "modified" && (
            <span className="text-xs font-semibold text-amber-600">● Modifié (non validé)</span>
          )}

          <div className="flex items-center gap-2 border-l pl-3" style={{ borderColor: "var(--border-soft)" }}>
            <button
              type="button"
              onClick={handleExportCSV}
              className="text-[11px] font-semibold hover:underline"
              style={{ color: "var(--accent)" }}
            >
              Export CSV
            </button>
            <label className="text-[11px] font-semibold hover:underline cursor-pointer" style={{ color: "var(--accent)" }}>
              Import CSV
              <input type="file" accept=".csv" onChange={handleImportCSV} style={{ display: "none" }} />
            </label>
          </div>
        </div>
      </div>

      {/* Messages et Alertes */}
      {erreur && (
        <div className="p-3 text-xs font-semibold rounded bg-red-50 text-red-700 border border-red-200">
          ⚠️ {erreur}
        </div>
      )}

      {messageCharge && (
        <div className="p-3 text-xs font-semibold rounded bg-teal-50 text-teal-800 border border-teal-200">
          ✓ {messageCharge}
        </div>
      )}

      {validationWarnings.length > 0 && (
        <div className="flex flex-col gap-1">
          {validationWarnings.map((w, idx) => (
            <div key={idx} className="p-2 text-xs font-semibold rounded bg-amber-50 text-amber-800 border border-amber-200">
              ⚡ {w}
            </div>
          ))}
        </div>
      )}

      {/* 3. ODOO FORM SHEET (Fiche Document Centrale) */}
      {salarieActive ? (
        <OdooSheet
          statusbar={
            <OdooStatusbar
              steps={[
                { id: "draft", label: "1. Brouillon" },
                { id: "computed", label: "2. Calculé en direct" },
                { id: "saved", label: "3. Validé & Enregistré" },
              ]}
              currentStep={estEnregistre ? "saved" : resultat ? "computed" : "draft"}
              actions={
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => formRef.current?.requestSubmit()}
                    disabled={isPending}
                    className="btn btn-primary text-xs font-bold px-3 py-1.5 rounded"
                  >
                    Valider le bulletin
                  </button>
                  {initialBulletin?.bulletin_id && (
                    <button
                      type="button"
                      onClick={handleSupprimer}
                      disabled={isPending}
                      className="text-xs font-semibold text-red-600 hover:underline px-2"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              }
            />
          }
          avatar={
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold shadow-sm"
              style={{
                background: "var(--accent-bg)",
                color: "var(--accent-ink)",
                border: "2px solid var(--accent)",
              }}
            >
              {salarieActive.nom_prenom.slice(0, 2).toUpperCase()}
            </div>
          }
          title={salarieActive.nom_prenom}
          subtitle={`Matricule : ${salarieActive.matricule || "—"} • Fonction : ${salarieActive.fonction || "Non renseigné"} • Période : ${MOIS[mois - 1]} ${annee}`}
          smartButtons={[
            {
              id: "sb-base",
              label: "Salaire de base",
              count: formatDA(initialValues["salaire_base_theorique"] ?? salarieActive.salaire_base_theorique),
            },
            {
              id: "sb-brut",
              label: "Total Brut (Gains)",
              count: formatDA(resultat ? resultat.total_gains : 0),
            },
            {
              id: "sb-cnas",
              label: "Retenue CNAS (9%)",
              count: formatDA(resultat ? resultat.retenue_cnas : 0),
            },
            {
              id: "sb-net",
              label: "NET À PAYER",
              count: formatDA(resultat ? resultat.net_a_payer : 0),
            },
          ]}
        >
          {/* Formulaire englobant avec Onglets Odoo */}
          <form
            key={formKey}
            ref={formRef}
            onSubmit={onSubmit}
            onKeyDown={handleKeyDown}
            onChange={debouncedCalcul}
            className="flex flex-col gap-6"
          >
            <input type="hidden" name="annee" value={annee} />
            <input type="hidden" name="mois" value={mois} />

            {/* Champs masqués pour compatibilité existante */}
            {CHAMPS_PRIMES_MONTANT.map((c) => (
              <input key={c.name} type="hidden" name={c.name} value={initialValues[c.name] ?? 0} />
            ))}
            {CHAMPS_PRIMES_POURCENTAGE.map((c) => (
              <input key={c.name} type="hidden" name={c.name} value={initialValues[c.name] ?? 0} />
            ))}
            {CHAMPS_RETENUES.map((c) => (
              <input key={c.name} type="hidden" name={c.name} value={initialValues[c.name] ?? 0} />
            ))}

            {/* SYSTÈME D'ONGLETS ODOO NOTEBOOK */}
            <OdooNotebook
              tabs={[
                {
                  id: "lignes_paie",
                  label: "Rubriques & Lignes de Paie",
                  count: lignes.length,
                  content: (
                    <div className="flex flex-col gap-4">
                      {/* Salaire de base théorique */}
                      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold" style={{ color: "var(--text)" }}>
                            Salaire de base théorique contractuel
                          </span>
                          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                            Base mensuelle légale (173.33 h)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            name="salaire_base_theorique"
                            type="number"
                            step="0.01"
                            defaultValue={initialValues["salaire_base_theorique"] ?? salarieActive.salaire_base_theorique}
                            onFocus={(e) => e.target.select()}
                            className="font-bold text-sm px-3 py-1.5 rounded border text-right w-44"
                            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                          />
                          <span className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>DA</span>
                        </div>
                      </div>

                      {/* TABLE DES RUBRIQUES FAÇON ODOO */}
                      <div className="table-wrap rounded-lg border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                              <th className="py-2.5 px-3 font-bold w-20">Code</th>
                              <th className="py-2.5 px-3 font-bold">Désignation de la rubrique</th>
                              <th className="py-2.5 px-3 font-bold w-28">Type</th>
                              <th className="py-2.5 px-3 font-bold w-28 text-center">Catégorie</th>
                              <th className="py-2.5 px-3 font-bold w-48 text-right">Valeur / Taux</th>
                              <th className="py-2.5 px-3 font-bold w-12 text-center"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {lignes.map((ligne) => {
                              const isGain = ligne.type_valeur === "Gain (+)";
                              return (
                                <tr
                                  key={ligne.code}
                                  className="border-b transition-colors hover:bg-slate-50/50"
                                  style={{ borderColor: "var(--border-soft)" }}
                                >
                                  {/* Code */}
                                  <td className="py-2.5 px-3 font-mono font-bold" style={{ color: "var(--accent)" }}>
                                    {ligne.code}
                                  </td>

                                  {/* Libellé */}
                                  <td className="py-2.5 px-3 font-medium">
                                    {ligne.libelle}
                                  </td>

                                  {/* Type */}
                                  <td className="py-2.5 px-3">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                        isGain ? "bg-teal-100 text-teal-800" : "bg-red-100 text-red-800"
                                      }`}
                                    >
                                      {isGain ? "Gain (+)" : "Retenue (-)"}
                                    </span>
                                  </td>

                                  {/* Catégorie */}
                                  <td className="py-2.5 px-3 text-center text-muted-foreground font-mono">
                                    {LABELS_CATEGORIE[ligne.categorie] || "DA"}
                                  </td>

                                  {/* Inputs Valeurs */}
                                  <td className="py-2.5 px-3 text-right">
                                    {ligne.categorie === "nombre_x_taux" ? (
                                      <div className="flex items-center justify-end gap-1.5">
                                        <input
                                          name={`dyn_${ligne.code}_v1`}
                                          type="number"
                                          step="0.01"
                                          defaultValue={ligne.valeur_1}
                                          onFocus={(e) => e.target.select()}
                                          className="w-16 px-2 py-1 text-right text-xs rounded border"
                                          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                                          placeholder="Nbr"
                                        />
                                        <span className="text-muted-foreground">×</span>
                                        <input
                                          name={`dyn_${ligne.code}_v2`}
                                          type="number"
                                          step="0.01"
                                          defaultValue={ligne.valeur_2}
                                          onFocus={(e) => e.target.select()}
                                          className="w-20 px-2 py-1 text-right text-xs rounded border font-semibold"
                                          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                                          placeholder="Taux"
                                        />
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-end gap-1">
                                        <input
                                          name={`dyn_${ligne.code}_v1`}
                                          type="number"
                                          step="0.01"
                                          defaultValue={ligne.valeur_1}
                                          onFocus={(e) => e.target.select()}
                                          className="w-28 px-2 py-1 text-right text-xs rounded border font-semibold"
                                          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                                        />
                                        <span className="text-muted-foreground text-[11px]">
                                          {ligne.categorie === "pourcentage" ? "%" : "DA"}
                                        </span>
                                      </div>
                                    )}
                                  </td>

                                  {/* Supprimer */}
                                  <td className="py-2.5 px-3 text-center">
                                    <button
                                      type="button"
                                      onClick={() => retirerRubrique(ligne.code)}
                                      title="Supprimer la ligne"
                                      className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                    >
                                      ✕
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}

                            {lignes.length === 0 && (
                              <tr>
                                <td colSpan={6} className="py-6 text-center text-muted-foreground">
                                  Aucune rubrique additionnelle ajoutée. Cliquez sur le bouton ci-dessous pour ajouter une prime ou retenue.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* LE BOUTON ICONIQUE ODOO : « + Ajouter une ligne » */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors"
                          style={{
                            color: "var(--accent)",
                            background: "var(--accent-bg)",
                            border: "1px dashed var(--accent)",
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                          <span>Ajouter une ligne</span>
                        </button>

                        {/* Menu de sélection Odoo déroulant instantané */}
                        {isAddMenuOpen && (
                          <div
                            className="absolute left-0 top-full mt-2 w-full max-w-md rounded-lg shadow-xl border p-2 z-30"
                            style={{
                              background: "var(--surface)",
                              borderColor: "var(--border)",
                            }}
                          >
                            <input
                              type="text"
                              autoFocus
                              value={recherche}
                              onChange={(e) => setRecherche(e.target.value)}
                              placeholder="Rechercher une prime, indemnité ou retenue..."
                              className="w-full text-xs px-3 py-2 rounded border mb-2"
                              style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
                            />

                            <div className="max-h-56 overflow-y-auto flex flex-col gap-1">
                              {resultatsRecherche.map((r) => {
                                const isGain = r.type_valeur === "Gain (+)";
                                return (
                                  <button
                                    key={r.code}
                                    type="button"
                                    onClick={() => ajouterRubrique(r)}
                                    className="flex items-center justify-between p-2 rounded hover:bg-slate-100 text-left text-xs transition-colors"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono font-bold" style={{ color: "var(--accent)" }}>
                                        {r.code}
                                      </span>
                                      <span className="font-medium" style={{ color: "var(--text)" }}>
                                        {r.libelle}
                                      </span>
                                    </div>
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                        isGain ? "bg-teal-100 text-teal-800" : "bg-red-100 text-red-800"
                                      }`}
                                    >
                                      {isGain ? "Gain" : "Retenue"}
                                    </span>
                                  </button>
                                );
                              })}
                              {resultatsRecherche.length === 0 && (
                                <span className="p-3 text-center text-xs text-muted-foreground">
                                  Toutes les rubriques correspondantes sont déjà ajoutées.
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ),
                },
                {
                  id: "absences_heures",
                  label: "Absences & Heures Supplémentaires",
                  content: (
                    <div className="flex flex-col gap-6">
                      {/* Section Absences */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text)" }}>
                            DÉCOMPTE DES ABSENCES (HEURES)
                          </h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-700">
                            Déduites du salaire de base
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                          {CHAMPS_ABSENCES.map((c) => (
                            <div key={c.name} className="flex flex-col gap-1 p-2.5 rounded border" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
                              <label className="text-[11px] font-semibold" style={{ color: "var(--text-muted)" }}>
                                {c.label}
                              </label>
                              <input
                                name={c.name}
                                type="number"
                                step="0.01"
                                defaultValue={initialValues[c.name] ?? 0}
                                onFocus={(e) => e.target.select()}
                                className="text-xs font-bold text-center px-2 py-1 rounded border"
                                style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                              />
                              {prevMonthValues[c.name] !== undefined && prevMonthValues[c.name] > 0 && (
                                <span className="text-[10px] text-center text-muted-foreground">
                                  Mois dernier: {prevMonthValues[c.name]} h
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Section Heures Sup */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text)" }}>
                            HEURES SUPPLÉMENTAIRES
                          </h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                            Majorations légales
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {CHAMPS_HEURES_SUP.map((c) => (
                            <div key={c.name} className="flex flex-col gap-1 p-2.5 rounded border" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
                              <label className="text-[11px] font-semibold" style={{ color: "var(--text-muted)" }}>
                                {c.label}
                              </label>
                              <input
                                name={c.name}
                                type="number"
                                step="0.01"
                                defaultValue={initialValues[c.name] ?? 0}
                                onFocus={(e) => e.target.select()}
                                className="text-xs font-bold text-center px-2 py-1 rounded border"
                                style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                              />
                              {prevMonthValues[c.name] !== undefined && prevMonthValues[c.name] > 0 && (
                                <span className="text-[10px] text-center text-muted-foreground">
                                  Mois dernier: {prevMonthValues[c.name]} h
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ),
                },
                {
                  id: "cotisations_synthese",
                  label: "Cotisations Sociales & Charges Patronales",
                  content: (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Synthèse Retenues Salariales */}
                      <div className="p-4 rounded-lg border flex flex-col gap-3" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
                        <h4 className="text-xs font-bold uppercase tracking-wider pb-2 border-b" style={{ color: "var(--text)", borderColor: "var(--border-soft)" }}>
                          Retenues Salariales & Fiscales
                        </h4>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Assiette CNAS cotisable</span>
                          <span className="font-semibold">{formatDA(resultat ? resultat.base_cnas : 0)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Retenue CNAS Salarié (9%)</span>
                          <span className="font-bold text-red-600">{formatDA(resultat ? resultat.retenue_cnas : 0)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Base Imposable IRG</span>
                          <span className="font-semibold">{formatDA(resultat ? resultat.base_imposable_irg : 0)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">IRG Net prélevé</span>
                          <span className="font-bold text-red-600">{formatDA(resultat ? resultat.retenue_irg_nette : 0)}</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold pt-2 border-t" style={{ borderColor: "var(--border-soft)" }}>
                          <span>Total Retenues Salarié</span>
                          <span className="text-red-700">{formatDA(resultat ? resultat.total_retenues : 0)}</span>
                        </div>
                      </div>

                      {/* Charges Patronales Employeur */}
                      <div className="p-4 rounded-lg border flex flex-col gap-3" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
                        <h4 className="text-xs font-bold uppercase tracking-wider pb-2 border-b" style={{ color: "var(--text)", borderColor: "var(--border-soft)" }}>
                          Charges & Coût Total Employeur
                        </h4>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Salaire Brut (Total gains)</span>
                          <span className="font-semibold">{formatDA(resultat ? resultat.total_gains : 0)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Cotisation CNAS Employeur (26%)</span>
                          <span className="font-bold text-amber-700">
                            {formatDA(resultat ? resultat.base_cnas * 0.26 : 0)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs font-bold pt-2 border-t" style={{ borderColor: "var(--border-soft)" }}>
                          <span>Coût Global Employeur</span>
                          <span className="text-base font-bold" style={{ color: "var(--accent)" }}>
                            {formatDA(resultat ? resultat.cout_total_employeur : 0)}
                          </span>
                        </div>
                        <div className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
                          La part patronale CNAS de 26% s&apos;applique directement sur la totalité de l&apos;assiette cotisable de l&apos;entreprise.
                        </div>
                      </div>
                    </div>
                  ),
                },
              ]}
            />
          </form>
        </OdooSheet>
      ) : (
        <div className="p-12 text-center rounded-lg border border-dashed text-muted-foreground" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          Sélectionnez un salarié dans la barre supérieure pour afficher sa fiche de paie.
        </div>
      )}

      {/* 4. MODAL DRAWER D'INSPECTION MATHÉMATIQUE EN DIRECT */}
      {isDrawerOpen && salarieActive && resultat && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs"
          onClick={() => setIsDrawerOpen(false)}
        >
          <div
            className="w-full max-w-lg h-full overflow-y-auto p-6 flex flex-col gap-4 shadow-2xl transition-transform"
            style={{ background: "var(--surface)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-bold text-base" style={{ color: "var(--text)" }}>
                Détails du calcul (Live Engine)
              </h3>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="text-gray-400 hover:text-gray-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4 text-xs font-mono">
              <div className="p-3 rounded bg-slate-50 border leading-relaxed">
                <strong className="text-[11px] uppercase text-purple-700 block mb-1">1. Base & Absences</strong>
                Base théorique : {formatDA(resultat.salaire_base_reel + (resultat.total_heures_absence * (resultat.salaire_base_reel / 173.33)))}<br />
                Heures déduites : {resultat.total_heures_absence} h<br />
                <strong>Base réelle : {formatDA(resultat.salaire_base_reel)}</strong>
              </div>

              <div className="p-3 rounded bg-slate-50 border leading-relaxed">
                <strong className="text-[11px] uppercase text-purple-700 block mb-1">2. Primes & Heures Sup</strong>
                Heures supplémentaires : {formatDA(resultat.total_heures_sup_da)}<br />
                <strong>Total Brut : {formatDA(resultat.total_gains)}</strong>
              </div>

              <div className="p-3 rounded bg-slate-50 border leading-relaxed">
                <strong className="text-[11px] uppercase text-purple-700 block mb-1">3. Cotisations CNAS</strong>
                Assiette CNAS : {formatDA(resultat.base_cnas)}<br />
                Part salariale 9% : {formatDA(resultat.retenue_cnas)}<br />
                Part patronale 26% : {formatDA(resultat.base_cnas * 0.26)}
              </div>

              <div className="p-3 rounded bg-slate-50 border leading-relaxed">
                <strong className="text-[11px] uppercase text-purple-700 block mb-1">4. Barème IRG 2022/2026</strong>
                Base IRG : {formatDA(resultat.base_imposable_irg)}<br />
                IRG Brut : {formatDA(resultat.irg_brut)}<br />
                Abattement 40% : {formatDA(resultat.abattement_irg)}<br />
                <strong>IRG Net : {formatDA(resultat.retenue_irg_nette)}</strong>
              </div>

              <div className="p-3 rounded bg-purple-50 border border-purple-200 leading-relaxed font-bold text-sm">
                NET À PAYER : {formatDA(resultat.net_a_payer)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
