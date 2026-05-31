"use client";

import { useState } from "react";
import Link from "next/link";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecipeStarButton } from "@/components/recipes/recipe-star-button";

type RecipeCard = {
  id: string;
  name: string;
  description: string | null;
  servings: number;
  prepMinutes: number | null;
  suitableForLunch: boolean;
  suitableForDinner: boolean;
  isActive: boolean;
  ingredientCount: number;
  starred: boolean;
};

export function RecipeList({
  recipes,
  householdId,
}: {
  recipes: RecipeCard[];
  householdId: string | null;
}) {
  const [query, setQuery] = useState("");

  const filtered = recipes.filter((r) =>
    r.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-4">
      <Input
        placeholder="Buscar receta…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-sm"
      />

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {recipes.length === 0
            ? "Aún no hay recetas. Crea la primera."
            : "Ninguna receta coincide con la búsqueda."}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <Link key={r.id} href={`/recipes/${r.id}`}>
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span className="flex-1">{r.name}</span>
                    {!r.isActive && (
                      <Badge variant="outline" className="font-normal">
                        Inactiva
                      </Badge>
                    )}
                    {householdId && (
                      <RecipeStarButton
                        householdId={householdId}
                        recipeId={r.id}
                        starred={r.starred}
                        size="icon-sm"
                      />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {r.description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {r.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {r.suitableForLunch && <Badge variant="secondary">Comida</Badge>}
                    {r.suitableForDinner && <Badge variant="secondary">Cena</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {r.servings} raciones · {r.ingredientCount} ingredientes
                    {r.prepMinutes != null && ` · ${r.prepMinutes} min`}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
