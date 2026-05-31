"use client";

import { useEffect, useState, useTransition } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";

import {
  createIngredient,
  updateIngredient,
  type IngredientOption,
} from "@/lib/actions/ingredients";
import {
  searchNutrition,
  listSources,
  type SourceInfo,
} from "@/lib/actions/nutrition-search";
import type { NutritionCandidate, SourceId } from "@/lib/nutrition-sources/types";
import {
  INGREDIENT_CATEGORIES,
  CATEGORY_LABELS,
  UNITS,
  UNIT_LABELS,
  UNIT_SINGULAR,
  INGREDIENT_NUTRIENTS,
  unitNeedsGramsPerUnit,
  type IngredientNutrientKey,
} from "@/lib/validation/recipe";
import { cn } from "@/lib/utils";
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
  const [source, setSource] = useState<{ id: string; ref: string } | null>(
    initial?.sourceId ? { id: initial.sourceId, ref: initial.sourceRef ?? "" } : null,
  );
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

  // Fuentes disponibles + pestaña activa + resultados por búsqueda.
  const [sources, setSources] = useState<SourceInfo[]>([]);
  const [activeSource, setActiveSource] = useState<SourceId>("off");
  const [candidates, setCandidates] = useState<NutritionCandidate[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searching, startSearch] = useTransition();
  const [pending, startSave] = useTransition();

  useEffect(() => {
    if (!open) return;
    listSources().then((s) => {
      setSources(s);
      const firstEnabled = s.find((x) => x.enabled);
      if (firstEnabled) setActiveSource(firstEnabled.id);
    });
  }, [open]);

  function resetForCreate() {
    setName("");
    setCategory("OTRO");
    setUnit("UNIDAD");
    setSource(null);
    setNutrition(emptyNutrition());
    setCandidates(null);
    setSearchError(null);
  }

  function handleOpenChange(o: boolean) {
    if (o && !isEdit) setName(initialName);
    onOpenChange(o);
  }

  function runSearch(sourceId: SourceId) {
    setActiveSource(sourceId);
    setCandidates(null);
    setSearchError(null);
    startSearch(async () => {
      const res = await searchNutrition(name, sourceId);
      if (res.ok) {
        setCandidates(res.candidates);
      } else {
        setCandidates([]);
        setSearchError(res.error);
      }
    });
  }

  function applyCandidate(c: NutritionCandidate) {
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
    setSource({ id: c.sourceId, ref: c.externalId });
    setCandidates(null);
    toast.success(`Valores aplicados desde ${c.sourceId.toUpperCase()}`);
  }

  function submit() {
    const payload = {
      name,
      category,
      defaultUnit: unit,
      sourceId: source?.id ?? null,
      sourceRef: source?.ref ?? null,
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar ingrediente" : "Nuevo ingrediente"}</DialogTitle>
          <DialogDescription>
            Busca la nutrición por 100 g en varias fuentes o introdúcela a mano.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="ing-name">Nombre</Label>
            <Input
              id="ing-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tomate"
              autoFocus
            />
          </div>

          {/* Pestañas de fuente */}
          <div className="flex flex-col gap-2 rounded-md border p-2">
            <div className="flex flex-wrap items-center gap-1">
              <span className="eyebrow mr-1 text-muted-foreground">Buscar en</span>
              {sources.map((s) => (
                <Button
                  key={s.id}
                  type="button"
                  size="sm"
                  variant={activeSource === s.id ? "secondary" : "ghost"}
                  disabled={!s.enabled || searching || name.trim().length < 2}
                  title={s.enabled ? s.note : "No configurada"}
                  onClick={() => runSearch(s.id)}
                >
                  {s.label}
                </Button>
              ))}
              <Search className="ml-auto size-4 text-muted-foreground" />
            </div>

            {searching && (
              <p className="px-1 text-sm text-muted-foreground">Buscando…</p>
            )}
            {!searching && searchError && (
              <p className="px-1 text-sm text-muted-foreground">{searchError}</p>
            )}
            {!searching && candidates && candidates.length === 0 && !searchError && (
              <p className="px-1 text-sm text-muted-foreground">Sin resultados.</p>
            )}
            {!searching && candidates && candidates.length > 0 && (
              <div className="flex flex-col gap-1">
                {candidates.map((c) => (
                  <button
                    key={`${c.sourceId}-${c.externalId}`}
                    type="button"
                    onClick={() => applyCandidate(c)}
                    className="flex flex-col gap-0.5 rounded-sm px-2 py-1 text-left text-sm hover:bg-accent"
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate">
                        {c.name}
                        {c.brand && (
                          <span className="text-muted-foreground"> · {c.brand}</span>
                        )}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {c.kcalPer100 != null ? `${c.kcalPer100} kcal/100g` : "sin macros"}
                      </span>
                    </span>
                    {c.info && (
                      <span className="line-clamp-2 text-xs text-muted-foreground">
                        {c.info}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
            {source && (
              <p className="px-1 text-xs text-muted-foreground">
                Origen actual: {source.id.toUpperCase()}
              </p>
            )}
          </div>

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

          {/* Nutrición por 100 g + factor de conversión */}
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
              <div className={cn("flex flex-col gap-1", !unitNeedsGramsPerUnit(unit) && "opacity-60")}>
                <Label htmlFor="ing-gramsPerUnit" className="text-xs">
                  Gramos por {UNIT_SINGULAR[unit]}
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
            {unitNeedsGramsPerUnit(unit) ? (
              <p className="text-xs text-muted-foreground">
                Factor de conversión: cuántos gramos pesa 1 {UNIT_SINGULAR[unit]} (p. ej. 1
                cebolla ≈ 110 g, 1 diente de ajo ≈ 5 g).
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Esta unidad ya se mide en peso/volumen; el factor no es imprescindible.
              </p>
            )}
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
