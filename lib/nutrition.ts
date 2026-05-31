import type { MealNutrition } from "@/lib/actions/planner";
import { NUTRIENTS, type NutrientKey } from "@/lib/validation/recipe";

export type NutritionTotals = Record<NutrientKey, number>;

// ──────────────────────────────────────────────────────────────────────────
// Cálculo de la nutrición de una receta a partir de sus ingredientes.
// ──────────────────────────────────────────────────────────────────────────

/** Campo "por 100 g" del ingrediente correspondiente a cada nutriente de receta. */
export const PER100_FIELD: Record<NutrientKey, string> = {
  calories: "kcalPer100",
  protein: "proteinPer100",
  carbs: "carbsPer100",
  fat: "fatPer100",
  fiber: "fiberPer100",
  sugar: "sugarPer100",
  salt: "saltPer100",
};

/** Unidades que se miden directamente en peso/volumen (densidad≈1 para líquidos). */
const DIRECT_GRAMS: Record<string, number> = {
  GRAMO: 1,
  KILOGRAMO: 1000,
  MILILITRO: 1,
  LITRO: 1000,
};

/**
 * Convierte una cantidad+unidad a gramos. Para unidades "por pieza"
 * (UNIDAD/DIENTE/LATA/MANOJO/cucharadas/pizca) usa gramsPerUnit del ingrediente.
 * Devuelve null si no se puede determinar (→ el ingrediente no entra en el cálculo).
 * AL_GUSTO devuelve 0 (no aporta).
 */
export function toGrams(
  quantity: number,
  unit: string,
  gramsPerUnit: number | null | undefined,
): number | null {
  if (unit === "AL_GUSTO") return 0;
  const direct = DIRECT_GRAMS[unit];
  if (direct != null) return quantity * direct;
  // Resto de unidades: requieren gramsPerUnit.
  if (gramsPerUnit == null) return null;
  return quantity * gramsPerUnit;
}

export type CalcIngredient = {
  name: string;
  quantity: number;
  unit: string;
  gramsPerUnit: number | null;
  per100: Partial<Record<NutrientKey, number | null>>;
};

export type RecipeOverride = Partial<Record<NutrientKey, number | null>>;

export type ComputedNutrition = {
  /** Valor por ración por nutriente (override si existe; si no, calculado). null si nada). */
  values: Record<NutrientKey, number | null>;
  /** true si algún ingrediente no pudo computarse (faltan datos o gramos). */
  partial: boolean;
  /** Ingredientes que no se pudieron incluir en el cálculo. */
  missing: string[];
};

/**
 * Nutrición POR RACIÓN de una receta. Por cada nutriente, devuelve el override
 * de la receta si está informado; si no, la suma de los ingredientes ÷ raciones.
 */
export function nutritionForRecipe(params: {
  servings: number;
  override: RecipeOverride;
  ingredients: CalcIngredient[];
}): ComputedNutrition {
  const { servings, override, ingredients } = params;
  const servingsDiv = servings > 0 ? servings : 1;

  const calc = emptyTotals();
  const missing: string[] = [];
  let contributors = 0; // ingredientes que sí aportaron datos

  for (const ing of ingredients) {
    const grams = toGrams(ing.quantity, ing.unit, ing.gramsPerUnit);
    if (grams === null) {
      missing.push(ing.name);
      continue;
    }
    if (grams === 0) continue; // AL_GUSTO, no aporta
    // Si el ingrediente no tiene NINGÚN dato nutricional, también es "missing".
    const hasAny = NUTRIENTS.some((n) => typeof ing.per100[n.key] === "number");
    if (!hasAny) {
      missing.push(ing.name);
      continue;
    }
    contributors++;
    for (const n of NUTRIENTS) {
      const per100 = ing.per100[n.key];
      if (typeof per100 === "number") {
        calc[n.key] += (per100 * grams) / 100;
      }
    }
  }

  const values = {} as Record<NutrientKey, number | null>;
  for (const n of NUTRIENTS) {
    const ov = override[n.key];
    if (typeof ov === "number") {
      values[n.key] = ov;
    } else {
      // Calculado por ración. Si ningún ingrediente aportó datos, queda null.
      values[n.key] = contributors > 0 ? calc[n.key] / servingsDiv : null;
    }
  }

  return { values, partial: missing.length > 0, missing };
}

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
