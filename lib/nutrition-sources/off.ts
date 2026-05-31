import {
  fetchJson,
  num,
  type NutritionSource,
  type NutritionCandidate,
} from "./types";

type OFFProduct = {
  code?: string;
  product_name?: string;
  product_name_es?: string;
  brands?: string;
  serving_quantity?: string | number;
  nutriments?: Record<string, unknown>;
};

export const offSource: NutritionSource = {
  id: "off",
  label: "Open Food Facts",
  enabled: () => true,
  async search(term) {
    const url =
      "https://world.openfoodfacts.org/cgi/search.pl?" +
      new URLSearchParams({
        search_terms: term,
        search_simple: "1",
        action: "process",
        json: "1",
        page_size: "6",
        lc: "es",
        fields: "code,product_name,product_name_es,brands,serving_quantity,nutriments",
      }).toString();

    const data = (await fetchJson(url)) as { products?: OFFProduct[] };
    const products = data.products ?? [];

    return products
      .filter((p) => p.code && (p.product_name_es || p.product_name))
      .map<NutritionCandidate>((p) => {
        const n = p.nutriments ?? {};
        return {
          sourceId: "off",
          externalId: String(p.code),
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
      .filter((c) => c.kcalPer100 != null || c.proteinPer100 != null);
  },
};
