import { createClient } from "./supabaseServer";

export async function checkPortalAccess(salarieId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, salarie_id")
      .eq("id", user.id)
      .single();

    if (profile) {
      return { user, profile };
    }
  }

  // Profil par défaut pour accès libre
  return {
    user: user || { id: "guest-user", email: "guest@netix.local" },
    profile: { role: "Directeur", salarie_id: salarieId },
  };
}

export async function checkAdminAccess() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, salarie_id")
      .eq("id", user.id)
      .single();

    if (profile) {
      return { user, profile };
    }
  }

  // Profil Directeur par défaut (accès complet à tous les modules)
  return {
    user: user || { id: "guest-user", email: "guest@netix.local" },
    profile: { role: "Directeur", salarie_id: null },
  };
}

