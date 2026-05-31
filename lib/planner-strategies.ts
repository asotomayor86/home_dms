import type { MealSlot } from "@prisma/client";

// Estrategias de selección de receta para la generación del menú. Diseñado para
// ser enchufable: hoy solo "random"; en el futuro se añadirán otras (p. ej.
// minimizar repeticiones, equilibrio nutricional, preferencias…).

export type StrategyId = "random";

export type CandidateRecipe = {
  id: string;
  suitableForLunch: boolean;
  suitableForDinner: boolean;
};

export type SlotToFill = {
  dayKey: string; // "YYYY-MM-DD"
  slot: MealSlot;
};

/** Una asignación propuesta por la estrategia. */
export type Assignment = {
  dayKey: string;
  slot: MealSlot;
  recipeId: string;
};

export type StrategyContext = {
  slots: SlotToFill[]; // huecos a rellenar
  pool: CandidateRecipe[]; // recetas disponibles (con corazón) del hogar
  /** Función de aleatoriedad inyectable (para tests/determinismo). */
  rng?: () => number;
};

export type Strategy = (ctx: StrategyContext) => Assignment[];

function aptFor(recipe: CandidateRecipe, slot: MealSlot): boolean {
  return slot === "LUNCH" ? recipe.suitableForLunch : recipe.suitableForDinner;
}

/**
 * Estrategia aleatoria: para cada hueco elige una receta apta al azar del pool.
 * Los huecos sin ninguna receta apta se omiten (no se asignan).
 */
const randomStrategy: Strategy = ({ slots, pool, rng = Math.random }) => {
  const out: Assignment[] = [];
  for (const { dayKey, slot } of slots) {
    const apt = pool.filter((r) => aptFor(r, slot));
    if (apt.length === 0) continue;
    const pick = apt[Math.floor(rng() * apt.length)];
    out.push({ dayKey, slot, recipeId: pick.id });
  }
  return out;
};

const STRATEGIES: Record<StrategyId, Strategy> = {
  random: randomStrategy,
};

export function getStrategy(id: StrategyId): Strategy {
  return STRATEGIES[id] ?? randomStrategy;
}

export const STRATEGY_LABELS: Record<StrategyId, string> = {
  random: "Aleatorio",
};
