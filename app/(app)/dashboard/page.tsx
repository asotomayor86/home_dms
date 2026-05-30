import { requireSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requireSession();

  const memberships = await prisma.membership.findMany({
    where: { simId: session.user.id },
    include: { household: true },
    orderBy: { household: { name: "asc" } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Hola, {session.user.displayName} 👋</h1>
        <p className="text-muted-foreground">Bienvenido a HOME DMS.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tus hogares</CardTitle>
        </CardHeader>
        <CardContent>
          {memberships.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Todavía no perteneces a ningún hogar. Pídele a un administrador que te asigne.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {memberships.map((m) => (
                <li
                  key={m.householdId}
                  className="rounded-md border px-3 py-2 text-sm font-medium"
                >
                  {m.household.name}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Próximamente: gastos, compras, inventario y planificación de comidas.
      </p>
    </div>
  );
}
