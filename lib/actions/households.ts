"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

export type ActionResult = { ok: true } | { ok: false; error: string };

const nameSchema = z.string().trim().min(2, "Nombre demasiado corto").max(60);

export async function createHousehold(name: string): Promise<ActionResult> {
  await requireAdmin();
  const parsed = nameSchema.safeParse(name);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  await prisma.household.create({ data: { name: parsed.data } });
  revalidatePath("/admin/households");
  revalidatePath("/admin");
  return { ok: true };
}

export async function renameHousehold(id: string, name: string): Promise<ActionResult> {
  await requireAdmin();
  const parsed = nameSchema.safeParse(name);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  await prisma.household.update({ where: { id }, data: { name: parsed.data } });
  revalidatePath("/admin/households");
  return { ok: true };
}

export async function deleteHousehold(id: string): Promise<ActionResult> {
  await requireAdmin();
  // Las memberships se borran en cascada (onDelete: Cascade en el schema).
  await prisma.household.delete({ where: { id } });
  revalidatePath("/admin/households");
  revalidatePath("/admin");
  return { ok: true };
}
