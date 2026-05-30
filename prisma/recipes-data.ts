import type { IngredientCategory, Unit } from "@prisma/client";

// Catálogo de ingredientes y recetas para el seed. Los ingredientes se referencian
// por nombre desde las recetas; el seed los crea (upsert) y luego enlaza.

export type IngredientSeed = {
  name: string;
  category: IngredientCategory;
  defaultUnit: Unit;
};

export type RecipeIngredientSeed = {
  ingredient: string; // debe coincidir con un IngredientSeed.name
  quantity: number;
  unit?: Unit; // si se omite, se usa el defaultUnit del ingrediente
  note?: string;
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
};

export const INGREDIENTS: IngredientSeed[] = [
  // Verduras / hortalizas
  { name: "Cebolla", category: "VERDURA", defaultUnit: "UNIDAD" },
  { name: "Ajo", category: "VERDURA", defaultUnit: "DIENTE" },
  { name: "Tomate", category: "VERDURA", defaultUnit: "UNIDAD" },
  { name: "Tomate triturado", category: "DESPENSA", defaultUnit: "GRAMO" },
  { name: "Pimiento verde", category: "VERDURA", defaultUnit: "UNIDAD" },
  { name: "Pimiento rojo", category: "VERDURA", defaultUnit: "UNIDAD" },
  { name: "Patata", category: "VERDURA", defaultUnit: "GRAMO" },
  { name: "Zanahoria", category: "VERDURA", defaultUnit: "UNIDAD" },
  { name: "Calabacín", category: "VERDURA", defaultUnit: "UNIDAD" },
  { name: "Berenjena", category: "VERDURA", defaultUnit: "UNIDAD" },
  { name: "Lechuga", category: "VERDURA", defaultUnit: "UNIDAD" },
  { name: "Espinacas", category: "VERDURA", defaultUnit: "GRAMO" },
  { name: "Puerro", category: "VERDURA", defaultUnit: "UNIDAD" },
  { name: "Champiñones", category: "VERDURA", defaultUnit: "GRAMO" },
  { name: "Guisantes", category: "CONGELADO", defaultUnit: "GRAMO" },
  { name: "Judías verdes", category: "VERDURA", defaultUnit: "GRAMO" },
  { name: "Garbanzos cocidos", category: "DESPENSA", defaultUnit: "GRAMO" },
  { name: "Lentejas", category: "DESPENSA", defaultUnit: "GRAMO" },
  { name: "Arroz", category: "DESPENSA", defaultUnit: "GRAMO" },
  { name: "Pasta (macarrones)", category: "DESPENSA", defaultUnit: "GRAMO" },
  { name: "Espagueti", category: "DESPENSA", defaultUnit: "GRAMO" },
  { name: "Pan", category: "PANADERIA", defaultUnit: "UNIDAD" },
  { name: "Harina", category: "DESPENSA", defaultUnit: "GRAMO" },
  // Proteínas
  { name: "Huevo", category: "HUEVOS", defaultUnit: "UNIDAD" },
  { name: "Pollo (pechuga)", category: "CARNE", defaultUnit: "GRAMO" },
  { name: "Pollo (muslos)", category: "CARNE", defaultUnit: "GRAMO" },
  { name: "Carne picada de ternera", category: "CARNE", defaultUnit: "GRAMO" },
  { name: "Chorizo", category: "CARNE", defaultUnit: "GRAMO" },
  { name: "Bacon", category: "CARNE", defaultUnit: "GRAMO" },
  { name: "Atún en lata", category: "PESCADO", defaultUnit: "LATA" },
  { name: "Merluza", category: "PESCADO", defaultUnit: "GRAMO" },
  { name: "Gambas", category: "PESCADO", defaultUnit: "GRAMO" },
  // Lácteos
  { name: "Queso rallado", category: "LACTEO", defaultUnit: "GRAMO" },
  { name: "Leche", category: "LACTEO", defaultUnit: "MILILITRO" },
  { name: "Mantequilla", category: "LACTEO", defaultUnit: "GRAMO" },
  { name: "Nata para cocinar", category: "LACTEO", defaultUnit: "MILILITRO" },
  // Despensa / condimentos
  { name: "Aceite de oliva", category: "CONDIMENTO", defaultUnit: "CUCHARADA" },
  { name: "Sal", category: "CONDIMENTO", defaultUnit: "AL_GUSTO" },
  { name: "Pimienta negra", category: "CONDIMENTO", defaultUnit: "AL_GUSTO" },
  { name: "Pimentón dulce", category: "CONDIMENTO", defaultUnit: "CUCHARADITA" },
  { name: "Comino", category: "CONDIMENTO", defaultUnit: "CUCHARADITA" },
  { name: "Laurel", category: "CONDIMENTO", defaultUnit: "UNIDAD" },
  { name: "Caldo de pollo", category: "DESPENSA", defaultUnit: "MILILITRO" },
  { name: "Caldo de verduras", category: "DESPENSA", defaultUnit: "MILILITRO" },
  { name: "Azúcar", category: "DESPENSA", defaultUnit: "CUCHARADA" },
  { name: "Vino blanco", category: "BEBIDA", defaultUnit: "MILILITRO" },
  { name: "Limón", category: "FRUTA", defaultUnit: "UNIDAD" },
  { name: "Perejil", category: "CONDIMENTO", defaultUnit: "MANOJO" },
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
  },
];
