"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Sparkles, Eye, Pencil } from "lucide-react";

import type { MealSlot } from "@prisma/client";
import type { PlannedMealView } from "@/lib/actions/planner";
import { monthGrid, monthLabel, dayKey, WEEKDAY_LABELS } from "@/lib/date-utils";
import { NUTRIENTS } from "@/lib/validation/recipe";
import { sumNutrition, formatNutrient } from "@/lib/nutrition";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HouseholdSwitcher } from "@/components/household-switcher";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MealAssignDialog } from "@/components/calendar/meal-assign-dialog";
import { MealViewDialog } from "@/components/calendar/meal-view-dialog";
import { GenerateMenuDialog } from "@/components/calendar/generate-menu-dialog";

export type PoolRecipe = {
  id: string;
  name: string;
  suitableForLunch: boolean;
  suitableForDinner: boolean;
};

type SlotFilter = "all" | "lunch" | "dinner";
type ViewMode = "view" | "edit";
type ActiveCell = { dayKey: string; slot: MealSlot } | null;

const SLOT_LABEL: Record<MealSlot, string> = { LUNCH: "Comida", DINNER: "Cena" };

export function MealCalendar({
  households,
  activeHouseholdId,
  year,
  month,
  meals,
  pool,
}: {
  households: { id: string; name: string }[];
  activeHouseholdId: string;
  year: number;
  month: number;
  meals: PlannedMealView[];
  pool: PoolRecipe[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startNav] = useTransition();

  const [mode, setMode] = useState<ViewMode>("view"); // por defecto: visualizar
  const [slotFilter, setSlotFilter] = useState<SlotFilter>("all");
  const [query, setQuery] = useState("");
  const [activeCell, setActiveCell] = useState<ActiveCell>(null);
  const [generateOpen, setGenerateOpen] = useState(false);

  const weeks = useMemo(() => monthGrid(year, month), [year, month]);
  const todayKey = dayKey(
    new Date(
      Date.UTC(
        new Date().getUTCFullYear(),
        new Date().getUTCMonth(),
        new Date().getUTCDate(),
      ),
    ),
  );

  // Index: "dayKey|slot" → comida planificada.
  const mealMap = useMemo(() => {
    const m = new Map<string, PlannedMealView>();
    for (const meal of meals) m.set(`${meal.dayKey}|${meal.slot}`, meal);
    return m;
  }, [meals]);

  const q = query.trim().toLowerCase();
  function slotPassesFilter(slot: MealSlot): boolean {
    if (slotFilter === "lunch") return slot === "LUNCH";
    if (slotFilter === "dinner") return slot === "DINNER";
    return true;
  }
  function visible(meal: PlannedMealView | undefined, slot: MealSlot): boolean {
    if (!slotPassesFilter(slot)) return false;
    if (q && (!meal || !meal.recipeName.toLowerCase().includes(q))) return false;
    return true;
  }

  function navigateMonth(deltaMonths: number) {
    const d = new Date(Date.UTC(year, month + deltaMonths, 1));
    pushParams({ year: String(d.getUTCFullYear()), month: String(d.getUTCMonth()) });
  }
  function goToday() {
    const now = new Date();
    pushParams({ year: String(now.getUTCFullYear()), month: String(now.getUTCMonth()) });
  }
  function pushParams(patch: Record<string, string>) {
    const params = new URLSearchParams(searchParams);
    for (const [k, v] of Object.entries(patch)) params.set(k, v);
    startNav(() => router.push(`${pathname}?${params.toString()}`));
  }

  function onCellClick(key: string, slot: MealSlot, meal: PlannedMealView | undefined) {
    if (mode === "edit") {
      setActiveCell({ dayKey: key, slot });
    } else if (meal) {
      // En modo visualizar, solo abre el detalle si hay receta asignada.
      setActiveCell({ dayKey: key, slot });
    }
  }

  const slots: MealSlot[] = ["LUNCH", "DINNER"];
  const activeMeal = activeCell
    ? mealMap.get(`${activeCell.dayKey}|${activeCell.slot}`) ?? null
    : null;

  // Totales semanales (por ración): suma de las comidas visibles de cada semana.
  function weekTotals(week: Date[]) {
    const weekMeals: PlannedMealView[] = [];
    for (const day of week) {
      const key = dayKey(day);
      for (const slot of slots) {
        if (!slotPassesFilter(slot)) continue;
        const meal = mealMap.get(`${key}|${slot}`);
        if (meal) weekMeals.push(meal);
      }
    }
    return { totals: sumNutrition(weekMeals), count: weekMeals.length };
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => navigateMonth(-1)}
            aria-label="Mes anterior"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-44 text-center text-sm font-semibold uppercase tracking-[0.08em]">
            {monthLabel(year, month)}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => navigateMonth(1)}
            aria-label="Mes siguiente"
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={goToday}>
            Hoy
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <HouseholdSwitcher households={households} activeId={activeHouseholdId} />

          {/* Conmutador de modo: Visualizar / Generar */}
          <div className="flex items-center rounded-md border p-0.5">
            <Button
              variant={mode === "view" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setMode("view")}
            >
              <Eye className="size-4" />
              Visualizar
            </Button>
            <Button
              variant={mode === "edit" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setMode("edit")}
            >
              <Pencil className="size-4" />
              Generar
            </Button>
          </div>

          <Select value={slotFilter} onValueChange={(v) => setSlotFilter(v as SlotFilter)}>
            <SelectTrigger className="h-8 w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Comida y cena</SelectItem>
              <SelectItem value="lunch">Solo comida</SelectItem>
              <SelectItem value="dinner">Solo cena</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Filtrar receta…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-8 w-40"
          />

          {mode === "edit" && (
            <Button size="sm" onClick={() => setGenerateOpen(true)}>
              <Sparkles className="size-4" />
              Generar menú
            </Button>
          )}
        </div>
      </div>

      {/* Cabecera de días (+ columna de totales) */}
      <div className="grid grid-cols-[repeat(7,1fr)_minmax(7rem,0.8fr)] gap-px">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="eyebrow px-1 py-1 text-center text-muted-foreground">
            {d}
          </div>
        ))}
        <div className="eyebrow px-1 py-1 text-center text-muted-foreground">Semana</div>
      </div>

      {/* Cuadrícula: una fila por semana, con celda de totales al final */}
      <div className="grid grid-cols-[repeat(7,1fr)_minmax(7rem,0.8fr)] gap-px border bg-border">
        {weeks.map((week, wi) => {
          const { totals, count } = weekTotals(week);
          return (
            <WeekRow key={wi}>
              {week.map((day) => {
                const key = dayKey(day);
                const inMonth = day.getUTCMonth() === month;
                const isToday = key === todayKey;
                return (
                  <div
                    key={key}
                    className={cn(
                      "flex min-h-20 flex-col gap-0.5 bg-background p-1",
                      !inMonth && "bg-muted/40 text-muted-foreground",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "text-xs",
                          isToday &&
                            "flex size-5 items-center justify-center rounded-full bg-foreground font-semibold text-background",
                        )}
                      >
                        {day.getUTCDate()}
                      </span>
                    </div>

                    {slots.map((slot) => {
                      const meal = mealMap.get(`${key}|${slot}`);
                      if (!visible(meal, slot)) return null;
                      const clickable = mode === "edit" || !!meal;
                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={!clickable}
                          onClick={() => onCellClick(key, slot, meal)}
                          className={cn(
                            "group flex items-center gap-1 truncate rounded-sm px-1 py-0.5 text-left text-[0.7rem] leading-tight transition-colors",
                            clickable && "hover:bg-accent",
                            meal ? "text-foreground" : "text-muted-foreground/60",
                          )}
                          title={
                            meal
                              ? `${SLOT_LABEL[slot]}: ${meal.recipeName}`
                              : `Añadir ${SLOT_LABEL[slot].toLowerCase()}`
                          }
                        >
                          <span className="shrink-0 opacity-60">
                            {slot === "LUNCH" ? "🍽" : "🌙"}
                          </span>
                          <span className="truncate">{meal ? meal.recipeName : "—"}</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}

              {/* Totales de la semana (por ración) */}
              <div className="flex min-h-20 flex-col gap-0.5 bg-muted/30 p-1.5">
                {count === 0 ? (
                  <span className="text-[0.65rem] text-muted-foreground/60">—</span>
                ) : (
                  <dl className="flex flex-col gap-0.5 text-[0.65rem] leading-tight">
                    {NUTRIENTS.map((n) => (
                      <div key={n.key} className="flex items-baseline justify-between gap-1">
                        <dt className="text-muted-foreground">{n.label.slice(0, 4)}.</dt>
                        <dd className="font-medium tabular-nums">
                          {formatNutrient(n.key, totals[n.key])}
                          {n.unit === "g" ? "" : ""}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            </WeekRow>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        Totales semanales por ración (1 persona). Kcal y gramos.
      </p>

      {/* Diálogo según modo */}
      {activeCell && mode === "edit" && (
        <MealAssignDialog
          open
          onOpenChange={(o) => !o && setActiveCell(null)}
          householdId={activeHouseholdId}
          dayKey={activeCell.dayKey}
          slot={activeCell.slot}
          current={activeMeal}
          pool={pool}
          onDone={() => {
            setActiveCell(null);
            router.refresh();
          }}
        />
      )}
      {activeCell && mode === "view" && activeMeal && (
        <MealViewDialog
          open
          onOpenChange={(o) => !o && setActiveCell(null)}
          slot={activeCell.slot}
          dayKey={activeCell.dayKey}
          meal={activeMeal}
        />
      )}

      <GenerateMenuDialog
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        householdId={activeHouseholdId}
        year={year}
        month={month}
        scope={slotFilter}
        onDone={() => {
          setGenerateOpen(false);
          router.refresh();
        }}
      />
    </div>
  );
}

/** Subgrid de 8 columnas (7 días + totales) que ocupa una fila completa. */
function WeekRow({ children }: { children: React.ReactNode }) {
  return <div className="col-span-full grid grid-cols-subgrid gap-px">{children}</div>;
}
