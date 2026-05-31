import { z } from "zod";

// Enums duplicados como literales zod (evita importar el runtime de Prisma en cliente).
export const UNITS = [
  "GRAMO",
  "KILOGRAMO",
  "MILILITRO",
  "LITRO",
  "UNIDAD",
  "CUCHARADA",
  "CUCHARADITA",
  "PIZCA",
  "DIENTE",
  "LATA",
  "MANOJO",
  "AL_GUSTO",
] as const;

export const INGREDIENT_CATEGORIES = [
  "VERDURA",
  "FRUTA",
  "CARNE",
  "PESCADO",
  "LACTEO",
  "HUEVOS",
  "PANADERIA",
  "DESPENSA",
  "CONGELADO",
  "BEBIDA",
  "CONDIMENTO",
  "OTRO",
] as const;

export const UNIT_LABELS: Record<(typeof UNITS)[number], string> = {
  GRAMO: "g",
  KILOGRAMO: "kg",
  MILILITRO: "ml",
  LITRO: "l",
  UNIDAD: "ud",
  CUCHARADA: "cda",
  CUCHARADITA: "cdta",
  PIZCA: "pizca",
  DIENTE: "diente",
  LATA: "lata",
  MANOJO: "manojo",
  AL_GUSTO: "al gusto",
};

export const CATEGORY_LABELS: Record<(typeof INGREDIENT_CATEGORIES)[number], string> = {
  VERDURA: "Verdura",
  FRUTA: "Fruta",
  CARNE: "Carne",
  PESCADO: "Pescado",
  LACTEO: "Lácteo",
  HUEVOS: "Huevos",
  PANADERIA: "Panadería",
  DESPENSA: "Despensa",
  CONGELADO: "Congelado",
  BEBIDA: "Bebida",
  CONDIMENTO: "Condimento",
  OTRO: "Otro",
};

export const recipeIngredientSchema = z.object({
  ingredientId: z.string().min(1, "Selecciona un ingrediente"),
  quantity: z.number().positive("La cantidad debe ser mayor que 0"),
  unit: z.enum(UNITS),
  note: z.string().trim().max(120).optional().or(z.literal("")),
});

// Campo nutricional opcional: número ≥ 0 o null (no informado).
const nutrientField = z.number().min(0).max(100000).optional().nullable();

export const NUTRIENTS = [
  { key: "calories", label: "Calorías", unit: "kcal" },
  { key: "protein", label: "Proteínas", unit: "g" },
  { key: "carbs", label: "Carbohidratos", unit: "g" },
  { key: "fat", label: "Grasas", unit: "g" },
  { key: "fiber", label: "Fibra", unit: "g" },
  { key: "sugar", label: "Azúcares", unit: "g" },
  { key: "salt", label: "Sal", unit: "g" },
] as const;

export type NutrientKey = (typeof NUTRIENTS)[number]["key"];

export const recipeSchema = z
  .object({
    name: z.string().trim().min(2, "Nombre demasiado corto").max(120),
    description: z.string().trim().max(500).optional().or(z.literal("")),
    servings: z.number().int().min(1, "Mínimo 1 ración").max(50),
    prepMinutes: z.number().int().min(0).max(1000).optional().nullable(),
    suitableForLunch: z.boolean(),
    suitableForDinner: z.boolean(),
    steps: z.array(z.string().trim().min(1)).max(40),
    ingredients: z
      .array(recipeIngredientSchema)
      .min(1, "Añade al menos un ingrediente"),
    calories: nutrientField,
    protein: nutrientField,
    carbs: nutrientField,
    fat: nutrientField,
    fiber: nutrientField,
    sugar: nutrientField,
    salt: nutrientField,
  })
  .refine((d) => d.suitableForLunch || d.suitableForDinner, {
    message: "La receta debe valer para comida, cena o ambas",
    path: ["suitableForLunch"],
  })
  .refine(
    (d) => new Set(d.ingredients.map((i) => i.ingredientId)).size === d.ingredients.length,
    { message: "Hay ingredientes repetidos", path: ["ingredients"] },
  );

export type RecipeInput = z.infer<typeof recipeSchema>;

export const createIngredientSchema = z.object({
  name: z.string().trim().min(2, "Nombre demasiado corto").max(80),
  category: z.enum(INGREDIENT_CATEGORIES),
  defaultUnit: z.enum(UNITS),
});

export type CreateIngredientInput = z.infer<typeof createIngredientSchema>;
