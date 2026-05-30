"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { deleteRecipe, toggleRecipeActive } from "@/lib/actions/recipes";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function RecipeActions({
  id,
  isActive,
}: {
  id: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function toggle() {
    start(async () => {
      const res = await toggleRecipeActive(id);
      if (res.ok) {
        toast.success(isActive ? "Receta desactivada" : "Receta activada");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function remove() {
    start(async () => {
      const res = await deleteRecipe(id);
      if (res.ok) {
        toast.success("Receta eliminada");
        router.push("/recipes");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild variant="outline">
        <Link href={`/recipes/${id}/edit`}>Editar</Link>
      </Button>
      <Button variant="outline" onClick={toggle} disabled={pending}>
        {isActive ? "Desactivar" : "Activar"}
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive">Eliminar</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta receta?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará la receta, sus ingredientes y la selección en los hogares que la
              usaran. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={remove} disabled={pending}>
              {pending ? "Eliminando…" : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
