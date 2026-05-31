"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

import { getRecipeView, type RecipeFullView } from "@/lib/actions/recipes";
import { UNIT_LABELS, NUTRIENTS } from "@/lib/validation/recipe";
import { Button } from "@/components/ui/button";

function formatQuantity(quantity: number, unit: string) {
  if (unit === "AL_GUSTO") return "al gusto";
  const label = UNIT_LABELS[unit as keyof typeof UNIT_LABELS] ?? unit;
  const q = Number.isInteger(quantity) ? quantity : Number(quantity.toFixed(2));
  return `${q} ${label}`;
}

/**
 * Overlay a pantalla completa sobre el calendario con la receta completa. Carga
 * la receta on-demand al recibir un id. Cierre rápido: botón, clic en el fondo o
 * tecla Esc. No navega fuera del calendario.
 */
export function RecipeOverlay({
  recipeId,
  onClose,
}: {
  recipeId: string | null;
  onClose: () => void;
}) {
  // Guarda la receta cargada junto a su id, para derivar el estado de carga sin
  // setState síncrono en el effect.
  const [loaded, setLoaded] = useState<{ id: string; recipe: RecipeFullView | null } | null>(
    null,
  );
  const recipe = loaded && loaded.id === recipeId ? loaded.recipe : null;
  const loading = recipeId != null && (loaded === null || loaded.id !== recipeId);

  useEffect(() => {
    if (!recipeId) return;
    let active = true;
    getRecipeView(recipeId).then((r) => {
      if (active) setLoaded({ id: recipeId, recipe: r });
    });
    return () => {
      active = false;
    };
  }, [recipeId]);

  useEffect(() => {
    if (!recipeId) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [recipeId, onClose]);

  if (!recipeId) return null;

  const hasNutrition = recipe && NUTRIENTS.some((n) => recipe.nutrition[n.key] != null);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/80 p-4 backdrop-blur-sm sm:p-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-2xl border bg-background p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            {loading ? (
              <h2 className="text-2xl font-semibold">Cargando…</h2>
            ) : recipe ? (
              <>
                <h2 className="text-2xl font-semibold">{recipe.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {recipe.servings} raciones
                  {recipe.prepMinutes != null && ` · ${recipe.prepMinutes} min`}
                </p>
              </>
            ) : (
              <h2 className="text-2xl font-semibold">Receta no encontrada</h2>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar">
            <X className="size-5" />
          </Button>
        </div>

        {recipe && (
          <div className="flex flex-col gap-6">
            {recipe.description && (
              <p className="text-sm text-muted-foreground">{recipe.description}</p>
            )}

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <h3 className="eyebrow mb-2 text-muted-foreground">Ingredientes</h3>
                <ul className="flex flex-col gap-1.5 text-sm">
                  {recipe.ingredients.map((ri, i) => (
                    <li
                      key={i}
                      className="flex items-baseline justify-between gap-3 border-b pb-1 last:border-0"
                    >
                      <span className="font-medium">{ri.name}</span>
                      <span className="text-muted-foreground">
                        {formatQuantity(ri.quantity, ri.unit)}
                        {ri.note ? ` · ${ri.note}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="eyebrow mb-2 text-muted-foreground">Pasos</h3>
                {recipe.steps.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin pasos detallados.</p>
                ) : (
                  <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-sm">
                    {recipe.steps.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ol>
                )}
              </div>
            </div>

            {hasNutrition && (
              <div>
                <h3 className="eyebrow mb-2 text-muted-foreground">Nutrición · por ración</h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                  {NUTRIENTS.map((n) => {
                    const v = recipe.nutrition[n.key];
                    return (
                      <div key={n.key} className="flex flex-col">
                        <span className="eyebrow text-muted-foreground">{n.label}</span>
                        <span className="text-base font-semibold">
                          {v != null ? `${v} ${n.unit}` : "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button asChild variant="outline">
                <Link href={`/recipes/${recipe.id}`}>Abrir ficha</Link>
              </Button>
              <Button onClick={onClose}>Cerrar</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
