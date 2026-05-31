"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus } from "lucide-react";

import type { IngredientOption } from "@/lib/actions/ingredients";
import {
  CATEGORY_LABELS,
  UNIT_LABELS,
  UNIT_SINGULAR,
  unitNeedsGramsPerUnit,
} from "@/lib/validation/recipe";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IngredientDialog } from "@/components/recipes/ingredient-dialog";

function fmt(v: number | null): string {
  if (v == null) return "—";
  return (Math.round(v * 10) / 10).toString();
}

export function IngredientManager({ ingredients }: { ingredients: IngredientOption[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<IngredientOption | null>(null);

  const q = query.trim().toLowerCase();
  const filtered = ingredients.filter((i) => i.name.toLowerCase().includes(q));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Input
          placeholder="Buscar ingrediente…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Nuevo ingrediente
        </Button>
      </div>

      <div className="overflow-x-auto border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ingrediente</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead className="text-right">kcal/100g</TableHead>
              <TableHead className="text-right">Prot.</TableHead>
              <TableHead className="text-right">Carb.</TableHead>
              <TableHead className="text-right">Grasa</TableHead>
              <TableHead className="text-right">Fibra</TableHead>
              <TableHead className="text-right">Azúc.</TableHead>
              <TableHead className="text-right">Sal</TableHead>
              <TableHead>Conversión</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center text-sm text-muted-foreground">
                  Sin ingredientes que coincidan.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((ing) => {
                const needsFactor = unitNeedsGramsPerUnit(ing.defaultUnit);
                return (
                  <TableRow key={ing.id}>
                    <TableCell className="font-medium">{ing.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {CATEGORY_LABELS[ing.category as keyof typeof CATEGORY_LABELS]}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmt(ing.kcalPer100)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmt(ing.proteinPer100)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmt(ing.carbsPer100)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(ing.fatPer100)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmt(ing.fiberPer100)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmt(ing.sugarPer100)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(ing.saltPer100)}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs">
                      {needsFactor ? (
                        ing.gramsPerUnit != null ? (
                          <span>
                            1 {UNIT_SINGULAR[ing.defaultUnit as keyof typeof UNIT_SINGULAR]} ={" "}
                            {fmt(ing.gramsPerUnit)} g
                          </span>
                        ) : (
                          <Badge variant="outline">falta factor</Badge>
                        )
                      ) : (
                        <span className="text-muted-foreground">
                          {UNIT_LABELS[ing.defaultUnit as keyof typeof UNIT_LABELS]}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setEditing(ing)}
                        aria-label={`Editar ${ing.name}`}
                      >
                        <Pencil className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        La columna «Conversión» indica cuántos gramos pesa 1 unidad del ingrediente (cebolla,
        diente de ajo, lata…), necesario para calcular la nutrición de las recetas. Los
        ingredientes medidos en g/ml no la necesitan.
      </p>

      {/* Crear */}
      <IngredientDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSaved={() => {
          setCreateOpen(false);
          router.refresh();
        }}
      />

      {/* Editar */}
      {editing && (
        <IngredientDialog
          open
          onOpenChange={(o) => !o && setEditing(null)}
          initial={editing}
          onSaved={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
