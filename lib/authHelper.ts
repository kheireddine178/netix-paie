import { createClient } from "./supabaseServer";
import { redirect } from "next/navigation";

export async function checkPortalAccess(salarieId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, salarie_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  // Si l'utilisateur est un simple salarié, il est strictement limité à ses propres données
  if (profile.role === "Salarie" && profile.salarie_id !== salarieId) {
    if (profile.salarie_id) {
      redirect(`/portail/${profile.salarie_id}`);
    } else {
      redirect("/login");
    }
  }

  return { user, profile };
}

export async function checkAdminAccess() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, salarie_id")
    .eq("id", user.id)
    .single();

  if (!profile || !["Directeur", "Responsable RH", "Gestionnaire RH"].includes(profile.role)) {
    if (profile?.role === "Salarie" && profile.salarie_id) {
      redirect(`/portail/${profile.salarie_id}`);
    }
    redirect("/login");
  }

  return { user, profile };
}
