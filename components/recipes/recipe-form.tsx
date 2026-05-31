"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";

import { createRecipe, updateRecipe } from "@/lib/actions/recipes";
import type { IngredientOption } from "@/lib/actions/ingredients";
import {
  recipeSchema,
  UNITS,
  UNIT_LABELS,
  NUTRIENTS,
  type NutrientKey,
  type RecipeInput,
} from "@/lib/validation/recipe";
import { nutritionForRecipe, formatNutrient } from "@/lib/nutrition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IngredientCombobox } from "@/components/recipes/ingredient-combobox";

type IngredientRow = {
  key: string;
  ingredientId: string | null;
  quantity: string;
  unit: (typeof UNITS)[number];
  note: string;
};

export type RecipeFormInitial = {
  id: string;
  name: string;
  description: string;
  servings: number;
  prepMinutes: number | null;
  suitableForLunch: boolean;
  suitableForDinner: boolean;
  steps: string[];
  ingredients: {
    ingredientId: string;
    quantity: number;
    unit: (typeof UNITS)[number];
    note: string | null;
  }[];
  nutrition: Partial<Record<NutrientKey, number | null>>;
};

let keyCounter = 0;
const nextKey = () => `row-${keyCounter++}`;

/** "" → null; "12.5" → 12.5; valores no numéricos → null. */
function parseNutrient(value: string): number | null {
  const t = value.trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function RecipeForm({
  ingredients: initialIngredients,
  initial,
}: {
  ingredients: IngredientOption[];
  initial?: RecipeFormInitial;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  // El catálogo puede crecer si se crea un ingrediente al vuelo.
  const [catalog, setCatalog] = useState<IngredientOption[]>(initialIngredients);

  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [servings, setServings] = useState(String(initial?.servings ?? 2));
  const [prepMinutes, setPrepMinutes] = useState(
    initial?.prepMinutes != null ? String(initial.prepMinutes) : "",
  );
  const [forLunch, setForLunch] = useState(initial?.suitableForLunch ?? true);
  const [forDinner, setForDinner] = useState(initial?.suitableForDinner ?? true);

  // Override nutricional por ración (opcional): si se rellena, manda sobre el cálculo.
  const [nutrition, setNutrition] = useState<Record<NutrientKey, string>>(() => {
    const init = {} as Record<NutrientKey, string>;
    for (const n of NUTRIENTS) {
      const v = initial?.nutrition?.[n.key];
      init[n.key] = v != null ? String(v) : "";
    }
    return init;
  });
  // ¿Mostrar el bloque de ajuste manual? Abierto si ya hay algún override.
  const [showOverride, setShowOverride] = useState(() =>
    NUTRIENTS.some((n) => initial?.nutrition?.[n.key] != null),
  );

  const [steps, setSteps] = useState<{ key: string; text: string }[]>(
    initial?.steps.length
      ? initial.steps.map((t) => ({ key: nextKey(), text: t }))
      : [{ key: nextKey(), text: "" }],
  );

  const [rows, setRows] = useState<IngredientRow[]>(
    initial?.ingredients.length
      ? initial.ingredients.map((i) => ({
          key: nextKey(),
          ingredientId: i.ingredientId,
          quantity: String(i.quantity),
          unit: i.unit,
          note: i.note ?? "",
        }))
      : [{ key: nextKey(), ingredientId: null, quantity: "", unit: "UNIDAD", note: "" }],
  );

  // Preview de la nutrición CALCULADA desde los ingredientes (sin override),
  // recalculada en vivo según las filas y las raciones.
  const calcPreview = useMemo(() => {
    const byId = new Map(catalog.map((c) => [c.id, c]));
    const ingredients = rows
      .filter((r) => r.ingredientId && r.quantity.trim() !== "")
      .map((r) => {
        const ing = byId.get(r.ingredientId as string);
        return {
          name: ing?.name ?? "ingrediente",
          quantity: Number(r.quantity) || 0,
          unit: r.unit,
          gramsPerUnit: ing?.gramsPerUnit ?? null,
          per100: {
            calories: ing?.kcalPer100 ?? null,
            protein: ing?.proteinPer100 ?? null,
            carbs: ing?.carbsPer100 ?? null,
            fat: ing?.fatPer100 ?? null,
            fiber: ing?.fiberPer100 ?? null,
            sugar: ing?.sugarPer100 ?? null,
            salt: ing?.saltPer100 ?? null,
          },
        };
      });
    return nutritionForRecipe({
      servings: Number(servings) || 1,
      override: {},
      ingredients,
    });
  }, [catalog, rows, servings]);

  function addIngredientRow() {
    setRows((r) => [
      ...r,
      { key: nextKey(), ingredientId: null, quantity: "", unit: "UNIDAD", note: "" },
    ]);
  }
  function removeIngredientRow(key: string) {
    setRows((r) => (r.length > 1 ? r.filter((x) => x.key !== key) : r));
  }
  function updateRow(key: string, patch: Partial<IngredientRow>) {
    setRows((r) => r.map((x) => (x.key === key ? { ...x, ...patch } : x)));
  }

  function addStep() {
    setSteps((s) => [...s, { key: nextKey(), text: "" }]);
  }
  function removeStep(key: string) {
    setSteps((s) => (s.length > 1 ? s.filter((x) => x.key !== key) : s));
  }
  function moveStep(index: number, dir: -1 | 1) {
    setSteps((s) => {
      const target = index + dir;
      if (target < 0 || target >= s.length) return s;
      const copy = [...s];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  }

  function submit() {
    // Construye y valida el payload con el mismo schema del servidor.
    const payload: RecipeInput = {
      name: name.trim(),
      description: description.trim() || undefined,
      servings: Number(servings),
      prepMinutes: prepMinutes.trim() ? Number(prepMinutes) : null,
      suitableForLunch: forLunch,
      suitableForDinner: forDinner,
      calories: parseNutrient(nutrition.calories),
      protein: parseNutrient(nutrition.protein),
      carbs: parseNutrient(nutrition.carbs),
      fat: parseNutrient(nutrition.fat),
      fiber: parseNutrient(nutrition.fiber),
      sugar: parseNutrient(nutrition.sugar),
      salt: parseNutrient(nutrition.salt),
      steps: steps.map((s) => s.text.trim()).filter(Boolean),
      ingredients: rows
        .filter((r) => r.ingredientId)
        .map((r) => ({
          ingredientId: r.ingredientId as string,
          quantity: Number(r.quantity),
          unit: r.unit,
          note: r.note.trim() || undefined,
        })),
    };

    const parsed = recipeSchema.safeParse(payload);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    start(async () => {
      const res = initial
        ? await updateRecipe(initial.id, parsed.data)
        : await createRecipe(parsed.data);
      if (res.ok) {
        toast.success(initial ? "Receta actualizada" : "Receta creada");
        router.push(`/recipes/${res.id}`);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Datos de la receta</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Lentejas estofadas"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="servings">Raciones base</Label>
              <Input
                id="servings"
                type="number"
                min={1}
                value={servings}
                onChange={(e) => setServings(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Las cantidades se refieren a estas raciones; la cesta se escalará al hogar.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="prep">Minutos de preparación (opcional)</Label>
              <Input
                id="prep"
                type="number"
                min={0}
                value={prepMinutes}
                onChange={(e) => setPrepMinutes(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={forLunch}
                onCheckedChange={(c) => setForLunch(c === true)}
              />
              Apta para comida
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={forDinner}
                onCheckedChange={(c) => setForDinner(c === true)}
              />
              Apta para cena
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Ingredientes</CardTitle>
          <Button type="button" size="sm" variant="outline" onClick={addIngredientRow}>
            Añadir ingrediente
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {rows.map((row) => (
            <div key={row.key} className="grid grid-cols-12 items-start gap-2">
              <div className="col-span-12 sm:col-span-5">
                <IngredientCombobox
                  ingredients={catalog}
                  value={row.ingredientId}
                  onSelect={(ing) =>
                    updateRow(row.key, {
                      ingredientId: ing.id,
                      unit: ing.defaultUnit as (typeof UNITS)[number],
                    })
                  }
                  onCreated={(ing) => setCatalog((c) => [...c, ing])}
                />
              </div>
              <div className="col-span-4 sm:col-span-2">
                <Input
                  type="number"
                  min={0}
                  step="any"
                  placeholder="Cant."
                  value={row.quantity}
                  onChange={(e) => updateRow(row.key, { quantity: e.target.value })}
                />
              </div>
              <div className="col-span-4 sm:col-span-2">
                <Select
                  value={row.unit}
                  onValueChange={(v) => updateRow(row.key, { unit: v as (typeof UNITS)[number] })}
                >
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
              <div className="col-span-3 sm:col-span-2">
                <Input
                  placeholder="Nota"
                  value={row.note}
                  onChange={(e) => updateRow(row.key, { note: e.target.value })}
                />
              </div>
              <div className="col-span-1 flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeIngredientRow(row.key)}
                  aria-label="Quitar ingrediente"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Pasos</CardTitle>
          <Button type="button" size="sm" variant="outline" onClick={addStep}>
            Añadir paso
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {steps.map((step, index) => (
            <div key={step.key} className="flex items-start gap-2">
              <div className="flex flex-col items-center pt-2">
                <span className="text-sm font-medium text-muted-foreground">
                  {index + 1}
                </span>
              </div>
              <Textarea
                value={step.text}
                onChange={(e) =>
                  setSteps((s) =>
                    s.map((x) => (x.key === step.key ? { ...x, text: e.target.value } : x)),
                  )
                }
                rows={2}
                placeholder={`Paso ${index + 1}`}
                className="flex-1"
              />
              <div className="flex flex-col gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => moveStep(index, -1)}
                  disabled={index === 0}
                  aria-label="Subir paso"
                >
                  <ChevronUp className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => moveStep(index, 1)}
                  disabled={index === steps.length - 1}
                  aria-label="Bajar paso"
                >
                  <ChevronDown className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => removeStep(step.key)}
                  aria-label="Quitar paso"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nutrición (por ración)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Preview calculado desde los ingredientes */}
          <div>
            <p className="eyebrow mb-2 text-muted-foreground">
              Calculado desde los ingredientes
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
              {NUTRIENTS.map((n) => {
                const v = calcPreview.values[n.key];
                return (
                  <div key={n.key} className="flex flex-col">
                    <span className="eyebrow text-muted-foreground">{n.label}</span>
                    <span className="text-base font-semibold">
                      {v != null ? `${formatNutrient(n.key, v)} ${n.unit}` : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
            {calcPreview.partial && (
              <p className="mt-2 text-xs text-muted-foreground">
                Cálculo parcial: sin datos de {calcPreview.missing.join(", ")}.
              </p>
            )}
          </div>

          {/* Ajuste manual (override) opcional */}
          <div className="border-t pt-3">
            <button
              type="button"
              onClick={() => setShowOverride((s) => !s)}
              className="eyebrow text-muted-foreground hover:text-foreground"
            >
              {showOverride ? "− Ocultar ajuste manual" : "+ Ajustar manualmente (override)"}
            </button>
            {showOverride && (
              <>
                <p className="mt-2 mb-2 text-xs text-muted-foreground">
                  Si rellenas un valor, sustituye al cálculo para ese nutriente. Déjalo vacío
                  para usar el calculado.
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {NUTRIENTS.map((n) => (
                    <div key={n.key} className="flex flex-col gap-1">
                      <Label htmlFor={`nut-${n.key}`} className="text-xs">
                        {n.label} ({n.unit})
                      </Label>
                      <Input
                        id={`nut-${n.key}`}
                        type="number"
                        min={0}
                        step="any"
                        inputMode="decimal"
                        value={nutrition[n.key]}
                        onChange={(e) =>
                          setNutrition((prev) => ({ ...prev, [n.key]: e.target.value }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="button" onClick={submit} disabled={pending}>
          {pending ? "Guardando…" : initial ? "Guardar cambios" : "Crear receta"}
        </Button>
      </div>
    </div>
  );
}
