"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { Prisma, type GlobalRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { generateTempPassword, hashPassword } from "@/lib/password";

export type SimActionResult =
  | { ok: true }
  | { ok: false; error: string };

export type PasswordResult =
  | { ok: true; username: string; password: string }
  | { ok: false; error: string };

const createSchema = z.object({
  // username: minúsculas/números/._- para que sea fácil de comunicar.
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Mínimo 3 caracteres")
    .max(30)
    .regex(/^[a-z0-9._-]+$/, "Solo letras, números y . _ -"),
  displayName: z.string().trim().min(2, "Nombre demasiado corto").max(60),
  role: z.enum(["ADMIN", "USER"]),
});

export async function createSim(input: {
  username: string;
  displayName: string;
  role: GlobalRole;
}): Promise<PasswordResult> {
  await requireAdmin();
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const password = generateTempPassword();
  const passwordHash = await hashPassword(password);

  try {
    await prisma.sim.create({
      data: {
        username: parsed.data.username,
        displayName: parsed.data.displayName,
        globalRole: parsed.data.role,
        passwordHash,
        mustChangePassword: true,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "Ya existe un usuario con ese nombre" };
    }
    throw e;
  }

  revalidatePath("/admin/sims");
  revalidatePath("/admin");
  return { ok: true, username: parsed.data.username, password };
}

/** Genera una nueva contraseña temporal y la devuelve en claro para comunicarla. */
export async function regeneratePassword(simId: string): Promise<PasswordResult> {
  await requireAdmin();

  const password = generateTempPassword();
  const passwordHash = await hashPassword(password);

  const sim = await prisma.sim.update({
    where: { id: simId },
    data: { passwordHash, mustChangePassword: true },
    select: { username: true },
  });

  revalidatePath("/admin/sims");
  return { ok: true, username: sim.username, password };
}

export async function deleteSim(simId: string): Promise<SimActionResult> {
  const session = await requireAdmin();

  if (session.user.id === simId) {
    return { ok: false, error: "No puedes eliminar tu propia cuenta" };
  }

  const target = await prisma.sim.findUnique({ where: { id: simId } });
  if (!target) return { ok: false, error: "El usuario no existe" };

  if (target.globalRole === "ADMIN") {
    const admins = await prisma.sim.count({ where: { globalRole: "ADMIN" } });
    if (admins <= 1) {
      return { ok: false, error: "No puedes eliminar al último administrador" };
    }
  }

  await prisma.sim.delete({ where: { id: simId } });
  revalidatePath("/admin/sims");
  revalidatePath("/admin");
  return { ok: true };
}
