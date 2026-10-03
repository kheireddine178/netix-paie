"use client";

import React, { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Parametres } from "@/lib/paieCalcul";
import { updateParametres, reinitialiserParametres } from "./actions";

export default function ParametresForm({ initial }: { initial: Parametres }) {
  const [parametres, setParametres] = useState<Parametres>(initial);
  const [bareme, setBareme] = useState<[number, number | null, number][]>(initial.bareme_irg);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  function updateBareme(idx: number, field: "de" | "a" | "taux", value: string) {
    setBareme((prev) => {
      const next = [...prev];
      const row = [...next[idx]] as [number, number | null, number];
      if (field === "de") row[0] = parseFloat(value) || 0;
      if (field === "a") row[1] = value === "" ? null : parseFloat(value) || 0;
      if (field === "taux") row[2] = parseFloat(value) || 0;
      next[idx] = row;
      return next;
    });
  }

  function handleSubmit(formData: FormData) {
    formData.set("bareme_irg_json", JSON.stringify(bareme));
    startTransition(async () => {
      try {
        const result = await updateParametres(formData);
        setParametres(result);
        setBareme(result.bareme_irg);
        setMessage({ text: "Paramètres légaux et informations employeur enregistrés avec succès.", type: "success" });
        router.refresh();
      } catch (e) {
        setMessage({ text: e instanceof Error ? e.message : "Erreur d'enregistrement", type: "error" });
      }
    });
  }

  function handleReset() {
    if (!confirm("Attention : Réinitialiser tous les paramètres aux barèmes officiels par défaut (LF 2024 / SNMG 20 000 DA) ?")) return;
    startTransition(async () => {
      try {
        const result = await reinitialiserParametres();
        setParametres(result);
        setBareme(result.bareme_irg);
        setMessage({ text: "Tous les paramètres ont été réinitialisés aux valeurs légales officielles.", type: "success" });
        router.refresh();
      } catch (e) {
        setMessage({ text: e instanceof Error ? e.message : "Erreur de réinitialisation", type: "error" });
      }
    });
  }

  return (
    <div className="flex flex-col gap-5 max-w-5xl mx-auto w-full">
      {/* 1. ODOO ACTION BAR */}
      <div
        className="sticky top-0 z-20 p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 shadow-xs"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => formRef.current?.requestSubmit()}
            className="btn btn-primary text-xs font-bold px-4 py-2 inline-flex items-center gap-1.5 rounded shadow-sm"
            disabled={isPending}
          >
            <span>{isPending ? "Enregistrement…" : "💾 Enregistrer les paramètres"}</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary text-xs font-semibold px-3 py-2 inline-flex items-center gap-1.5 rounded"
            onClick={handleReset}
            disabled={isPending}
            title="Rétablir les barèmes officiels de la loi de finances"
          >
            <span>↺ Rétablir les barèmes légaux</span>
          </button>
        </div>

        <span className="text-xs text-muted-foreground font-medium">
          Droit du travail &amp; fiscalité algérienne (LF 2024 / CIDTA)
        </span>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between gap-3 ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <span>{message.type === "success" ? "✓" : "⚠️"} {message.text}</span>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="text-slate-400 hover:text-slate-600 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      <form ref={formRef} action={handleSubmit} className="flex flex-col gap-5">
        {/* SECTION 1 : INFORMATIONS EMPLOYEUR */}
        <div
          className="rounded-xl border p-5 flex flex-col gap-4 shadow-xs"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between border-b pb-2.5" style={{ borderColor: "var(--border-soft)" }}>
            <div>
              <h3 className="text-sm font-bold m-0" style={{ color: "var(--text)" }}>
                🏢 Informations de l&apos;Entreprise &amp; Identifiants Fiscaux
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Ces mentions légales sont automatiquement imprimées sur les bulletins de paie PDF et les états officiels.
              </p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 border border-slate-200 dark:border-slate-700">
              En-tête légal
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label htmlFor="employeur_nom" className="font-semibold block mb-1">
                Raison sociale / Nom de l&apos;entreprise
              </label>
              <input
                id="employeur_nom"
                name="employeur_nom"
                defaultValue={parametres.employeur_nom}
                placeholder="Ex : SARL Netix Industrie"
                className="w-full px-3 py-2 rounded-lg border text-xs"
                style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
              />
            </div>

            <div>
              <label htmlFor="employeur_adresse" className="font-semibold block mb-1">
                Adresse du siège social
              </label>
              <input
                id="employeur_adresse"
                name="employeur_adresse"
                defaultValue={parametres.employeur_adresse}
                placeholder="Ex : Zone industrielle, Oran, Algérie"
                className="w-full px-3 py-2 rounded-lg border text-xs"
                style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
              />
            </div>

            <div>
              <label htmlFor="employeur_nif" className="font-semibold block mb-1">
                Numéro d&apos;Identification Fiscale (NIF)
              </label>
              <input
                id="employeur_nif"
                name="employeur_nif"
                defaultValue={parametres.employeur_nif}
                placeholder="Ex : 000123456789012"
                className="w-full px-3 py-2 rounded-lg border text-xs font-mono"
                style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
              />
            </div>

            <div>
              <label htmlFor="employeur_nis" className="font-semibold block mb-1">
                Numéro d&apos;Identification Statistique (NIS)
              </label>
              <input
                id="employeur_nis"
                name="employeur_nis"
                defaultValue={parametres.employeur_nis}
                placeholder="Ex : 012345678"
                className="w-full px-3 py-2 rounded-lg border text-xs font-mono"
                style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="employeur_affiliation_cnas" className="font-semibold block mb-1">
                N° d&apos;Affiliation Employeur CNAS
              </label>
              <input
                id="employeur_affiliation_cnas"
                name="employeur_affiliation_cnas"
                defaultValue={parametres.employeur_affiliation_cnas}
                placeholder="Ex : 16/123456/78"
                className="w-full px-3 py-2 rounded-lg border text-xs font-mono"
                style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
              />
            </div>
          </div>
        </div>

        {/* SECTION 2 : SNMG & COTISATIONS CNAS */}
        <div
          className="rounded-xl border p-5 flex flex-col gap-4 shadow-xs"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between border-b pb-2.5" style={{ borderColor: "var(--border-soft)" }}>
            <div>
              <h3 className="text-sm font-bold m-0" style={{ color: "var(--text)" }}>
                💰 SNMG, Temps de Travail &amp; Cotisations Sociales CNAS
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Barèmes nationaux régis par la loi 90-11 et la législation de sécurité sociale.
              </p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              CNAS 9% / 26%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label htmlFor="snmg" className="font-semibold block mb-1">
                SNMG mensuel (DA)
              </label>
              <input
                id="snmg"
                name="snmg"
                type="number"
                step="0.01"
                defaultValue={parametres.snmg}
                className="w-full px-3 py-2 rounded-lg border text-xs font-bold"
                style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
              />
              <span className="text-[10px] text-muted-foreground mt-1 block">Réf : 20 000 DA</span>
            </div>

            <div>
              <label htmlFor="duree_legale_mensuelle" className="font-semibold block mb-1">
                Durée légale mensuelle (h)
              </label>
              <input
                id="duree_legale_mensuelle"
                name="duree_legale_mensuelle"
                type="number"
                step="0.01"
                defaultValue={parametres.duree_legale_mensuelle}
                className="w-full px-3 py-2 rounded-lg border text-xs font-bold"
                style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
              />
              <span className="text-[10px] text-muted-foreground mt-1 block">40h/sem = 173.33h</span>
            </div>

            <div>
              <label htmlFor="taux_cnas_salarie" className="font-semibold block mb-1">
                Taux CNAS Salarié (%)
              </label>
              <input
                id="taux_cnas_salarie"
                name="taux_cnas_salarie_pct"
                type="number"
                step="0.01"
                defaultValue={parametres.taux_cnas_salarie * 100}
                className="w-full px-3 py-2 rounded-lg border text-xs font-bold text-teal-700"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}
              />
              <span className="text-[10px] text-muted-foreground mt-1 block">Retenue ouvrière (9%)</span>
            </div>

            <div>
              <label htmlFor="taux_cnas_employeur" className="font-semibold block mb-1">
                Taux CNAS Employeur (%)
              </label>
              <input
                id="taux_cnas_employeur"
                name="taux_cnas_employeur_pct"
                type="number"
                step="0.01"
                defaultValue={parametres.taux_cnas_employeur * 100}
                className="w-full px-3 py-2 rounded-lg border text-xs font-bold text-indigo-700"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}
              />
              <span className="text-[10px] text-muted-foreground mt-1 block">Charge patronale (26%)</span>
            </div>
          </div>
        </div>

        {/* SECTION 3 : MAJORATIONS HEURES SUPPLÉMENTAIRES */}
        <div
          className="rounded-xl border p-5 flex flex-col gap-4 shadow-xs"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between border-b pb-2.5" style={{ borderColor: "var(--border-soft)" }}>
            <div>
              <h3 className="text-sm font-bold m-0" style={{ color: "var(--text)" }}>
                ⏱️ Majorations des Heures Supplémentaires (Loi 90-11 Art. 32)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Coefficients légaux multiplicateurs du taux horaire de base selon les paliers de travail.
              </p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              Paliers légaux
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label htmlFor="majoration_hs_1" className="font-semibold block mb-1">
                Palier 1 : Normales (+50%)
              </label>
              <input
                id="majoration_hs_1"
                name="majoration_hs_1"
                type="number"
                step="0.01"
                defaultValue={parametres.majoration_hs_1}
                className="w-full px-3 py-2 rounded-lg border text-xs font-bold"
                style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
              />
              <span className="text-[10px] text-muted-foreground mt-1 block">Coefficient 1.50</span>
            </div>

            <div>
              <label htmlFor="majoration_hs_2" className="font-semibold block mb-1">
                Palier 2 : Nuit / Dérogatoires (+75%)
              </label>
              <input
                id="majoration_hs_2"
                name="majoration_hs_2"
                type="number"
                step="0.01"
                defaultValue={parametres.majoration_hs_2}
                className="w-full px-3 py-2 rounded-lg border text-xs font-bold"
                style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
              />
              <span className="text-[10px] text-muted-foreground mt-1 block">Coefficient 1.75</span>
            </div>

            <div>
              <label htmlFor="majoration_hs_3" className="font-semibold block mb-1">
                Palier 3 : Fériés / Repos légal (+100%)
              </label>
              <input
                id="majoration_hs_3"
                name="majoration_hs_3"
                type="number"
                step="0.01"
                defaultValue={parametres.majoration_hs_3}
                className="w-full px-3 py-2 rounded-lg border text-xs font-bold"
                style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
              />
              <span className="text-[10px] text-muted-foreground mt-1 block">Coefficient 2.00</span>
            </div>
          </div>
        </div>

        {/* SECTION 4 : BARÈME PROGRESSIF IRG */}
        <div
          className="rounded-xl border p-5 flex flex-col gap-4 shadow-xs"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between border-b pb-2.5" style={{ borderColor: "var(--border-soft)" }}>
            <div>
              <h3 className="text-sm font-bold m-0" style={{ color: "var(--text)" }}>
                📊 Barème Progressif IRG (Art. 104 CIDTA / Barème Officiel)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tranches d&apos;imposition mensuelles calculées en cascade sur le salaire imposable.
              </p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
              Tranches CIDTA
            </span>
          </div>

          <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "var(--border)" }}>
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
                  <th className="px-4 py-2.5 font-bold">Tranche</th>
                  <th className="px-4 py-2.5 font-bold">De (DA / mois)</th>
                  <th className="px-4 py-2.5 font-bold">À (DA / mois)</th>
                  <th className="px-4 py-2.5 font-bold text-right">Taux appliqué</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--border-soft)" }}>
                {bareme.map((t, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-2 font-semibold text-muted-foreground">
                      Tranche {i + 1}
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        step="0.01"
                        value={t[0]}
                        onChange={(e) => updateBareme(i, "de", e.target.value)}
                        className="px-2.5 py-1.5 rounded border text-xs w-36 font-mono font-medium"
                        style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type={t[1] === null ? "text" : "number"}
                        step="0.01"
                        value={t[1] === null ? "" : t[1]}
                        placeholder="Illimité"
                        onChange={(e) => updateBareme(i, "a", e.target.value)}
                        className="px-2.5 py-1.5 rounded border text-xs w-36 font-mono font-medium"
                        style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <input
                          type="number"
                          step="0.01"
                          value={Math.round(t[2] * 100 * 100) / 100}
                          onChange={(e) =>
                            updateBareme(i, "taux", String((parseFloat(e.target.value) || 0) / 100))
                          }
                          className="px-2.5 py-1.5 rounded border text-xs w-20 text-right font-bold text-purple-700 dark:text-purple-300"
                          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                        />
                        <span className="font-bold text-muted-foreground">%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 5 : ABATTEMENT ET EXONÉRATION IRG */}
        <div
          className="rounded-xl border p-5 flex flex-col gap-4 shadow-xs"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between border-b pb-2.5" style={{ borderColor: "var(--border-soft)" }}>
            <div>
              <h3 className="text-sm font-bold m-0" style={{ color: "var(--text)" }}>
                🛡️ Seuil d&apos;Exonération Totale &amp; Abattement Légal de 40%
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Exonération en deçà de 30 000 DA et mécanisme de décote prévu par le code des impôts.
              </p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
              Exonération 30 000 DA
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label htmlFor="seuil_exoneration_irg" className="font-semibold block mb-1">
                Seuil d&apos;exonération totale (DA)
              </label>
              <input
                id="seuil_exoneration_irg"
                name="seuil_exoneration_irg"
                type="number"
                step="0.01"
                defaultValue={parametres.seuil_exoneration_irg}
                className="w-full px-3 py-2 rounded-lg border text-xs font-bold text-amber-800"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}
              />
              <span className="text-[10px] text-muted-foreground mt-1 block">Imposable &le; 30 000 DA = 0 IRG</span>
            </div>

            <div>
              <label htmlFor="taux_abattement_irg" className="font-semibold block mb-1">
                Taux d&apos;abattement légal (%)
              </label>
              <input
                id="taux_abattement_irg"
                name="taux_abattement_irg_pct"
                type="number"
                step="0.01"
                defaultValue={parametres.taux_abattement_irg * 100}
                className="w-full px-3 py-2 rounded-lg border text-xs font-bold"
                style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
              />
              <span className="text-[10px] text-muted-foreground mt-1 block">Abattement général : 40%</span>
            </div>

            <div>
              <label htmlFor="abattement_irg_min" className="font-semibold block mb-1">
                Abattement minimum (DA/mois)
              </label>
              <input
                id="abattement_irg_min"
                name="abattement_irg_min"
                type="number"
                step="0.01"
                defaultValue={parametres.abattement_irg_min}
                className="w-full px-3 py-2 rounded-lg border text-xs font-bold"
                style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
              />
              <span className="text-[10px] text-muted-foreground mt-1 block">Minimum : 1 000 DA</span>
            </div>

            <div>
              <label htmlFor="abattement_irg_max" className="font-semibold block mb-1">
                Abattement maximum (DA/mois)
              </label>
              <input
                id="abattement_irg_max"
                name="abattement_irg_max"
                type="number"
                step="0.01"
                defaultValue={parametres.abattement_irg_max}
                className="w-full px-3 py-2 rounded-lg border text-xs font-bold"
                style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
              />
              <span className="text-[10px] text-muted-foreground mt-1 block">Plafond : 1 500 DA</span>
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="btn btn-primary text-xs font-bold px-5 py-2.5 rounded shadow-sm"
            disabled={isPending}
          >
            {isPending ? "Enregistrement en cours…" : "💾 Enregistrer les paramètres"}
          </button>
        </div>
      </form>
    </div>
  );
}
