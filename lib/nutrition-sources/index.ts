import type { NutritionSource, SourceId } from "./types";
import { offSource } from "./off";
import { bedcaSource } from "./bedca";
import { mercadonaSource } from "./mercadona";
import { usdaSource } from "./usda";

// Registro de fuentes nutricionales. Añadir una fuente = registrarla aquí.
export const SOURCES: NutritionSource[] = [
  offSource,
  bedcaSource,
  mercadonaSource,
  usdaSource,
];

export function getSource(id: SourceId): NutritionSource | undefined {
  return SOURCES.find((s) => s.id === id);
}

export type { NutritionSource, NutritionCandidate, SourceId } from "./types";
