import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const [households, sims] = await Promise.all([
    prisma.household.count(),
    prisma.sim.count(),
  ]);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Link href="/admin/households">
        <Card className="transition-colors hover:bg-muted/50">
          <CardHeader>
            <CardTitle>Hogares</CardTitle>
            <CardDescription>Crear, renombrar y eliminar hogares</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{households}</p>
          </CardContent>
        </Card>
      </Link>

      <Link href="/admin/sims">
        <Card className="transition-colors hover:bg-muted/50">
          <CardHeader>
            <CardTitle>Usuarios</CardTitle>
            <CardDescription>Crear sims, contraseñas y asignación a hogares</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{sims}</p>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
