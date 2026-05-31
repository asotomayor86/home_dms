"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { toast } from "sonner";

import {
  addRecipeToHousehold,
  removeRecipeFromHousehold,
} from "@/lib/actions/household-recipes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Estrella de disponibilidad: marca/desmarca una receta para el hogar activo
 * (toggle sobre HouseholdRecipe). Optimista, con reversión si falla.
 */
export function RecipeStarButton({
  householdId,
  recipeId,
  starred: initialStarred,
  size = "icon",
}: {
  householdId: string | null;
  recipeId: string;
  starred: boolean;
  size?: "icon" | "icon-sm";
}) {
  const router = useRouter();
  const [starred, setStarred] = useState(initialStarred);
  const [pending, start] = useTransition();

  function toggle(e: React.MouseEvent) {
    // Evita navegar si la estrella va dentro de un enlace (tarjeta).
    e.preventDefault();
    e.stopPropagation();

    if (!householdId) {
      toast.error("No perteneces a ningún hogar");
      return;
    }

    const next = !starred;
    setStarred(next);
    start(async () => {
      const res = next
        ? await addRecipeToHousehold(householdId, recipeId)
        : await removeRecipeFromHousehold(householdId, recipeId);
      if (!res.ok) {
        setStarred(!next);
        toast.error(res.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size={size}
      onClick={toggle}
      disabled={pending}
      aria-pressed={starred}
      aria-label={starred ? "Quitar de mi menú" : "Añadir a mi menú"}
      title={starred ? "Disponible para el hogar" : "Marcar como disponible"}
    >
      <Star
        className={cn(
          "size-4 transition-colors",
          starred ? "fill-foreground text-foreground" : "text-muted-foreground",
        )}
      />
    </Button>
  );
}
