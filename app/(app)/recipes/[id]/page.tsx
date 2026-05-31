import { notFound } from "next/navigation";

import { requireSession, canManageRecipe } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { getSimHouseholds, resolveActiveHousehold } from "@/lib/households";
import { UNIT_LABELS } from "@/lib/validation/recipe";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecipeActions } from "@/components/recipes/recipe-actions";
import { RecipeStarButton } from "@/components/recipes/recipe-star-button";

export const dynamic = "force-dynamic";

function formatQuantity(quantity: number, unit: string) {
  if (unit === "AL_GUSTO") return "al gusto";
  const label = UNIT_LABELS[unit as keyof typeof UNIT_LABELS] ?? unit;
  // Evita decimales innecesarios (2 en vez de 2.0).
  const q = Number.isInteger(quantity) ? quantity : Number(quantity.toFixed(2));
  return `${q} ${label}`;
}

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();

  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: {
      createdBy: { select: { displayName: true } },
      ingredients: {
        include: { ingredient: { select: { name: true } } },
      },
    },
  });

  if (!recipe) notFound();

  const canManage = canManageRecipe(session.user, recipe);

  // Estrella: contexto del hogar activo del sim.
  const households = await getSimHouseholds(session.user.id);
  const activeHousehold = resolveActiveHousehold(households, undefined);
  const starred = activeHousehold
    ? !!(await prisma.householdRecipe.findUnique({
        where: {
          householdId_recipeId: { householdId: activeHousehold.id, recipeId: id },
        },
        select: { recipeId: true },
      }))
    : false;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{recipe.name}</h1>
            {activeHousehold && (
              <RecipeStarButton
                householdId={activeHousehold.id}
                recipeId={recipe.id}
                starred={starred}
              />
            )}
            {!recipe.isActive && <Badge variant="outline">Inactiva</Badge>}
          </div>
          {recipe.description && (
            <p className="mt-1 text-muted-foreground">{recipe.description}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {recipe.suitableForLunch && <Badge variant="secondary">Comida</Badge>}
            {recipe.suitableForDinner && <Badge variant="secondary">Cena</Badge>}
            <span className="ml-1 text-sm text-muted-foreground">
              {recipe.servings} raciones
              {recipe.prepMinutes != null && ` · ${recipe.prepMinutes} min`}
              {recipe.createdBy && ` · por ${recipe.createdBy.displayName}`}
            </span>
          </div>
        </div>
        {canManage && <RecipeActions id={recipe.id} isActive={recipe.isActive} />}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ingredientes</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2">
              {recipe.ingredients.map((ri) => (
                <li
                  key={ri.ingredientId}
                  className="flex items-baseline justify-between gap-3 border-b pb-1 text-sm last:border-0"
                >
                  <span className="font-medium">{ri.ingredient.name}</span>
                  <span className="text-muted-foreground">
                    {formatQuantity(ri.quantity, ri.unit)}
                    {ri.note ? ` · ${ri.note}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pasos</CardTitle>
          </CardHeader>
          <CardContent>
            {recipe.steps.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin pasos detallados.</p>
            ) : (
              <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm">
                {recipe.steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
