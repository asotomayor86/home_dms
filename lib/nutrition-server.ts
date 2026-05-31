import { prisma } from "@/lib/prisma";
import { nutritionForRecipe, type ComputedNutrition } from "@/lib/nutrition";
import type { NutrientKey } from "@/lib/validation/recipe";

// Cálculo de nutrición de recetas en servidor: construye los ingredientes con sus
// datos por 100 g + gramsPerUnit y aplica el override de la receta si existe.

type RecipeWithData = {
  servings: number;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
  sugar: number | null;
  salt: number | null;
  ingredients: {
    quantity: number;
    unit: string;
    ingredient: {
      name: string;
      gramsPerUnit: number | null;
      kcalPer100: number | null;
      proteinPer100: number | null;
      carbsPer100: number | null;
      fatPer100: number | null;
      fiberPer100: number | null;
      sugarPer100: number | null;
      saltPer100: number | null;
    };
  }[];
};

const recipeInclude = {
  ingredients: {
    include: {
      ingredient: {
        select: {
          name: true,
          gramsPerUnit: true,
          kcalPer100: true,
          proteinPer100: true,
          carbsPer100: true,
          fatPer100: true,
          fiberPer100: true,
          sugarPer100: true,
          saltPer100: true,
        },
      },
    },
  },
} as const;

export function computeNutrition(recipe: RecipeWithData): ComputedNutrition {
  return nutritionForRecipe({
    servings: recipe.servings,
    override: {
      calories: recipe.calories,
      protein: recipe.protein,
      carbs: recipe.carbs,
      fat: recipe.fat,
      fiber: recipe.fiber,
      sugar: recipe.sugar,
      salt: recipe.salt,
    },
    ingredients: recipe.ingredients.map((ri) => ({
      name: ri.ingredient.name,
      quantity: ri.quantity,
      unit: ri.unit,
      gramsPerUnit: ri.ingredient.gramsPerUnit,
      per100: {
        calories: ri.ingredient.kcalPer100,
        protein: ri.ingredient.proteinPer100,
        carbs: ri.ingredient.carbsPer100,
        fat: ri.ingredient.fatPer100,
        fiber: ri.ingredient.fiberPer100,
        sugar: ri.ingredient.sugarPer100,
        salt: ri.ingredient.saltPer100,
      },
    })),
  });
}

/** Nutrición calculada por ración de un conjunto de recetas (por id). */
export async function computeNutritionForRecipeIds(
  ids: string[],
): Promise<Map<string, Record<NutrientKey, number | null>>> {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return new Map();
  const recipes = await prisma.recipe.findMany({
    where: { id: { in: unique } },
    select: {
      id: true,
      servings: true,
      calories: true,
      protein: true,
      carbs: true,
      fat: true,
      fiber: true,
      sugar: true,
      salt: true,
      ...recipeInclude,
    },
  });
  const map = new Map<string, Record<NutrientKey, number | null>>();
  for (const r of recipes) {
    map.set(r.id, computeNutrition(r).values);
  }
  return map;
}
