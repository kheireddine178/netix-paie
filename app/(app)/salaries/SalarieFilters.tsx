"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SalarieFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "active");
  const [isPending, startTransition] = useTransition();

  // Debounced search logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      updateUrl(search, status);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const updateUrl = (searchTerm: string, statusTerm: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchTerm.trim()) {
        params.set("search", searchTerm);
      } else {
        params.delete("search");
      }
      
      params.set("status", statusTerm);
      params.set("page", "1"); // Reset to page 1 on new search/filter

      router.push(`?${params.toString()}`);
    });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setStatus(val);
    updateUrl(search, val);
  };

  return (
    <div className="card no-print" style={{ marginBottom: "var(--s4)", padding: "var(--s3)" }}>
      <div className="grid md:grid-cols-3 gap-4 items-end">
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="search-input">Rechercher</label>
          <input
            id="search-input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nom, prénom, matricule ou fonction..."
          />
        </div>

        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="status-select">Statut</label>
          <select
            id="status-select"
            value={status}
            onChange={handleStatusChange}
          >
            <option value="active">Salariés Actifs uniquement</option>
            <option value="inactive">Salariés Inactifs uniquement</option>
            <option value="all">Tous les salariés</option>
          </select>
        </div>

        {isPending && (
          <div style={{ fontSize: "var(--txs)", color: "var(--text-muted)", paddingBottom: "12px" }}>
            Mise à jour de la liste...
          </div>
        )}
      </div>
    </div>
  );
}
