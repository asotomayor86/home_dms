import type { MealNutrition } from "@/lib/actions/planner";
import { NUTRIENTS, type NutrientKey } from "@/lib/validation/recipe";

export type NutritionTotals = Record<NutrientKey, number>;

export function emptyTotals(): NutritionTotals {
  return NUTRIENTS.reduce((acc, n) => {
    acc[n.key] = 0;
    return acc;
  }, {} as NutritionTotals);
}

/** Suma los valores nutricionales (por ración) de un conjunto de comidas. */
export function sumNutrition(meals: { nutrition: MealNutrition }[]): NutritionTotals {
  const totals = emptyTotals();
  for (const m of meals) {
    for (const n of NUTRIENTS) {
      const v = m.nutrition[n.key];
      if (typeof v === "number") totals[n.key] += v;
    }
  }
  return totals;
}

/** Redondea para mostrar (sin decimales en kcal; 1 decimal en gramos). */
export function formatNutrient(key: NutrientKey, value: number): string {
  if (key === "calories") return String(Math.round(value));
  return (Math.round(value * 10) / 10).toString();
}
