"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  generateMonthPlan,
  type GenerateMode,
  type SlotScope,
} from "@/lib/actions/planner";
import { monthLabel } from "@/lib/date-utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SCOPE_LABEL: Record<SlotScope, string> = {
  all: "comida y cena",
  lunch: "solo comida",
  dinner: "solo cena",
};

export function GenerateMenuDialog({
  open,
  onOpenChange,
  householdId,
  year,
  month,
  scope,
  onDone,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  householdId: string;
  year: number;
  month: number;
  scope: SlotScope;
  onDone: () => void;
}) {
  const [mode, setMode] = useState<GenerateMode>("fill");
  const [pending, start] = useTransition();

  function run() {
    start(async () => {
      const res = await generateMonthPlan({ householdId, year, month, mode, scope });
      if (res.ok) {
        toast.success(
          res.assigned > 0
            ? `Menú generado: ${res.assigned} comidas asignadas`
            : "No había huecos que rellenar",
        );
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
          <DialogTitle>Generar menú · {monthLabel(year, month)}</DialogTitle>
          <DialogDescription>
            Asigna recetas al azar del menú del hogar (❤️). Ámbito actual:{" "}
            <strong>{SCOPE_LABEL[scope]}</strong> (según el filtro de la barra).
          </DialogDescription>
        </DialogHeader>

        <fieldset className="flex flex-col gap-3 py-2">
          <label className="flex items-start gap-3">
            <input
              type="radio"
              name="gen-mode"
              className="mt-1"
              checked={mode === "fill"}
              onChange={() => setMode("fill")}
            />
            <span>
              <span className="block text-sm font-medium">Rellenar solo huecos vacíos</span>
              <span className="block text-xs text-muted-foreground">
                Respeta las comidas ya asignadas; solo completa lo que falta.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-3">
            <input
              type="radio"
              name="gen-mode"
              className="mt-1"
              checked={mode === "replace"}
              onChange={() => setMode("replace")}
            />
            <span>
              <span className="block text-sm font-medium">Regenerar todo el mes</span>
              <span className="block text-xs text-muted-foreground">
                Borra lo existente del ámbito y reasigna todo al azar.
              </span>
            </span>
          </label>
        </fieldset>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancelar
          </Button>
          <Button onClick={run} disabled={pending}>
            {pending ? "Generando…" : "Generar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
