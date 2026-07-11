require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from("salaries").insert({
    nom_prenom: "Drh Carbusud",
    matricule: "4039",
    fonction: "Poor",
    salaire_base_theorique: 0,
    date_visite_medicale: "2026-07-01",
  });
  console.log("Error:", error);
  console.log("Data:", data);
}
test();
