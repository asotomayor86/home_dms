import type { IngredientCategory, Unit } from "@prisma/client";

// Catálogo de ingredientes y recetas para el seed. Los ingredientes se referencian
// por nombre desde las recetas; el seed los crea (upsert) y luego enlaza.

export type IngredientSeed = {
  name: string;
  category: IngredientCategory;
  defaultUnit: Unit;
  // Nutrición por 100 g (valores de referencia genéricos) y gramos por "unidad base".
  kcalPer100?: number;
  proteinPer100?: number;
  carbsPer100?: number;
  fatPer100?: number;
  fiberPer100?: number;
  sugarPer100?: number;
  saltPer100?: number;
  gramsPerUnit?: number;
};

export type RecipeIngredientSeed = {
  ingredient: string; // debe coincidir con un IngredientSeed.name
  quantity: number;
  unit?: Unit; // si se omite, se usa el defaultUnit del ingrediente
  note?: string;
};

export type Nutrition = {
  calories: number; // kcal por ración
  protein: number; // g
  carbs: number; // g
  fat: number; // g
  fiber: number; // g
  sugar: number; // g
  salt: number; // g
};

export type RecipeSeed = {
  name: string;
  description: string;
  servings: number;
  prepMinutes?: number;
  suitableForLunch: boolean;
  suitableForDinner: boolean;
  steps: string[];
  ingredients: RecipeIngredientSeed[];
  // Estimación por ración (referencia histórica). Ya NO se usa como override en el
  // seed: la nutrición se calcula desde los ingredientes. Se conserva como dato.
  nutrition?: Nutrition;
};

// Valores nutricionales por 100 g de referencia (genéricos, aprox.) y gramos por
// "unidad base". Sirven para que el cálculo de recetas funcione desde el seed; son
// editables después por ingrediente (también desde Open Food Facts).
export const INGREDIENTS: IngredientSeed[] = [
  // Verduras / hortalizas
  { name: "Cebolla", category: "VERDURA", defaultUnit: "UNIDAD", kcalPer100: 40, proteinPer100: 1.1, carbsPer100: 9, fatPer100: 0.1, fiberPer100: 1.7, sugarPer100: 4.2, saltPer100: 0, gramsPerUnit: 110 },
  { name: "Ajo", category: "VERDURA", defaultUnit: "DIENTE", kcalPer100: 149, proteinPer100: 6.4, carbsPer100: 33, fatPer100: 0.5, fiberPer100: 2.1, sugarPer100: 1, saltPer100: 0, gramsPerUnit: 5 },
  { name: "Tomate", category: "VERDURA", defaultUnit: "UNIDAD", kcalPer100: 18, proteinPer100: 0.9, carbsPer100: 3.9, fatPer100: 0.2, fiberPer100: 1.2, sugarPer100: 2.6, saltPer100: 0, gramsPerUnit: 120 },
  { name: "Tomate triturado", category: "DESPENSA", defaultUnit: "GRAMO", kcalPer100: 25, proteinPer100: 1.2, carbsPer100: 4.5, fatPer100: 0.2, fiberPer100: 1.4, sugarPer100: 4, saltPer100: 0.1 },
  { name: "Pimiento verde", category: "VERDURA", defaultUnit: "UNIDAD", kcalPer100: 20, proteinPer100: 0.9, carbsPer100: 3.9, fatPer100: 0.2, fiberPer100: 1.7, sugarPer100: 2.4, saltPer100: 0, gramsPerUnit: 150 },
  { name: "Pimiento rojo", category: "VERDURA", defaultUnit: "UNIDAD", kcalPer100: 31, proteinPer100: 1, carbsPer100: 6, fatPer100: 0.3, fiberPer100: 2.1, sugarPer100: 4.2, saltPer100: 0, gramsPerUnit: 150 },
  { name: "Patata", category: "VERDURA", defaultUnit: "GRAMO", kcalPer100: 77, proteinPer100: 2, carbsPer100: 17, fatPer100: 0.1, fiberPer100: 2.2, sugarPer100: 0.8, saltPer100: 0 },
  { name: "Zanahoria", category: "VERDURA", defaultUnit: "UNIDAD", kcalPer100: 41, proteinPer100: 0.9, carbsPer100: 10, fatPer100: 0.2, fiberPer100: 2.8, sugarPer100: 4.7, saltPer100: 0.1, gramsPerUnit: 70 },
  { name: "Calabacín", category: "VERDURA", defaultUnit: "UNIDAD", kcalPer100: 17, proteinPer100: 1.2, carbsPer100: 3.1, fatPer100: 0.3, fiberPer100: 1, sugarPer100: 2.5, saltPer100: 0, gramsPerUnit: 200 },
  { name: "Berenjena", category: "VERDURA", defaultUnit: "UNIDAD", kcalPer100: 25, proteinPer100: 1, carbsPer100: 6, fatPer100: 0.2, fiberPer100: 3, sugarPer100: 3.5, saltPer100: 0, gramsPerUnit: 250 },
  { name: "Lechuga", category: "VERDURA", defaultUnit: "UNIDAD", kcalPer100: 15, proteinPer100: 1.4, carbsPer100: 2.9, fatPer100: 0.2, fiberPer100: 1.3, sugarPer100: 0.8, saltPer100: 0, gramsPerUnit: 300 },
  { name: "Espinacas", category: "VERDURA", defaultUnit: "GRAMO", kcalPer100: 23, proteinPer100: 2.9, carbsPer100: 3.6, fatPer100: 0.4, fiberPer100: 2.2, sugarPer100: 0.4, saltPer100: 0.1 },
  { name: "Puerro", category: "VERDURA", defaultUnit: "UNIDAD", kcalPer100: 61, proteinPer100: 1.5, carbsPer100: 14, fatPer100: 0.3, fiberPer100: 1.8, sugarPer100: 3.9, saltPer100: 0, gramsPerUnit: 100 },
  { name: "Champiñones", category: "VERDURA", defaultUnit: "GRAMO", kcalPer100: 22, proteinPer100: 3.1, carbsPer100: 3.3, fatPer100: 0.3, fiberPer100: 1, sugarPer100: 2, saltPer100: 0 },
  { name: "Guisantes", category: "CONGELADO", defaultUnit: "GRAMO", kcalPer100: 81, proteinPer100: 5.4, carbsPer100: 14, fatPer100: 0.4, fiberPer100: 5.1, sugarPer100: 5.7, saltPer100: 0 },
  { name: "Judías verdes", category: "VERDURA", defaultUnit: "GRAMO", kcalPer100: 31, proteinPer100: 1.8, carbsPer100: 7, fatPer100: 0.2, fiberPer100: 3.4, sugarPer100: 3.3, saltPer100: 0 },
  { name: "Garbanzos cocidos", category: "DESPENSA", defaultUnit: "GRAMO", kcalPer100: 139, proteinPer100: 8.9, carbsPer100: 18, fatPer100: 2.6, fiberPer100: 5, sugarPer100: 0.5, saltPer100: 0.3 },
  { name: "Lentejas", category: "DESPENSA", defaultUnit: "GRAMO", kcalPer100: 116, proteinPer100: 9, carbsPer100: 20, fatPer100: 0.4, fiberPer100: 8, sugarPer100: 1.8, saltPer100: 0 },
  { name: "Arroz", category: "DESPENSA", defaultUnit: "GRAMO", kcalPer100: 360, proteinPer100: 7, carbsPer100: 79, fatPer100: 0.9, fiberPer100: 1.3, sugarPer100: 0.1, saltPer100: 0 },
  { name: "Pasta (macarrones)", category: "DESPENSA", defaultUnit: "GRAMO", kcalPer100: 359, proteinPer100: 12, carbsPer100: 72, fatPer100: 1.5, fiberPer100: 3, sugarPer100: 2.7, saltPer100: 0 },
  { name: "Espagueti", category: "DESPENSA", defaultUnit: "GRAMO", kcalPer100: 359, proteinPer100: 12, carbsPer100: 72, fatPer100: 1.5, fiberPer100: 3, sugarPer100: 2.7, saltPer100: 0 },
  { name: "Pan", category: "PANADERIA", defaultUnit: "UNIDAD", kcalPer100: 265, proteinPer100: 9, carbsPer100: 49, fatPer100: 3.2, fiberPer100: 2.7, sugarPer100: 3, saltPer100: 1.2, gramsPerUnit: 60 },
  { name: "Harina", category: "DESPENSA", defaultUnit: "GRAMO", kcalPer100: 364, proteinPer100: 10, carbsPer100: 76, fatPer100: 1, fiberPer100: 2.7, sugarPer100: 0.3, saltPer100: 0 },
  // Proteínas
  { name: "Huevo", category: "HUEVOS", defaultUnit: "UNIDAD", kcalPer100: 143, proteinPer100: 13, carbsPer100: 0.7, fatPer100: 9.5, fiberPer100: 0, sugarPer100: 0.4, saltPer100: 0.4, gramsPerUnit: 55 },
  { name: "Pollo (pechuga)", category: "CARNE", defaultUnit: "GRAMO", kcalPer100: 120, proteinPer100: 23, carbsPer100: 0, fatPer100: 2.6, fiberPer100: 0, sugarPer100: 0, saltPer100: 0.1 },
  { name: "Pollo (muslos)", category: "CARNE", defaultUnit: "GRAMO", kcalPer100: 177, proteinPer100: 19, carbsPer100: 0, fatPer100: 11, fiberPer100: 0, sugarPer100: 0, saltPer100: 0.2 },
  { name: "Carne picada de ternera", category: "CARNE", defaultUnit: "GRAMO", kcalPer100: 250, proteinPer100: 18, carbsPer100: 0, fatPer100: 20, fiberPer100: 0, sugarPer100: 0, saltPer100: 0.2 },
  { name: "Chorizo", category: "CARNE", defaultUnit: "GRAMO", kcalPer100: 455, proteinPer100: 24, carbsPer100: 2, fatPer100: 38, fiberPer100: 0, sugarPer100: 1, saltPer100: 2.7 },
  { name: "Bacon", category: "CARNE", defaultUnit: "GRAMO", kcalPer100: 380, proteinPer100: 14, carbsPer100: 1, fatPer100: 35, fiberPer100: 0, sugarPer100: 0, saltPer100: 2 },
  { name: "Atún en lata", category: "PESCADO", defaultUnit: "LATA", kcalPer100: 116, proteinPer100: 26, carbsPer100: 0, fatPer100: 1, fiberPer100: 0, sugarPer100: 0, saltPer100: 0.9, gramsPerUnit: 80 },
  { name: "Merluza", category: "PESCADO", defaultUnit: "GRAMO", kcalPer100: 71, proteinPer100: 17, carbsPer100: 0, fatPer100: 0.3, fiberPer100: 0, sugarPer100: 0, saltPer100: 0.2 },
  { name: "Gambas", category: "PESCADO", defaultUnit: "GRAMO", kcalPer100: 99, proteinPer100: 24, carbsPer100: 0.2, fatPer100: 0.3, fiberPer100: 0, sugarPer100: 0, saltPer100: 1.5 },
  // Lácteos
  { name: "Queso rallado", category: "LACTEO", defaultUnit: "GRAMO", kcalPer100: 380, proteinPer100: 27, carbsPer100: 2, fatPer100: 29, fiberPer100: 0, sugarPer100: 0.5, saltPer100: 1.8 },
  { name: "Leche", category: "LACTEO", defaultUnit: "MILILITRO", kcalPer100: 64, proteinPer100: 3.2, carbsPer100: 4.8, fatPer100: 3.6, fiberPer100: 0, sugarPer100: 4.8, saltPer100: 0.1 },
  { name: "Mantequilla", category: "LACTEO", defaultUnit: "GRAMO", kcalPer100: 717, proteinPer100: 0.9, carbsPer100: 0.1, fatPer100: 81, fiberPer100: 0, sugarPer100: 0.1, saltPer100: 0.1 },
  { name: "Nata para cocinar", category: "LACTEO", defaultUnit: "MILILITRO", kcalPer100: 195, proteinPer100: 2.6, carbsPer100: 3.4, fatPer100: 19, fiberPer100: 0, sugarPer100: 3.4, saltPer100: 0.1 },
  // Despensa / condimentos
  { name: "Aceite de oliva", category: "CONDIMENTO", defaultUnit: "CUCHARADA", kcalPer100: 884, proteinPer100: 0, carbsPer100: 0, fatPer100: 100, fiberPer100: 0, sugarPer100: 0, saltPer100: 0, gramsPerUnit: 14 },
  { name: "Sal", category: "CONDIMENTO", defaultUnit: "AL_GUSTO", kcalPer100: 0, proteinPer100: 0, carbsPer100: 0, fatPer100: 0, fiberPer100: 0, sugarPer100: 0, saltPer100: 100, gramsPerUnit: 6 },
  { name: "Pimienta negra", category: "CONDIMENTO", defaultUnit: "AL_GUSTO", kcalPer100: 251, proteinPer100: 10, carbsPer100: 64, fatPer100: 3.3, fiberPer100: 25, sugarPer100: 0.6, saltPer100: 0.1, gramsPerUnit: 2 },
  { name: "Pimentón dulce", category: "CONDIMENTO", defaultUnit: "CUCHARADITA", kcalPer100: 282, proteinPer100: 14, carbsPer100: 54, fatPer100: 13, fiberPer100: 35, sugarPer100: 10, saltPer100: 0.1, gramsPerUnit: 2.5 },
  { name: "Comino", category: "CONDIMENTO", defaultUnit: "CUCHARADITA", kcalPer100: 375, proteinPer100: 18, carbsPer100: 44, fatPer100: 22, fiberPer100: 11, sugarPer100: 2.3, saltPer100: 0.4, gramsPerUnit: 2 },
  { name: "Laurel", category: "CONDIMENTO", defaultUnit: "UNIDAD", kcalPer100: 313, proteinPer100: 7.6, carbsPer100: 75, fatPer100: 8.4, fiberPer100: 26, sugarPer100: 0, saltPer100: 0.1, gramsPerUnit: 0.2 },
  { name: "Caldo de pollo", category: "DESPENSA", defaultUnit: "MILILITRO", kcalPer100: 8, proteinPer100: 0.5, carbsPer100: 0.8, fatPer100: 0.3, fiberPer100: 0, sugarPer100: 0.3, saltPer100: 0.8 },
  { name: "Caldo de verduras", category: "DESPENSA", defaultUnit: "MILILITRO", kcalPer100: 6, proteinPer100: 0.3, carbsPer100: 0.9, fatPer100: 0.2, fiberPer100: 0, sugarPer100: 0.4, saltPer100: 0.8 },
  { name: "Azúcar", category: "DESPENSA", defaultUnit: "CUCHARADA", kcalPer100: 400, proteinPer100: 0, carbsPer100: 100, fatPer100: 0, fiberPer100: 0, sugarPer100: 100, saltPer100: 0, gramsPerUnit: 12 },
  { name: "Vino blanco", category: "BEBIDA", defaultUnit: "MILILITRO", kcalPer100: 82, proteinPer100: 0.1, carbsPer100: 2.6, fatPer100: 0, fiberPer100: 0, sugarPer100: 1, saltPer100: 0 },
  { name: "Limón", category: "FRUTA", defaultUnit: "UNIDAD", kcalPer100: 29, proteinPer100: 1.1, carbsPer100: 9, fatPer100: 0.3, fiberPer100: 2.8, sugarPer100: 2.5, saltPer100: 0, gramsPerUnit: 100 },
  { name: "Perejil", category: "CONDIMENTO", defaultUnit: "MANOJO", kcalPer100: 36, proteinPer100: 3, carbsPer100: 6, fatPer100: 0.8, fiberPer100: 3.3, sugarPer100: 0.9, saltPer100: 0.1, gramsPerUnit: 10 },
];

export const RECIPES: RecipeSeed[] = [
  {
    name: "Lentejas estofadas",
    description: "Guiso tradicional de lentejas con chorizo y verduras.",
    servings: 4,
    prepMinutes: 60,
    suitableForLunch: true,
    suitableForDinner: false,
    steps: [
      "Pochar la cebolla, el ajo, la zanahoria y el pimiento picados en aceite de oliva.",
      "Añadir el pimentón y rehogar unos segundos sin que se queme.",
      "Incorporar las lentejas, el chorizo en rodajas, el laurel y cubrir con caldo.",
      "Cocer a fuego medio unos 40 minutos hasta que las lentejas estén tiernas.",
      "Rectificar de sal y dejar reposar antes de servir.",
    ],
    ingredients: [
      { ingredient: "Lentejas", quantity: 400, unit: "GRAMO" },
      { ingredient: "Chorizo", quantity: 150, unit: "GRAMO" },
      { ingredient: "Cebolla", quantity: 1 },
      { ingredient: "Zanahoria", quantity: 2 },
      { ingredient: "Pimiento rojo", quantity: 1 },
      { ingredient: "Ajo", quantity: 2 },
      { ingredient: "Pimentón dulce", quantity: 1 },
      { ingredient: "Laurel", quantity: 1 },
      { ingredient: "Aceite de oliva", quantity: 3 },
      { ingredient: "Caldo de verduras", quantity: 1000 },
      { ingredient: "Sal", quantity: 1, unit: "AL_GUSTO" },
    ],
    nutrition: { calories: 410, protein: 22, carbs: 48, fat: 13, fiber: 16, sugar: 5, salt: 1.4 },
  },
  {
    name: "Tortilla de patatas",
    description: "Clásica tortilla española jugosa de patata y cebolla.",
    servings: 4,
    prepMinutes: 40,
    suitableForLunch: true,
    suitableForDinner: true,
    steps: [
      "Pelar y cortar las patatas en láminas finas; picar la cebolla.",
      "Freír las patatas y la cebolla a fuego suave en abundante aceite hasta que estén tiernas.",
      "Batir los huevos con sal y mezclar con las patatas escurridas.",
      "Cuajar la tortilla en la sartén por ambos lados hasta el punto deseado.",
    ],
    ingredients: [
      { ingredient: "Patata", quantity: 600, unit: "GRAMO" },
      { ingredient: "Huevo", quantity: 6 },
      { ingredient: "Cebolla", quantity: 1 },
      { ingredient: "Aceite de oliva", quantity: 6 },
      { ingredient: "Sal", quantity: 1, unit: "AL_GUSTO" },
    ],
    nutrition: { calories: 350, protein: 14, carbs: 28, fat: 21, fiber: 3, sugar: 3, salt: 0.9 },
  },
  {
    name: "Macarrones con tomate y chorizo",
    description: "Pasta con salsa de tomate casera y chorizo.",
    servings: 4,
    prepMinutes: 30,
    suitableForLunch: true,
    suitableForDinner: true,
    steps: [
      "Cocer los macarrones en agua con sal según el paquete y escurrir.",
      "Sofreír la cebolla y el ajo picados; añadir el chorizo en dados.",
      "Incorporar el tomate triturado y una pizca de azúcar; cocer 15 minutos.",
      "Mezclar la pasta con la salsa y servir con queso rallado por encima.",
    ],
    ingredients: [
      { ingredient: "Pasta (macarrones)", quantity: 320, unit: "GRAMO" },
      { ingredient: "Tomate triturado", quantity: 400, unit: "GRAMO" },
      { ingredient: "Chorizo", quantity: 100, unit: "GRAMO" },
      { ingredient: "Cebolla", quantity: 1 },
      { ingredient: "Ajo", quantity: 1 },
      { ingredient: "Azúcar", quantity: 1 },
      { ingredient: "Queso rallado", quantity: 60, unit: "GRAMO" },
      { ingredient: "Aceite de oliva", quantity: 2 },
      { ingredient: "Sal", quantity: 1, unit: "AL_GUSTO" },
    ],
    nutrition: { calories: 520, protein: 19, carbs: 68, fat: 19, fiber: 5, sugar: 8, salt: 1.3 },
  },
  {
    name: "Pollo al ajillo",
    description: "Pollo troceado y dorado con ajo y vino blanco.",
    servings: 4,
    prepMinutes: 40,
    suitableForLunch: true,
    suitableForDinner: true,
    steps: [
      "Salpimentar los muslos de pollo troceados.",
      "Dorar el pollo en aceite de oliva con los ajos laminados.",
      "Añadir el vino blanco y dejar evaporar el alcohol.",
      "Cocer a fuego medio 20 minutos; espolvorear perejil al servir.",
    ],
    ingredients: [
      { ingredient: "Pollo (muslos)", quantity: 800, unit: "GRAMO" },
      { ingredient: "Ajo", quantity: 6 },
      { ingredient: "Vino blanco", quantity: 150 },
      { ingredient: "Aceite de oliva", quantity: 4 },
      { ingredient: "Perejil", quantity: 1, unit: "AL_GUSTO" },
      { ingredient: "Sal", quantity: 1, unit: "AL_GUSTO" },
      { ingredient: "Pimienta negra", quantity: 1, unit: "AL_GUSTO" },
    ],
    nutrition: { calories: 390, protein: 38, carbs: 3, fat: 22, fiber: 0, sugar: 1, salt: 1.1 },
  },
  {
    name: "Crema de calabacín",
    description: "Crema suave de calabacín y puerro, ideal para cenar.",
    servings: 4,
    prepMinutes: 30,
    suitableForLunch: false,
    suitableForDinner: true,
    steps: [
      "Pochar el puerro picado en aceite de oliva.",
      "Añadir el calabacín y la patata troceados y rehogar unos minutos.",
      "Cubrir con caldo de verduras y cocer 20 minutos.",
      "Triturar hasta obtener una crema fina y rectificar de sal.",
    ],
    ingredients: [
      { ingredient: "Calabacín", quantity: 3 },
      { ingredient: "Puerro", quantity: 1 },
      { ingredient: "Patata", quantity: 200, unit: "GRAMO" },
      { ingredient: "Caldo de verduras", quantity: 800 },
      { ingredient: "Aceite de oliva", quantity: 2 },
      { ingredient: "Sal", quantity: 1, unit: "AL_GUSTO" },
    ],
    nutrition: { calories: 160, protein: 4, carbs: 18, fat: 8, fiber: 4, sugar: 7, salt: 0.9 },
  },
  {
    name: "Merluza a la plancha con limón",
    description: "Filetes de merluza a la plancha con un toque de limón.",
    servings: 2,
    prepMinutes: 20,
    suitableForLunch: true,
    suitableForDinner: true,
    steps: [
      "Salpimentar los lomos de merluza.",
      "Marcar en la plancha con un poco de aceite por ambos lados.",
      "Exprimir limón por encima y espolvorear perejil picado.",
    ],
    ingredients: [
      { ingredient: "Merluza", quantity: 400, unit: "GRAMO" },
      { ingredient: "Limón", quantity: 1 },
      { ingredient: "Aceite de oliva", quantity: 2 },
      { ingredient: "Perejil", quantity: 1, unit: "AL_GUSTO" },
      { ingredient: "Sal", quantity: 1, unit: "AL_GUSTO" },
    ],
    nutrition: { calories: 230, protein: 34, carbs: 2, fat: 9, fiber: 0, sugar: 0, salt: 1.0 },
  },
  {
    name: "Arroz con pollo y verduras",
    description: "Arroz seco con pollo, pimiento y guisantes.",
    servings: 4,
    prepMinutes: 45,
    suitableForLunch: true,
    suitableForDinner: false,
    steps: [
      "Dorar la pechuga de pollo en dados y reservar.",
      "Sofreír cebolla, ajo y pimiento picados.",
      "Añadir el arroz y rehogar; incorporar el pollo y los guisantes.",
      "Verter el caldo caliente y cocer unos 18 minutos; dejar reposar.",
    ],
    ingredients: [
      { ingredient: "Arroz", quantity: 320, unit: "GRAMO" },
      { ingredient: "Pollo (pechuga)", quantity: 400, unit: "GRAMO" },
      { ingredient: "Pimiento rojo", quantity: 1 },
      { ingredient: "Guisantes", quantity: 150, unit: "GRAMO" },
      { ingredient: "Cebolla", quantity: 1 },
      { ingredient: "Ajo", quantity: 2 },
      { ingredient: "Caldo de pollo", quantity: 800 },
      { ingredient: "Aceite de oliva", quantity: 3 },
      { ingredient: "Sal", quantity: 1, unit: "AL_GUSTO" },
    ],
    nutrition: { calories: 480, protein: 30, carbs: 62, fat: 11, fiber: 4, sugar: 4, salt: 1.2 },
  },
  {
    name: "Espaguetis a la carbonara",
    description: "Versión cremosa con bacon, huevo y queso.",
    servings: 2,
    prepMinutes: 25,
    suitableForLunch: true,
    suitableForDinner: true,
    steps: [
      "Cocer los espaguetis en agua con sal y reservar un poco del agua de cocción.",
      "Dorar el bacon en dados en una sartén.",
      "Batir los huevos con el queso rallado y pimienta.",
      "Fuera del fuego, mezclar la pasta caliente con el bacon y la crema de huevo, aflojando con agua de cocción.",
    ],
    ingredients: [
      { ingredient: "Espagueti", quantity: 200, unit: "GRAMO" },
      { ingredient: "Bacon", quantity: 120, unit: "GRAMO" },
      { ingredient: "Huevo", quantity: 3 },
      { ingredient: "Queso rallado", quantity: 60, unit: "GRAMO" },
      { ingredient: "Pimienta negra", quantity: 1, unit: "AL_GUSTO" },
      { ingredient: "Sal", quantity: 1, unit: "AL_GUSTO" },
    ],
    nutrition: { calories: 620, protein: 26, carbs: 75, fat: 24, fiber: 4, sugar: 3, salt: 1.6 },
  },
  {
    name: "Garbanzos con espinacas",
    description: "Potaje rápido de garbanzos y espinacas con pimentón.",
    servings: 4,
    prepMinutes: 30,
    suitableForLunch: true,
    suitableForDinner: true,
    steps: [
      "Sofreír el ajo picado en aceite de oliva.",
      "Añadir el pimentón y enseguida el tomate triturado; cocer 5 minutos.",
      "Incorporar los garbanzos cocidos y las espinacas.",
      "Cocer 10 minutos, rectificar de sal y servir.",
    ],
    ingredients: [
      { ingredient: "Garbanzos cocidos", quantity: 500, unit: "GRAMO" },
      { ingredient: "Espinacas", quantity: 200, unit: "GRAMO" },
      { ingredient: "Tomate triturado", quantity: 200, unit: "GRAMO" },
      { ingredient: "Ajo", quantity: 2 },
      { ingredient: "Pimentón dulce", quantity: 1 },
      { ingredient: "Comino", quantity: 1 },
      { ingredient: "Aceite de oliva", quantity: 3 },
      { ingredient: "Sal", quantity: 1, unit: "AL_GUSTO" },
    ],
    nutrition: { calories: 340, protein: 16, carbs: 38, fat: 13, fiber: 12, sugar: 4, salt: 1.2 },
  },
  {
    name: "Pisto de verduras con huevo",
    description: "Verduras de temporada guisadas con tomate, coronadas con huevo.",
    servings: 4,
    prepMinutes: 45,
    suitableForLunch: true,
    suitableForDinner: true,
    steps: [
      "Picar cebolla, pimientos, calabacín y berenjena en dados.",
      "Pochar la cebolla y los pimientos; añadir calabacín y berenjena.",
      "Incorporar el tomate triturado y cocer a fuego lento 25 minutos.",
      "Servir con un huevo frito o escalfado por ración.",
    ],
    ingredients: [
      { ingredient: "Calabacín", quantity: 1 },
      { ingredient: "Berenjena", quantity: 1 },
      { ingredient: "Pimiento verde", quantity: 1 },
      { ingredient: "Pimiento rojo", quantity: 1 },
      { ingredient: "Cebolla", quantity: 1 },
      { ingredient: "Tomate triturado", quantity: 400, unit: "GRAMO" },
      { ingredient: "Huevo", quantity: 4 },
      { ingredient: "Aceite de oliva", quantity: 4 },
      { ingredient: "Sal", quantity: 1, unit: "AL_GUSTO" },
    ],
    nutrition: { calories: 290, protein: 11, carbs: 20, fat: 18, fiber: 7, sugar: 11, salt: 0.8 },
  },
  {
    name: "Crema de champiñones",
    description: "Crema ligera de champiñones y puerro para cenar.",
    servings: 4,
    prepMinutes: 30,
    suitableForLunch: false,
    suitableForDinner: true,
    steps: [
      "Saltear los champiñones laminados con el puerro picado.",
      "Añadir la patata troceada y cubrir con caldo de verduras.",
      "Cocer 20 minutos y triturar con un chorro de nata.",
      "Rectificar de sal y pimienta.",
    ],
    ingredients: [
      { ingredient: "Champiñones", quantity: 400, unit: "GRAMO" },
      { ingredient: "Puerro", quantity: 1 },
      { ingredient: "Patata", quantity: 150, unit: "GRAMO" },
      { ingredient: "Nata para cocinar", quantity: 100 },
      { ingredient: "Caldo de verduras", quantity: 700 },
      { ingredient: "Aceite de oliva", quantity: 2 },
      { ingredient: "Sal", quantity: 1, unit: "AL_GUSTO" },
      { ingredient: "Pimienta negra", quantity: 1, unit: "AL_GUSTO" },
    ],
    nutrition: { calories: 180, protein: 5, carbs: 14, fat: 12, fiber: 3, sugar: 5, salt: 1.0 },
  },
  {
    name: "Albóndigas en salsa",
    description: "Albóndigas de ternera guisadas en salsa de tomate y verduras.",
    servings: 4,
    prepMinutes: 50,
    suitableForLunch: true,
    suitableForDinner: false,
    steps: [
      "Mezclar la carne picada con un huevo, ajo y perejil; formar las albóndigas.",
      "Enharinar y dorar las albóndigas; reservar.",
      "Sofreír cebolla y zanahoria; añadir tomate triturado y vino blanco.",
      "Incorporar las albóndigas y cocer en la salsa 20 minutos.",
    ],
    ingredients: [
      { ingredient: "Carne picada de ternera", quantity: 500, unit: "GRAMO" },
      { ingredient: "Huevo", quantity: 1 },
      { ingredient: "Ajo", quantity: 2 },
      { ingredient: "Perejil", quantity: 1, unit: "AL_GUSTO" },
      { ingredient: "Harina", quantity: 40, unit: "GRAMO" },
      { ingredient: "Cebolla", quantity: 1 },
      { ingredient: "Zanahoria", quantity: 1 },
      { ingredient: "Tomate triturado", quantity: 400, unit: "GRAMO" },
      { ingredient: "Vino blanco", quantity: 100 },
      { ingredient: "Aceite de oliva", quantity: 4 },
      { ingredient: "Sal", quantity: 1, unit: "AL_GUSTO" },
    ],
    nutrition: { calories: 430, protein: 28, carbs: 14, fat: 28, fiber: 2, sugar: 5, salt: 1.3 },
  },
];
