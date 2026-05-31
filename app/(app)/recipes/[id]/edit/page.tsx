import { notFound, redirect } from "next/navigation";

import { requireSession, canManageRecipe } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { listIngredients } from "@/lib/actions/ingredients";
import { UNITS } from "@/lib/validation/recipe";
import { RecipeForm, type RecipeFormInitial } from "@/components/recipes/recipe-form";

export const dynamic = "force-dynamic";

export default async function EditRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();

  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: { ingredients: true },
  });
  if (!recipe) notFound();
  if (!canManageRecipe(session.user, recipe)) redirect(`/recipes/${id}`);

  const ingredients = await listIngredients();

  const initial: RecipeFormInitial = {
    id: recipe.id,
    name: recipe.name,
    description: recipe.description ?? "",
    servings: recipe.servings,
    prepMinutes: recipe.prepMinutes,
    suitableForLunch: recipe.suitableForLunch,
    suitableForDinner: recipe.suitableForDinner,
    steps: recipe.steps,
    ingredients: recipe.ingredients.map((ri) => ({
      ingredientId: ri.ingredientId,
      quantity: ri.quantity,
      unit: ri.unit as (typeof UNITS)[number],
      note: ri.note,
    })),
    nutrition: {
      calories: recipe.calories,
      protein: recipe.protein,
      carbs: recipe.carbs,
      fat: recipe.fat,
      fiber: recipe.fiber,
      sugar: recipe.sugar,
      salt: recipe.salt,
    },
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Editar receta</h1>
      <RecipeForm ingredients={ingredients} initial={initial} />
    </div>
  );
}
