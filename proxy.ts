import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "@/auth.config";

// Instancia "edge-safe" de Auth.js solo para leer la sesión en el proxy
// (antes "middleware"; Next 16 renombró la convención a proxy.ts).
const { auth } = NextAuth(authConfig);

const PUBLIC_PATHS = ["/login"];
const CHANGE_PASSWORD_PATH = "/change-password";

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const isLoggedIn = !!session?.user;
  const path = nextUrl.pathname;

  const isPublic = PUBLIC_PATHS.includes(path);

  // No autenticado: solo puede ver rutas públicas.
  if (!isLoggedIn) {
    if (isPublic) return NextResponse.next();
    const loginUrl = new URL("/login", nextUrl);
    return NextResponse.redirect(loginUrl);
  }

  // Autenticado pero con contraseña temporal: forzar cambio antes que nada.
  const mustChange = session!.user.mustChangePassword;
  if (mustChange && path !== CHANGE_PASSWORD_PATH) {
    return NextResponse.redirect(new URL(CHANGE_PASSWORD_PATH, nextUrl));
  }

  // Ya no debe cambiar contraseña: fuera de la pantalla de cambio.
  if (!mustChange && path === CHANGE_PASSWORD_PATH) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // Autenticado en una ruta pública (login): mandar al dashboard.
  if (isPublic) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  // Ejecuta el proxy en todo salvo recursos estáticos y la API de auth.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
