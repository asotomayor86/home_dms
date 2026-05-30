"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import type { ActionResult } from "@/lib/actions/households";

export async function addMembership(
  simId: string,
  householdId: string,
): Promise<ActionResult> {
  await requireAdmin();
  try {
    await prisma.membership.create({ data: { simId, householdId } });
  } catch (e) {
    // P2002 = ya existe (clave única simId+householdId). Lo tratamos como éxito idempotente.
    if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) {
      throw e;
    }
  }
  revalidatePath("/admin/sims");
  return { ok: true };
}

export async function removeMembership(
  simId: string,
  householdId: string,
): Promise<ActionResult> {
  await requireAdmin();
  await prisma.membership.deleteMany({ where: { simId, householdId } });
  revalidatePath("/admin/sims");
  return { ok: true };
}
