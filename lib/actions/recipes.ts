"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireSession, canManageRecipe } from "@/lib/auth-helpers";
import { recipeSchema, type RecipeInput } from "@/lib/validation/recipe";

export type RecipeActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export type SimpleResult = { ok: true } | { ok: false; error: string };

function normalize(input: RecipeInput) {
  return {
    name: input.name,
    description: input.description?.trim() || null,
    servings: input.servings,
    prepMinutes: input.prepMinutes ?? null,
    suitableForLunch: input.suitableForLunch,
    suitableForDinner: input.suitableForDinner,
    calories: input.calories ?? null,
    protein: input.protein ?? null,
    carbs: input.carbs ?? null,
    fat: input.fat ?? null,
    fiber: input.fiber ?? null,
    sugar: input.sugar ?? null,
    salt: input.salt ?? null,
    steps: input.steps.map((s) => s.trim()).filter(Boolean),
    ingredients: input.ingredients.map((i) => ({
      ingredientId: i.ingredientId,
      quantity: i.quantity,
      unit: i.unit,
      note: i.note?.trim() || null,
    })),
  };
}

export async function createRecipe(input: RecipeInput): Promise<RecipeActionResult> {
  const session = await requireSession();
  const parsed = recipeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const data = normalize(parsed.data);

  const recipe = await prisma.recipe.create({
    data: {
      name: data.name,
      description: data.description,
      servings: data.servings,
      prepMinutes: data.prepMinutes,
      suitableForLunch: data.suitableForLunch,
      suitableForDinner: data.suitableForDinner,
      calories: data.calories,
      protein: data.protein,
      carbs: data.carbs,
      fat: data.fat,
      fiber: data.fiber,
      sugar: data.sugar,
      salt: data.salt,
      steps: data.steps,
      createdById: session.user.id,
      ingredients: { create: data.ingredients },
    },
  });

  revalidatePath("/recipes");
  return { ok: true, id: recipe.id };
}

export async function updateRecipe(
  id: string,
  input: RecipeInput,
): Promise<RecipeActionResult> {
  const session = await requireSession();
  const parsed = recipeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const existing = await prisma.recipe.findUnique({
    where: { id },
    select: { createdById: true },
  });
  if (!existing) return { ok: false, error: "La receta no existe" };
  if (!canManageRecipe(session.user, existing)) {
    return { ok: false, error: "No tienes permiso para editar esta receta" };
  }

  const data = normalize(parsed.data);

  // Reemplaza los ingredientes por completo (más simple y robusto que diff).
  await prisma.$transaction([
    prisma.recipeIngredient.deleteMany({ where: { recipeId: id } }),
    prisma.recipe.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        servings: data.servings,
        prepMinutes: data.prepMinutes,
        suitableForLunch: data.suitableForLunch,
        suitableForDinner: data.suitableForDinner,
        calories: data.calories,
        protein: data.protein,
        carbs: data.carbs,
        fat: data.fat,
        fiber: data.fiber,
        sugar: data.sugar,
        salt: data.salt,
        steps: data.steps,
        ingredients: { create: data.ingredients },
      },
    }),
  ]);

  revalidatePath("/recipes");
  revalidatePath(`/recipes/${id}`);
  return { ok: true, id };
}

export async function deleteRecipe(id: string): Promise<SimpleResult> {
  const session = await requireSession();
  const existing = await prisma.recipe.findUnique({
    where: { id },
    select: { createdById: true },
  });
  if (!existing) return { ok: false, error: "La receta no existe" };
  if (!canManageRecipe(session.user, existing)) {
    return { ok: false, error: "No tienes permiso para eliminar esta receta" };
  }

  // RecipeIngredient y HouseholdRecipe caen en cascada.
  await prisma.recipe.delete({ where: { id } });
  revalidatePath("/recipes");
  return { ok: true };
}

export async function toggleRecipeActive(id: string): Promise<SimpleResult> {
  const session = await requireSession();
  const existing = await prisma.recipe.findUnique({
    where: { id },
    select: { createdById: true, isActive: true },
  });
  if (!existing) return { ok: false, error: "La receta no existe" };
  if (!canManageRecipe(session.user, existing)) {
    return { ok: false, error: "No tienes permiso para modificar esta receta" };
  }

  await prisma.recipe.update({
    where: { id },
    data: { isActive: !existing.isActive },
  });
  revalidatePath("/recipes");
  revalidatePath(`/recipes/${id}`);
  return { ok: true };
}
