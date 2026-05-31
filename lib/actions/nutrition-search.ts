"use server";

import { requireSession } from "@/lib/auth-helpers";
import { SOURCES, getSource } from "@/lib/nutrition-sources";
import type { NutritionCandidate, SourceId } from "@/lib/nutrition-sources/types";

export type SourceInfo = { id: SourceId; label: string; note?: string; enabled: boolean };

export type NutritionSearchResult =
  | { ok: true; candidates: NutritionCandidate[] }
  | { ok: false; error: string };

/** Fuentes disponibles (las deshabilitadas se marcan para la UI). */
export async function listSources(): Promise<SourceInfo[]> {
  await requireSession();
  return SOURCES.map((s) => ({
    id: s.id,
    label: s.label,
    note: s.note,
    enabled: s.enabled(),
  }));
}

/** Busca candidatos en una fuente concreta. Errores por fuente no rompen la app. */
export async function searchNutrition(
  term: string,
  sourceId: SourceId,
): Promise<NutritionSearchResult> {
  await requireSession();
  const q = term.trim();
  if (q.length < 2) return { ok: true, candidates: [] };

  const source = getSource(sourceId);
  if (!source) return { ok: false, error: "Fuente desconocida" };
  if (!source.enabled()) return { ok: false, error: "Fuente no configurada" };

  try {
    const candidates = await source.search(q);
    return { ok: true, candidates };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error en la fuente" };
  }
}
