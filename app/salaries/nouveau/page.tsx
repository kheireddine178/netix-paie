import { creerSalarie } from "../actions";

export default function NouveauSalariePage() {
  return (
    <main className="p-8 max-w-lg mx-auto font-sans">
      <h1 className="text-2xl font-bold mb-6">Nouveau salarié</h1>

      <form action={creerSalarie} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nom et prénom *</label>
          <input
            name="nom_prenom"
            required
            className="w-full border rounded px-3 py-2"
            placeholder="Ex: Amina Benali"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Matricule</label>
          <input name="matricule" className="w-full border rounded px-3 py-2" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Fonction</label>
          <input name="fonction" className="w-full border rounded px-3 py-2" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Salaire de base théorique (DA)
          </label>
          <input
            name="salaire_base_theorique"
            type="number"
            step="0.01"
            defaultValue={0}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <button
          type="submit"
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
        >
          Créer le salarié
        </button>
      </form>
    </main>
  );
}
