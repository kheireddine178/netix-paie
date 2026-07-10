import Link from "next/link";
import { listerSalaries } from "../salaries/actions";

export const dynamic = "force-dynamic";

function SalarieCard({
  s,
  href,
  color,
  arrow,
}: {
  s: { id: number; nom_prenom: string; fonction?: string | null; matricule?: string | null };
  href: string;
  color: string;
  arrow: string;
}) {
  return (
    <Link key={s.id} href={href} style={{ textDecoration: "none", color: "inherit" }}>
      <div
        className="card hover-card"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--s4)",
          padding: "var(--s4)",
          cursor: "pointer",
          borderLeft: `4px solid ${color}`,
          transition: "transform 0.15s, box-shadow 0.15s",
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: color,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
            fontSize: 18,
            flexShrink: 0,
          }}
        >
          {s.nom_prenom.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: "bold", margin: 0 }}>{s.nom_prenom}</p>
          <p style={{ fontSize: "var(--tsm)", color: "var(--text-muted)", margin: "2px 0 0" }}>
            {s.fonction || "Pas de fonction"} · {s.matricule || "—"}
          </p>
        </div>
        <span style={{ color, fontWeight: "bold", fontSize: 18 }}>{arrow}</span>
      </div>
    </Link>
  );
}

export default async function MissionsPage() {
  const salaries = await listerSalaries();

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1>✈️ Missions & Déplacements</h1>
        <p>Sélectionnez un collaborateur pour saisir un déplacement et imprimer l'ordre de mission.</p>
      </div>

      {salaries.length === 0 ? (
        <div className="card">
          <p style={{ color: "var(--text-muted)" }}>Aucun salarié enregistré.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "var(--s4)" }}>
          {salaries.map((s) => (
            <SalarieCard key={s.id} s={s} href={`/salaries/${s.id}/missions`} color="#6366f1" arrow="→" />
          ))}
        </div>
      )}
    </div>
  );
}
