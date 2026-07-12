import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Vérification de la session
  const { data: { user } } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();
  const isLoginRoute = url.pathname === "/login";
  
  // Routes d'administration à protéger
  const isAppRoute = 
    url.pathname.startsWith("/dashboard") ||
    url.pathname.startsWith("/salaries") ||
    url.pathname.startsWith("/conges") ||
    url.pathname.startsWith("/contrats") ||
    url.pathname.startsWith("/missions") ||
    url.pathname.startsWith("/carriere") ||
    url.pathname.startsWith("/formations") ||
    url.pathname.startsWith("/rubriques") ||
    url.pathname.startsWith("/saisie") ||
    url.pathname.startsWith("/parametres") ||
    url.pathname.startsWith("/rapports") ||
    url.pathname.startsWith("/historique");

  // Portail salarié à protéger (sauf la page d'accueil d'ESS qui sert de point d'entrée)
  const isPortailRoute = url.pathname.startsWith("/portail") && url.pathname !== "/portail";

  if (!user && (isAppRoute || isPortailRoute)) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isLoginRoute) {
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
