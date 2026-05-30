"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  createHousehold,
  renameHousehold,
  deleteHousehold,
} from "@/lib/actions/households";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

type Household = { id: string; name: string; members: number };

export function HouseholdsManager({ households }: { households: Household[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle>Hogares</CardTitle>
          <CardDescription>Crear, renombrar y eliminar hogares</CardDescription>
        </div>
        <CreateHouseholdDialog />
      </CardHeader>
      <CardContent>
        {households.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no hay hogares.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="w-28">Miembros</TableHead>
                <TableHead className="w-32 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {households.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="font-medium">{h.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{h.members}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <RenameHouseholdDialog household={h} />
                      <DeleteHouseholdDialog household={h} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function CreateHouseholdDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [pending, start] = useTransition();

  function submit() {
    start(async () => {
      const res = await createHousehold(name);
      if (res.ok) {
        toast.success("Hogar creado");
        setName("");
        setOpen(false);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Nuevo hogar</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo hogar</DialogTitle>
          <DialogDescription>Indica el nombre del hogar.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="new-household">Nombre</Label>
          <Input
            id="new-household"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Casa de los García"
            autoFocus
          />
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

function RenameHouseholdDialog({ household }: { household: Household }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(household.name);
  const [pending, start] = useTransition();

  function submit() {
    start(async () => {
      const res = await renameHousehold(household.id, name);
      if (res.ok) {
        toast.success("Hogar actualizado");
        setOpen(false);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Renombrar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Renombrar hogar</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`rename-${household.id}`}>Nombre</Label>
          <Input
            id={`rename-${household.id}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={pending || name.trim().length < 2}>
            {pending ? "Guardando…" : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteHouseholdDialog({ household }: { household: Household }) {
  const [pending, start] = useTransition();

  function confirm() {
    start(async () => {
      const res = await deleteHousehold(household.id);
      if (res.ok) toast.success("Hogar eliminado");
      else toast.error(res.error);
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="destructive">
          Eliminar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar “{household.name}”?</AlertDialogTitle>
          <AlertDialogDescription>
            Se eliminará el hogar y las pertenencias de sus miembros. Esta acción no se
            puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={confirm} disabled={pending}>
            {pending ? "Eliminando…" : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
