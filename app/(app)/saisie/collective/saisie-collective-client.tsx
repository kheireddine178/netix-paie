"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { type Salarie } from "../../salaries/actions";
import { enregistrerBulletinsCollectifs } from "../../salaries/actions";

interface BulletinSimplifie {
  salarie_id: number;
  maladie_h: number;
  absence_irreguliere_h: number;
  retard_h: number;
  heures_sup_1: number;
  heures_sup_2: number;
  heures_sup_3: number;
  panier_jours: number;
  autre_prime_fixe: number;
  statut?: string;
}

interface Props {
  salaries: Salarie[];
  initialBulletins: BulletinSimplifie[];
  anneeActive: number;
  moisActive: number;
}

const MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

const COLUMNS = [
  { key: "maladie_h", label: "Maladie (H)" },
  { key: "absence_irreguliere_h", label: "Absences (H)" },
  { key: "retard_h", label: "Retards (H)" },
  { key: "heures_sup_1", label: "HS 50% (H)" },
  { key: "heures_sup_2", label: "HS 75% (H)" },
  { key: "heures_sup_3", label: "HS 100% (H)" },
  { key: "panier_jours", label: "Panier (Jours)" },
  { key: "autre_prime_fixe", label: "Autre Prime (DA)" },
];

export default function SaisieCollectiveClient({
  salaries,
  initialBulletins,
  anneeActive,
  moisActive
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Years & Months states for navigation
  const [annee, setAnnee] = useState(anneeActive);
  const [mois, setMois] = useState(moisActive);

  // Grid values state
  const [gridValues, setGridValues] = useState<Record<number, BulletinSimplifie>>({});
  
  // Search state
  const [search, setSearch] = useState("");

  // Initialize values when initial data or period changes
  useEffect(() => {
    const values: Record<number, BulletinSimplifie> = {};
    
    // Create map of existing bulletins
    const existingMap = new Map(initialBulletins.map(b => [b.salarie_id, b]));

    for (const s of salaries) {
      const existing = existingMap.get(s.id);
      values[s.id] = {
        salarie_id: s.id,
        maladie_h: existing?.maladie_h ?? 0,
        absence_irreguliere_h: existing?.absence_irreguliere_h ?? 0,
        retard_h: existing?.retard_h ?? 0,
        heures_sup_1: existing?.heures_sup_1 ?? 0,
        heures_sup_2: existing?.heures_sup_2 ?? 0,
        heures_sup_3: existing?.heures_sup_3 ?? 0,
        panier_jours: existing?.panier_jours ?? 0,
        autre_prime_fixe: existing?.autre_prime_fixe ?? 0,
        statut: existing?.statut ?? "Brouillon",
      };
    }
    
    setGridValues(values);
    setMessage(null);
  }, [initialBulletins, salaries, anneeActive, moisActive]);

  // Navigate when period changes
  const handlePeriodChange = (newAnnee: number, newMois: number) => {
    setAnnee(newAnnee);
    setMois(newMois);
    router.push(`?annee=${newAnnee}&mois=${newMois}`);
  };

  // Cell change handler
  const handleCellChange = (salarieId: number, field: keyof BulletinSimplifie, val: string) => {
    const num = parseFloat(val) || 0;
    setGridValues(prev => ({
      ...prev,
      [salarieId]: {
        ...prev[salarieId],
        [field]: num
      }
    }));
  };

  // Keyboard navigation helper
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, colIndex: number) => {
    let targetRow = rowIndex;
    let targetCol = colIndex;

    if (e.key === "ArrowUp") {
      targetRow = rowIndex - 1;
    } else if (e.key === "ArrowDown" || e.key === "Enter") {
      e.preventDefault(); // Prevent standard enter key submit or scroll
      targetRow = rowIndex + 1;
    } else if (e.key === "ArrowLeft") {
      // Navigate to left if cursor is at the beginning
      if (e.currentTarget.selectionStart === 0) {
        targetCol = colIndex - 1;
      }
    } else if (e.key === "ArrowRight") {
      // Navigate to right if cursor is at the end
      if (e.currentTarget.selectionEnd === e.currentTarget.value.length) {
        targetCol = colIndex + 1;
      }
    } else {
      return; // Do nothing for other keys
    }

    const nextInput = document.querySelector(
      `input[data-row="${targetRow}"][data-col="${targetCol}"]`
    ) as HTMLInputElement;

    if (nextInput) {
      nextInput.focus();
      // Select text on focus for easier overwrite
      setTimeout(() => nextInput.select(), 50);
    }
  };

  // Save handler
  const handleSave = () => {
    setMessage(null);
    const list = Object.values(gridValues).filter(v => {
      // Only send values that actually differ from zero or have a status
      return (
        v.maladie_h !== 0 ||
        v.absence_irreguliere_h !== 0 ||
        v.retard_h !== 0 ||
        v.heures_sup_1 !== 0 ||
        v.heures_sup_2 !== 0 ||
        v.heures_sup_3 !== 0 ||
        v.panier_jours !== 0 ||
        v.autre_prime_fixe !== 0 ||
        v.statut !== "Brouillon"
      );
    });

    startTransition(async () => {
      try {
        await enregistrerBulletinsCollectifs(annee, mois, list);
        setMessage({ type: "success", text: "Toutes les variables de paie ont été enregistrées et recalculées avec succès !" });
      } catch (err) {
        setMessage({ type: "error", text: err instanceof Error ? err.message : "Une erreur est survenue lors de l'enregistrement." });
      }
    });
  };

  // Filter salaries by search query
  const filteredSalaries = salaries.filter(s =>
    s.nom_prenom.toLowerCase().includes(search.toLowerCase()) ||
    (s.matricule || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.fonction || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Configuration bar */}
      <div className="card no-print" style={{ display: "flex", gap: "var(--s4)", alignItems: "flex-end", flexWrap: "wrap", border: "1px solid var(--border)", padding: "var(--s4)" }}>
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="mois-sel">Mois</label>
          <select
            id="mois-sel"
            value={mois}
            onChange={(e) => handlePeriodChange(annee, parseInt(e.target.value, 10))}
          >
            {MOIS.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>

        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="annee-sel">Année</label>
          <select
            id="annee-sel"
            value={annee}
            onChange={(e) => handlePeriodChange(parseInt(e.target.value, 10), mois)}
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div className="field" style={{ marginBottom: 0, flex: "1 1 250px" }}>
          <label htmlFor="search-sal">Filtrer les salariés</label>
          <input
            id="search-sal"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, fonction, matricule..."
          />
        </div>

        <button
          onClick={handleSave}
          disabled={isPending}
          className="btn btn-primary"
          style={{ height: "42px", minWidth: "180px", justifyContent: "center" }}
        >
          {isPending ? "Calcul & Enregistrement..." : "💾 Enregistrer la paie"}
        </button>
      </div>

      {message && (
        <div
          className={`badge ${message.type === "success" ? "badge-teal" : "badge-red"}`}
          style={{ display: "block", padding: "12px var(--s4)", fontSize: "var(--tsm)", textAlign: "center" }}
        >
          {message.text}
        </div>
      )}

      {/* Grid container */}
      <div className="card" style={{ padding: 0, overflow: "hidden", border: "1px solid var(--border)" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="table" style={{ width: "100%", margin: 0, borderCollapse: "collapse", fontSize: "var(--txs)" }}>
            <thead>
              <tr style={{ background: "var(--surface-2)", borderBottom: "2px solid var(--border)" }}>
                <th style={{ padding: "12px", minWidth: "180px", position: "sticky", left: 0, background: "var(--surface-2)", zIndex: 10 }}>Salarié</th>
                <th style={{ padding: "12px" }}>Matricule</th>
                {COLUMNS.map((col) => (
                  <th key={col.key} style={{ padding: "12px", textAlign: "center", minWidth: "110px" }}>
                    {col.label}
                  </th>
                ))}
                <th style={{ padding: "12px", textAlign: "center" }}>Statut</th>
              </tr>
            </thead>
            <tbody>
              {filteredSalaries.map((s, rowIndex) => {
                const values = gridValues[s.id] || {
                  salarie_id: s.id,
                  maladie_h: 0,
                  absence_irreguliere_h: 0,
                  retard_h: 0,
                  heures_sup_1: 0,
                  heures_sup_2: 0,
                  heures_sup_3: 0,
                  panier_jours: 0,
                  autre_prime_fixe: 0,
                  statut: "Brouillon",
                };
                
                const isLocked = values.statut === "Clôturé";

                return (
                  <tr
                    key={s.id}
                    style={{
                      borderBottom: "1px solid var(--border)",
                      background: isLocked ? "rgba(var(--text-muted), 0.05)" : undefined
                    }}
                  >
                    {/* Fixed name column */}
                    <td
                      style={{
                        padding: "10px 12px",
                        fontWeight: 650,
                        position: "sticky",
                        left: 0,
                        background: "var(--surface)",
                        zIndex: 5,
                        boxShadow: "2px 0 5px rgba(0,0,0,0.05)"
                      }}
                    >
                      <div>{s.nom_prenom}</div>
                      <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "normal" }}>
                        {s.fonction || "Pas de fonction"}
                      </div>
                    </td>

                    <td style={{ padding: "10px 12px", textAlign: "center" }}>
                      {s.matricule ? (
                        <span className="badge badge-accent">{s.matricule}</span>
                      ) : (
                        "—"
                      )}
                    </td>

                    {COLUMNS.map((col, colIndex) => {
                      const field = col.key as keyof BulletinSimplifie;
                      const val = values[field] ?? 0;

                      return (
                        <td key={col.key} style={{ padding: "6px", textAlign: "center" }}>
                          <input
                            type="number"
                            step={field === "autre_prime_fixe" ? "0.01" : "1"}
                            min="0"
                            value={val === 0 ? "" : val}
                            onChange={(e) => handleCellChange(s.id, field, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                            disabled={isLocked || isPending}
                            data-row={rowIndex}
                            data-col={colIndex}
                            placeholder="0"
                            style={{
                              width: "100%",
                              padding: "6px 8px",
                              border: "1px solid var(--border)",
                              borderRadius: "var(--radius-sm)",
                              textAlign: "right",
                              fontFamily: "var(--mono)",
                              fontSize: "var(--txs)",
                              background: isLocked ? "var(--surface-3)" : "var(--surface)",
                              color: isLocked ? "var(--text-muted)" : "var(--text)",
                              outline: "none"
                            }}
                          />
                        </td>
                      );
                    })}

                    <td style={{ padding: "10px 12px", textAlign: "center" }}>
                      {isLocked ? (
                        <span className="badge badge-teal" style={{ fontSize: "10px", padding: "2px 6px" }}>🔒 Clôturé</span>
                      ) : (
                        <span className="badge badge-secondary" style={{ fontSize: "10px", padding: "2px 6px" }}>✏️ Brouillon</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
