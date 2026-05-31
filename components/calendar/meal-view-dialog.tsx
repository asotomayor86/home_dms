"use client";

import Link from "next/link";

import type { MealSlot } from "@prisma/client";
import type { PlannedMealView } from "@/lib/actions/planner";
import { parseDayKey } from "@/lib/date-utils";
import { NUTRIENTS } from "@/lib/validation/recipe";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SLOT_LABEL: Record<MealSlot, string> = { LUNCH: "Comida", DINNER: "Cena" };

function formatDay(dayKey: string): string {
  return parseDayKey(dayKey).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

/** Diálogo de solo lectura: muestra la receta asignada a un hueco y su nutrición. */
export function MealViewDialog({
  open,
  onOpenChange,
  slot,
  dayKey,
  meal,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  slot: MealSlot;
  dayKey: string;
  meal: PlannedMealView;
}) {
  const hasNutrition = NUTRIENTS.some((n) => meal.nutrition[n.key] != null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogDescription className="eyebrow">
            {SLOT_LABEL[slot]} · {formatDay(dayKey)}
          </DialogDescription>
          <DialogTitle>{meal.recipeName}</DialogTitle>
        </DialogHeader>

        {hasNutrition ? (
          <div className="grid grid-cols-2 gap-3 py-2 sm:grid-cols-4">
            {NUTRIENTS.map((n) => {
              const v = meal.nutrition[n.key];
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
        ) : (
          <p className="py-2 text-sm text-muted-foreground">
            Esta receta no tiene información nutricional.
          </p>
        )}

        <DialogFooter>
          <Button asChild variant="outline">
            <Link href={`/recipes/${meal.recipeId}`}>Ver receta completa</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
