import { fetchJson, type NutritionSource, type NutritionCandidate } from "./types";

// API NO OFICIAL de la tienda online de Mercadona. Best-effort: puede cambiar o
// bloquearse sin aviso. IMPORTANTE: Mercadona NO publica valores nutricionales
// (kcal, macros) en su API; solo la lista de ingredientes y alérgenos. Por eso
// esta fuente sirve para CONSULTAR de qué se compone un producto, no para
// autocompletar macros (que vendrán a null).

type MercaHit = { id?: string | number; slug?: string; brand?: string };
type MercaSearch = { hits?: MercaHit[]; results?: { hits?: MercaHit[] }[] };

type MercaProduct = {
  display_name?: string;
  brand?: string;
  nutrition_information?: { allergens?: string; ingredients?: string };
};

/** Limpia etiquetas HTML que Mercadona incrusta en alérgenos. */
function stripHtml(s: string | undefined): string {
  return (s ?? "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

/** Convierte un slug ("tomate-frito-hacendado") en un nombre legible. */
function slugToName(slug: string | undefined): string {
  if (!slug) return "Producto";
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export const mercadonaSource: NutritionSource = {
  id: "mercadona",
  label: "Mercadona",
  note: "Solo ingredientes y alérgenos (sin datos nutricionales).",
  enabled: () => true,
  async search(term) {
    const url =
      "https://7uzjkl1dj0-dsn.algolia.net/1/indexes/products_prod_4315_es/query";
    let hits: MercaHit[] = [];
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "HomeDMS/1.0 (gestion-domestica)",
          "x-algolia-application-id": "7UZJKL1DJ0",
          "x-algolia-api-key": "9d8f2e39e90df472b4f2e559a116fe17",
        },
        body: JSON.stringify({ params: `query=${encodeURIComponent(term)}&hitsPerPage=6` }),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`Mercadona respondió ${res.status}`);
      const data = (await res.json()) as MercaSearch;
      hits = data.hits ?? data.results?.[0]?.hits ?? [];
    } catch {
      throw new Error("No se pudo consultar Mercadona (búsqueda).");
    }

    const candidates: NutritionCandidate[] = [];
    for (const h of hits.slice(0, 5)) {
      if (!h.id) continue;
      let name = slugToName(h.slug);
      let info: string | null = null;
      try {
        const product = (await fetchJson(
          `https://tienda.mercadona.es/api/products/${h.id}/`,
          { timeoutMs: 6000 },
        )) as MercaProduct;
        if (product.display_name) name = product.display_name;
        const ni = product.nutrition_information;
        const parts: string[] = [];
        if (ni?.ingredients) parts.push(`Ingredientes: ${stripHtml(ni.ingredients)}`);
        const allergens = stripHtml(ni?.allergens);
        if (allergens && allergens !== "x99.") parts.push(`Alérgenos: ${allergens}`);
        info = parts.length ? parts.join(" · ") : null;
      } catch {
        // Detalle no disponible: candidato solo con el nombre del slug.
      }
      candidates.push({
        sourceId: "mercadona",
        externalId: String(h.id),
        name,
        brand: h.brand ?? "Mercadona",
        kcalPer100: null,
        proteinPer100: null,
        carbsPer100: null,
        fatPer100: null,
        fiberPer100: null,
        sugarPer100: null,
        saltPer100: null,
        servingGrams: null,
        info,
      });
    }
    return candidates;
  },
};
