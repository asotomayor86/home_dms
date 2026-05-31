"use server";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";
import {
  createIngredientSchema,
  updateIngredientSchema,
  type CreateIngredientInput,
  type UpdateIngredientInput,
} from "@/lib/validation/recipe";

export type IngredientOption = {
  id: string;
  name: string;
  category: string;
  defaultUnit: string;
  // Nutrición por 100 g + gramos por unidad (para el cálculo de recetas).
  kcalPer100: number | null;
  proteinPer100: number | null;
  carbsPer100: number | null;
  fatPer100: number | null;
  fiberPer100: number | null;
  sugarPer100: number | null;
  saltPer100: number | null;
  gramsPerUnit: number | null;
  offId: string | null;
};

export type CreateIngredientResult =
  | { ok: true; ingredient: IngredientOption }
  | { ok: false; error: string };

export type SimpleResult = { ok: true } | { ok: false; error: string };

function toOption(r: {
  id: string;
  name: string;
  category: string;
  defaultUnit: string;
  kcalPer100: number | null;
  proteinPer100: number | null;
  carbsPer100: number | null;
  fatPer100: number | null;
  fiberPer100: number | null;
  sugarPer100: number | null;
  saltPer100: number | null;
  gramsPerUnit: number | null;
  offId: string | null;
}): IngredientOption {
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    defaultUnit: r.defaultUnit,
    kcalPer100: r.kcalPer100,
    proteinPer100: r.proteinPer100,
    carbsPer100: r.carbsPer100,
    fatPer100: r.fatPer100,
    fiberPer100: r.fiberPer100,
    sugarPer100: r.sugarPer100,
    saltPer100: r.saltPer100,
    gramsPerUnit: r.gramsPerUnit,
    offId: r.offId,
  };
}

/** Lista el catálogo de ingredientes (para el combobox y el cálculo). */
export async function listIngredients(): Promise<IngredientOption[]> {
  await requireSession();
  const rows = await prisma.ingredient.findMany({ orderBy: { name: "asc" } });
  return rows.map(toOption);
}

/** Normaliza campos nutricionales del input (number|null|undefined → number|null). */
function nutritionData(input: CreateIngredientInput) {
  return {
    kcalPer100: input.kcalPer100 ?? null,
    proteinPer100: input.proteinPer100 ?? null,
    carbsPer100: input.carbsPer100 ?? null,
    fatPer100: input.fatPer100 ?? null,
    fiberPer100: input.fiberPer100 ?? null,
    sugarPer100: input.sugarPer100 ?? null,
    saltPer100: input.saltPer100 ?? null,
    gramsPerUnit: input.gramsPerUnit ?? null,
    offId: input.offId ?? null,
  };
}

/** Crea un ingrediente nuevo en el catálogo (desde el combobox de la receta). */
export async function createIngredient(
  input: CreateIngredientInput,
): Promise<CreateIngredientResult> {
  await requireSession();
  const parsed = createIngredientSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  try {
    const row = await prisma.ingredient.create({
      data: {
        name: parsed.data.name,
        category: parsed.data.category,
        defaultUnit: parsed.data.defaultUnit,
        ...nutritionData(parsed.data),
      },
    });
    return { ok: true, ingredient: toOption(row) };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "Ya existe un ingrediente con ese nombre" };
    }
    throw e;
  }
}

/** Actualiza un ingrediente existente (nombre, categoría, unidad y nutrición). */
export async function updateIngredient(
  input: UpdateIngredientInput,
): Promise<CreateIngredientResult> {
  await requireSession();
  const parsed = updateIngredientSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  try {
    const row = await prisma.ingredient.update({
      where: { id: parsed.data.id },
      data: {
        name: parsed.data.name,
        category: parsed.data.category,
        defaultUnit: parsed.data.defaultUnit,
        ...nutritionData(parsed.data),
      },
    });
    revalidatePath("/recipes");
    return { ok: true, ingredient: toOption(row) };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "Ya existe un ingrediente con ese nombre" };
    }
    throw e;
  }
}
