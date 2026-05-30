import { prisma } from "@/lib/prisma";
import { SimsManager } from "@/components/admin/sims-manager";

export const dynamic = "force-dynamic";

export default async function SimsPage() {
  const [sims, households] = await Promise.all([
    prisma.sim.findMany({
      orderBy: { username: "asc" },
      include: { memberships: { select: { householdId: true } } },
    }),
    prisma.household.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <SimsManager
      households={households}
      sims={sims.map((s) => ({
        id: s.id,
        username: s.username,
        displayName: s.displayName,
        role: s.globalRole,
        mustChangePassword: s.mustChangePassword,
        householdIds: s.memberships.map((m) => m.householdId),
      }))}
    />
  );
}
