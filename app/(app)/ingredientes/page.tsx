import { requireSession } from "@/lib/auth-helpers";
import { listIngredients } from "@/lib/actions/ingredients";
import { IngredientManager } from "@/components/recipes/ingredient-manager";

export const dynamic = "force-dynamic";

export default async function IngredientsPage() {
  await requireSession();
  const ingredients = await listIngredients();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Ingredientes</h1>
        <p className="text-muted-foreground">
          Catálogo común. Define la nutrición por 100 g (puedes traerla de Open Food Facts) y
          los factores de conversión (cuántos gramos pesa 1 unidad, diente, lata…).
        </p>
      </div>

      <IngredientManager ingredients={ingredients} />
    </div>
  );
}
