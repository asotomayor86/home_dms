"use client";

import { useState, useTransition } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import {
  createIngredient,
  type IngredientOption,
} from "@/lib/actions/ingredients";
import {
  CATEGORY_LABELS,
  INGREDIENT_CATEGORIES,
  UNITS,
  UNIT_LABELS,
} from "@/lib/validation/recipe";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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

export function IngredientCombobox({
  ingredients,
  value,
  onSelect,
  onCreated,
}: {
  ingredients: IngredientOption[];
  value: string | null;
  onSelect: (ingredient: IngredientOption) => void;
  /** Notifica al padre que el catálogo creció, para refrescar su lista. */
  onCreated: (ingredient: IngredientOption) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const selected = ingredients.find((i) => i.id === value) ?? null;

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            <span className={cn(!selected && "text-muted-foreground")}>
              {selected ? selected.name : "Selecciona ingrediente…"}
            </span>
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Buscar ingrediente…"
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>
                <div className="py-2 text-sm text-muted-foreground">
                  Sin resultados.
                </div>
              </CommandEmpty>
              <CommandGroup>
                {ingredients.map((ing) => (
                  <CommandItem
                    key={ing.id}
                    value={ing.name}
                    onSelect={() => {
                      onSelect(ing);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 size-4",
                        value === ing.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="flex-1">{ing.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {CATEGORY_LABELS[ing.category as keyof typeof CATEGORY_LABELS]}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
              <div className="border-t p-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    setOpen(false);
                    setCreateOpen(true);
                  }}
                >
                  <Plus className="mr-2 size-4" />
                  Crear ingrediente nuevo
                </Button>
              </div>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <CreateIngredientDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        initialName={search}
        onCreated={(ing) => {
          onCreated(ing);
          onSelect(ing);
          setCreateOpen(false);
        }}
      />
    </>
  );
}

function CreateIngredientDialog({
  open,
  onOpenChange,
  initialName,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initialName: string;
  onCreated: (ingredient: IngredientOption) => void;
}) {
  const [name, setName] = useState(initialName);
  const [category, setCategory] = useState<(typeof INGREDIENT_CATEGORIES)[number]>("OTRO");
  const [unit, setUnit] = useState<(typeof UNITS)[number]>("UNIDAD");
  const [pending, start] = useTransition();

  // Sincroniza el nombre con lo escrito en el buscador cada vez que se abre.
  function handleOpenChange(o: boolean) {
    if (o) setName(initialName);
    onOpenChange(o);
  }

  function submit() {
    start(async () => {
      const res = await createIngredient({ name, category, defaultUnit: unit });
      if (res.ok) {
        toast.success("Ingrediente creado");
        onCreated(res.ingredient);
        setName("");
        setCategory("OTRO");
        setUnit("UNIDAD");
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo ingrediente</DialogTitle>
          <DialogDescription>
            Se añadirá al catálogo común y quedará disponible para todas las recetas.
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
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={pending || name.trim().length < 2}>
            {pending ? "Creando…" : "Crear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
