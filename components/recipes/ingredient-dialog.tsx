"use client";

import { useState, useTransition } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";

import {
  createIngredient,
  updateIngredient,
  type IngredientOption,
} from "@/lib/actions/ingredients";
import { searchOFF, type OFFCandidate } from "@/lib/actions/off";
import {
  INGREDIENT_CATEGORIES,
  CATEGORY_LABELS,
  UNITS,
  UNIT_LABELS,
  INGREDIENT_NUTRIENTS,
  type IngredientNutrientKey,
} from "@/lib/validation/recipe";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type NutritionState = Record<IngredientNutrientKey | "gramsPerUnit", string>;

const NUTRITION_KEYS: (IngredientNutrientKey | "gramsPerUnit")[] = [
  ...INGREDIENT_NUTRIENTS.map((n) => n.key),
  "gramsPerUnit",
];

function emptyNutrition(): NutritionState {
  return NUTRITION_KEYS.reduce((acc, k) => {
    acc[k] = "";
    return acc;
  }, {} as NutritionState);
}

function numOrUndef(s: string): number | undefined {
  const t = s.trim();
  if (t === "") return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

export type IngredientDialogInitial = IngredientOption;

/**
 * Diálogo para crear o editar un ingrediente. Permite buscar en Open Food Facts
 * y autocompletar la nutrición por 100 g. Si recibe `initial`, edita; si no, crea.
 */
export function IngredientDialog({
  open,
  onOpenChange,
  initialName = "",
  initial,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initialName?: string;
  initial?: IngredientDialogInitial;
  onSaved: (ingredient: IngredientOption) => void;
}) {
  const isEdit = !!initial;

  const [name, setName] = useState(initial?.name ?? initialName);
  const [category, setCategory] = useState<(typeof INGREDIENT_CATEGORIES)[number]>(
    (initial?.category as (typeof INGREDIENT_CATEGORIES)[number]) ?? "OTRO",
  );
  const [unit, setUnit] = useState<(typeof UNITS)[number]>(
    (initial?.defaultUnit as (typeof UNITS)[number]) ?? "UNIDAD",
  );
  const [offId, setOffId] = useState<string | null>(initial?.offId ?? null);
  const [nutrition, setNutrition] = useState<NutritionState>(() => {
    if (!initial) return emptyNutrition();
    const s = emptyNutrition();
    for (const n of INGREDIENT_NUTRIENTS) {
      const v = initial[n.key];
      s[n.key] = v != null ? String(v) : "";
    }
    s.gramsPerUnit = initial.gramsPerUnit != null ? String(initial.gramsPerUnit) : "";
    return s;
  });

  const [candidates, setCandidates] = useState<OFFCandidate[] | null>(null);
  const [searching, startSearch] = useTransition();
  const [pending, startSave] = useTransition();

  function resetForCreate() {
    setName("");
    setCategory("OTRO");
    setUnit("UNIDAD");
    setOffId(null);
    setNutrition(emptyNutrition());
    setCandidates(null);
  }

  function handleOpenChange(o: boolean) {
    // Al abrir en modo crear, sincroniza el nombre con lo escrito en el buscador.
    if (o && !isEdit) setName(initialName);
    onOpenChange(o);
  }

  function runSearch() {
    startSearch(async () => {
      const res = await searchOFF(name);
      if (!res.ok) {
        toast.error(res.error);
        setCandidates([]);
        return;
      }
      setCandidates(res.candidates);
      if (res.candidates.length === 0) toast.info("Sin resultados en Open Food Facts");
    });
  }

  function applyCandidate(c: OFFCandidate) {
    setNutrition((prev) => ({
      ...prev,
      kcalPer100: c.kcalPer100 != null ? String(c.kcalPer100) : prev.kcalPer100,
      proteinPer100: c.proteinPer100 != null ? String(c.proteinPer100) : prev.proteinPer100,
      carbsPer100: c.carbsPer100 != null ? String(c.carbsPer100) : prev.carbsPer100,
      fatPer100: c.fatPer100 != null ? String(c.fatPer100) : prev.fatPer100,
      fiberPer100: c.fiberPer100 != null ? String(c.fiberPer100) : prev.fiberPer100,
      sugarPer100: c.sugarPer100 != null ? String(c.sugarPer100) : prev.sugarPer100,
      saltPer100: c.saltPer100 != null ? String(c.saltPer100) : prev.saltPer100,
      gramsPerUnit:
        c.servingGrams != null && prev.gramsPerUnit === ""
          ? String(c.servingGrams)
          : prev.gramsPerUnit,
    }));
    setOffId(c.offId);
    setCandidates(null);
    toast.success("Valores de Open Food Facts aplicados");
  }

  function submit() {
    const payload = {
      name,
      category,
      defaultUnit: unit,
      offId,
      kcalPer100: numOrUndef(nutrition.kcalPer100),
      proteinPer100: numOrUndef(nutrition.proteinPer100),
      carbsPer100: numOrUndef(nutrition.carbsPer100),
      fatPer100: numOrUndef(nutrition.fatPer100),
      fiberPer100: numOrUndef(nutrition.fiberPer100),
      sugarPer100: numOrUndef(nutrition.sugarPer100),
      saltPer100: numOrUndef(nutrition.saltPer100),
      gramsPerUnit: numOrUndef(nutrition.gramsPerUnit),
    };
    startSave(async () => {
      const res = isEdit
        ? await updateIngredient({ ...payload, id: initial!.id })
        : await createIngredient(payload);
      if (res.ok) {
        toast.success(isEdit ? "Ingrediente actualizado" : "Ingrediente creado");
        onSaved(res.ingredient);
        if (!isEdit) resetForCreate();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar ingrediente" : "Nuevo ingrediente"}</DialogTitle>
          <DialogDescription>
            Catálogo común. Busca en Open Food Facts para autocompletar la nutrición por
            100 g, o introdúcela a mano.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="ing-name">Nombre</Label>
            <div className="flex gap-2">
              <Input
                id="ing-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tomate"
                autoFocus
              />
              <Button
                type="button"
                variant="outline"
                onClick={runSearch}
                disabled={searching || name.trim().length < 2}
                title="Buscar en Open Food Facts"
              >
                <Search className="size-4" />
                {searching ? "Buscando…" : "OFF"}
              </Button>
            </div>
          </div>

          {/* Candidatos de Open Food Facts */}
          {candidates && candidates.length > 0 && (
            <div className="flex flex-col gap-1 rounded-md border p-2">
              <span className="eyebrow text-muted-foreground">Resultados Open Food Facts</span>
              {candidates.map((c) => (
                <button
                  key={c.offId}
                  type="button"
                  onClick={() => applyCandidate(c)}
                  className="flex items-center justify-between gap-2 rounded-sm px-2 py-1 text-left text-sm hover:bg-accent"
                >
                  <span className="truncate">
                    {c.name}
                    {c.brand && (
                      <span className="text-muted-foreground"> · {c.brand}</span>
                    )}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {c.kcalPer100 != null ? `${c.kcalPer100} kcal/100g` : "—"}
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label>Categoría</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INGREDIENT_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Unidad por defecto</Label>
              <Select value={unit} onValueChange={(v) => setUnit(v as typeof unit)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {UNIT_LABELS[u]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Nutrición por 100 g */}
          <div className="flex flex-col gap-2">
            <Label className="eyebrow text-muted-foreground">Nutrición por 100 g</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {INGREDIENT_NUTRIENTS.map((n) => (
                <div key={n.key} className="flex flex-col gap-1">
                  <Label htmlFor={`ing-${n.key}`} className="text-xs">
                    {n.label} ({n.unit})
                  </Label>
                  <Input
                    id={`ing-${n.key}`}
                    type="number"
                    min={0}
                    step="any"
                    value={nutrition[n.key]}
                    onChange={(e) =>
                      setNutrition((prev) => ({ ...prev, [n.key]: e.target.value }))
                    }
                  />
                </div>
              ))}
              <div className="flex flex-col gap-1">
                <Label htmlFor="ing-gramsPerUnit" className="text-xs">
                  Gramos / unidad
                </Label>
                <Input
                  id="ing-gramsPerUnit"
                  type="number"
                  min={0}
                  step="any"
                  value={nutrition.gramsPerUnit}
                  onChange={(e) =>
                    setNutrition((prev) => ({ ...prev, gramsPerUnit: e.target.value }))
                  }
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              &quot;Gramos / unidad&quot; es el peso de 1 unidad base (p. ej. 1 cebolla ≈ 110 g),
              necesario para calcular recetas medidas por unidad, diente, lata o cucharada.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={submit} disabled={pending || name.trim().length < 2}>
            {pending ? "Guardando…" : isEdit ? "Guardar" : "Crear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
