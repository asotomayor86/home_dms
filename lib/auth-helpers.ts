import { redirect } from "next/navigation";

import { auth } from "@/auth";

/** Devuelve la sesión o redirige a /login si no hay sesión. */
export async function requireSession() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

/** Igual que requireSession pero además exige globalRole = ADMIN. */
export async function requireAdmin() {
  const session = await requireSession();
  if (session.user.role !== "ADMIN") redirect("/dashboard");
  return session;
}
