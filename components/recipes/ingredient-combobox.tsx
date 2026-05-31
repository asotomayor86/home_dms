"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { type IngredientOption } from "@/lib/actions/ingredients";
import { CATEGORY_LABELS } from "@/lib/validation/recipe";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { IngredientDialog } from "@/components/recipes/ingredient-dialog";

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
                <div className="py-2 text-sm text-muted-foreground">Sin resultados.</div>
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

      <IngredientDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        initialName={search}
        onSaved={(ing) => {
          onCreated(ing);
          onSelect(ing);
          setCreateOpen(false);
        }}
      />
    </>
  );
}
