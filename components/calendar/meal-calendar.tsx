"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

import type { MealSlot } from "@prisma/client";
import type { PlannedMealView } from "@/lib/actions/planner";
import { monthGrid, monthLabel, dayKey, WEEKDAY_LABELS } from "@/lib/date-utils";
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
import { GenerateMenuDialog } from "@/components/calendar/generate-menu-dialog";

export type PoolRecipe = {
  id: string;
  name: string;
  suitableForLunch: boolean;
  suitableForDinner: boolean;
};

type SlotFilter = "all" | "lunch" | "dinner";

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

  const [slotFilter, setSlotFilter] = useState<SlotFilter>("all");
  const [query, setQuery] = useState("");
  const [activeCell, setActiveCell] = useState<ActiveCell>(null);
  const [generateOpen, setGenerateOpen] = useState(false);

  const weeks = useMemo(() => monthGrid(year, month), [year, month]);
  const todayKey = dayKey(new Date(Date.UTC(
    new Date().getUTCFullYear(),
    new Date().getUTCMonth(),
    new Date().getUTCDate(),
  )));

  // Index: "dayKey|slot" → comida planificada.
  const mealMap = useMemo(() => {
    const m = new Map<string, PlannedMealView>();
    for (const meal of meals) m.set(`${meal.dayKey}|${meal.slot}`, meal);
    return m;
  }, [meals]);

  const q = query.trim().toLowerCase();
  function visible(meal: PlannedMealView | undefined, slot: MealSlot): boolean {
    if (slotFilter === "lunch" && slot !== "LUNCH") return false;
    if (slotFilter === "dinner" && slot !== "DINNER") return false;
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

  const slots: MealSlot[] = ["LUNCH", "DINNER"];

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" onClick={() => navigateMonth(-1)} aria-label="Mes anterior">
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-44 text-center text-sm font-semibold uppercase tracking-[0.08em]">
            {monthLabel(year, month)}
          </span>
          <Button variant="outline" size="icon-sm" onClick={() => navigateMonth(1)} aria-label="Mes siguiente">
            <ChevronRight className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={goToday}>
            Hoy
          </Button>
          <Button size="sm" onClick={() => setGenerateOpen(true)}>
            <Sparkles className="size-4" />
            Generar menú
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <HouseholdSwitcher households={households} activeId={activeHouseholdId} />
          <Select value={slotFilter} onValueChange={(v) => setSlotFilter(v as SlotFilter)}>
            <SelectTrigger className="h-8 w-32">
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
        </div>
      </div>

      {/* Cabecera de días */}
      <div className="grid grid-cols-7 gap-px">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="eyebrow px-1 py-1 text-center text-muted-foreground">
            {d}
          </div>
        ))}
      </div>

      {/* Cuadrícula */}
      <div className="grid grid-cols-7 gap-px border bg-border">
        {weeks.flat().map((day) => {
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
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setActiveCell({ dayKey: key, slot })}
                    className={cn(
                      "group flex items-center gap-1 truncate rounded-sm px-1 py-0.5 text-left text-[0.7rem] leading-tight transition-colors hover:bg-accent",
                      meal ? "text-foreground" : "text-muted-foreground/60",
                    )}
                    title={meal ? `${SLOT_LABEL[slot]}: ${meal.recipeName}` : `Añadir ${SLOT_LABEL[slot].toLowerCase()}`}
                  >
                    <span className="shrink-0 opacity-60">
                      {slot === "LUNCH" ? "🍽" : "🌙"}
                    </span>
                    <span className="truncate">
                      {meal ? meal.recipeName : "—"}
                    </span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {activeCell && (
        <MealAssignDialog
          open={!!activeCell}
          onOpenChange={(o) => !o && setActiveCell(null)}
          householdId={activeHouseholdId}
          dayKey={activeCell.dayKey}
          slot={activeCell.slot}
          current={mealMap.get(`${activeCell.dayKey}|${activeCell.slot}`) ?? null}
          pool={pool}
          onDone={() => {
            setActiveCell(null);
            router.refresh();
          }}
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
