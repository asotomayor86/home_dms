import {
  fetchJson,
  num,
  type NutritionSource,
  type NutritionCandidate,
} from "./types";

// FoodData Central (USDA). Requiere USDA_API_KEY (gratuita). En inglés.
// Los números de nutriente varían entre conjuntos de datos: SR Legacy usa los
// históricos (208 energía, 203 proteína, 205 carbos, 204 grasa, 291 fibra,
// 269 azúcar, 307 sodio); otros usan los nuevos (1008/1003/1005/1004/1079/2000/
// 1093). Aceptamos ambos. Sal = sodio(mg) × 2.5 / 1000 (g).
type FDCNutrient = { nutrientNumber?: string; value?: number };
type FDCFood = {
  fdcId?: number;
  description?: string;
  brandOwner?: string;
  foodNutrients?: FDCNutrient[];
};

const NUM = {
  energy: ["208", "1008"],
  protein: ["203", "1003"],
  carbs: ["205", "1005"],
  fat: ["204", "1004"],
  fiber: ["291", "1079"],
  sugar: ["269", "2000"],
  sodium: ["307", "1093"],
};

function byNumbers(nutrients: FDCNutrient[], numbers: string[]): number | null {
  for (const code of numbers) {
    const n = nutrients.find((x) => x.nutrientNumber === code);
    if (n) return num(n.value);
  }
  return null;
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
        pageSize: "8",
        // Prioriza alimentos genéricos/de referencia (frescos) sobre productos de marca.
        dataType: "Foundation,SR Legacy",
        api_key: key,
      }).toString();

    const data = (await fetchJson(url)) as { foods?: FDCFood[] };
    const foods = data.foods ?? [];

    return foods
      .filter((f) => f.fdcId && f.description)
      .map<NutritionCandidate>((f) => {
        const nut = f.foodNutrients ?? [];
        const sodiumMg = byNumbers(nut, NUM.sodium);
        return {
          sourceId: "usda",
          externalId: String(f.fdcId),
          name: f.description as string,
          brand: f.brandOwner ?? null,
          kcalPer100: byNumbers(nut, NUM.energy),
          proteinPer100: byNumbers(nut, NUM.protein),
          carbsPer100: byNumbers(nut, NUM.carbs),
          fatPer100: byNumbers(nut, NUM.fat),
          fiberPer100: byNumbers(nut, NUM.fiber),
          sugarPer100: byNumbers(nut, NUM.sugar),
          saltPer100: sodiumMg != null ? num((sodiumMg * 2.5) / 1000) : null,
          servingGrams: null,
        };
      })
      .filter((c) => c.kcalPer100 != null || c.proteinPer100 != null);
  },
};
