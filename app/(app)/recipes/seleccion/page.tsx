import { requireSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { HouseholdRecipeSelector } from "@/components/recipes/household-recipe-selector";

export const dynamic = "force-dynamic";

export default async function RecipeSelectionPage({
  searchParams,
}: {
  searchParams: Promise<{ household?: string }>;
}) {
  const session = await requireSession();
  const { household } = await searchParams;

  // Hogares a los que pertenece el sim.
  const memberships = await prisma.membership.findMany({
    where: { simId: session.user.id },
    include: { household: { select: { id: true, name: true } } },
    orderBy: { household: { name: "asc" } },
  });
  const households = memberships.map((m) => m.household);

  if (households.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">Mi menú</h1>
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            No perteneces a ningún hogar todavía. Pídele a un administrador que te asigne a
            uno para poder elegir las recetas de su menú.
          </CardContent>
        </Card>
      </div>
    );
  }

  // Hogar activo: el del query param (si el sim pertenece) o el primero.
  const activeHousehold =
    households.find((h) => h.id === household) ?? households[0];

  const [recipes, selected] = await Promise.all([
    prisma.recipe.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        suitableForLunch: true,
        suitableForDinner: true,
      },
    }),
    prisma.householdRecipe.findMany({
      where: { householdId: activeHousehold.id },
      select: { recipeId: true },
    }),
  ]);

  const selectedIds = selected.map((s) => s.recipeId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Mi menú</h1>
        <p className="text-muted-foreground">
          Elige las recetas que tu hogar usará para generar el plan de comidas.
        </p>
      </div>

      <HouseholdRecipeSelector
        households={households}
        activeHouseholdId={activeHousehold.id}
        recipes={recipes}
        selectedIds={selectedIds}
      />
    </div>
  );
}
