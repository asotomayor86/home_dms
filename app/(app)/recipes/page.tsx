import Link from "next/link";

import { requireSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { getSimHouseholds, resolveActiveHousehold } from "@/lib/households";
import { Button } from "@/components/ui/button";
import { HouseholdSwitcher } from "@/components/household-switcher";
import { RecipeList } from "@/components/recipes/recipe-list";

export const dynamic = "force-dynamic";

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: Promise<{ household?: string }>;
}) {
  const session = await requireSession();
  const { household } = await searchParams;

  const households = await getSimHouseholds(session.user.id);
  const activeHousehold = resolveActiveHousehold(households, household);

  const [recipes, starred] = await Promise.all([
    prisma.recipe.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        servings: true,
        prepMinutes: true,
        suitableForLunch: true,
        suitableForDinner: true,
        isActive: true,
        _count: { select: { ingredients: true } },
      },
    }),
    activeHousehold
      ? prisma.householdRecipe.findMany({
          where: { householdId: activeHousehold.id },
          select: { recipeId: true },
        })
      : Promise.resolve([]),
  ]);

  const starredIds = new Set(starred.map((s) => s.recipeId));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Recetas</h1>
          <p className="text-muted-foreground">
            Catálogo común. Marca con ★ las recetas disponibles para tu hogar.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeHousehold && households.length > 1 && (
            <HouseholdSwitcher households={households} activeId={activeHousehold.id} />
          )}
          <Button asChild variant="outline">
            <Link href="/recipes/seleccion">Mi menú</Link>
          </Button>
          <Button asChild>
            <Link href="/recipes/new">Nueva receta</Link>
          </Button>
        </div>
      </div>

      <RecipeList
        householdId={activeHousehold?.id ?? null}
        recipes={recipes.map((r) => ({
          id: r.id,
          name: r.name,
          description: r.description,
          servings: r.servings,
          prepMinutes: r.prepMinutes,
          suitableForLunch: r.suitableForLunch,
          suitableForDinner: r.suitableForDinner,
          isActive: r.isActive,
          ingredientCount: r._count.ingredients,
          starred: starredIds.has(r.id),
        }))}
      />
    </div>
  );
}
