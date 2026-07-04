import { supabase } from "@/lib/supabaseClient";

export default async function TestConnexion() {
  const { data: rubriques, error, count } = await supabase
    .from("rubriques_catalogue")
    .select("code, libelle", { count: "exact" })
    .limit(10);

  const { data: parametres } = await supabase
    .from("parametres")
    .select("data")
    .single();

  return (
    <main className="p-8 max-w-2xl mx-auto font-sans">
      <h1 className="text-2xl font-bold mb-4">Test de connexion Supabase</h1>

      {error ? (
        <div className="bg-red-100 text-red-800 p-4 rounded">
          <p className="font-semibold">Erreur de connexion :</p>
          <p>{error.message}</p>
          <p className="mt-2 text-sm">
            Vérifie que .env.local contient bien NEXT_PUBLIC_SUPABASE_URL et
            NEXT_PUBLIC_SUPABASE_ANON_KEY, et redémarre le serveur (npm run dev).
          </p>
        </div>
      ) : (
        <>
          <div className="bg-green-100 text-green-800 p-4 rounded mb-6">
            ✅ Connexion réussie. Nombre total de rubriques dans le catalogue :{" "}
            <strong>{count}</strong> (doit afficher 402)
          </div>

          <h2 className="font-semibold mb-2">Aperçu (10 premières rubriques) :</h2>
          <ul className="list-disc pl-6 mb-6">
            {rubriques?.map((r) => (
              <li key={r.code}>
                <code>{r.code}</code> — {r.libelle}
              </li>
            ))}
          </ul>

          <h2 className="font-semibold mb-2">Paramètres de paie :</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(parametres?.data, null, 2)}
          </pre>
        </>
      )}
    </main>
  );
}
