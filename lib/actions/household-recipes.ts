"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireSession, isMemberOf } from "@/lib/auth-helpers";

export type SimpleResult = { ok: true } | { ok: false; error: string };

export async function addRecipeToHousehold(
  householdId: string,
  recipeId: string,
): Promise<SimpleResult> {
  const session = await requireSession();
  if (!(await isMemberOf(session.user.id, householdId))) {
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
  revalidatePath("/recipes");
  revalidatePath("/calendario");
  return { ok: true };
}

export async function removeRecipeFromHousehold(
  householdId: string,
  recipeId: string,
): Promise<SimpleResult> {
  const session = await requireSession();
  if (!(await isMemberOf(session.user.id, householdId))) {
    return { ok: false, error: "No perteneces a ese hogar" };
  }

  await prisma.householdRecipe.deleteMany({ where: { householdId, recipeId } });
  revalidatePath("/recipes/seleccion");
  revalidatePath("/recipes");
  revalidatePath("/calendario");
  return { ok: true };
}
