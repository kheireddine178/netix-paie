"use client";

import { useState } from "react";
import { Calculator, Scale, Users, FileText, ChevronLeft, ChevronRight } from "lucide-react";

type Slide = {
  icon: React.ComponentType<any>;
  iconBg: string;
  title: string;
  description: string;
  points: string[];
  stat: { label: string; value: string }[];
};

const SLIDES: Slide[] = [
  {
    icon: Calculator,
    iconBg: "rgba(13, 148, 136, 0.15)",
    title: "Calcul de paie conforme",
    description:
      "Le moteur de calcul applique en cascade le salaire de base, les absences, les heures supplémentaires et les primes pour produire un net à payer fiable, mois après mois.",
    points: [
      "Proratisation des absences (maladie, mise à pied, retard…)",
      "Heures supplémentaires sur 3 paliers (×1.5 / ×1.75 / ×2.0)",
      "Primes : I.E.P, Nuisance, Panier, P.R.I, P.R.C, I.C.R…",
    ],
    stat: [
      { label: "Rubriques catalogue", value: "402" },
      { label: "Paliers heures sup.", value: "3" },
    ],
  },
  {
    icon: Scale,
    iconBg: "rgba(59, 130, 246, 0.15)",
    title: "Cotisations et impôt à jour",
    description:
      "Le barème IRG et les cotisations CNAS sont appliqués selon les textes en vigueur, sans configuration manuelle des tranches ni des taux.",
    points: [
      "IRG progressif — 6 tranches (Art. 104 CIDTA, LF 2022)",
      "Abattement légal de 40 % (plancher / plafond)",
      "CNAS salariale 9 % et coût employeur (patronale 26 %)",
    ],
    stat: [
      { label: "Tranches IRG", value: "6" },
      { label: "Exonération", value: "30 000 DA" },
    ],
  },
  {
    icon: Users,
    iconBg: "rgba(245, 158, 11, 0.15)",
    title: "Gestion des salariés",
    description:
      "Chaque salarié dispose d'une fiche complète et de ses propres rubriques, avec un historique jamais perdu même après désactivation.",
    points: [
      "Fiche : matricule, fonction, salaire de base théorique",
      "Activation / désactivation (soft delete)",
      "Rubriques configurables avec valeurs par défaut",
    ],
    stat: [
      { label: "Historique", value: "Conservé" },
      { label: "Rubriques / salarié", value: "Personnalisables" },
    ],
  },
  {
    icon: FileText,
    iconBg: "rgba(16, 185, 129, 0.15)",
    title: "Bulletins PDF prêts à l'emploi",
    description:
      "Chaque bulletin est généré à la volée en PDF, en version salarié ou en version employeur avec le détail des charges patronales.",
    points: [
      "Génération instantanée via @react-pdf/renderer",
      "Aucune dépendance système à installer",
      "Historique complet consultable par salarié",
    ],
    stat: [
      { label: "Formats export", value: "2" },
      { label: "Dépendance système", value: "Aucune" },
    ],
  },
];

export default function FeatureSlides() {
  const [index, setIndex] = useState(0);

  function go(next: number) {
    const total = SLIDES.length;
    setIndex(((next % total) + total) % total);
  }

  const active = SLIDES[index];

  return (
    <div className="slide-deck">
      <div
        className="slide-track"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {SLIDES.map((slide, i) => {
          const Icon = slide.icon;
          return (
            <div className="slide" key={i} aria-hidden={i !== index}>
              <div className="slide-copy">
                <div className="slide-icon-wrap" style={{ background: slide.iconBg }}>
                  <Icon size={24} className="text-teal" />
                </div>
                <h3>{slide.title}</h3>
                <p>{slide.description}</p>
                <ul>
                  {slide.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
              <div className="slide-visual">
                {slide.stat.map((s) => (
                  <div className="stat" key={s.label}>
                    <strong>{s.value}</strong>
                    <span>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="slide-controls">
        <button
          type="button"
          className="slide-arrow"
          onClick={() => go(index - 1)}
          aria-label="Diapositive précédente"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="slide-dots">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.title}
              type="button"
              className={`slide-dot${i === index ? " active" : ""}`}
              onClick={() => go(i)}
              aria-label={`Aller à la diapositive ${i + 1}`}
            />
          ))}
        </div>
        <button
          type="button"
          className="slide-arrow"
          onClick={() => go(index + 1)}
          aria-label="Diapositive suivante"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
