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

/**
 * ¿Puede este sim gestionar (editar/borrar) una receta? El creador o cualquier
 * ADMIN. Las recetas sin autor (createdById null, p. ej. tras borrar al creador)
 * solo las gestiona un ADMIN.
 */
export function canManageRecipe(
  user: { id: string; role: "ADMIN" | "USER" },
  recipe: { createdById: string | null },
): boolean {
  return user.role === "ADMIN" || recipe.createdById === user.id;
}
