"use client";

import { useRouter } from "next/navigation";
import type { Salarie } from "../salaries/actions";

export default function SaisieSelecteur({ salaries }: { salaries: Salarie[] }) {
  const router = useRouter();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    if (id) router.push(`/salaries/${id}/bulletin`);
  }

  return (
    <div className="card selectors-bar" style={{ marginBottom: "var(--s4)" }}>
      <div className="field" style={{ marginBottom: 0, maxWidth: 420 }}>
        <label htmlFor="sel-salarie-saisie">Salarié</label>
        <select id="sel-salarie-saisie" defaultValue="" onChange={onChange}>
          <option value="" disabled>
            Sélectionner un salarié…
          </option>
          {salaries.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nom_prenom}
              {s.matricule ? ` (${s.matricule})` : ""}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
