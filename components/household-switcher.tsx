"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type HouseholdOption = { id: string; name: string };

/**
 * Selector de hogar activo. Reescribe el query param `household` de la ruta
 * actual, conservando el resto de parámetros. Solo se muestra si hay >1 hogar.
 */
export function HouseholdSwitcher({
  households,
  activeId,
}: {
  households: HouseholdOption[];
  activeId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (households.length <= 1) return null;

  function change(id: string) {
    const params = new URLSearchParams(searchParams);
    params.set("household", id);
    router.push(`${pathname}?${params.toString()}`);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <span className="eyebrow text-muted-foreground">Hogar</span>
      <Select value={activeId} onValueChange={change}>
        <SelectTrigger className="h-8 w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {households.map((h) => (
            <SelectItem key={h.id} value={h.id}>
              {h.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
