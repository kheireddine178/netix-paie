"use client";

import React, { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";

interface SalarieFormProps {
  initialData?: {
    id?: number;
    nom_prenom: string;
    matricule: string | null;
    fonction: string | null;
    salaire_base_theorique: number;
    date_visite_medicale?: string | null;
  };
  actionSubmit: (formData: FormData) => Promise<{ error?: string } | void>;
  buttonText: string;
}

export default function SalarieForm({ initialData, actionSubmit, buttonText }: SalarieFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // States for live preview
  const [nomPrenom, setNomPrenom] = useState(initialData?.nom_prenom ?? "");
  const [matricule, setMatricule] = useState(initialData?.matricule ?? "");
  const [fonction, setFonction] = useState(initialData?.fonction ?? "");
  const [salaireBase, setSalaireBase] = useState<number | string>(initialData?.salaire_base_theorique ?? 0);
  const [dateVisiteMedicale, setDateVisiteMedicale] = useState(initialData?.date_visite_medicale ?? "");

  // Format Nom & Prénom on blur (capitalize first letters)
  function handleNameBlur() {
    const formatted = nomPrenom
      .trim()
      .split(/\s+/)
      .map((word) => {
        if (!word) return "";
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(" ");
    setNomPrenom(formatted);
  }

  // Get initials for the live profile card avatar
  const initials = useMemo(() => {
    const parts = nomPrenom.trim().split(/\s+/);
    if (parts.length === 0 || !parts[0]) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }, [nomPrenom]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        const result = await actionSubmit(formData);
        if (result && result.error) {
          setError(result.error);
        } else {
          router.refresh();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  }

  return (
    <div style={{ display: "flex", gap: "var(--s6)", flexWrap: "wrap", alignItems: "flex-start" }}>
      {/* Form Card */}
      <div className="card" style={{ flex: "1 1 450px", maxWidth: 520 }}>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="nom_prenom">Nom et prénom *</label>
            <input
              id="nom_prenom"
              name="nom_prenom"
              required
              value={nomPrenom}
              onChange={(e) => setNomPrenom(e.target.value)}
              onBlur={handleNameBlur}
              placeholder="Ex: Amina Benali"
            />
          </div>

          <div className="field">
            <label htmlFor="matricule">Matricule</label>
            <input
              id="matricule"
              name="matricule"
              value={matricule}
              onChange={(e) => setMatricule(e.target.value)}
              placeholder="Ex: M100"
            />
          </div>

          <div className="field">
            <label htmlFor="fonction">Fonction</label>
            <input
              id="fonction"
              name="fonction"
              value={fonction}
              onChange={(e) => setFonction(e.target.value)}
              placeholder="Ex: Ingénieur Logiciel"
            />
          </div>

          <div className="field">
            <label htmlFor="salaire_base_theorique">Salaire de base théorique (DA)</label>
            <input
              id="salaire_base_theorique"
              name="salaire_base_theorique"
              type="number"
              step="0.01"
              value={salaireBase}
              onChange={(e) => setSalaireBase(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="field">
            <label htmlFor="date_visite_medicale">Date de dernière visite médicale</label>
            <input
              id="date_visite_medicale"
              name="date_visite_medicale"
              type="date"
              value={dateVisiteMedicale}
              onChange={(e) => setDateVisiteMedicale(e.target.value)}
            />
          </div>

          {error && (
            <p className="badge badge-red" style={{ display: "block", marginBottom: "var(--s4)" }}>
              {error}
            </p>
          )}

          <div className="field-row" style={{ display: "flex", gap: "var(--s3)", marginTop: "var(--s4)" }}>
            <button type="submit" disabled={isPending} className="btn btn-primary">
              {isPending ? "Enregistrement..." : buttonText}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="btn btn-secondary"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>

      {/* Live Profile Card */}
      <div
        className="card"
        style={{
          flex: "1 1 280px",
          maxWidth: 320,
          background: "linear-gradient(135deg, var(--surface) 0%, var(--surface-2) 100%)",
          textAlign: "center",
          border: "1px solid var(--border)",
          boxShadow: "var(--sh)",
          position: "sticky",
          top: "var(--s6)",
          padding: "var(--s6) var(--s4)",
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--marine-600) 0%, var(--marine-800) 100%)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "24px",
            fontWeight: "bold",
            margin: "0 auto var(--s4)",
            boxShadow: "var(--shsm)",
          }}
        >
          {initials}
        </div>

        <h2 style={{ fontSize: "var(--tmd)", fontWeight: 700, marginBottom: "var(--s1)", color: "var(--text)" }}>
          {nomPrenom.trim() || "Nouveau Salarié"}
        </h2>

        <p style={{ fontSize: "var(--tsm)", color: "var(--text-muted)", marginBottom: "var(--s4)" }}>
          {fonction.trim() || "Aucune fonction renseignée"}
        </p>

        <div
          style={{
            borderTop: "1px solid var(--border)",
            paddingTop: "var(--s4)",
            marginTop: "var(--s4)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--s2)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--txs)" }}>
            <span style={{ color: "var(--text-muted)" }}>Matricule :</span>
            <span style={{ fontWeight: 600 }}>{matricule.trim() ? (
              <span className="badge badge-accent" style={{ padding: "2px 8px" }}>{matricule}</span>
            ) : "—"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--txs)" }}>
            <span style={{ color: "var(--text-muted)" }}>Salaire de base :</span>
            <span style={{ fontWeight: 650, color: "var(--accent)" }}>
              {Number(salaireBase || 0).toLocaleString("fr-FR").replace(/[\u202F\u00A0]/g, ' ')} DA
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
