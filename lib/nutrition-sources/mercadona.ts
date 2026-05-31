import {
  fetchJson,
  num,
  type NutritionSource,
  type NutritionCandidate,
} from "./types";

// API NO OFICIAL de la tienda online de Mercadona. Best-effort: puede cambiar o
// bloquearse sin aviso. Búsqueda vía su backend Algolia; nutrición en el detalle
// del producto. Sólo productos de marca (Hacendado, etc.).

type MercaSearchHit = { id?: string | number; display_name?: string };
type MercaSearch = { results?: { hits?: MercaSearchHit[] }[]; hits?: MercaSearchHit[] };

type MercaProduct = {
  id?: string | number;
  display_name?: string;
  nutrition_information?: { allergens?: string; ingredients?: string };
  details?: {
    nutrition_information?: {
      // Mercadona expone la nutrición como texto; intentamos varios campos.
      [k: string]: unknown;
    };
  };
};

// El detalle de Mercadona no ofrece macros estructurados de forma estable; por eso
// esta fuente devuelve candidatos por nombre pero con nutrición a null si no se
// puede extraer. Mantiene la utilidad de localizar el producto y su id.
export const mercadonaSource: NutritionSource = {
  id: "mercadona",
  label: "Mercadona",
  note: "No oficial; puede no estar disponible.",
  enabled: () => true,
  async search(term) {
    // Endpoint de búsqueda (Algolia) usado por la web de Mercadona.
    const url =
      "https://7uzjkl1dj0-dsn.algolia.net/1/indexes/products_prod_4315_es/query";
    let hits: MercaSearchHit[] = [];
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
    // Limita a 5 detalles para no abusar de la API.
    for (const h of hits.slice(0, 5)) {
      if (!h.id || !h.display_name) continue;
      let macros: Partial<NutritionCandidate> = {};
      try {
        const product = (await fetchJson(
          `https://tienda.mercadona.es/api/products/${h.id}/`,
          { timeoutMs: 6000 },
        )) as MercaProduct;
        macros = extractMacros(product);
      } catch {
        // Detalle no disponible: candidato sin macros (aún localiza el producto).
      }
      candidates.push({
        sourceId: "mercadona",
        externalId: String(h.id),
        name: h.display_name,
        brand: "Mercadona",
        kcalPer100: macros.kcalPer100 ?? null,
        proteinPer100: macros.proteinPer100 ?? null,
        carbsPer100: macros.carbsPer100 ?? null,
        fatPer100: macros.fatPer100 ?? null,
        fiberPer100: macros.fiberPer100 ?? null,
        sugarPer100: macros.sugarPer100 ?? null,
        saltPer100: macros.saltPer100 ?? null,
        servingGrams: null,
      });
    }
    return candidates;
  },
};

// Intenta extraer macros del detalle. La estructura de Mercadona no es estable;
// se hace de forma defensiva y se devuelve lo que se pueda.
function extractMacros(product: MercaProduct): Partial<NutritionCandidate> {
  const info = product.details?.nutrition_information;
  if (!info || typeof info !== "object") return {};
  const get = (k: string) => num((info as Record<string, unknown>)[k]);
  return {
    kcalPer100: get("calories") ?? get("energy"),
    proteinPer100: get("proteins") ?? get("protein"),
    carbsPer100: get("carbohydrates"),
    fatPer100: get("fats") ?? get("fat"),
    fiberPer100: get("fiber"),
    sugarPer100: get("sugars"),
    saltPer100: get("salt"),
  };
}
