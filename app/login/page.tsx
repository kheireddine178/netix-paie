"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseBrowser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur(null);

    startTransition(async () => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErreur("Identifiants incorrects ou compte inexistant.");
      } else {
        router.refresh();
        router.push("/dashboard");
      }
    });
  };

  return (
    <div className="landing" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--s4)" }}>
      <div className="nested-bezel-outer" style={{ width: "100%", maxWidth: 440 }}>
        <div className="nested-bezel-inner card" style={{ padding: "var(--s6)", background: "var(--surface)" }}>
          <div style={{ textAlign: "center", marginBottom: "var(--s5)" }}>
            <h1 style={{ fontSize: "24px", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text)" }}>Connexion</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "var(--tsm)", marginTop: 6 }}>
              Accédez à votre espace Netix SIRH &amp; Paie
            </p>
          </div>

          {erreur && (
            <div style={{ padding: "10px", background: "rgba(220, 38, 38, 0.08)", border: "1px solid rgba(220, 38, 38, 0.2)", borderRadius: "var(--r)", color: "var(--red)", fontSize: "var(--tsm)", marginBottom: "var(--s4)", textAlign: "center" }}>
              {erreur}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "var(--s4)" }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="email">Adresse Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nom@entreprise.dz"
                disabled={isPending}
              />
            </div>

            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="password">Mot de passe</label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isPending}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isPending}
              style={{ justifyContent: "center", padding: "12px", fontSize: "var(--tsm)", width: "100%", marginTop: "var(--s2)" }}
            >
              {isPending ? "Connexion en cours..." : "Se connecter"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
