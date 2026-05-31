"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Sparkles, Eye, Pencil } from "lucide-react";

import type { MealSlot } from "@prisma/client";
import type { PlannedMealView } from "@/lib/actions/planner";
import {
  weekDays,
  weekLabel,
  dayKey,
  parseDayKey,
  WEEKDAY_LABELS_FULL,
} from "@/lib/date-utils";
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
import { RecipeOverlay } from "@/components/calendar/recipe-overlay";
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
  weekStartKey,
  meals,
  pool,
}: {
  households: { id: string; name: string }[];
  activeHouseholdId: string;
  weekStartKey: string;
  meals: PlannedMealView[];
  pool: PoolRecipe[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startNav] = useTransition();

  const [mode, setMode] = useState<ViewMode>("view");
  const [slotFilter, setSlotFilter] = useState<SlotFilter>("all");
  const [query, setQuery] = useState("");
  const [activeCell, setActiveCell] = useState<ActiveCell>(null);
  const [overlayRecipeId, setOverlayRecipeId] = useState<string | null>(null);
  const [generateOpen, setGenerateOpen] = useState(false);

  const monday = useMemo(() => parseDayKey(weekStartKey), [weekStartKey]);
  const days = useMemo(() => weekDays(monday), [monday]);
  const todayKey = dayKey(
    new Date(
      Date.UTC(
        new Date().getUTCFullYear(),
        new Date().getUTCMonth(),
        new Date().getUTCDate(),
      ),
    ),
  );

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

  function navigateWeek(deltaWeeks: number) {
    const d = parseDayKey(weekStartKey);
    const target = new Date(
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + deltaWeeks * 7),
    );
    pushParams({ week: dayKey(target) });
  }
  function goThisWeek() {
    const now = new Date();
    const todayUtc = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    pushParams({ week: dayKey(todayUtc) });
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
      setOverlayRecipeId(meal.recipeId);
    }
  }

  const slots: MealSlot[] = ["LUNCH", "DINNER"];
  const activeMeal = activeCell
    ? mealMap.get(`${activeCell.dayKey}|${activeCell.slot}`) ?? null
    : null;

  // Resumen semanal (por ración) de las comidas visibles.
  const weekMeals = useMemo(() => {
    const out: PlannedMealView[] = [];
    for (const day of days) {
      const key = dayKey(day);
      for (const slot of slots) {
        if (!slotPassesFilter(slot)) continue;
        const meal = mealMap.get(`${key}|${slot}`);
        if (meal) out.push(meal);
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, mealMap, slotFilter]);
  const weekTotals = useMemo(() => sumNutrition(weekMeals), [weekMeals]);

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => navigateWeek(-1)}
            aria-label="Semana anterior"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-48 text-center text-sm font-semibold uppercase tracking-[0.08em]">
            {weekLabel(monday)}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => navigateWeek(1)}
            aria-label="Semana siguiente"
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={goThisWeek}>
            Esta semana
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <HouseholdSwitcher households={households} activeId={activeHouseholdId} />

          {/* Conmutador de modo: ancho fijo para que no salte de línea al cambiar */}
          <div className="flex shrink-0 items-center rounded-md border p-0.5">
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
            <SelectTrigger className="eyebrow h-8 w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="eyebrow">
                Comida y cena
              </SelectItem>
              <SelectItem value="lunch" className="eyebrow">
                Solo comida
              </SelectItem>
              <SelectItem value="dinner" className="eyebrow">
                Solo cena
              </SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Filtrar receta…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-8 w-40"
          />

          {/* Botón generar: reserva su espacio para que la fila no salte */}
          <div className="w-40 shrink-0">
            {mode === "edit" && (
              <Button size="sm" className="w-full" onClick={() => setGenerateOpen(true)}>
                <Sparkles className="size-4" />
                Generar menú
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Semana en vertical: lunes (arriba) → domingo (abajo) */}
      <div className="flex flex-col border bg-border gap-px">
        {days.map((day, i) => {
          const key = dayKey(day);
          const isToday = key === todayKey;
          return (
            <div key={key} className="flex items-stretch gap-px bg-background">
              {/* Etiqueta del día */}
              <div
                className={cn(
                  "flex w-28 shrink-0 flex-col justify-center px-3 py-2",
                  isToday ? "bg-foreground text-background" : "bg-muted/40",
                )}
              >
                <span className="eyebrow">{WEEKDAY_LABELS_FULL[i]}</span>
                <span className="text-lg font-semibold">{day.getUTCDate()}</span>
              </div>

              {/* Huecos del día */}
              <div className="flex flex-1 flex-col justify-center gap-1 p-2">
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
                        "flex items-center gap-2 rounded-sm px-2 py-1 text-left text-sm transition-colors",
                        clickable && "hover:bg-accent",
                        meal ? "text-foreground" : "text-muted-foreground/60",
                      )}
                    >
                      <span className="shrink-0 opacity-60">
                        {slot === "LUNCH" ? "🍽" : "🌙"}
                      </span>
                      <span className="eyebrow w-16 shrink-0 text-muted-foreground">
                        {SLOT_LABEL[slot]}
                      </span>
                      <span className="truncate">{meal ? meal.recipeName : "— sin asignar"}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Resumen de la semana (por ración) */}
      <div className="border bg-muted/30 p-3">
        <h2 className="eyebrow mb-2 text-muted-foreground">
          Resumen de la semana · por ración
        </h2>
        {weekMeals.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin comidas planificadas esta semana.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {NUTRIENTS.map((n) => (
              <div key={n.key} className="flex flex-col">
                <span className="eyebrow text-muted-foreground">{n.label}</span>
                <span className="text-lg font-semibold tabular-nums">
                  {formatNutrient(n.key, weekTotals[n.key])}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    {n.unit}
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Diálogos */}
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

      <RecipeOverlay
        recipeId={overlayRecipeId}
        onClose={() => setOverlayRecipeId(null)}
      />

      <GenerateMenuDialog
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        householdId={activeHouseholdId}
        weekStartKey={weekStartKey}
        scope={slotFilter}
        onDone={() => {
          setGenerateOpen(false);
          router.refresh();
        }}
      />
    </div>
  );
}
