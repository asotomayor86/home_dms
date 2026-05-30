"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  addRecipeToHousehold,
  removeRecipeFromHousehold,
} from "@/lib/actions/household-recipes";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type HouseholdOption = { id: string; name: string };
type RecipeRow = {
  id: string;
  name: string;
  suitableForLunch: boolean;
  suitableForDinner: boolean;
};

export function HouseholdRecipeSelector({
  households,
  activeHouseholdId,
  recipes,
  selectedIds,
}: {
  households: HouseholdOption[];
  activeHouseholdId: string;
  recipes: RecipeRow[];
  selectedIds: string[];
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, start] = useTransition();

  // Estado optimista de las recetas seleccionadas.
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedIds));

  function changeHousehold(id: string) {
    // Recarga la página con el hogar elegido (el server trae su selección).
    router.push(`/recipes/seleccion?household=${id}`);
    router.refresh();
  }

  function toggle(recipeId: string, isSelected: boolean) {
    setPendingId(recipeId);
    // Optimista.
    setSelected((prev) => {
      const next = new Set(prev);
      if (isSelected) next.delete(recipeId);
      else next.add(recipeId);
      return next;
    });

    start(async () => {
      const res = isSelected
        ? await removeRecipeFromHousehold(activeHouseholdId, recipeId)
        : await addRecipeToHousehold(activeHouseholdId, recipeId);
      if (!res.ok) {
        toast.error(res.error);
        // Revertir si falla.
        setSelected((prev) => {
          const next = new Set(prev);
          if (isSelected) next.add(recipeId);
          else next.delete(recipeId);
          return next;
        });
      }
      setPendingId(null);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {households.length > 1 && (
        <div className="flex max-w-xs flex-col gap-2">
          <label className="text-sm font-medium">Hogar</label>
          <Select value={activeHouseholdId} onValueChange={changeHousehold}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {households.map((h) => (
                <SelectItem key={h.id} value={h.id}>
                  {h.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Recetas seleccionadas: {selected.size} / {recipes.length}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recipes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay recetas activas en el catálogo.
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {recipes.map((r) => {
                const isSelected = selected.has(r.id);
                return (
                  <li
                    key={r.id}
                    className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/50"
                  >
                    <Checkbox
                      id={`r-${r.id}`}
                      checked={isSelected}
                      disabled={pendingId === r.id}
                      onCheckedChange={() => toggle(r.id, isSelected)}
                    />
                    <label
                      htmlFor={`r-${r.id}`}
                      className="flex flex-1 cursor-pointer items-center justify-between gap-2"
                    >
                      <span className="text-sm font-medium">{r.name}</span>
                      <span className="flex gap-1">
                        {r.suitableForLunch && (
                          <Badge variant="secondary" className="text-xs">
                            Comida
                          </Badge>
                        )}
                        {r.suitableForDinner && (
                          <Badge variant="secondary" className="text-xs">
                            Cena
                          </Badge>
                        )}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
