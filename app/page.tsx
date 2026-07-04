import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 font-sans">
      <h1 className="text-3xl font-bold">Netix Paie</h1>
      <p className="text-gray-500">Application de gestion de paie algérienne</p>
      <div className="flex gap-4">
        <Link href="/salaries" className="bg-black text-white px-5 py-2.5 rounded hover:bg-gray-800">
          Gérer les salariés
        </Link>
        <Link href="/test-connexion" className="border px-5 py-2.5 rounded hover:bg-gray-50">
          Test connexion Supabase
        </Link>
      </div>
    </main>
  );
}
