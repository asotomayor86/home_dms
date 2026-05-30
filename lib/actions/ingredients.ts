"use server";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-helpers";
import { createIngredientSchema, type CreateIngredientInput } from "@/lib/validation/recipe";

export type IngredientOption = {
  id: string;
  name: string;
  category: string;
  defaultUnit: string;
};

export type CreateIngredientResult =
  | { ok: true; ingredient: IngredientOption }
  | { ok: false; error: string };

/** Lista el catálogo de ingredientes (para el combobox). */
export async function listIngredients(): Promise<IngredientOption[]> {
  await requireSession();
  const rows = await prisma.ingredient.findMany({ orderBy: { name: "asc" } });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    defaultUnit: r.defaultUnit,
  }));
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
    const row = await prisma.ingredient.create({ data: parsed.data });
    return {
      ok: true,
      ingredient: {
        id: row.id,
        name: row.name,
        category: row.category,
        defaultUnit: row.defaultUnit,
      },
    };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "Ya existe un ingrediente con ese nombre" };
    }
    throw e;
  }
}
