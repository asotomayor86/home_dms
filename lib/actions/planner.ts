"use server";

import { revalidatePath } from "next/cache";
import type { MealSlot } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireSession, isMemberOf } from "@/lib/auth-helpers";
import { parseDayKey, utcDate } from "@/lib/date-utils";

export type SimpleResult = { ok: true } | { ok: false; error: string };

export type PlannedMealView = {
  id: string;
  dayKey: string; // "YYYY-MM-DD"
  slot: MealSlot;
  recipeId: string;
  recipeName: string;
};

/**
 * Asigna (o reemplaza) la receta de un hueco comida/cena en un día del hogar.
 * Valida pertenencia, que la receta tenga estrella en el hogar y sea apta.
 */
export async function setPlannedMeal(
  householdId: string,
  dayKey: string,
  slot: MealSlot,
  recipeId: string,
): Promise<SimpleResult> {
  const session = await requireSession();
  if (!(await isMemberOf(session.user.id, householdId))) {
    return { ok: false, error: "No perteneces a ese hogar" };
  }

  // La receta debe estar en el pool (estrella) del hogar.
  const inPool = await prisma.householdRecipe.findUnique({
    where: { householdId_recipeId: { householdId, recipeId } },
    select: { recipeId: true },
  });
  if (!inPool) {
    return { ok: false, error: "La receta no está marcada como disponible para el hogar" };
  }

  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    select: { suitableForLunch: true, suitableForDinner: true, isActive: true },
  });
  if (!recipe || !recipe.isActive) {
    return { ok: false, error: "La receta no existe o está inactiva" };
  }
  const apt = slot === "LUNCH" ? recipe.suitableForLunch : recipe.suitableForDinner;
  if (!apt) {
    return {
      ok: false,
      error: `La receta no es apta para ${slot === "LUNCH" ? "comida" : "cena"}`,
    };
  }

  const date = parseDayKey(dayKey);

  await prisma.plannedMeal.upsert({
    where: { householdId_date_slot: { householdId, date, slot } },
    update: { recipeId, createdById: session.user.id },
    create: { householdId, date, slot, recipeId, createdById: session.user.id },
  });

  revalidatePath("/calendario");
  return { ok: true };
}

/** Quita la receta de un hueco del calendario. */
export async function clearPlannedMeal(
  householdId: string,
  dayKey: string,
  slot: MealSlot,
): Promise<SimpleResult> {
  const session = await requireSession();
  if (!(await isMemberOf(session.user.id, householdId))) {
    return { ok: false, error: "No perteneces a ese hogar" };
  }

  const date = parseDayKey(dayKey);
  await prisma.plannedMeal.deleteMany({ where: { householdId, date, slot } });

  revalidatePath("/calendario");
  return { ok: true };
}

/**
 * Comidas planificadas de un mes (year, month 0-11) para un hogar. Incluye los
 * días de relleno de semanas adyacentes para que la cuadrícula no pierda nada.
 */
export async function getMonthPlan(
  householdId: string,
  year: number,
  month: number,
): Promise<PlannedMealView[]> {
  // Rango amplio: del día 1 del mes anterior al último del siguiente cubre el grid.
  const from = utcDate(year, month - 1, 1);
  const to = utcDate(year, month + 2, 0);

  const meals = await prisma.plannedMeal.findMany({
    where: { householdId, date: { gte: from, lte: to } },
    select: {
      id: true,
      date: true,
      slot: true,
      recipeId: true,
      recipe: { select: { name: true } },
    },
    orderBy: { date: "asc" },
  });

  return meals.map((m) => ({
    id: m.id,
    dayKey: m.date.toISOString().slice(0, 10),
    slot: m.slot,
    recipeId: m.recipeId,
    recipeName: m.recipe.name,
  }));
}
