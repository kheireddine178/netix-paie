"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Salarie, MissionGlobalRow } from "../salaries/actions";
import {
  changerStatutMissionGlobal,
  supprimerMissionGlobal,
  creerMissionSalarie,
} from "../salaries/actions";
import OdooControlPanel from "@/components/odoo/OdooControlPanel";
import OdooKanbanCard from "@/components/odoo/OdooKanbanCard";

export interface MissionsViewClientProps {
  missions: MissionGlobalRow[];
  salaries: Salarie[];
}

export default function MissionsViewClient({
  missions,
  salaries,
}: MissionsViewClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [viewMode, setViewMode] = useState<"list" | "kanban" | "folders">("list");
  const [filterStatut, setFilterStatut] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [formSalarieId, setFormSalarieId] = useState<string>(salaries[0]?.id ? String(salaries[0].id) : "");
  const [formObjet, setFormObjet] = useState("");
  const [formDestination, setFormDestination] = useState("");
  const [formDebut, setFormDebut] = useState("");
  const [formFin, setFormFin] = useState("");
  const [formTransport, setFormTransport] = useState("Véhicule de service");

  // KPIs
  const totalEnAttente = missions.filter((m) => m.statut === "En attente").length;
  const totalApprouvees = missions.filter((m) => m.statut === "Approuvée").length;
  const totalTerminees = missions.filter((m) => m.statut === "Terminée").length;

  const handleChangerStatut = (id: number, statut: string) => {
    setMessage(null);
    startTransition(async () => {
      try {
        await changerStatutMissionGlobal(id, statut);
        setMessage({ type: "success", text: `Mission ${statut.toLowerCase()}.` });
        router.refresh();
      } catch (err) {
        setMessage({ type: "error", text: "Erreur lors de la mise à jour." });
      }
    });
  };

  const handleSupprimer = (id: number) => {
    if (!confirm("Voulez-vous vraiment supprimer cet ordre de mission ?")) return;
    setMessage(null);
    startTransition(async () => {
      try {
        await supprimerMissionGlobal(id);
        setMessage({ type: "success", text: "Ordre de mission supprimé." });
        router.refresh();
      } catch (err) {
        setMessage({ type: "error", text: "Erreur lors de la suppression." });
      }
    });
  };

  const handleCreerMission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSalarieId || !formObjet || !formDestination || !formDebut || !formFin) return;

    setMessage(null);
    const formData = new FormData();
    formData.append("objet", formObjet);
    formData.append("destination", formDestination);
    formData.append("date_debut", formDebut);
    formData.append("date_fin", formFin);
    formData.append("moyen_transport", formTransport);
    formData.append("statut", "Approuvée"); // Directly approved when entered by HR Admin

    startTransition(async () => {
      try {
        await creerMissionSalarie(parseInt(formSalarieId, 10), formData);
        setIsModalOpen(false);
        setFormObjet("");
        setFormDestination("");
        setFormDebut("");
        setFormFin("");
        setMessage({ type: "success", text: "Nouvel ordre de mission enregistré." });
        router.refresh();
      } catch (err) {
        setMessage({ type: "error", text: "Erreur lors de l'enregistrement de la mission." });
      }
    });
  };

  const filteredMissions = missions.filter((m) => {
    if (filterStatut === "attente") {
      if (m.statut !== "En attente") return false;
    } else if (filterStatut === "approuve") {
      if (m.statut !== "Approuvée") return false;
    } else if (filterStatut === "termine") {
      if (m.statut !== "Terminée") return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      const nom = (m.salaries?.nom_prenom || "").toLowerCase();
      const obj = m.objet.toLowerCase();
      const dest = m.destination.toLowerCase();
      if (!nom.includes(q) && !obj.includes(q) && !dest.includes(q)) return false;
    }

    return true;
  });

  return (
    <div className="flex flex-col gap-4">
      {/* 1. ODOO CONTROL PANEL */}
      <OdooControlPanel
        breadcrumbs={[{ label: "Missions & Déplacements" }]}
        primaryAction={{
          label: "+ Nouvel ordre de mission",
          onClick: () => setIsModalOpen(true),
          icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          ),
        }}
        search={{
          value: search,
          onChange: setSearch,
          placeholder: "Rechercher par collaborateur, destination, objet…",
        }}
        filters={[
          {
            id: "all",
            label: "Toutes les missions",
            active: filterStatut === "all",
            onClick: () => setFilterStatut("all"),
          },
          {
            id: "attente",
            label: `À valider (${totalEnAttente})`,
            active: filterStatut === "attente",
            onClick: () => setFilterStatut("attente"),
          },
          {
            id: "approuve",
            label: `Approuvées (${totalApprouvees})`,
            active: filterStatut === "approuve",
            onClick: () => setFilterStatut("approuve"),
          },
          {
            id: "termine",
            label: `Terminées (${totalTerminees})`,
            active: filterStatut === "termine",
            onClick: () => setFilterStatut("termine"),
          },
        ]}
        viewMode={viewMode === "folders" ? "list" : viewMode}
        onViewModeChange={(m) => setViewMode(m)}
        extraRight={
          <button
            type="button"
            onClick={() => setViewMode(viewMode === "folders" ? "list" : "folders")}
            className="text-xs font-semibold px-2.5 py-1.5 rounded transition-all cursor-pointer"
            style={{
              background: viewMode === "folders" ? "var(--accent)" : "var(--surface-2)",
              color: viewMode === "folders" ? "#FFFFFF" : "var(--text)",
              border: "1px solid var(--border)",
            }}
          >
            ✈️ {viewMode === "folders" ? "Vue Missions" : "Dossiers Collaborateurs"}
          </button>
        }
      />

      {/* 2. STATS KPI ODOO */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div
          className="p-3.5 rounded-lg border flex flex-col justify-between"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: "#6366f1" }}>
            ✈️ Total missions enregistrées
          </span>
          <div className="text-xl font-bold mt-1" style={{ color: "#6366f1" }}>
            {missions.length} mission(s)
          </div>
        </div>

        <div
          className="p-3.5 rounded-lg border flex flex-col justify-between"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--amber)" }}>
            ⏳ En attente de validation
          </span>
          <div className="text-xl font-bold mt-1" style={{ color: "var(--amber)" }}>
            {totalEnAttente} en attente
          </div>
        </div>

        <div
          className="p-3.5 rounded-lg border flex flex-col justify-between"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--teal)" }}>
            ✓ Missions autorisées
          </span>
          <div className="text-xl font-bold mt-1" style={{ color: "var(--teal)" }}>
            {totalApprouvees} en cours
          </div>
        </div>

        <div
          className="p-3.5 rounded-lg border flex flex-col justify-between"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
            🏁 Missions clôturées
          </span>
          <div className="text-xl font-bold mt-1" style={{ color: "var(--text)" }}>
            {totalTerminees} terminées
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`p-3 text-xs font-semibold rounded ${
            message.type === "success"
              ? "bg-teal-50 text-teal-800 border border-teal-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* 3. MAIN CONTENT */}
      {viewMode === "folders" ? (
        <div className="odoo-kanban-grid">
          {salaries.map((s) => (
            <OdooKanbanCard
              key={s.id}
              title={s.nom_prenom}
              subtitle={s.fonction || "Poste non renseigné"}
              badge={{
                text: s.actif ? "Actif" : "Inactif",
                variant: s.actif ? "success" : "neutral",
              }}
              metrics={[
                { label: "Matricule", value: s.matricule || "—" },
                { label: "Missions", value: "Dossier" },
              ]}
              href={`/salaries/${s.id}/missions`}
              actions={
                <span className="text-xs font-bold hover:underline" style={{ color: "#6366f1" }}>
                  Gérer les ordres de mission →
                </span>
              }
            />
          ))}
        </div>
      ) : filteredMissions.length === 0 ? (
        <div
          className="p-12 text-center rounded-lg border border-dashed text-xs text-muted-foreground"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          Aucun ordre de mission ne correspond à vos critères.
        </div>
      ) : viewMode === "list" ? (
        <div
          className="table-wrap rounded-lg border overflow-hidden"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        >
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                <th className="py-2.5 px-3 font-bold">Collaborateur</th>
                <th className="py-2.5 px-3 font-bold">Objet de la mission</th>
                <th className="py-2.5 px-3 font-bold w-36">Destination</th>
                <th className="py-2.5 px-3 font-bold w-48">Période</th>
                <th className="py-2.5 px-3 font-bold w-36">Transport</th>
                <th className="py-2.5 px-3 font-bold w-24 text-center">Statut</th>
                <th className="py-2.5 px-3 font-bold w-52 text-right">Actions RH</th>
              </tr>
            </thead>
            <tbody>
              {filteredMissions.map((m) => (
                <tr
                  key={m.id}
                  className="border-b transition-colors hover:bg-slate-50/70"
                  style={{ borderColor: "var(--border-soft)" }}
                >
                  <td className="py-2.5 px-3 font-semibold">
                    <Link
                      href={`/salaries/${m.salarie_id}/missions`}
                      className="hover:underline flex items-center gap-2"
                      style={{ color: "var(--text)" }}
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                        style={{ background: "#EEF2FF", color: "#4F46E5" }}
                      >
                        {(m.salaries?.nom_prenom || "S").slice(0, 2).toUpperCase()}
                      </div>
                      <span>{m.salaries?.nom_prenom || `Salarié #${m.salarie_id}`}</span>
                    </Link>
                  </td>

                  <td className="py-2.5 px-3 font-medium" style={{ color: "var(--text)" }}>
                    {m.objet}
                  </td>

                  <td className="py-2.5 px-3 font-semibold text-slate-700">
                    📍 {m.destination}
                  </td>

                  <td className="py-2.5 px-3 font-mono text-[11px]">
                    {m.date_debut.split("-").reverse().join("/")} → {m.date_fin.split("-").reverse().join("/")}
                  </td>

                  <td className="py-2.5 px-3 text-muted-foreground">
                    🚗 {m.moyen_transport}
                  </td>

                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        m.statut === "Approuvée"
                          ? "bg-teal-100 text-teal-800"
                          : m.statut === "Terminée"
                          ? "bg-slate-100 text-slate-700"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {m.statut}
                    </span>
                  </td>

                  <td className="py-2.5 px-3 text-right">
                    <div className="inline-flex items-center gap-1.5 justify-end">
                      <Link
                        href={`/salaries/${m.salarie_id}/missions/generate-ordre?id=${m.id}`}
                        target="_blank"
                        className="btn btn-primary btn-sm text-[11px] py-1 px-2 font-bold"
                        title="Imprimer l'ordre de mission PDF"
                      >
                        📄 PDF
                      </Link>

                      {m.statut === "En attente" && (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleChangerStatut(m.id, "Approuvée")}
                          className="btn btn-secondary btn-sm text-[11px] py-1 px-2 text-teal-700 hover:bg-teal-50"
                          title="Autoriser la mission"
                        >
                          ✓ Valider
                        </button>
                      )}

                      {m.statut === "Approuvée" && (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleChangerStatut(m.id, "Terminée")}
                          className="text-[11px] text-muted-foreground hover:underline"
                          title="Clôturer la mission"
                        >
                          Clôturer
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleSupprimer(m.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="odoo-kanban-grid">
          {filteredMissions.map((m) => (
            <OdooKanbanCard
              key={m.id}
              title={m.salaries?.nom_prenom || `Salarié #${m.salarie_id}`}
              subtitle={`📍 ${m.destination} • ${m.objet}`}
              badge={{
                text: m.statut,
                variant: m.statut === "Approuvée" ? "success" : m.statut === "En attente" ? "warning" : "neutral",
              }}
              metrics={[
                { label: "Début", value: m.date_debut.split("-").reverse().join("/") },
                { label: "Fin", value: m.date_fin.split("-").reverse().join("/") },
                { label: "Transport", value: m.moyen_transport },
              ]}
              href={`/salaries/${m.salarie_id}/missions`}
              actions={
                <div className="flex items-center gap-2 justify-end w-full">
                  <Link
                    href={`/salaries/${m.salarie_id}/missions/generate-ordre?id=${m.id}`}
                    target="_blank"
                    className="btn btn-primary btn-sm text-[11px] py-0.5 px-2"
                  >
                    📄 Imprimer PDF
                  </Link>
                </div>
              }
            />
          ))}
        </div>
      )}

      {/* 4. MODAL NOUVELLE MISSION */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-xl shadow-xl p-6"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b mb-4" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-bold text-base m-0" style={{ color: "var(--text)" }}>
                Établir un Nouvel Ordre de Mission
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreerMission} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Collaborateur missionné :</label>
                <select
                  value={formSalarieId}
                  onChange={(e) => setFormSalarieId(e.target.value)}
                  required
                  className="w-full p-2 rounded border"
                  style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}
                >
                  {salaries.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nom_prenom} {s.matricule ? `(${s.matricule})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">Objet de la mission :</label>
                <input
                  type="text"
                  value={formObjet}
                  onChange={(e) => setFormObjet(e.target.value)}
                  placeholder="Ex : Audit technique sur site, Réunion client..."
                  required
                  className="w-full p-2 rounded border"
                  style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Lieu / Destination :</label>
                  <input
                    type="text"
                    value={formDestination}
                    onChange={(e) => setFormDestination(e.target.value)}
                    placeholder="Ex : Oran, Hassi Messaoud..."
                    required
                    className="w-full p-2 rounded border"
                    style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">Moyen de transport :</label>
                  <select
                    value={formTransport}
                    onChange={(e) => setFormTransport(e.target.value)}
                    className="w-full p-2 rounded border"
                    style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}
                  >
                    <option value="Véhicule de service">Véhicule de service</option>
                    <option value="Avion">Avion (Air Algérie / Tassili)</option>
                    <option value="Train / Transport public">Train / Transport public</option>
                    <option value="Véhicule personnel">Véhicule personnel</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Date de départ (début) :</label>
                  <input
                    type="date"
                    value={formDebut}
                    onChange={(e) => setFormDebut(e.target.value)}
                    required
                    className="w-full p-2 rounded border"
                    style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">Date de retour (fin) :</label>
                  <input
                    type="date"
                    value={formFin}
                    onChange={(e) => setFormFin(e.target.value)}
                    required
                    className="w-full p-2 rounded border"
                    style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t mt-2" style={{ borderColor: "var(--border)" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn btn-primary btn-sm font-bold"
                >
                  {isPending ? "Enregistrement…" : "Enregistrer et Valider"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
