import {
  fetchJson,
  num,
  type NutritionSource,
  type NutritionCandidate,
} from "./types";

// FoodData Central (USDA). Requiere USDA_API_KEY (gratuita). En inglés.
// Nutrientes por número estándar de FDC:
//   1008 Energy (kcal), 1003 Protein, 1005 Carbs, 1004 Fat, 1079 Fiber,
//   2000 Sugars, 1093 Sodium (mg) → sal = sodio×2.5/1000 (g).
type FDCNutrient = { nutrientNumber?: string; value?: number };
type FDCFood = {
  fdcId?: number;
  description?: string;
  brandOwner?: string;
  foodNutrients?: FDCNutrient[];
};

function byNumber(nutrients: FDCNutrient[], number: string): number | null {
  const n = nutrients.find((x) => x.nutrientNumber === number);
  return n ? num(n.value) : null;
}

export const usdaSource: NutritionSource = {
  id: "usda",
  label: "USDA (EE. UU.)",
  note: "En inglés. Requiere clave de API.",
  enabled: () => !!process.env.USDA_API_KEY,
  async search(term) {
    const key = process.env.USDA_API_KEY;
    if (!key) throw new Error("Fuente no configurada (falta USDA_API_KEY).");

    const url =
      "https://api.nal.usda.gov/fdc/v1/foods/search?" +
      new URLSearchParams({
        query: term,
        pageSize: "6",
        api_key: key,
      }).toString();

    const data = (await fetchJson(url)) as { foods?: FDCFood[] };
    const foods = data.foods ?? [];

    return foods
      .filter((f) => f.fdcId && f.description)
      .map<NutritionCandidate>((f) => {
        const nut = f.foodNutrients ?? [];
        const sodiumMg = byNumber(nut, "1093");
        return {
          sourceId: "usda",
          externalId: String(f.fdcId),
          name: f.description as string,
          brand: f.brandOwner ?? null,
          kcalPer100: byNumber(nut, "1008"),
          proteinPer100: byNumber(nut, "1003"),
          carbsPer100: byNumber(nut, "1005"),
          fatPer100: byNumber(nut, "1004"),
          fiberPer100: byNumber(nut, "1079"),
          sugarPer100: byNumber(nut, "2000"),
          saltPer100: sodiumMg != null ? num((sodiumMg * 2.5) / 1000) : null,
          servingGrams: null,
        };
      })
      .filter((c) => c.kcalPer100 != null || c.proteinPer100 != null);
  },
};
