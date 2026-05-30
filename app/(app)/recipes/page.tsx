import Link from "next/link";

import { requireSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { RecipeList } from "@/components/recipes/recipe-list";

export const dynamic = "force-dynamic";

export default async function RecipesPage() {
  await requireSession();

  const recipes = await prisma.recipe.findMany({
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
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Recetas</h1>
          <p className="text-muted-foreground">Catálogo común de recetas.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/recipes/seleccion">Mi menú</Link>
          </Button>
          <Button asChild>
            <Link href="/recipes/new">Nueva receta</Link>
          </Button>
        </div>
      </div>

      <RecipeList
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
        }))}
      />
    </div>
  );
}
