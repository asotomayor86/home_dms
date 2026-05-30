import { requireSession } from "@/lib/auth-helpers";
import { listIngredients } from "@/lib/actions/ingredients";
import { RecipeForm } from "@/components/recipes/recipe-form";

export const dynamic = "force-dynamic";

export default async function NewRecipePage() {
  await requireSession();
  const ingredients = await listIngredients();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Nueva receta</h1>
      <RecipeForm ingredients={ingredients} />
    </div>
  );
}
