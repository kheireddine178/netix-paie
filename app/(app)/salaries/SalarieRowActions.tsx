"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { desactiverSalarie, reactiverSalarie, supprimerSalarieDefinitif } from "./actions";

export default function SalarieRowActions({
  id,
  actif,
}: {
  id: number;
  actif: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDesactiver() {
    if (!confirm("Désactiver ce salarié ? Son historique de bulletins sera conservé.")) return;
    startTransition(async () => {
      await desactiverSalarie(id);
      router.refresh();
    });
  }

  function handleReactiver() {
    startTransition(async () => {
      await reactiverSalarie(id);
      router.refresh();
    });
  }

  function handleSupprimer() {
    if (
      !confirm(
        "⚠️ SUPPRESSION DÉFINITIVE\n\nCette action supprimera le salarié ET tout son historique de bulletins de paie.\n\nCette action est IRRÉVERSIBLE. Continuer ?"
      )
    )
      return;
    startTransition(async () => {
      await supprimerSalarieDefinitif(id);
      router.refresh();
    });
  }

  return (
    <div style={{ display: "flex", gap: "var(--s3)", justifyContent: "flex-end" }}>
      {actif ? (
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleDesactiver}
          disabled={isPending}
        >
          Désactiver
        </button>
      ) : (
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleReactiver}
          disabled={isPending}
        >
          Réactiver
        </button>
      )}
      <button
        type="button"
        className="btn btn-sm"
        style={{ color: "var(--red-600)", borderColor: "var(--red-600)" }}
        onClick={handleSupprimer}
        disabled={isPending}
      >
        Supprimer
      </button>
    </div>
  );
}
