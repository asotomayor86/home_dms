"use server";

import { requireSession } from "@/lib/auth-helpers";

// Integración con Open Food Facts: búsqueda de productos y extracción de los
// valores nutricionales por 100 g. Se ejecuta en servidor (evita CORS y centraliza
// el manejo de errores). No requiere API key.

export type OFFCandidate = {
  offId: string;
  name: string;
  brand: string | null;
  kcalPer100: number | null;
  proteinPer100: number | null;
  carbsPer100: number | null;
  fatPer100: number | null;
  fiberPer100: number | null;
  sugarPer100: number | null;
  saltPer100: number | null;
  /** Peso de una ración, si OFF lo indica (g). Sirve como pista para gramsPerUnit. */
  servingGrams: number | null;
};

export type OFFSearchResult =
  | { ok: true; candidates: OFFCandidate[] }
  | { ok: false; error: string };

function num(v: unknown): number | null {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

type OFFProduct = {
  code?: string;
  product_name?: string;
  product_name_es?: string;
  brands?: string;
  serving_quantity?: string | number;
  nutriments?: Record<string, unknown>;
};

/** Busca en Open Food Facts y devuelve hasta 5 candidatos con su nutrición/100 g. */
export async function searchOFF(term: string): Promise<OFFSearchResult> {
  await requireSession();
  const q = term.trim();
  if (q.length < 2) return { ok: true, candidates: [] };

  const url =
    "https://world.openfoodfacts.org/cgi/search.pl?" +
    new URLSearchParams({
      search_terms: q,
      search_simple: "1",
      action: "process",
      json: "1",
      page_size: "5",
      lc: "es",
      fields:
        "code,product_name,product_name_es,brands,serving_quantity,nutriments",
    }).toString();

  try {
    const res = await fetch(url, {
      headers: {
        // OFF pide identificar la app.
        "User-Agent": "HomeDMS/1.0 (gestion-domestica)",
      },
      // Evita que un OFF lento bloquee la acción indefinidamente.
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      return { ok: false, error: `Open Food Facts respondió ${res.status}` };
    }
    const data = (await res.json()) as { products?: OFFProduct[] };
    const products = data.products ?? [];

    const candidates: OFFCandidate[] = products
      .filter((p) => p.code && (p.product_name_es || p.product_name))
      .map((p) => {
        const n = p.nutriments ?? {};
        return {
          offId: String(p.code),
          name: (p.product_name_es || p.product_name) as string,
          brand: p.brands ? p.brands.split(",")[0].trim() : null,
          kcalPer100: num(n["energy-kcal_100g"]),
          proteinPer100: num(n["proteins_100g"]),
          carbsPer100: num(n["carbohydrates_100g"]),
          fatPer100: num(n["fat_100g"]),
          fiberPer100: num(n["fiber_100g"]),
          sugarPer100: num(n["sugars_100g"]),
          saltPer100: num(n["salt_100g"]),
          servingGrams: num(p.serving_quantity),
        };
      })
      // Descarta candidatos sin ningún dato nutricional útil.
      .filter((c) => c.kcalPer100 != null || c.proteinPer100 != null);

    return { ok: true, candidates };
  } catch {
    return {
      ok: false,
      error: "No se pudo consultar Open Food Facts (sin respuesta).",
    };
  }
}
