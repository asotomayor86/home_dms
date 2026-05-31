import type { NutritionSource, SourceId } from "./types";
import { offSource } from "./off";
import { mercadonaSource } from "./mercadona";
import { usdaSource } from "./usda";

// Registro de fuentes nutricionales. Añadir una fuente = registrarla aquí.
// (BEDCA se retiró: su servicio web no devolvía macros de forma fiable.)
export const SOURCES: NutritionSource[] = [offSource, usdaSource, mercadonaSource];

export function getSource(id: SourceId): NutritionSource | undefined {
  return SOURCES.find((s) => s.id === id);
}

export type { NutritionSource, NutritionCandidate, SourceId } from "./types";
