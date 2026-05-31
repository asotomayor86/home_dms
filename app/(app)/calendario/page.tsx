import { requireSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { getSimHouseholds, resolveActiveHousehold } from "@/lib/households";
import { getMonthPlan } from "@/lib/actions/planner";
import { Card, CardContent } from "@/components/ui/card";
import { MealCalendar, type PoolRecipe } from "@/components/calendar/meal-calendar";

export const dynamic = "force-dynamic";

function parseIntParam(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ household?: string; year?: string; month?: string }>;
}) {
  const session = await requireSession();
  const sp = await searchParams;

  const households = await getSimHouseholds(session.user.id);
  const activeHousehold = resolveActiveHousehold(households, sp.household);

  if (!activeHousehold) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">Calendario</h1>
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            No perteneces a ningún hogar todavía. Pídele a un administrador que te asigne a
            uno para planificar su menú.
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mes mostrado: de los query params, o el mes "ancla" por defecto (year/month
  // se pasan siempre desde la navegación; sin ellos usamos un valor base estable).
  // El cliente, en su primer render, normaliza al mes actual si no hay params.
  const now = new Date();
  const year = parseIntParam(sp.year, now.getUTCFullYear());
  const month = parseIntParam(sp.month, now.getUTCMonth()); // 0-11

  const [meals, pool] = await Promise.all([
    getMonthPlan(activeHousehold.id, year, month),
    prisma.householdRecipe.findMany({
      where: { householdId: activeHousehold.id, recipe: { isActive: true } },
      select: {
        recipe: {
          select: {
            id: true,
            name: true,
            suitableForLunch: true,
            suitableForDinner: true,
          },
        },
      },
      orderBy: { recipe: { name: "asc" } },
    }),
  ]);

  const poolRecipes: PoolRecipe[] = pool.map((p) => p.recipe);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Calendario</h1>
        <p className="text-muted-foreground">
          Planifica comidas y cenas del hogar. Usa recetas marcadas con ❤️.
        </p>
      </div>

      <MealCalendar
        households={households}
        activeHouseholdId={activeHousehold.id}
        year={year}
        month={month}
        meals={meals}
        pool={poolRecipes}
      />
    </div>
  );
}
