import { createClient } from "@supabase/supabase-js";

// Ces deux valeurs viennent de : Supabase Dashboard > Project Settings > API
// Elles sont publiques côté navigateur (clé "anon"), c'est normal et prévu par Supabase.
// La vraie protection se fait via les policies RLS définies dans 01_schema_supabase.sql.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
