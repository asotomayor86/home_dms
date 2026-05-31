"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import type { MealSlot } from "@prisma/client";
import { setPlannedMeal, clearPlannedMeal, type PlannedMealView } from "@/lib/actions/planner";
import { parseDayKey } from "@/lib/date-utils";
import type { PoolRecipe } from "@/components/calendar/meal-calendar";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SLOT_LABEL: Record<MealSlot, string> = { LUNCH: "comida", DINNER: "cena" };

function formatDay(dayKey: string): string {
  const d = parseDayKey(dayKey);
  return d.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

export function MealAssignDialog({
  open,
  onOpenChange,
  householdId,
  dayKey,
  slot,
  current,
  pool,
  onDone,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  householdId: string;
  dayKey: string;
  slot: MealSlot;
  current: PlannedMealView | null;
  pool: PoolRecipe[];
  onDone: () => void;
}) {
  const [pending, start] = useTransition();

  // Solo recetas del pool aptas para este hueco.
  const options = useMemo(
    () =>
      pool.filter((r) => (slot === "LUNCH" ? r.suitableForLunch : r.suitableForDinner)),
    [pool, slot],
  );

  const [selected, setSelected] = useState<string | null>(current?.recipeId ?? null);

  function save() {
    if (!selected) return;
    start(async () => {
      const res = await setPlannedMeal(householdId, dayKey, slot, selected);
      if (res.ok) {
        toast.success("Menú actualizado");
        onDone();
      } else {
        toast.error(res.error);
      }
    });
  }

  function clear() {
    start(async () => {
      const res = await clearPlannedMeal(householdId, dayKey, slot);
      if (res.ok) {
        toast.success("Hueco vaciado");
        onDone();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {SLOT_LABEL[slot]} · {formatDay(dayKey)}
          </DialogTitle>
          <DialogDescription>
            Elige una receta del menú del hogar (❤️) apta para {SLOT_LABEL[slot]}.
          </DialogDescription>
        </DialogHeader>

        {options.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">
            No hay recetas marcadas con ❤️ aptas para {SLOT_LABEL[slot]}. Marca recetas como
            disponibles desde el catálogo o &quot;Mi menú&quot;.
          </p>
        ) : (
          <Command className="border">
            <CommandInput placeholder="Buscar receta del menú…" />
            <CommandList>
              <CommandEmpty>Sin resultados.</CommandEmpty>
              <CommandGroup>
                {options.map((r) => (
                  <CommandItem
                    key={r.id}
                    value={r.name}
                    onSelect={() => setSelected(r.id)}
                    data-selected={r.id === selected}
                    className="data-[selected=true]:bg-accent"
                  >
                    <span className="flex-1">{r.name}</span>
                    {r.id === selected && (
                      <span className="text-xs text-muted-foreground">seleccionada</span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          {current ? (
            <Button variant="outline" onClick={clear} disabled={pending}>
              Quitar
            </Button>
          ) : (
            <span />
          )}
          <Button onClick={save} disabled={pending || !selected}>
            {pending ? "Guardando…" : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
