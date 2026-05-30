"use server";

import { z } from "zod";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { auth, signIn, signOut, updateSession } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

/** Login con username + contraseña. Devuelve mensaje de error o redirige. */
export async function authenticate(
  _prev: string | null,
  formData: FormData,
): Promise<string | null> {
  try {
    await signIn("credentials", {
      username: formData.get("username"),
      password: formData.get("password"),
      redirectTo: "/dashboard",
    });
    return null;
  } catch (error) {
    if (error instanceof AuthError) {
      return "Usuario o contraseña incorrectos";
    }
    // Re-lanza el redirect interno de Next.js (NEXT_REDIRECT).
    throw error;
  }
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}

const schema = z
  .object({
    password: z.string().min(8, "Mínimo 8 caracteres"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Las contraseñas no coinciden",
    path: ["confirm"],
  });

export type ChangePasswordResult =
  | { ok: true }
  | { ok: false; error: string };

/** Cambia la contraseña del sim autenticado y quita el flag mustChangePassword. */
export async function changeOwnPassword(
  _prev: ChangePasswordResult | null,
  formData: FormData,
): Promise<ChangePasswordResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "No autenticado" };

  const parsed = schema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.sim.update({
    where: { id: session.user.id },
    data: { passwordHash, mustChangePassword: false },
  });

  // Refresca el token JWT para que el middleware deje de forzar el cambio.
  await updateSession({ user: { mustChangePassword: false } });

  redirect("/dashboard");
}
