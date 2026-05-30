"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-helpers";

export type SimpleResult = { ok: true } | { ok: false; error: string };

/** Comprueba que el sim autenticado pertenece al hogar indicado. */
async function assertMembership(simId: string, householdId: string): Promise<boolean> {
  const m = await prisma.membership.findUnique({
    where: { simId_householdId: { simId, householdId } },
  });
  return !!m;
}

export async function addRecipeToHousehold(
  householdId: string,
  recipeId: string,
): Promise<SimpleResult> {
  const session = await requireSession();
  if (!(await assertMembership(session.user.id, householdId))) {
    return { ok: false, error: "No perteneces a ese hogar" };
  }

  try {
    await prisma.householdRecipe.create({ data: { householdId, recipeId } });
  } catch (e) {
    // Idempotente: si ya estaba seleccionada, no es error.
    if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) {
      throw e;
    }
  }
  revalidatePath("/recipes/seleccion");
  return { ok: true };
}

export async function removeRecipeFromHousehold(
  householdId: string,
  recipeId: string,
): Promise<SimpleResult> {
  const session = await requireSession();
  if (!(await assertMembership(session.user.id, householdId))) {
    return { ok: false, error: "No perteneces a ese hogar" };
  }

  await prisma.householdRecipe.deleteMany({ where: { householdId, recipeId } });
  revalidatePath("/recipes/seleccion");
  return { ok: true };
}
