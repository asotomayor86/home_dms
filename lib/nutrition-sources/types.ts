// Tipos compartidos para las fuentes de datos nutricionales (registro enchufable).

export type SourceId = "off" | "bedca" | "mercadona" | "usda";

/** Candidato normalizado, común a todas las fuentes. Valores por 100 g. */
export type NutritionCandidate = {
  sourceId: SourceId;
  externalId: string; // id del producto/alimento en la fuente
  name: string;
  brand: string | null;
  kcalPer100: number | null;
  proteinPer100: number | null;
  carbsPer100: number | null;
  fatPer100: number | null;
  fiberPer100: number | null;
  sugarPer100: number | null;
  saltPer100: number | null;
  /** Peso de una ración si la fuente lo indica (g); pista para gramsPerUnit. */
  servingGrams: number | null;
  /** Texto informativo (p. ej. ingredientes/alérgenos) cuando la fuente no da macros. */
  info?: string | null;
};

export type NutritionSource = {
  id: SourceId;
  label: string;
  /** Nota breve para la UI (p. ej. "puede no estar disponible"). */
  note?: string;
  /** ¿Está disponible/configurada? (p. ej. USDA requiere API key). */
  enabled: () => boolean;
  /** Busca candidatos. Debe capturar sus propios errores y lanzar uno legible. */
  search: (term: string) => Promise<NutritionCandidate[]>;
};

/** Redondea a 2 decimales o null. */
export function num(v: unknown): number | null {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

/** fetch con timeout y User-Agent común; lanza Error legible si falla. */
export async function fetchJson(
  url: string,
  opts: { timeoutMs?: number; headers?: Record<string, string> } = {},
): Promise<unknown> {
  const res = await fetch(url, {
    headers: { "User-Agent": "HomeDMS/1.0 (gestion-domestica)", ...opts.headers },
    signal: AbortSignal.timeout(opts.timeoutMs ?? 8000),
  });
  if (!res.ok) throw new Error(`La fuente respondió ${res.status}`);
  return res.json();
}
