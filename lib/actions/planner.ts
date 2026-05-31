"use server";

import { revalidatePath } from "next/cache";
import type { MealSlot, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireSession, isMemberOf } from "@/lib/auth-helpers";
import { parseDayKey, dayKey as toDayKey, weekDays } from "@/lib/date-utils";
import {
  getStrategy,
  type SlotToFill,
  type StrategyId,
} from "@/lib/planner-strategies";

export type SimpleResult = { ok: true } | { ok: false; error: string };

export type GenerateMode = "fill" | "replace";
export type SlotScope = "all" | "lunch" | "dinner";

export type GenerateResult =
  | { ok: true; assigned: number; skipped: number }
  | { ok: false; error: string };

export type MealNutrition = {
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
  sugar: number | null;
  salt: number | null;
};

export type PlannedMealView = {
  id: string;
  dayKey: string; // "YYYY-MM-DD"
  slot: MealSlot;
  recipeId: string;
  recipeName: string;
  nutrition: MealNutrition;
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
 * Comidas planificadas de la semana (lunes→domingo) que empieza en `weekStartKey`
 * ("YYYY-MM-DD" del lunes) para un hogar.
 */
export async function getWeekPlan(
  householdId: string,
  weekStartKey: string,
): Promise<PlannedMealView[]> {
  const monday = parseDayKey(weekStartKey);
  const days = weekDays(monday);
  const from = days[0];
  const to = days[6];

  const meals = await prisma.plannedMeal.findMany({
    where: { householdId, date: { gte: from, lte: to } },
    select: {
      id: true,
      date: true,
      slot: true,
      recipeId: true,
      recipe: {
        select: {
          name: true,
          calories: true,
          protein: true,
          carbs: true,
          fat: true,
          fiber: true,
          sugar: true,
          salt: true,
        },
      },
    },
    orderBy: { date: "asc" },
  });

  return meals.map((m) => ({
    id: m.id,
    dayKey: m.date.toISOString().slice(0, 10),
    slot: m.slot,
    recipeId: m.recipeId,
    recipeName: m.recipe.name,
    nutrition: {
      calories: m.recipe.calories,
      protein: m.recipe.protein,
      carbs: m.recipe.carbs,
      fat: m.recipe.fat,
      fiber: m.recipe.fiber,
      sugar: m.recipe.sugar,
      salt: m.recipe.salt,
    },
  }));
}

/**
 * Genera automáticamente el menú de una semana (lunes→domingo) para el hogar
 * usando una estrategia (de momento solo "random"). `mode` decide si solo rellena
 * huecos vacíos ("fill") o regenera toda la semana ("replace"); `scope` limita a
 * comida/cena. `weekStartKey` es "YYYY-MM-DD" del lunes.
 */
export async function generateWeekPlan(params: {
  householdId: string;
  weekStartKey: string;
  mode: GenerateMode;
  scope: SlotScope;
  strategy?: StrategyId;
}): Promise<GenerateResult> {
  const { householdId, weekStartKey, mode, scope, strategy = "random" } = params;

  const session = await requireSession();
  if (!(await isMemberOf(session.user.id, householdId))) {
    return { ok: false, error: "No perteneces a ese hogar" };
  }

  // Pool del hogar (recetas con corazón, activas).
  const poolRows = await prisma.householdRecipe.findMany({
    where: { householdId, recipe: { isActive: true } },
    select: {
      recipe: { select: { id: true, suitableForLunch: true, suitableForDinner: true } },
    },
  });
  const pool = poolRows.map((p) => p.recipe);
  if (pool.length === 0) {
    return { ok: false, error: "No hay recetas marcadas como disponibles para el hogar" };
  }

  const slotsForScope: MealSlot[] =
    scope === "lunch" ? ["LUNCH"] : scope === "dinner" ? ["DINNER"] : ["LUNCH", "DINNER"];

  // Días de la semana objetivo.
  const days = weekDays(parseDayKey(weekStartKey));
  const weekStart = days[0];
  const weekEnd = days[6];

  const allSlots: SlotToFill[] = [];
  for (const day of days) {
    const key = toDayKey(day);
    for (const slot of slotsForScope) allSlots.push({ dayKey: key, slot });
  }

  // Huecos ya ocupados en la semana (para modo "fill" y para el borrado en "replace").
  const existing = await prisma.plannedMeal.findMany({
    where: {
      householdId,
      date: { gte: weekStart, lte: weekEnd },
      slot: { in: slotsForScope },
    },
    select: { date: true, slot: true },
  });
  const occupied = new Set(
    existing.map((e) => `${e.date.toISOString().slice(0, 10)}|${e.slot}`),
  );

  // En "replace" se reasignan todos los huecos del scope; en "fill" solo los vacíos.
  const targetSlots =
    mode === "replace"
      ? allSlots
      : allSlots.filter((s) => !occupied.has(`${s.dayKey}|${s.slot}`));

  if (targetSlots.length === 0) {
    return { ok: true, assigned: 0, skipped: 0 };
  }

  const assignments = getStrategy(strategy)({ slots: targetSlots, pool });

  // Persistencia atómica: en "replace" borramos el scope de la semana primero.
  const ops: Prisma.PrismaPromise<unknown>[] = [];
  if (mode === "replace") {
    ops.push(
      prisma.plannedMeal.deleteMany({
        where: {
          householdId,
          date: { gte: weekStart, lte: weekEnd },
          slot: { in: slotsForScope },
        },
      }),
    );
  }
  for (const a of assignments) {
    const date = parseDayKey(a.dayKey);
    ops.push(
      prisma.plannedMeal.upsert({
        where: { householdId_date_slot: { householdId, date, slot: a.slot } },
        update: { recipeId: a.recipeId, createdById: session.user.id },
        create: {
          householdId,
          date,
          slot: a.slot,
          recipeId: a.recipeId,
          createdById: session.user.id,
        },
      }),
    );
  }
  await prisma.$transaction(ops);

  revalidatePath("/calendario");
  return {
    ok: true,
    assigned: assignments.length,
    skipped: targetSlots.length - assignments.length,
  };
}
