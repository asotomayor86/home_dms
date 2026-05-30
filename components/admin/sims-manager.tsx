"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { GlobalRole } from "@prisma/client";

import { createSim, regeneratePassword, deleteSim } from "@/lib/actions/sims";
import { addMembership, removeMembership } from "@/lib/actions/memberships";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

type HouseholdOption = { id: string; name: string };
type Sim = {
  id: string;
  username: string;
  displayName: string;
  role: GlobalRole;
  mustChangePassword: boolean;
  householdIds: string[];
};

type Credentials = { username: string; password: string };

export function SimsManager({
  sims,
  households,
}: {
  sims: Sim[];
  households: HouseholdOption[];
}) {
  // Credenciales recién generadas a mostrar en claro (crear / regenerar).
  const [credentials, setCredentials] = useState<Credentials | null>(null);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle>Usuarios</CardTitle>
          <CardDescription>
            Crea sims, gestiona contraseñas temporales y asígnalos a hogares
          </CardDescription>
        </div>
        <CreateSimDialog onCreated={setCredentials} />
      </CardHeader>
      <CardContent>
        {sims.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no hay usuarios.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Hogares</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sims.map((sim) => (
                <TableRow key={sim.id}>
                  <TableCell className="font-medium">{sim.username}</TableCell>
                  <TableCell>{sim.displayName}</TableCell>
                  <TableCell>
                    <Badge variant={sim.role === "ADMIN" ? "default" : "secondary"}>
                      {sim.role === "ADMIN" ? "Admin" : "Usuario"}
                    </Badge>
                    {sim.mustChangePassword && (
                      <Badge variant="outline" className="ml-2">
                        Contraseña temporal
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {sim.householdIds.length}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <MembershipsDialog sim={sim} households={households} />
                      <RegenerateButton sim={sim} onDone={setCredentials} />
                      <DeleteSimButton sim={sim} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <CredentialsDialog
        credentials={credentials}
        onClose={() => setCredentials(null)}
      />
    </Card>
  );
}

function CreateSimDialog({ onCreated }: { onCreated: (c: Credentials) => void }) {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<GlobalRole>("USER");
  const [pending, start] = useTransition();

  function submit() {
    start(async () => {
      const res = await createSim({ username, displayName, role });
      if (res.ok) {
        toast.success("Usuario creado");
        onCreated({ username: res.username, password: res.password });
        setUsername("");
        setDisplayName("");
        setRole("USER");
        setOpen(false);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Nuevo usuario</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo usuario</DialogTitle>
          <DialogDescription>
            Se generará una contraseña temporal que deberás comunicarle.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="new-username">Nombre de usuario</Label>
            <Input
              id="new-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="maria"
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="new-displayname">Nombre visible</Label>
            <Input
              id="new-displayname"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="María García"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Rol</Label>
            <Select value={role} onValueChange={(v) => setRole(v as GlobalRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">Usuario</SelectItem>
                <SelectItem value="ADMIN">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={submit}
            disabled={pending || username.trim().length < 3 || displayName.trim().length < 2}
          >
            {pending ? "Creando…" : "Crear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RegenerateButton({
  sim,
  onDone,
}: {
  sim: Sim;
  onDone: (c: Credentials) => void;
}) {
  const [pending, start] = useTransition();

  function regen() {
    start(async () => {
      const res = await regeneratePassword(sim.id);
      if (res.ok) {
        toast.success("Contraseña regenerada");
        onDone({ username: res.username, password: res.password });
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="outline" disabled={pending}>
          Contraseña
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Regenerar contraseña de {sim.username}</AlertDialogTitle>
          <AlertDialogDescription>
            Se generará una nueva contraseña temporal. La actual dejará de funcionar y el
            usuario deberá cambiarla en su próximo acceso.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={regen} disabled={pending}>
            {pending ? "Generando…" : "Regenerar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function DeleteSimButton({ sim }: { sim: Sim }) {
  const [pending, start] = useTransition();

  function confirm() {
    start(async () => {
      const res = await deleteSim(sim.id);
      if (res.ok) toast.success("Usuario eliminado");
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
          <AlertDialogTitle>¿Eliminar a {sim.username}?</AlertDialogTitle>
          <AlertDialogDescription>
            Se eliminará la cuenta y sus pertenencias a hogares. Esta acción no se puede
            deshacer.
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

function MembershipsDialog({
  sim,
  households,
}: {
  sim: Sim;
  households: HouseholdOption[];
}) {
  const [open, setOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, start] = useTransition();

  function toggle(householdId: string, isMember: boolean) {
    setPendingId(householdId);
    start(async () => {
      const res = isMember
        ? await removeMembership(sim.id, householdId)
        : await addMembership(sim.id, householdId);
      if (!res.ok) toast.error(res.error);
      setPendingId(null);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Hogares
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hogares de {sim.username}</DialogTitle>
          <DialogDescription>
            Marca los hogares a los que pertenece este usuario.
          </DialogDescription>
        </DialogHeader>

        {households.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay hogares todavía. Crea uno en la pestaña “Hogares”.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {households.map((h) => {
              const isMember = sim.householdIds.includes(h.id);
              return (
                <li
                  key={h.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <span className="text-sm font-medium">{h.name}</span>
                  <Button
                    size="sm"
                    variant={isMember ? "secondary" : "default"}
                    disabled={pendingId === h.id}
                    onClick={() => toggle(h.id, isMember)}
                  >
                    {pendingId === h.id ? "…" : isMember ? "Quitar" : "Añadir"}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CredentialsDialog({
  credentials,
  onClose,
}: {
  credentials: Credentials | null;
  onClose: () => void;
}) {
  function copy() {
    if (!credentials) return;
    navigator.clipboard
      .writeText(`Usuario: ${credentials.username}\nContraseña: ${credentials.password}`)
      .then(() => toast.success("Copiado al portapapeles"))
      .catch(() => toast.error("No se pudo copiar"));
  }

  return (
    <Dialog open={!!credentials} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Contraseña temporal</DialogTitle>
          <DialogDescription>
            Cópiala y envíasela al usuario (p. ej. por WhatsApp). No volverá a mostrarse.
            Deberá cambiarla en su primer acceso.
          </DialogDescription>
        </DialogHeader>
        {credentials && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Usuario</span>
              <code className="rounded bg-muted px-2 py-1 text-sm">{credentials.username}</code>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Contraseña</span>
              <code className="rounded bg-muted px-2 py-1 text-base font-semibold tracking-wide">
                {credentials.password}
              </code>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={copy}>
            Copiar
          </Button>
          <Button onClick={onClose}>Hecho</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
