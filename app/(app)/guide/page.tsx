"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  GUIDE_HTML_CONTENT,
  RUBRIQUES_DATA,
  FAQ_DATA,
  DICO_DATA,
  RubriqueItem,
} from "./guideData";
import {
  BookOpen,
  Scale,
  FileText,
  HelpCircle,
  Globe,
  ShieldAlert,
  Search,
  Copy,
  Check,
  Calculator,
  Users,
  AlertTriangle,
  Award,
  Briefcase,
  TrendingUp,
  Compass,
  Heart,
  Lock,
  Book,
  Folder,
  ChevronDown
} from "lucide-react";

const IconMap: Record<string, React.ComponentType<any>> = {
  Calculator,
  FileText,
  Scale,
  Users,
  ShieldAlert,
  AlertTriangle,
  Award,
  Briefcase,
  TrendingUp,
  Compass,
  Heart,
  Lock,
  Globe,
  BookOpen,
  Book,
  Folder,
  HelpCircle,
};

function RenderIcon({ name, size = 16, className }: { name: string; size?: number; className?: string }) {
  const IconComponent = IconMap[name];
  if (!IconComponent) return null;
  return <IconComponent size={size} className={className} />;
}

const CATEGORIES = [
  {
    title: "1. Thématiques Légales",
    items: [
      { id: "theme1", label: "Paie & Fiscalité", icon: "Calculator" },
      { id: "theme2", label: "Administration RH", icon: "FileText" },
      { id: "theme3", label: "Droit du travail", icon: "Scale" },
      { id: "theme4", label: "Droit syndical", icon: "Users" },
      { id: "theme5", label: "Santé & Sécurité", icon: "ShieldAlert" },
      { id: "theme6", label: "Conflits & Discipline", icon: "AlertTriangle" },
      { id: "theme7", label: "Formation & Talent", icon: "Award" },
      { id: "theme8", label: "GPEC & Recrutement", icon: "Briefcase" },
      { id: "theme9", label: "Pilotage RH", icon: "TrendingUp" },
      { id: "theme10", label: "Stratégie & Climat", icon: "Compass" },
      { id: "theme11", label: "Retraite & Prévoyance", icon: "Heart" },
      { id: "theme12", label: "Protection Données", icon: "Lock" },
      { id: "theme13", label: "Travailleurs Étrangers", icon: "Globe" },
    ],
  },
  {
    title: "2. Outils & Lexique",
    items: [
      { id: "suppl", label: "Référentiels de paie", icon: "BookOpen" },
      { id: "dico", label: "Dictionnaire RH", icon: "Book" },
      { id: "modeles", label: "Modèles & Documents", icon: "Folder" },
      { id: "faq", label: "FAQ RH", icon: "HelpCircle" },
    ],
  },
];

export default function GuidePage() {
  const [activeTab, setActiveTab] = useState("theme1");
  const tabContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  // Sub-tabs state
  const [supplSubTab, setSupplSubTab] = useState("rubriques");
  const [modelesSubTab, setModelesSubTab] = useState("contrats");

  // Search/Filters states
  const [rubriqueSearch, setRubriqueSearch] = useState("");
  
  const [dicoSearch, setDicoSearch] = useState("");
  const [dicoCat, setDicoCat] = useState("tous");
  const [dicoLetter, setDicoLetter] = useState("");

  const [faqSearch, setFaqSearch] = useState("");
  const [faqCat, setFaqCat] = useState("tous");
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Main Tabs definitions
  const TABS = [
    { id: "theme1", label: "1. Paie & Fiscalité" },
    { id: "theme2", label: "2. Administration" },
    { id: "theme3", label: "3. Droit du travail" },
    { id: "theme4", label: "4. Droit syndical" },
    { id: "theme5", label: "5. Santé & Sécurité" },
    { id: "theme6", label: "6. Conflits & Discipline" },
    { id: "theme7", label: "7. Formation" },
    { id: "theme8", label: "8. GPEC & Recrutement" },
    { id: "theme9", label: "9. Pilotage RH" },
    { id: "theme10", label: "10. Stratégie & Climat" },
    { id: "theme11", label: "11. Retraite & Prévoyance" },
    { id: "suppl", label: "+ Référentiels" },
    {id: "dico", label: "Dictionnaire RH" },
    {id: "modeles", label: "Modèles & Documents" },
    {id: "theme12", label: "Protection données RH" },
    {id: "theme13", label: "Travail des étrangers" },
    {id: "faq", label: "FAQ RH" },
  ];

  // Handle Tab bar scroll arrow visibility
  const updateTabArrows = () => {
    const bar = tabContainerRef.current;
    if (!bar) return;
    setShowLeftArrow(bar.scrollLeft > 4);
    setShowRightArrow(bar.scrollLeft + bar.clientWidth < bar.scrollWidth - 4);
  };

  useEffect(() => {
    const bar = tabContainerRef.current;
    if (bar) {
      updateTabArrows();
      bar.addEventListener("scroll", updateTabArrows);
      window.addEventListener("resize", updateTabArrows);
    }
    return () => {
      if (bar) {
        bar.removeEventListener("scroll", updateTabArrows);
      }
      window.removeEventListener("resize", updateTabArrows);
    };
  }, []);

  const scrollTabs = (direction: number) => {
    const bar = tabContainerRef.current;
    if (!bar) return;
    bar.scrollBy({ left: direction * 220, behavior: "smooth" });
    setTimeout(updateTabArrows, 320);
  };

  // Bind global helper functions to window for html templates copy buttons
  useEffect(() => {
    (window as any).copyChecklist = () => {
      const el = document.getElementById("checklist-retraite");
      if (!el) return;
      const text = "✅ CHECKLIST — DOCUMENTS DÉPART EN RETRAITE\n\n" + el.innerText.replace(/☐/g, "☐").trim();
      navigator.clipboard.writeText(text).then(() => {
        alert("Checklist copiée dans le presse-papiers !");
      });
    };

    (window as any).copyChecklistData = () => {
      const el = document.getElementById("checklist-data");
      if (!el) return;
      const items = el.querySelectorAll("div");
      let text = "🔒 CHECKLIST CONFORMITÉ PROTECTION DES DONNÉES RH — LOI 18-07\n\n";
      items.forEach((item) => {
        text += (item as HTMLElement).innerText.trim() + "\n";
      });
      navigator.clipboard.writeText(text).then(() => {
        alert("Checklist conformité copiée !");
      });
    };

    (window as any).copyChecklistEtranger = () => {
      const el = document.getElementById("checklist-etranger");
      if (!el) return;
      const items = el.querySelectorAll("div");
      let text = "🌍 CHECKLIST — EMBAUCHE TRAVAILLEUR ÉTRANGER EN ALGÉRIE\n\n";
      items.forEach((item) => {
        const t = (item as HTMLElement).innerText.trim();
        if (t) text += t + "\n";
      });
      navigator.clipboard.writeText(text).then(() => {
        alert("Checklist travailleur étranger copiée !");
      });
    };

    return () => {
      delete (window as any).copyChecklist;
      delete (window as any).copyChecklistData;
      delete (window as any).copyChecklistEtranger;
    };
  }, [activeTab]);

  // Split Theme 1 into static intro and interactive calc
  const theme1IntroHtml = useMemo(() => {
    const parts = (GUIDE_HTML_CONTENT["theme1"] || "").split(
      '<div class="panel" style="margin-top:16px">'
    );
    return parts[0] || "";
  }, []);

  // Theme 1 Calculator State & Computation
  const [sb, setSb] = useState(100000);
  const [iepPct, setIepPct] = useState(0);
  const [nuisPct, setNuisPct] = useState(0);
  const [respPct, setRespPct] = useState(0);
  const [autresPct, setAutresPct] = useState(0);
  const [icr, setIcr] = useState(0);
  const [panier, setPanier] = useState(0);
  const [mutuelle, setMutuelle] = useState(0);

  const calcResults = useMemo(() => {
    const primesPct = sb * ((iepPct + nuisPct + respPct + autresPct) / 100);
    const totalGains = sb + icr + primesPct + panier;

    // CNAS : panier exclu de l'assiette
    const baseCnas = totalGains - panier;
    const cnasSal = baseCnas * 0.09;

    // IRG : panier inclus dans la base imposable
    const baseIrg = totalGains - cnasSal;

    const exo = baseIrg <= 30000;
    const zoneAb2 = baseIrg > 30000 && baseIrg <= 42500;

    const tr = [
      { l: 20000, t: 0 },
      { l: 40000, t: 0.23 },
      { l: 80000, t: 0.27 },
      { l: 160000, t: 0.30 },
      { l: 320000, t: 0.33 },
      { l: Infinity, t: 0.35 },
    ];
    const lb = [
      "N'excède pas 20 000",
      "20 001 → 40 000",
      "40 001 → 80 000",
      "80 001 → 160 000",
      "160 001 → 320 000",
      "Supérieure à 320 000",
    ];

    let irgB = 0;
    let prev = 0;
    const tranches: { label: string; value: number; active: boolean }[] = [];

    for (let i = 0; i < tr.length; i++) {
      const dans = Math.min(baseIrg, tr[i].l) - prev;
      if (dans <= 0) {
        tranches.push({
          label: `${lb[i]} DA · ${(tr[i].t * 100).toFixed(0)}%`,
          value: 0,
          active: false,
        });
        continue;
      }
      const p = dans * tr[i].t;
      irgB += p;
      const isA = baseIrg > prev && baseIrg <= tr[i].l;
      tranches.push({
        label: `${lb[i]} DA · ${(tr[i].t * 100).toFixed(0)}%`,
        value: p,
        active: isA,
      });
      prev = tr[i].l;
      if (prev >= baseIrg) break;
    }

    const abat40 = irgB * 0.4;
    let abat = abat40;
    let abatNote = "";
    if (abat40 < 1000) {
      abat = 1000;
      abatNote = "plancher 1 000 DA";
    } else if (abat40 > 1500) {
      abat = 1500;
      abatNote = "plafond 1 500 DA";
    } else {
      abatNote = "40 % × IRG brut";
    }

    const irgNet1 = Math.max(0, irgB - abat);
    const irgNet = exo
      ? 0
      : zoneAb2
      ? Math.max(0, irgNet1 * (93 / 61) - 81213 / 41)
      : irgNet1;

    const net = totalGains - cnasSal - irgNet - mutuelle;
    const cnasPat = baseCnas * 0.26;
    const cout = totalGains + cnasPat;

    return {
      totalGains,
      baseCnas,
      cnasSal,
      baseIrg,
      irgB,
      irgNet,
      net,
      cout,
      cnasPat,
      primesPct,
      tranches,
      exo,
      zoneAb2,
      abat40,
      abatNote,
      irgNet1,
    };
  }, [sb, iepPct, nuisPct, respPct, autresPct, icr, panier, mutuelle]);

  const fmtDA = (n: number) => {
    return Math.round(n).toLocaleString("fr-DZ") + " DA";
  };

  // Rubriques Filter logic
  const filteredRubriques = useMemo(() => {
    const q = rubriqueSearch.trim().toLowerCase();
    if (!q) return RUBRIQUES_DATA;
    return RUBRIQUES_DATA.filter((item) => {
      if (item.g) return true; // keep groups for structure
      const haystack = (
        (item.r || "") +
        " " +
        (item.cat || "") +
        " " +
        (item.base || "") +
        " " +
        (item.rem || "")
      ).toLowerCase();
      return haystack.includes(q);
    });
  }, [rubriqueSearch]);

  const rubriquesToShow = useMemo(() => {
    // Hide group headers if there are no items under them
    const result: RubriqueItem[] = [];
    for (let i = 0; i < filteredRubriques.length; i++) {
      const current = filteredRubriques[i];
      if (current.g) {
        const next = filteredRubriques[i + 1];
        if (next && !next.g) {
          result.push(current);
        }
      } else {
        result.push(current);
      }
    }
    return result;
  }, [filteredRubriques]);

  // Dictionary filter logic
  const filteredDico = useMemo(() => {
    const q = dicoSearch.trim().toLowerCase();
    return DICO_DATA.filter((item) => {
      const matchSearch =
        !q ||
        (item.term + " " + item.def + " " + item.theme + " " + item.ref)
          .toLowerCase()
          .includes(q);
      const matchCat = dicoCat === "tous" || item.cat === dicoCat;
      const matchLetter =
        !dicoLetter ||
        item.term.trim().charAt(0).toUpperCase() === dicoLetter;
      return matchSearch && matchCat && matchLetter;
    });
  }, [dicoSearch, dicoCat, dicoLetter]);

  const alphabet = Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ");

  // FAQ Filter logic
  const filteredFaq = useMemo(() => {
    const q = faqSearch.trim().toLowerCase();
    return FAQ_DATA.filter((item) => {
      const matchSearch =
        !q || (item.q + " " + item.a + " " + item.ref).toLowerCase().includes(q);
      const matchCat = faqCat === "tous" || item.cat === faqCat;
      return matchSearch && matchCat;
    });
  }, [faqSearch, faqCat]);

  // Copy models
  const copyModel = (id: string, name: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const text = el.innerText.trim();
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className="rh-guide-root">
      <div className="page-header">
        <h1>Guide RH &amp; Réglementaire</h1>
        <p>Référentiel complet des Ressources Humaines et de la paie en Algérie</p>
      </div>

      <div className="stats">
        <div className="stat">
          <strong>13</strong>
          <small>Thèmes Légaux</small>
        </div>
        <div className="stat">
          <strong>47</strong>
          <small>Rubriques de Paie</small>
        </div>
        <div className="stat">
          <strong>48</strong>
          <small>Termes au Lexique</small>
        </div>
        <div className="stat">
          <strong>24</strong>
          <small>Questions FAQ</small>
        </div>
      </div>

      {/* Redesigned layout container: Sidebar on desktop, Select on mobile */}
      <div className="rh-guide-container">
        {/* Sidebar for Desktop */}
        <aside className="rh-sidebar">
          {CATEGORIES.map((cat, idx) => (
            <div key={idx} className="rh-sidebar-group">
              <h3 className="rh-sidebar-group-title">{cat.title}</h3>
              <div className="rh-sidebar-group-items">
                {cat.items.map((item) => (
                  <button
                    key={item.id}
                    className={`rh-sidebar-item ${activeTab === item.id ? "active" : ""}`}
                    onClick={() => {
                      setActiveTab(item.id);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    <RenderIcon name={item.icon} size={15} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </aside>

        {/* Mobile Dropdown Navigator */}
        <div className="rh-mobile-nav">
          <label htmlFor="rh-mobile-select">Thématique active :</label>
          <div className="rh-mobile-select-wrapper">
            <select
              id="rh-mobile-select"
              value={activeTab}
              onChange={(e) => {
                setActiveTab(e.target.value);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              {CATEGORIES.map((cat) => (
                <optgroup key={cat.title} label={cat.title}>
                  {cat.items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <ChevronDown size={16} className="select-arrow" />
          </div>
        </div>

        <div className="rh-main-content">
        {/* THEME 1 — PAIE & FISCALITE SPECIAL REACT RENDER FOR THE CALCULATOR */}
        {activeTab === "theme1" && (
          <div>
            <div dangerouslySetInnerHTML={{ __html: theme1IntroHtml }} />

            {/* React replacement of the calculator panel */}
            <div className="panel" style={{ marginTop: 16 }}>
              <div className="panel-kicker">Outil interactif</div>
              <div className="panel-title">Simulateur de paie — du brut au net</div>
              <p className="panel-text">
                Saisissez la composition du salaire pour voir la cascade CNAS &rarr; IRG &rarr; Net se recalculer en temps réel. Le panier est non cotisable CNAS mais imposable IRG (CIDTA Art. 68).
              </p>

              <div className="calc-grid">
                <div className="calc-input-area">
                  <h3>Données d'entrée</h3>

                  <div className="calc-group">
                    <div className="calc-group-title">Salaire de base</div>
                    <div className="sim-slider-row">
                      <label htmlFor="g-brut">Salaire de base théorique</label>
                      <input
                        type="range"
                        id="g-brut"
                        min="24000"
                        max="300000"
                        step="1000"
                        value={sb}
                        onChange={(e) => setSb(Number(e.target.value))}
                      />
                      <span className="sim-slider-val">{fmtDA(sb)}</span>
                    </div>
                  </div>

                  <div className="calc-group calc-group-primes">
                    <div className="calc-group-title">Primes en % du de base</div>
                    <div className="sim-num-row">
                      <label>I.E.P (ancienneté) %</label>
                      <input
                        type="number"
                        min="0"
                        max="30"
                        step="0.5"
                        value={iepPct}
                        onChange={(e) => setIepPct(Number(e.target.value))}
                      />
                      <span className="sim-badge sim-badge-blue">Cotisable &amp; Imposable</span>
                    </div>
                    <div className="sim-num-row">
                      <label>Indemnité de nuisance %</label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        step="0.5"
                        value={nuisPct}
                        onChange={(e) => setNuisPct(Number(e.target.value))}
                      />
                      <span className="sim-badge sim-badge-blue">Cotisable &amp; Imposable</span>
                    </div>
                    <div className="sim-num-row">
                      <label>Prime de responsabilité %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={respPct}
                        onChange={(e) => setRespPct(Number(e.target.value))}
                      />
                      <span className="sim-badge sim-badge-blue">Cotisable &amp; Imposable</span>
                    </div>
                    <div className="sim-num-row">
                      <label>Autres primes % (PRI, PRC…)</label>
                      <input
                        type="number"
                        min="0"
                        max="200"
                        step="0.5"
                        value={autresPct}
                        onChange={(e) => setAutresPct(Number(e.target.value))}
                      />
                      <span className="sim-badge sim-badge-blue">Cotisable &amp; Imposable</span>
                    </div>
                  </div>

                  <div className="calc-group">
                    <div className="calc-group-title">Indemnités fixes</div>
                    <div className="sim-num-row">
                      <label>I.C.R &amp; primes fixes (DA)</label>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={icr}
                        onChange={(e) => setIcr(Number(e.target.value))}
                      />
                      <span className="sim-badge sim-badge-blue">Cotisable &amp; Imposable</span>
                    </div>
                    <div className="sim-slider-row">
                      <label htmlFor="g-panier">Panier mensuel</label>
                      <input
                        type="range"
                        id="g-panier"
                        min="0"
                        max="30000"
                        step="500"
                        value={panier}
                        onChange={(e) => setPanier(Number(e.target.value))}
                      />
                      <span className="sim-slider-val">{fmtDA(panier)}</span>
                    </div>
                    <div className="calc-subnote">
                      ⚠️ Le panier est <strong>non cotisable CNAS</strong> (Ord. n°95-01 Art. 1) mais reste <strong>imposable à l'IRG</strong> (non répertorié Art. 68 CIDTA).
                    </div>
                  </div>

                  <div className="calc-group calc-group-abs">
                    <div className="calc-group-title">Retenues</div>
                    <div className="sim-num-row">
                      <label>Cotisation mutuelle (DA)</label>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={mutuelle}
                        onChange={(e) => setMutuelle(Number(e.target.value))}
                      />
                    </div>
                  </div>
                </div>

                <div className="calc-result-area">
                  <h3>Résultats de la simulation</h3>

                  <div className="sim-cascade">
                    <div className="sim-step">
                      <div className="sim-bar sim-bar-green"></div>
                      <div className="sim-sc">
                        <p className="sim-lbl">① Total gains bruts</p>
                        <p className="sim-val">{fmtDA(calcResults.totalGains)}</p>
                        <p className="sim-detail">
                          Base {fmtDA(sb)}
                          {icr > 0 && ` + ICR ${fmtDA(icr)}`}
                          {calcResults.primesPct > 0 && ` + Primes ${fmtDA(calcResults.primesPct)}`}
                          {panier > 0 && ` + Panier ${fmtDA(panier)}`}
                        </p>
                      </div>
                    </div>

                    <div className="sim-step">
                      <div className="sim-bar sim-bar-amber"></div>
                      <div className="sim-sc">
                        <p className="sim-lbl">② CNAS salariale 9 %</p>
                        <p className="sim-val sim-val-amber">− {fmtDA(calcResults.cnasSal)}</p>
                        <p className="sim-detail">
                          Assiette {fmtDA(calcResults.baseCnas)} × 9%
                          {panier > 0 && " (panier exclu)"}
                        </p>
                      </div>
                    </div>

                    <div className="sim-step">
                      <div className="sim-bar sim-bar-blue"></div>
                      <div className="sim-sc">
                        <p className="sim-lbl">
                          ③ Base imposable IRG
                          {calcResults.exo && (
                            <span className="badge-exo">✓ exonéré</span>
                          )}
                          {calcResults.zoneAb2 && (
                            <span className="badge-exo" style={{ backgroundColor: "#fef3c7", color: "#92400e" }}>
                              2e abattement
                            </span>
                          )}
                        </p>
                        <p className="sim-val">{fmtDA(calcResults.baseIrg)}</p>
                        <p className="sim-detail">
                          Gains {fmtDA(calcResults.totalGains)} − CNAS {fmtDA(calcResults.cnasSal)}
                          {panier > 0 && " (panier réintégré)"}
                        </p>

                        {calcResults.exo ? (
                          <div className="sim-exo">
                            Base &le; 30 000 DA &rarr; exonération totale d'IRG (Art. 104 CIDTA).
                          </div>
                        ) : (
                          <>
                            <table className="sim-tranches">
                              <tbody>
                                {calcResults.tranches.map((t, idx) => (
                                  <tr key={idx} className={t.active ? "s-active" : t.value === 0 ? "s-zero" : ""}>
                                    <td>{t.label}</td>
                                    <td>{t.value > 0 ? `+ ${fmtDA(t.value)}` : "—"}</td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr>
                                  <td>IRG brut cumulé</td>
                                  <td>{fmtDA(calcResults.irgB)}</td>
                                </tr>
                              </tfoot>
                            </table>

                            <div className="sim-abat">
                              <div className="r">
                                <span>Abattement 40 % × {fmtDA(calcResults.irgB)}</span>
                                <span>{fmtDA(calcResults.irgB * 0.4)}</span>
                              </div>
                              <div className="r" style={{ color: "var(--text-muted)", fontSize: "10.5px" }}>
                                <span>Plancher 1 000 / Plafond 1 500 DA</span>
                                <span>&rarr; {calcResults.abatNote}</span>
                              </div>
                              <div className="r total">
                                <span>IRG après 1er abattement</span>
                                <span>{fmtDA(calcResults.irgNet1)}</span>
                              </div>
                            </div>

                            {calcResults.zoneAb2 && (
                              <div className="sim-exo" style={{ backgroundColor: "rgba(254, 243, 199, 0.2)", borderColor: "#f59e0b", color: "#fcd494" }}>
                                2e abattement dégressif (30 001–42 500 DA) &rarr; IRG net = {fmtDA(calcResults.irgNet)}
                              </div>
                            )}

                            <p className="sim-lbl" style={{ marginTop: 8 }}>IRG net retenu</p>
                            <p className="sim-val sim-val-red">− {fmtDA(calcResults.irgNet)}</p>
                          </>
                        )}
                      </div>
                    </div>

                    {mutuelle > 0 && (
                      <div className="sim-step">
                        <div className="sim-bar sim-bar-gray"></div>
                        <div className="sim-sc">
                          <p className="sim-lbl">Cotisation mutuelle</p>
                          <p className="sim-val sim-val-amber">− {fmtDA(mutuelle)}</p>
                        </div>
                      </div>
                    )}

                    <div className="sim-net">
                      <p className="nl">④ Net à payer</p>
                      <p className="nv">{fmtDA(calcResults.net)}</p>
                      <p className="nd">
                        Brut {fmtDA(calcResults.totalGains)} − CNAS {fmtDA(calcResults.cnasSal)} − IRG {fmtDA(calcResults.irgNet)}
                        {mutuelle > 0 && ` − mutuelle ${fmtDA(mutuelle)}`}
                      </p>
                    </div>

                    <div className="sim-cout" style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
                      <span className="sim-cout-lbl">Coût total employeur (salaire + CNAS patronale 26%)</span>
                      <span className="sim-cout-val">{fmtDA(calcResults.cout)}</span>
                    </div>

                    <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", marginTop: 10, lineHeight: 1.4 }}>
                      CNAS patronale (26%) : CNR 7,50%, Assurances sociales 13,00%, Accidents travail 1,25%, Chômage (CNAC) 1,00%, Retraite anticipée 0,25%, Œuvres sociales 0.50%, Formation 1.00%, FCCL 1.25%, Maladie 0.25%. Réf: Décret n°06-373.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REFERENTIELS (+ Référentiels) */}
        {activeTab === "suppl" && (
          <div>
            <div dangerouslySetInnerHTML={{ __html: GUIDE_HTML_CONTENT["suppl"].split('<!-- Sous-onglets -->')[0] }} />

            {/* Sub-tabs selector for Référentiels */}
            <div className="rh-tab-bar" style={{ marginBottom: 14 }}>
              <button
                className={`rh-tab ${supplSubTab === "rubriques" ? "active" : ""}`}
                onClick={() => setSupplSubTab("rubriques")}
              >
                Rubriques de paie (47)
              </button>
              <button
                className={`rh-tab ${supplSubTab === "taux" ? "active" : ""}`}
                onClick={() => setSupplSubTab("taux")}
              >
                Taux &amp; Barème IRG
              </button>
              <button
                className={`rh-tab ${supplSubTab === "sources" ? "active" : ""}`}
                onClick={() => setSupplSubTab("sources")}
              >
                Sources juridiques
              </button>
            </div>

            {/* Content for sub-tab: Rubriques */}
            {supplSubTab === "rubriques" && (
              <div>
                <div className="legend">
                  <div className="leg">
                    <div className="leg-dot" style={{ backgroundColor: "#86efac" }}></div>
                    Cotisable + Imposable
                  </div>
                  <div className="leg">
                    <div className="leg-dot leg-dot-none"></div>
                    Ni cotisable ni imposable
                  </div>
                  <div className="leg">
                    <div className="leg-dot leg-dot-imp"></div>
                    Non cotisable / Imposable
                  </div>
                  <div className="leg">
                    <div className="leg-dot leg-dot-cot"></div>
                    Cotisable / Non imposable
                  </div>
                </div>

                <div className="toolbar">
                  <div className="search-wrap">
                    <Search size={16} className="search-icon" />
                    <input
                      type="text"
                      placeholder="Rechercher une rubrique, une loi…"
                      value={rubriqueSearch}
                      onChange={(e) => setRubriqueSearch(e.target.value)}
                    />
                  </div>
                  <span className="count-rhBadge">
                    {rubriquesToShow.filter((r) => !r.g).length} rubriques affichées
                  </span>
                </div>

                <div className="tbl-wrap">
                  <table className="main">
                    <thead>
                      <tr>
                        <th style={{ width: 42 }}>N°</th>
                        <th>Rubrique / Élément de salaire</th>
                        <th>Cotisable CNAS</th>
                        <th>Imposable IRG</th>
                        <th>Base légale</th>
                        <th>Remarques</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rubriquesToShow.map((item, idx) => {
                        if (item.g) {
                          return (
                            <tr key={`group-${idx}`} className="grp-row">
                              <td colSpan={6}>{item.g}</td>
                            </tr>
                          );
                        }
                        const isCot = item.cot === true;
                        const isImp = item.imp === true;
                        const rowClass =
                          isCot && isImp
                            ? "row-cc"
                            : !isCot && !isImp
                            ? "row-nn"
                            : !isCot && isImp
                            ? "row-nc"
                            : "row-cn";

                        return (
                          <tr key={`rubrique-${item.n}`} className={rowClass}>
                            <td className="num-cell">{item.n}</td>
                            <td>
                              <div className="rub">{item.r}</div>
                              <div className="cat">{item.cat}</div>
                            </td>
                            <td>
                              <span className={`rhBadge ${isCot ? "b-oui" : "b-non"}`}>
                                {isCot ? "Oui" : "Non"}
                              </span>
                            </td>
                            <td>
                              <span className={`rhBadge ${isImp ? "b-oui" : "b-non"}`}>
                                {isImp ? "Oui" : "Non"}
                              </span>
                            </td>
                            <td className="ref-cell">{item.base}</td>
                            <td className="rem-cell">{item.rem}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {rubriquesToShow.filter((r) => !r.g).length === 0 && (
                    <div className="no-results">Aucune rubrique trouvée.</div>
                  )}
                </div>
              </div>
            )}

            {/* Content for sub-tab: Taux */}
            {supplSubTab === "taux" && (
              <div dangerouslySetInnerHTML={{ __html: GUIDE_HTML_CONTENT["suppl-sub-taux"] || GUIDE_HTML_CONTENT["suppl"].substring(GUIDE_HTML_CONTENT["suppl"].indexOf('<div id="tab-sub-taux"')) }} />
            )}

            {/* Content for sub-tab: Sources */}
            {supplSubTab === "sources" && (
              <div dangerouslySetInnerHTML={{ __html: GUIDE_HTML_CONTENT["suppl-sub-sources"] || GUIDE_HTML_CONTENT["suppl"].substring(GUIDE_HTML_CONTENT["suppl"].indexOf('<div id="tab-sub-sources"')) }} />
            )}
          </div>
        )}

        {/* DICTIONNAIRE DICO */}
        {activeTab === "dico" && (
          <div>
            <div className="panel">
              <div className="panel-kicker">Outil transverse</div>
              <div className="panel-title">📖 Dictionnaire RH — Termes &amp; Acronymes</div>
              <p className="panel-text">
                Retrouvez ici les définitions des termes RH internationaux couramment utilisés et des acronymes/sigles juridiques algériens. Chaque entrée précise la définition, le thème du guide concerné et la référence légale lorsqu'elle existe.
              </p>
            </div>

            <div className="toolbar" style={{ flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
              <div className="search-wrap" style={{ flex: 1, minWidth: 220 }}>
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Rechercher un terme, un acronyme, une loi…"
                  value={dicoSearch}
                  onChange={(e) => setDicoSearch(e.target.value)}
                />
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  className={`rh-tab ${dicoCat === "tous" ? "active" : ""}`}
                  onClick={() => setDicoCat("tous")}
                  style={{ fontSize: 12, padding: "6px 14px" }}
                >
                  Tous
                </button>
                <button
                  className={`rh-tab ${dicoCat === "international" ? "active" : ""}`}
                  onClick={() => setDicoCat("international")}
                  style={{ fontSize: 12, padding: "6px 14px" }}
                >
                  🌐 Termes RH
                </button>
                <button
                  className={`rh-tab ${dicoCat === "algerie" ? "active" : ""}`}
                  onClick={() => setDicoCat("algerie")}
                  style={{ fontSize: 12, padding: "6px 14px" }}
                >
                  🇩🇿 Acronymes DZ
                </button>
              </div>
              <span className="count-rhBadge" style={{ alignSelf: "center" }}>
                {filteredDico.length} termes affichés
              </span>
            </div>

            {/* Alphabetical filter */}
            <div id="dico-alpha" style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 14 }}>
              <button
                className={`rh-tab ${dicoLetter === "" ? "active" : ""}`}
                onClick={() => setDicoLetter("")}
                style={{ fontSize: 11, padding: "4px 10px" }}
              >
                Tout
              </button>
              {alphabet.map((letter) => {
                const count = DICO_DATA.filter((i) => i.term.trim().charAt(0).toUpperCase() === letter).length;
                if (count === 0) return null;
                return (
                  <button
                    key={letter}
                    className={`rh-tab ${dicoLetter === letter ? "active" : ""}`}
                    onClick={() => setDicoLetter(letter)}
                    style={{ fontSize: 11, padding: "4px 10px" }}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>

            <div
              id="dico-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))",
                gap: 14,
                marginTop: 4,
              }}
            >
              {filteredDico.map((item, idx) => (
                <div key={idx} className="rh-card card-teal">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                    <strong style={{ fontSize: 15, color: "var(--teal-700)" }}>{item.term}</strong>
                    <span style={{ fontSize: 10, textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700 }}>
                      {item.cat === "algerie" ? "🇩🇿 Sigle DZ" : "🌐 Concept"}
                    </span>
                  </div>
                  <p style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.6 }}>{item.def}</p>
                  <div style={{ borderTop: "1px solid var(--border-soft)", marginTop: 8, paddingTop: 6, display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                    <span style={{ color: "var(--text-muted)" }}>{item.theme}</span>
                    {item.ref && <span style={{ fontFamily: "var(--mono)", color: "var(--teal-700)", fontWeight: 600 }}>{item.ref}</span>}
                  </div>
                </div>
              ))}
            </div>

            {filteredDico.length === 0 && (
              <div className="no-results" style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}>
                Aucun terme trouvé. Essayez une autre recherche.
              </div>
            )}
          </div>
        )}

        {/* MODELES DE DOCUMENTS (modeles) */}
        {activeTab === "modeles" && (
          <div>
            <div className="panel">
              <div className="panel-kicker">Modèles administratifs</div>
              <div className="panel-title">📄 Modèles &amp; Documents Prêts à l'Emploi</div>
              <p className="panel-text">
                Retrouvez ici des modèles de documents juridiques, de contrats, de courriers disciplinaires et d'attestations rédigés conformément à la Loi n°90-11 et aux usages administratifs algériens. Vous pouvez copier chaque modèle en un clic pour l'adapter à votre entreprise.
              </p>
            </div>

            {/* Sub-tabs for models */}
            <div className="rh-tab-bar" style={{ marginBottom: 14 }}>
              <button
                className={`rh-tab ${modelesSubTab === "contrats" ? "active" : ""}`}
                onClick={() => setModelesSubTab("contrats")}
              >
                📑 Contrats
              </button>
              <button
                className={`rh-tab ${modelesSubTab === "discipline" ? "active" : ""}`}
                onClick={() => setModelesSubTab("discipline")}
              >
                ⚖️ Discipline &amp; Rupture
              </button>
              <button
                className={`rh-tab ${modelesSubTab === "attestations" ? "active" : ""}`}
                onClick={() => setModelesSubTab("attestations")}
              >
                📋 Attestations
              </button>
              <button
                className={`rh-tab ${modelesSubTab === "evaluation" ? "active" : ""}`}
                onClick={() => setModelesSubTab("evaluation")}
              >
                🎯 Évaluation &amp; RI
              </button>
            </div>

            {/* Render model chosen */}
            {modelesSubTab === "contrats" && (
              <div className="grid-2">
                <div className="rh-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <strong>Contrat de Travail à Durée Indéterminée (CDI)</strong>
                    <button className="mod-copy-btn btn btn-sm btn-secondary" style={{ display: "flex", alignItems: "center", gap: "6px" }} onClick={() => copyModel("mod-cdi", "CDI")}>
                      {copiedId === "mod-cdi" ? <Check size={14} style={{ color: "var(--teal-600)" }} /> : <Copy size={14} />}
                      {copiedId === "mod-cdi" ? "Copié !" : "Copier"}
                    </button>
                  </div>
                  <pre id="mod-cdi" className="mod-pre" style={{ whiteSpace: "pre-wrap", maxHeight: 350, overflowY: "auto", fontSize: "11.5px", padding: 12, background: "var(--surface-2)", borderRadius: 6 }}>
{`CONTRAT DE TRAVAIL À DURÉE INDÉTERMINÉE (CDI)
Loi n°90-11 relative aux relations de travail

Entre les soussignés :
La Société : [Nom de l'entreprise]
Représentée par : [Nom et Fonction du signataire]
Ci-après désignée "l'Employeur", d'une part,

Et :
M./Mme : [Nom et Prénom du salarié]
Né(e) le : [Date] à [Lieu]
Demeurant à : [Adresse]
Nationalité : [Algérienne / Autre]
Ci-après désigné "le Salarié", d'autre part,

Il a été convenu et arrêté ce qui suit :

ARTICLE 1 — OBJET ET DATE D'EFFET
Le présent contrat est conclu sous le régime de la Loi n°90-11 du 21 avril 1990 relative aux relations de travail. Le Salarié est engagé à compter du [Date] en qualité de [Fiche de poste / Fonction], rattaché à la catégorie professionnelle [Catégorie] de la grille de l'entreprise.

ARTICLE 2 — PÉRIODE D'ESSAI
Le présent contrat est soumis à une période d'essai de [Durée - ex: 6 mois cadres / 3 mois maîtrise / 1 mois exécution], conformément à l'Art. 17 de la Loi n°90-11. Durant cette période, le contrat peut être rompu à tout moment par l'une ou l'autre des parties, sans indemnité ni préavis.

ARTICLE 3 — LIEU ET DURÉE DU TRAVAIL
Le lieu de travail habituel est fixé à [Adresse des bureaux/chantier]. La durée de travail est fixée conformément à la législation en vigueur, soit 40 heures hebdomadaires réparties sur 5 ou 6 jours de travail.

ARTICLE 4 — RÉMUNÉRATION
En contrepartie de ses fonctions, le Salarié percevra un salaire de base mensuel brut de [Montant] DA.
S'y ajouteront les indemnités et primes prévues par la politique de l'entreprise et la réglementation :
- Indemnité d'Expérience Professionnelle (IEP) : selon dispositions réglementaires,
- Prime de panier : [Montant] DA par jour travaillé,
- Indemnité de transport : [Montant] DA par mois travaillé,
- Toutes autres primes ou indemnités liées à l'activité ou au rendement.

ARTICLE 5 — CONGÉ ANNUEL
Le Salarié bénéficie d'un congé annuel payé calculé à raison de 2,5 jours par mois d'activité effective, soit 30 jours calendaires par année de travail complète.

ARTICLE 6 — OBLIGATION DE RÉSERVE ET CONFIDENTIALITÉ
Le Salarié s'engage à observer une discrétion absolue professionnelle sur tout ce qui concerne les affaires de l'entreprise, ses clients et ses procédés de fabrication ou d'administration.

Fait à [Ville], le [Date] en deux exemplaires originaux.

L'Employeur (signature & cachet)               Le Salarié (signature précédée de "Lu et approuvé")`}
                  </pre>
                </div>

                <div className="rh-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <strong>Contrat de Travail à Durée Déterminée (CDD)</strong>
                    <button className="mod-copy-btn btn btn-sm btn-secondary" style={{ display: "flex", alignItems: "center", gap: "6px" }} onClick={() => copyModel("mod-cdd", "CDD")}>
                      {copiedId === "mod-cdd" ? <Check size={14} style={{ color: "var(--teal-600)" }} /> : <Copy size={14} />}
                      {copiedId === "mod-cdd" ? "Copié !" : "Copier"}
                    </button>
                  </div>
                  <pre id="mod-cdd" className="mod-pre" style={{ whiteSpace: "pre-wrap", maxHeight: 350, overflowY: "auto", fontSize: "11.5px", padding: 12, background: "var(--surface-2)", borderRadius: 6 }}>
{`CONTRAT DE TRAVAIL À DURÉE DÉTERMINÉE (CDD)
Loi n°90-11 relative aux relations de travail

Entre les soussignés :
La Société : [Nom de l'entreprise]
Représentée par : [Nom et Fonction du signataire]
Ci-après désignée "l'Employeur", d'une part,

Et :
M./Mme : [Nom et Prénom du salarié]
Demeurant à : [Adresse]
Ci-après désigné "le Salarié", d'autre part,

Préambule justificatif (Art. 12 Loi n°90-11) :
Le présent contrat est conclu pour le motif suivant : [Préciser le motif : remplacement d'un salarié suspendu, surcroît de travail temporaire, travaux saisonniers, travaux de durée limitée].

Il a été convenu et arrêté ce qui suit :

ARTICLE 1 — OBJET ET DATE D'EFFET
Le présent contrat est conclu à durée déterminée sous le régime de la Loi n°90-11. Le Salarié est engagé à compter du [Date] en qualité de [Fonction], pour exécuter les tâches spécifiques détaillées dans la fiche de poste jointe.

ARTICLE 2 — DURÉE ET ÉCHÉANCE
Le présent contrat est conclu pour une durée déterminée de [Nombre] mois, allant du [Date de début] au [Date de fin]. À cette date de fin, le contrat prendra fin de plein droit sans autre formalité.

ARTICLE 3 — PÉRIODE D'ESSAI
Le contrat comporte une période d'essai de [Durée - max 1 mois pour CDD court].

ARTICLE 4 — RÉMUNÉRATION
Le Salarié percevra un salaire mensuel de base brut de [Montant] DA, plus les indemnités associées au poste.

Fait à [Ville], le [Date] en deux exemplaires.

L'Employeur                                     Le Salarié`}
                  </pre>
                </div>
              </div>
            )}

            {modelesSubTab === "discipline" && (
              <div className="grid-2">
                <div className="rh-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <strong>Lettre d'Avertissement Disciplinaire</strong>
                    <button className="mod-copy-btn btn btn-sm btn-secondary" style={{ display: "flex", alignItems: "center", gap: "6px" }} onClick={() => copyModel("mod-avert", "Avertissement")}>
                      {copiedId === "mod-avert" ? <Check size={14} style={{ color: "var(--teal-600)" }} /> : <Copy size={14} />}
                      {copiedId === "mod-avert" ? "Copié !" : "Copier"}
                    </button>
                  </div>
                  <pre id="mod-avert" className="mod-pre" style={{ whiteSpace: "pre-wrap", maxHeight: 350, overflowY: "auto", fontSize: "11.5px", padding: 12, background: "var(--surface-2)", borderRadius: 6 }}>
{`LETTRE D'AVERTISSEMENT DISCIPLINAIRE
(Recommandé avec AR ou remis en main propre contre décharge)

[En-tête de l'entreprise]

À : M./Mme [Nom du salarié]
[Adresse / Service]

Fait à [Ville], le [Date]

Objet : Avertissement disciplinaire

M.,

Nous sommes au regret de vous notifier par la présente un avertissement disciplinaire en raison des faits suivants constatés le [Date] :
[Décrire précisément les faits : absence injustifiée, retard répété documenté, insubordination aux directives, non-respect du règlement intérieur].

Ces agissements nuisent au bon fonctionnement du service et sont en contradiction avec vos obligations contractuelles et les dispositions de l'Article [Numéro] du Règlement Intérieur de notre entreprise.

Lors de notre entretien informel du [Date], vous avez invoqué comme explications : [Indiquer brièvement les arguments du salarié]. Ces explications n'ont malheureusement pas été jugées satisfaisantes pour excuser le manquement constaté.

Nous vous demandons instamment de redresser votre comportement professionnel afin qu'aucun incident similaire ne se reproduise à l'avenir. À défaut, nous nous verrions dans l'obligation de prendre des sanctions disciplinaires plus sévères à votre encontre, conformément aux dispositions légales et conventionnelles.

Veuillez agréer, M., l'expression de nos salutations distinguées.

Pour l'Entreprise,
[Nom et Signature]`}
                  </pre>
                </div>

                <div className="rh-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <strong>Convocation à Audition Disciplinaire</strong>
                    <button className="mod-copy-btn btn btn-sm btn-secondary" style={{ display: "flex", alignItems: "center", gap: "6px" }} onClick={() => copyModel("mod-map", "Mise à pied / Audition")}>
                      {copiedId === "mod-map" ? <Check size={14} style={{ color: "var(--teal-600)" }} /> : <Copy size={14} />}
                      {copiedId === "mod-map" ? "Copié !" : "Copier"}
                    </button>
                  </div>
                  <pre id="mod-map" className="mod-pre" style={{ whiteSpace: "pre-wrap", maxHeight: 350, overflowY: "auto", fontSize: "11.5px", padding: 12, background: "var(--surface-2)", borderRadius: 6 }}>
{`CONVOCATION À AUDITION DISCIPLINAIRE AVANT SANCTION
(Audition préalable obligatoire selon Loi n°90-11)

[En-tête de l'entreprise]

À : M./Mme [Nom du salarié]

Fait à [Ville], le [Date]

Objet : Convocation à une audition disciplinaire

M.,

Nous vous informons que nous envisageons de prendre une sanction disciplinaire à votre encontre à la suite des faits suivants qui vous sont reprochés :
[Décrire brièvement mais clairement les faits reprochés : fautes répétées, absence injustifiée prolongée, etc.].

Conformément aux dispositions de l'Article 73 bis de la Loi n°90-11 et aux procédures internes, vous êtes convoqué à un entretien d'audition préalable qui aura lieu le :
[Date] à [Heure] dans le bureau de [Lieu / RH].

Cet entretien a pour objet de recueillir vos explications concernant les manquements susmentionnés. Vous avez le droit de vous faire assister lors de cette audition par un représentant des salariés (délégué du personnel) ou un salarié de votre choix appartenant à notre entreprise.

[Optionnel - Faute grave] : Compte tenu de la gravité des faits reprochés, nous vous notifions également par la présente une mise à pied conservatoire immédiate dans l'attente de la décision définitive. Durant cette période, votre salaire est suspendu.

Veuillez accuser réception de la présente convocation par votre signature sur le double.

Pour l'Entreprise,
[Nom et Signature]

Accusé de réception par le salarié (signature + date) :`}
                  </pre>
                </div>
              </div>
            )}

            {modelesSubTab === "attestations" && (
              <div className="grid-2">
                <div className="rh-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <strong>Certificat de Travail (Sortie)</strong>
                    <button className="mod-copy-btn btn btn-sm btn-secondary" style={{ display: "flex", alignItems: "center", gap: "6px" }} onClick={() => copyModel("mod-cert", "Certificat")}>
                      {copiedId === "mod-cert" ? <Check size={14} style={{ color: "var(--teal-600)" }} /> : <Copy size={14} />}
                      {copiedId === "mod-cert" ? "Copié !" : "Copier"}
                    </button>
                  </div>
                  <pre id="mod-cert" className="mod-pre" style={{ whiteSpace: "pre-wrap", maxHeight: 350, overflowY: "auto", fontSize: "11.5px", padding: 12, background: "var(--surface-2)", borderRadius: 6 }}>
{`CERTIFICAT DE TRAVAIL
(Obligation de l'employeur à la rupture du contrat - Art. 63 Loi n°90-11)

[En-tête de l'entreprise]

Je soussigné, [Nom et Fonction du signataire], agissant au nom de la société [Nom de l'entreprise], certifie par la présente que :

M./Mme [Nom et Prénom du salarié]
Demeurant à : [Adresse du salarié]
N° de Sécurité Sociale (CNAS) : [Numéro]

a été employé au sein de notre entreprise du [Date d'embauche] au [Date de départ de l'effectif].

Durant cette période, M./Mme [Nom du salarié] a exercé successivement les fonctions suivantes :
- Du [Date] au [Date] : [Poste / Fonction 1]
- Du [Date] au [Date] : [Poste / Fonction 2 / Actuelle]

M./Mme [Nom du salarié] nous quitte ce jour libre de tout engagement envers notre entreprise, après avoir reçu l'intégralité des sommes qui lui étaient dues au titre de son salaire, ses indemnités de congé et son solde de tout compte.

En foi de quoi, le présent certificat est délivré pour servir et valoir ce que de droit.

Fait à [Ville], le [Date de départ]

Pour l'Entreprise,
[Nom et Signature & Cachet]`}
                  </pre>
                </div>

                <div className="rh-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <strong>Attestation de Travail (Salarié actif)</strong>
                    <button className="mod-copy-btn btn btn-sm btn-secondary" style={{ display: "flex", alignItems: "center", gap: "6px" }} onClick={() => copyModel("mod-att", "Attestation")}>
                      {copiedId === "mod-att" ? <Check size={14} style={{ color: "var(--teal-600)" }} /> : <Copy size={14} />}
                      {copiedId === "mod-att" ? "Copié !" : "Copier"}
                    </button>
                  </div>
                  <pre id="mod-att" className="mod-pre" style={{ whiteSpace: "pre-wrap", maxHeight: 350, overflowY: "auto", fontSize: "11.5px", padding: 12, background: "var(--surface-2)", borderRadius: 6 }}>
{`ATTESTATION DE TRAVAIL
(Salarié en activité)

[En-tête de l'entreprise]

Je soussigné, [Nom et Fonction du représentant], certifie par la présente que :

M./Mme [Nom et Prénom du salarié]
Demeurant à : [Adresse]
N° de Sécurité Sociale (CNAS) : [Numéro]

est employé au sein de notre entreprise [Nom de l'entreprise] depuis le [Date d'embauche] à ce jour, en qualité de [Poste actuel] sous le régime du Contrat de Travail à Durée Indéterminée (CDI).

La présente attestation est délivrée à l'intéressé(e) sur sa demande pour servir et valoir ce que de droit.

Fait à [Ville], le [Date du jour]

Pour l'Entreprise,
[Nom et Signature & Cachet]`}
                  </pre>
                </div>
              </div>
            )}

            {modelesSubTab === "evaluation" && (
              <div className="grid-2">
                <div className="rh-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <strong>Grille d'Évaluation de l'Entretien Annuel</strong>
                    <button className="mod-copy-btn btn btn-sm btn-secondary" style={{ display: "flex", alignItems: "center", gap: "6px" }} onClick={() => copyModel("mod-eval", "Évaluation")}>
                      {copiedId === "mod-eval" ? <Check size={14} style={{ color: "var(--teal-600)" }} /> : <Copy size={14} />}
                      {copiedId === "mod-eval" ? "Copié !" : "Copier"}
                    </button>
                  </div>
                  <pre id="mod-eval" className="mod-pre" style={{ whiteSpace: "pre-wrap", maxHeight: 350, overflowY: "auto", fontSize: "11.5px", padding: 12, background: "var(--surface-2)", borderRadius: 6 }}>
{`GRILLE D'ÉVALUATION DE L'ENTRETIEN ANNUEL DE PERFORMANCE

Salarié : [Nom & Prénom]                     Poste : [Fonction]
Manager : [Nom & Prénom]                     Service : [Département]
Période évaluée : Année [Année]             Date de l'entretien : [Date]

SECTION 1 — BILAN DE L'ANNÉE ÉCOULÉE (Objectifs vs Réalisations)
1. Objectif : [Objectif 1]
   Taux de réalisation : [ % ou Commentaires]
2. Objectif : [Objectif 2]
   Taux de réalisation : [ % ou Commentaires]

SECTION 2 — ÉVALUATION DES COMPÉTENCES PROFESSIONNELLES (Notes de 1 à 4)
[ 1: Insuffisant · 2: À développer · 3: Conforme aux attentes · 4: Dépasse les attentes ]
1. Compétences Techniques (Savoir-faire) : [Note]
   Commentaires : [Détails]
2. Autonomie & Initiative : [Note]
   Commentaires : [Détails]
3. Esprit d'équipe & Collaboration : [Note]
   Commentaires : [Détails]
4. Communication & Relationnel : [Note]
   Commentaires : [Détails]

SECTION 3 — OBJECTIFS POUR L'ANNÉE N+1 (Indicateurs SMART)
1. Objectif 1 : [Description de la cible quantitative ou qualitative]
2. Objectif 2 : [Description]

SECTION 4 — SOUHAITS D'ÉVOLUTION ET BESOINS EN FORMATION
- Souhaits de carrière du salarié : [Mouvements, promotions, mobilité]
- Formations identifiées comme nécessaires : [Thèmes de formation]

Signatures :
Salarié                                         Évaluateur`}
                  </pre>
                </div>

                <div className="rh-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <strong>Règlement Intérieur (Sommaire Type)</strong>
                    <button className="mod-copy-btn btn btn-sm btn-secondary" style={{ display: "flex", alignItems: "center", gap: "6px" }} onClick={() => copyModel("mod-ri", "Règlement intérieur")}>
                      {copiedId === "mod-ri" ? <Check size={14} style={{ color: "var(--teal-600)" }} /> : <Copy size={14} />}
                      {copiedId === "mod-ri" ? "Copié !" : "Copier"}
                    </button>
                  </div>
                  <pre id="mod-ri" className="mod-pre" style={{ whiteSpace: "pre-wrap", maxHeight: 350, overflowY: "auto", fontSize: "11.5px", padding: 12, background: "var(--surface-2)", borderRadius: 6 }}>
{`RÈGLEMENT INTÉRIEUR TYPE — SOMMAIRE ET DISPOSITIONS CLÉS
Loi n°90-11, Articles 75 à 79 (Obligatoire dès 20 salariés)

TITRE I — DISPOSITIONS GÉNÉRALES
- Article 1 : Objet du règlement intérieur (droit, discipline, hygiène et sécurité).
- Article 2 : Champ d'application (s'applique à tous les salariés, y compris temporaires).

TITRE II — ORGANISATION DU TRAVAIL ET DISCIPLINE
- Article 3 : Horaires de travail, durée hebdomadaire (40 h), repos hebdomadaire.
- Article 4 : Contrôle des accès, pointage, retards et absences (obligation de justificatif médical sous 48 h).
- Article 5 : Obligations professionnelles, devoir de réserve, secret des affaires, utilisation du matériel.

TITRE III — HYGIÈNE, SÉCURITÉ ET SANTÉ AU TRAVAIL (Loi n°88-07)
- Article 6 : Port obligatoire des Équipements de Protection Individuelle (EPI).
- Article 7 : Interdiction de fumer ou d'introduire des substances interdites.
- Article 8 : Rôle de la médecine du travail et des visites médicales d'embauche et périodiques.
- Article 9 : Procédure en cas d'accident du travail (déclaration sous 24 h).

TITRE IV — DISCIPLINE ET ÉCHELLE DES SANCTIONS
- Article 10 : Définition des fautes (Fautes de 1er, 2e et 3e degré - Art. 73 et s. Loi 90-11).
- Article 11 : Échelle des sanctions :
  * 1er degré : avertissement écrit, blâme.
  * 2e degré : mise à pied temporaire (1 à 8 jours) avec suspension de salaire.
  * 3e degré : licenciement pour faute grave sans indemnité.
- Article 12 : Procédure disciplinaire (convocation, entretien obligatoire, PV d'audition, notification).

TITRE V — DISPOSITIONS FINALES
- Article 13 : Entrée en vigueur après avis des représentants des salariés et enregistrement auprès de l'Inspection du Travail.`}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* FAQ SECTION */}
        {activeTab === "faq" && (
          <div>
            <div className="panel">
              <div className="panel-kicker">Outil transverse</div>
              <div className="panel-title">❓ FAQ RH — Questions &amp; réponses rapides</div>
              <p className="panel-text">
                Réponses courtes et directes aux questions les plus fréquentes posées par les managers, salariés et chefs d'entreprise. Chaque réponse renvoie au thème du guide pour approfondir. Ces réponses sont données à titre indicatif.
              </p>
            </div>

            <div className="toolbar" style={{ flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
              <div className="search-wrap" style={{ flex: 1, minWidth: 220 }}>
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Rechercher une question…"
                  value={faqSearch}
                  onChange={(e) => setFaqSearch(e.target.value)}
                />
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  className={`rh-tab ${faqCat === "tous" ? "active" : ""}`}
                  onClick={() => setFaqCat("tous")}
                  style={{ fontSize: 12, padding: "6px 14px" }}
                >
                  Toutes
                </button>
                <button
                  className={`rh-tab ${faqCat === "contrat" ? "active" : ""}`}
                  onClick={() => setFaqCat("contrat")}
                  style={{ fontSize: 12, padding: "6px 14px" }}
                >
                  📑 Contrat
                </button>
                <button
                  className={`rh-tab ${faqCat === "paie" ? "active" : ""}`}
                  onClick={() => setFaqCat("paie")}
                  style={{ fontSize: 12, padding: "6px 14px" }}
                >
                  💰 Paie
                </button>
                <button
                  className={`rh-tab ${faqCat === "conges" ? "active" : ""}`}
                  onClick={() => setFaqCat("conges")}
                  style={{ fontSize: 12, padding: "6px 14px" }}
                >
                  🏖️ Congés
                </button>
                <button
                  className={`rh-tab ${faqCat === "discipline" ? "active" : ""}`}
                  onClick={() => setFaqCat("discipline")}
                  style={{ fontSize: 12, padding: "6px 14px" }}
                >
                  ⚖️ Discipline
                </button>
                <button
                  className={`rh-tab ${faqCat === "sante" ? "active" : ""}`}
                  onClick={() => setFaqCat("sante")}
                  style={{ fontSize: 12, padding: "6px 14px" }}
                >
                  🏥 Santé
                </button>
                <button
                  className={`rh-tab ${faqCat === "retraite" ? "active" : ""}`}
                  onClick={() => setFaqCat("retraite")}
                  style={{ fontSize: 12, padding: "6px 14px" }}
                >
                  🎯 Retraite
                </button>
                <button
                  className={`rh-tab ${faqCat === "divers" ? "active" : ""}`}
                  onClick={() => setFaqCat("divers")}
                  style={{ fontSize: 12, padding: "6px 14px" }}
                >
                  📌 Divers
                </button>
              </div>
              <span className="count-rhBadge" style={{ alignSelf: "center" }}>
                {filteredFaq.length} questions
              </span>
            </div>

            <div id="faq-grid">
              {filteredFaq.map((item, idx) => {
                const isOpen = faqOpenIndex === idx;
                return (
                  <div key={idx} className="faq-item" onClick={() => setFaqOpenIndex(isOpen ? null : idx)}>
                    <div className="faq-question">
                      <strong>{item.q}</strong>
                      <ChevronDown size={18} className={`faq-arrow ${isOpen ? "open" : ""}`} />
                    </div>
                    <div className={`faq-answer ${isOpen ? "open" : ""}`}>
                      <div className="faq-answer-inner">
                        <p>{item.a}</p>
                        <div className="faq-meta">
                          <span>{item.theme}</span>
                          {item.ref && <span className="faq-ref">Réf : {item.ref}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredFaq.length === 0 && (
              <div className="no-results" style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}>
                Aucune question trouvée.
              </div>
            )}
          </div>
        )}

        {/* STATIC HTML PAGES FOR REMAINING TABS */}
        {activeTab !== "theme1" &&
          activeTab !== "suppl" &&
          activeTab !== "dico" &&
          activeTab !== "modeles" &&
          activeTab !== "faq" && (
            <div
              dangerouslySetInnerHTML={{
                __html: GUIDE_HTML_CONTENT[activeTab] || "",
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
