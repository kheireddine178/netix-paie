"use client";

import React, { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import OdooSheet from "@/components/odoo/OdooSheet";
import OdooNotebook from "@/components/odoo/OdooNotebook";

interface SalarieFormProps {
  initialData?: {
    id?: number;
    nom_prenom: string;
    matricule: string | null;
    fonction: string | null;
    salaire_base_theorique: number;
    date_visite_medicale?: string | null;
    ccp_rib?: string | null;
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
  const [ccpRib, setCcpRib] = useState(initialData?.ccp_rib ?? "");

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
    <form onSubmit={handleSubmit} className="w-full">
      <OdooSheet
        avatar={
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold shadow-sm"
            style={{
              background: "var(--accent-bg)",
              color: "var(--accent-ink)",
              border: "2px solid var(--accent)",
            }}
          >
            {initials}
          </div>
        }
        title={
          <div className="w-full max-w-md">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
              Nom et Prénom du collaborateur *
            </label>
            <input
              id="nom_prenom"
              name="nom_prenom"
              required
              value={nomPrenom}
              onChange={(e) => setNomPrenom(e.target.value)}
              onBlur={handleNameBlur}
              placeholder="Ex: Amina Benali"
              className="text-xl sm:text-2xl font-bold w-full px-3 py-1.5 rounded border"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
                color: "var(--text)",
              }}
            />
          </div>
        }
        subtitle={
          <div className="w-full max-w-md mt-2">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
              Intitulé du poste / Fonction
            </label>
            <input
              id="fonction"
              name="fonction"
              value={fonction}
              onChange={(e) => setFonction(e.target.value)}
              placeholder="Ex: Ingénieur Système / Chef de projet"
              className="text-xs font-semibold w-full px-3 py-1.5 rounded border"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
                color: "var(--text)",
              }}
            />
          </div>
        }
      >
        {error && (
          <div className="p-3 mb-4 rounded bg-red-50 text-red-700 border border-red-200 text-xs font-semibold">
            ⚠️ {error}
          </div>
        )}

        <OdooNotebook
          tabs={[
            {
              id: "poste_paie",
              label: "Contrat & Rémunération",
              content: (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="flex flex-col gap-1.5 p-3 rounded border" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
                    <label htmlFor="matricule" className="font-bold text-muted-foreground">
                      Matricule employé
                    </label>
                    <input
                      id="matricule"
                      name="matricule"
                      value={matricule}
                      onChange={(e) => setMatricule(e.target.value)}
                      placeholder="Ex: M100"
                      className="text-xs font-mono font-semibold px-2.5 py-1.5 rounded border"
                      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                    />
                    <span className="text-[10px] text-muted-foreground">Identifiant unique interne pour la paie</span>
                  </div>

                  <div className="flex flex-col gap-1.5 p-3 rounded border" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
                    <label htmlFor="salaire_base_theorique" className="font-bold text-muted-foreground">
                      Salaire de base contractuel (DA)
                    </label>
                    <input
                      id="salaire_base_theorique"
                      name="salaire_base_theorique"
                      type="number"
                      step="0.01"
                      value={salaireBase}
                      onChange={(e) => setSalaireBase(e.target.value)}
                      placeholder="0.00"
                      className="text-xs font-bold px-2.5 py-1.5 rounded border text-right"
                      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                    />
                    <span className="text-[10px] text-muted-foreground">Montant de base légal mensuel</span>
                  </div>

                  <div className="flex flex-col gap-1.5 p-3 rounded border" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
                    <label htmlFor="date_visite_medicale" className="font-bold text-muted-foreground">
                      Dernière visite médicale de travail
                    </label>
                    <input
                      id="date_visite_medicale"
                      name="date_visite_medicale"
                      type="date"
                      value={dateVisiteMedicale}
                      onChange={(e) => setDateVisiteMedicale(e.target.value)}
                      className="text-xs px-2.5 py-1.5 rounded border"
                      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                    />
                    <span className="text-[10px] text-muted-foreground">Suivi obligatoire médecine du travail</span>
                  </div>
                </div>
              ),
            },
            {
              id: "coordonnees_banque",
              label: "Banque & Paiement",
              content: (
                <div className="max-w-md flex flex-col gap-1.5 p-3 rounded border text-xs" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
                  <label htmlFor="ccp_rib" className="font-bold text-muted-foreground">
                    Coordonnées bancaires (RIB ou CCP 20 chiffres)
                  </label>
                  <input
                    id="ccp_rib"
                    name="ccp_rib"
                    value={ccpRib}
                    onChange={(e) => setCcpRib(e.target.value)}
                    placeholder="Ex: 00799999000000123456"
                    className="text-xs font-mono px-2.5 py-1.5 rounded border"
                    style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                  />
                  <span className="text-[10px] text-muted-foreground">
                    Utilisé pour les états de virement bancaire et chèques de paie
                  </span>
                </div>
              ),
            },
          ]}
        />

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-6 mt-6 border-t" style={{ borderColor: "var(--border)" }}>
          <button
            type="submit"
            disabled={isPending}
            className="btn btn-primary text-xs font-bold px-4 py-2 rounded"
          >
            {isPending ? "Enregistrement…" : buttonText}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="btn btn-secondary text-xs font-semibold px-4 py-2 rounded"
          >
            Annuler
          </button>
        </div>
      </OdooSheet>
    </form>
  );
}
