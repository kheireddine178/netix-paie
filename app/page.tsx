import Link from "next/link";

export default function Home() {
  return (
    <div>
      <div className="page-header">
        <h1>Netix Paie</h1>
        <p>Application de gestion de paie algérienne</p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "var(--s5)",
          marginBottom: "var(--s6)",
        }}
      >
        <div className="card">
          <h2 style={{ marginBottom: "var(--s2)" }}>Salariés</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "var(--s4)" }}>
            Ajouter, modifier ou consulter la fiche des salariés et leurs bulletins de paie mensuels.
          </p>
          <Link href="/salaries" className="btn btn-primary">
            Gérer les salariés
          </Link>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: "var(--s2)" }}>Connexion base de données</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "var(--s4)" }}>
            Vérifier que l&apos;application communique correctement avec Supabase.
          </p>
          <Link href="/test-connexion" className="btn btn-secondary">
            Tester la connexion
          </Link>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 640 }}>
        <h3 style={{ marginBottom: "var(--s2)" }}>À propos</h3>
        <p style={{ color: "var(--text-2)", fontSize: "var(--tsm)" }}>
          Calcul de paie conforme à la réglementation algérienne : SNMG, barème IRG (Art. 104 CIDTA), cotisations
          CNAS, heures supplémentaires et primes.
        </p>
      </div>
    </div>
  );
}
