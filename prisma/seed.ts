import { PrismaClient, type Unit } from "@prisma/client";
import bcrypt from "bcryptjs";

import { INGREDIENTS, RECIPES } from "./recipes-data";

const prisma = new PrismaClient();

// ──────────────────────────────────────────────────────────────────────────
// CONFIGURA AQUÍ tu cuenta de administrador inicial.
// Se toman de variables de entorno si existen; si no, de estas constantes.
// ⚠️  CAMBIA la contraseña antes de usar en producción.
// ──────────────────────────────────────────────────────────────────────────
const ADMIN_USERNAME = process.env.SEED_ADMIN_USERNAME ?? "admin";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "cambia-esto-1234";
const ADMIN_DISPLAY_NAME = process.env.SEED_ADMIN_DISPLAYNAME ?? "Administrador";

/** Asegura el admin inicial. Create-only: no pisa la contraseña si ya existe. */
async function seedAdmin(): Promise<string> {
  const existing = await prisma.sim.findUnique({
    where: { username: ADMIN_USERNAME },
  });

  if (existing) {
    console.log(`• Admin "${existing.username}" ya existe; no se modifica.`);
    return existing.id;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const admin = await prisma.sim.create({
    data: {
      username: ADMIN_USERNAME,
      passwordHash,
      displayName: ADMIN_DISPLAY_NAME,
      globalRole: "ADMIN",
      mustChangePassword: false,
    },
  });
  console.log(`✔ Admin creado: ${admin.username} (rol ${admin.globalRole})`);
  return admin.id;
}

/** Siembra el catálogo de ingredientes (upsert por nombre). Devuelve mapa nombre→{id,unit}. */
async function seedIngredients() {
  const map = new Map<string, { id: string; defaultUnit: Unit }>();
  for (const ing of INGREDIENTS) {
    // Incluye nutrición por 100 g + gramsPerUnit tanto al crear como al actualizar,
    // para que las filas ya existentes en producción reciban los valores de referencia.
    const data = {
      category: ing.category,
      defaultUnit: ing.defaultUnit,
      kcalPer100: ing.kcalPer100 ?? null,
      proteinPer100: ing.proteinPer100 ?? null,
      carbsPer100: ing.carbsPer100 ?? null,
      fatPer100: ing.fatPer100 ?? null,
      fiberPer100: ing.fiberPer100 ?? null,
      sugarPer100: ing.sugarPer100 ?? null,
      saltPer100: ing.saltPer100 ?? null,
      gramsPerUnit: ing.gramsPerUnit ?? null,
    };
    const row = await prisma.ingredient.upsert({
      where: { name: ing.name },
      update: data,
      create: { name: ing.name, ...data },
    });
    map.set(ing.name, { id: row.id, defaultUnit: row.defaultUnit });
  }
  console.log(`✔ Ingredientes sembrados: ${map.size}`);
  return map;
}

/** Siembra las recetas. Idempotente por nombre: si la receta ya existe, la salta. */
async function seedRecipes(
  createdById: string,
  ingredientMap: Map<string, { id: string; defaultUnit: Unit }>,
) {
  let created = 0;
  let updated = 0;
  for (const recipe of RECIPES) {
    const exists = await prisma.recipe.findFirst({ where: { name: recipe.name } });
    if (exists) {
      // La receta ya existe: limpia los overrides nutricionales para que la nutrición
      // se CALCULE desde los ingredientes (que ahora tienen datos por 100 g).
      await prisma.recipe.update({
        where: { id: exists.id },
        data: {
          calories: null,
          protein: null,
          carbs: null,
          fat: null,
          fiber: null,
          sugar: null,
          salt: null,
        },
      });
      updated++;
      continue;
    }

    await prisma.recipe.create({
      data: {
        name: recipe.name,
        description: recipe.description,
        steps: recipe.steps,
        servings: recipe.servings,
        prepMinutes: recipe.prepMinutes,
        suitableForLunch: recipe.suitableForLunch,
        suitableForDinner: recipe.suitableForDinner,
        // Sin override: la nutrición se calcula desde los ingredientes.
        createdById,
        ingredients: {
          create: recipe.ingredients.map((ri) => {
            const ing = ingredientMap.get(ri.ingredient);
            if (!ing) {
              throw new Error(
                `Ingrediente "${ri.ingredient}" de la receta "${recipe.name}" no está en el catálogo INGREDIENTS.`,
              );
            }
            return {
              ingredientId: ing.id,
              quantity: ri.quantity,
              unit: ri.unit ?? ing.defaultUnit,
              note: ri.note,
            };
          }),
        },
      },
    });
    created++;
  }
  console.log(
    `✔ Recetas: ${created} creadas, ${updated} con override nutricional limpiado (ahora se calcula) de ${RECIPES.length}.`,
  );
}

async function main() {
  const adminId = await seedAdmin();
  const ingredientMap = await seedIngredients();
  await seedRecipes(adminId, ingredientMap);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
