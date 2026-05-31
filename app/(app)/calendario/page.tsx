import { requireSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { getSimHouseholds, resolveActiveHousehold } from "@/lib/households";
import { getWeekPlan } from "@/lib/actions/planner";
import { weekStartMonday, dayKey, parseDayKey } from "@/lib/date-utils";
import { Card, CardContent } from "@/components/ui/card";
import { MealCalendar, type PoolRecipe } from "@/components/calendar/meal-calendar";

export const dynamic = "force-dynamic";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ household?: string; week?: string }>;
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

  // Lunes de la semana mostrada: del query param (validado) o la semana actual.
  let monday: Date;
  if (sp.week && /^\d{4}-\d{2}-\d{2}$/.test(sp.week)) {
    monday = weekStartMonday(parseDayKey(sp.week));
  } else {
    const now = new Date();
    monday = weekStartMonday(
      new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())),
    );
  }
  const weekStartKey = dayKey(monday);

  const [meals, pool] = await Promise.all([
    getWeekPlan(activeHousehold.id, weekStartKey),
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
          Planifica comidas y cenas del hogar por semana. Usa recetas marcadas con ❤️.
        </p>
      </div>

      <MealCalendar
        households={households}
        activeHouseholdId={activeHousehold.id}
        weekStartKey={weekStartKey}
        meals={meals}
        pool={poolRecipes}
      />
    </div>
  );
}
