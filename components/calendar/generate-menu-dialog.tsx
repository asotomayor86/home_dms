"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  generateMonthPlan,
  type GenerateMode,
  type SlotScope,
} from "@/lib/actions/planner";
import { STRATEGY_LABELS, type StrategyId } from "@/lib/planner-strategies";
import { monthLabel } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
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

const STRATEGY_DESCRIPTIONS: Record<StrategyId, string> = {
  random: "Elige recetas al azar del menú del hogar, respetando comida/cena.",
};

const STRATEGY_IDS = Object.keys(STRATEGY_LABELS) as StrategyId[];

type Step = "algorithm" | "mode";

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
  const [step, setStep] = useState<Step>("algorithm");
  const [strategy, setStrategy] = useState<StrategyId>("random");
  const [mode, setMode] = useState<GenerateMode>("fill");
  const [pending, start] = useTransition();

  // Reinicia al primer paso cada vez que se abre.
  function handleOpenChange(o: boolean) {
    if (o) {
      setStep("algorithm");
      setStrategy("random");
      setMode("fill");
    }
    onOpenChange(o);
  }

  function run() {
    start(async () => {
      const res = await generateMonthPlan({
        householdId,
        year,
        month,
        mode,
        scope,
        strategy,
      });
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generar menú · {monthLabel(year, month)}</DialogTitle>
          <DialogDescription>
            {step === "algorithm"
              ? "Elige el tipo de generación."
              : "Elige cómo aplicar la generación."}{" "}
            Ámbito: <strong>{SCOPE_LABEL[scope]}</strong> (según el filtro de la barra).
          </DialogDescription>
        </DialogHeader>

        {step === "algorithm" ? (
          <fieldset className="flex flex-col gap-2 py-2">
            {STRATEGY_IDS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setStrategy(id)}
                className={cn(
                  "rounded-md border p-3 text-left transition-colors hover:bg-accent",
                  strategy === id && "border-foreground bg-accent",
                )}
              >
                <span className="block text-sm font-medium">{STRATEGY_LABELS[id]}</span>
                <span className="block text-xs text-muted-foreground">
                  {STRATEGY_DESCRIPTIONS[id]}
                </span>
              </button>
            ))}
          </fieldset>
        ) : (
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
                  Borra lo existente del ámbito y reasigna todo.
                </span>
              </span>
            </label>
          </fieldset>
        )}

        <DialogFooter>
          {step === "algorithm" ? (
            <>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setStep("mode")}>Continuar</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep("algorithm")} disabled={pending}>
                Atrás
              </Button>
              <Button onClick={run} disabled={pending}>
                {pending ? "Generando…" : "Generar"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
